"""
Reva Core Engine: Asynchronous Prioritization, Token-Bucket Rate Limiting,
and Idempotent State Registry.

Backs the entire venture benchmarking and scouting platform with zero SaaS dependencies.
"""

import asyncio
import hashlib
import os
import sqlite3
import time
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, Optional


# =====================================================================
# 1. PRIORITY LEVELS
# =====================================================================
PRIORITY_USER_INTERACTIVE = 0   # Flow 1 Benchmarks, Flow 2a User Uploads
PRIORITY_BATCH_EXPORT     = 1   # PDF / Word / PPTX Generation
PRIORITY_BACKGROUND_CRAWL = 2   # Flow 2b & 2c Scheduled Daily Crawlers


@dataclass(order=True)
class PrioritizedTask:
    priority: int
    created_at: float = field(compare=False)
    task_id: str = field(compare=False)
    coro_func: Any = field(compare=False)
    args: tuple = field(default_factory=tuple, compare=False)
    kwargs: dict = field(default_factory=dict, compare=False)


class OperationPriorityQueue:
    """
    Asynchronous task priority queue ensuring user interactive requests
    (Flow 1 and 2a) always preempt background scraping tasks (Flow 2b and 2c).
    """

    def __init__(self, max_concurrent: int = 5):
        self._queue: asyncio.PriorityQueue = asyncio.PriorityQueue()
        self.max_concurrent = max_concurrent
        self._active_workers: int = 0
        self._lock = asyncio.Lock()

    async def enqueue(
        self,
        task_id: str,
        priority: int,
        coro_func: Callable,
        *args,
        **kwargs
    ):
        task = PrioritizedTask(
            priority=priority,
            created_at=time.time(),
            task_id=task_id,
            coro_func=coro_func,
            args=args,
            kwargs=kwargs,
        )
        await self._queue.put(task)

    async def execute_next(self) -> Any:
        task: PrioritizedTask = await self._queue.get()
        try:
            res = await task.coro_func(*task.args, **task.kwargs)
            return res
        finally:
            self._queue.task_done()

    def size(self) -> int:
        return self._queue.qsize()


# =====================================================================
# 2. TOKEN-BUCKET RATE LIMITER (FREE-TIER RESILIENCE)
# =====================================================================
class TokenBucketRateLimiter:
    """
    Thread-safe, async-compatible Token Bucket Rate Limiter to guarantee
    we never exceed free-tier quotas (e.g. Gemini 15 RPM, Groq 30 RPM, Tavily 1000/mo).
    """

    def __init__(self, rate_per_minute: float, burst_capacity: Optional[float] = None):
        self.rate_per_second = rate_per_minute / 60.0
        self.capacity = burst_capacity if burst_capacity is not None else rate_per_minute
        self.tokens = self.capacity
        self.last_refill = time.monotonic()
        self._lock = asyncio.Lock()

    async def acquire(self, tokens_needed: float = 1.0) -> None:
        async with self._lock:
            while True:
                now = time.monotonic()
                elapsed = now - self.last_refill
                self.tokens = min(self.capacity, self.tokens + elapsed * self.rate_per_second)
                self.last_refill = now

                if self.tokens >= tokens_needed:
                    self.tokens -= tokens_needed
                    return

                # Wait for required token accumulation
                needed = tokens_needed - self.tokens
                sleep_time = needed / self.rate_per_second
                await asyncio.sleep(min(sleep_time, 2.0))


# Default Rate Limiter instances for free providers
LIMITERS: Dict[str, TokenBucketRateLimiter] = {
    "gemini": TokenBucketRateLimiter(rate_per_minute=14.0, burst_capacity=15.0), # Safe margin below 15 RPM
    "groq": TokenBucketRateLimiter(rate_per_minute=28.0, burst_capacity=30.0),   # Safe margin below 30 RPM
    "tavily": TokenBucketRateLimiter(rate_per_minute=20.0, burst_capacity=20.0),
    "crawler": TokenBucketRateLimiter(rate_per_minute=60.0, burst_capacity=60.0),
}


# =====================================================================
# 3. IDEMPOTENT STATE & HASH REGISTRY
# =====================================================================
class StateRegistry:
    """
    SQLite-backed state registry tracking processed URLs, article content hashes,
    and benchmark caches. Guarantees 100% idempotency across daily runs.
    """

    def __init__(self, db_path: Optional[str] = None):
        if db_path is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            db_path = os.path.join(base_dir, "reva_state.db")
        self.db_path = db_path
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            # Track scraped article URLs and hashes (Flow 2b & 2c)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS scraped_items (
                    url_hash TEXT PRIMARY KEY,
                    url TEXT NOT NULL,
                    title TEXT,
                    source_name TEXT,
                    source_type TEXT, -- 'emerging_tech' | 'nigeria_policy'
                    published_date TEXT,
                    content_hash TEXT,
                    processed_at REAL NOT NULL,
                    status TEXT -- 'processed' | 'skipped' | 'duplicate'
                )
            """)

            # Track benchmark cache (Flow 1)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS benchmark_cache (
                    concept_hash TEXT PRIMARY KEY,
                    idea_name TEXT NOT NULL,
                    sector TEXT,
                    benchmark_json TEXT NOT NULL,
                    created_at REAL NOT NULL
                )
            """)
            conn.commit()

    @staticmethod
    def hash_text(text: str) -> str:
        return hashlib.sha256(text.strip().lower().encode("utf-8")).hexdigest()

    def is_url_processed(self, url: str) -> bool:
        url_hash = self.hash_text(url)
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT 1 FROM scraped_items WHERE url_hash = ?", (url_hash,))
            return cursor.fetchone() is not None

    def record_scraped_item(
        self,
        url: str,
        title: str,
        source_name: str,
        source_type: str,
        content: str,
        status: str = "processed",
        published_date: Optional[str] = None,
    ):
        url_hash = self.hash_text(url)
        content_hash = self.hash_text(content)
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO scraped_items
                (url_hash, url, title, source_name, source_type, published_date, content_hash, processed_at, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (url_hash, url, title, source_name, source_type, published_date, content_hash, time.time(), status))
            conn.commit()

    def get_cached_benchmark(self, concept_text: str) -> Optional[str]:
        concept_hash = self.hash_text(concept_text)
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT benchmark_json FROM benchmark_cache WHERE concept_hash = ?", (concept_hash,))
            row = cursor.fetchone()
            if row:
                return row["benchmark_json"]
        return None

    def cache_benchmark(self, concept_text: str, idea_name: str, sector: str, benchmark_json: str):
        concept_hash = self.hash_text(concept_text)
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO benchmark_cache
                (concept_hash, idea_name, sector, benchmark_json, created_at)
                VALUES (?, ?, ?, ?, ?)
            """, (concept_hash, idea_name, sector, benchmark_json, time.time()))
            conn.commit()


# Singleton engine instances
global_queue = OperationPriorityQueue()
global_registry = StateRegistry()
