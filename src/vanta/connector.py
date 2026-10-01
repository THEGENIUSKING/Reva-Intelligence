"""
Vanta Portfolio & Idea Bank API Connector (Read-Only).
Connects to Vanta over HTTPS to fetch existing initiatives for deduplication
and past assessments for calibration.

Supports live Vanta Public API (GET /api/v1/portfolio) with bearer token (vnt_...)
and caches only records fetched from that API.
"""

import json
import os
import urllib.error
import urllib.request
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class VantaInitiative(BaseModel):
    id: Optional[str] = None
    name: str
    description: Optional[str] = None
    problem: Optional[str] = None
    solution: Optional[str] = None
    targetCustomer: Optional[str] = None
    goToMarket: Optional[str] = None
    expectedRevenue: Optional[str] = None
    sector: Optional[str] = None
    stage: Optional[str] = "Idea"
    portfolioTab: Optional[str] = "bank"  # "bank" | "active" | "hidden"
    assessmentScore: Optional[float] = None
    assessmentResult: Optional[str] = None  # "passed" | "reserved" | "declined"


class VantaConnector:
    """Connects to Vanta's API to read portfolio entries and past assessments."""

    def __init__(self):
        self.base_url = os.getenv("VANTA_API_BASE_URL", "https://vanta.trium.ng").rstrip("/")
        self.api_key = os.getenv("VANTA_API_KEY", "").strip()
        self.cache_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
            "config"
        )
        self.cache_file = os.path.join(self.cache_dir, "vanta_cache.json")

    def fetch_idea_bank(self, force_refresh: bool = False) -> List[VantaInitiative]:
        """
        Fetches all Idea Bank entries from Vanta.
        Returns live API data or previously cached API data; never invents portfolio records.
        """
        if not force_refresh and os.path.exists(self.cache_file):
            try:
                with open(self.cache_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    return [VantaInitiative(**item) for item in data]
            except Exception as e:
                print(f"[Vanta Connector] Error reading local cache: {e}. Fetching afresh...")

        if not self.api_key or self.api_key.startswith("vnt_your_"):
            raise RuntimeError("Vanta access is not configured. Set VANTA_API_KEY.")
        items = self._fetch_from_vanta_api()
        self._save_cache(items)
        return items

    def _fetch_from_vanta_api(self) -> List[VantaInitiative]:
        """Call Vanta GET /api/v1/portfolio."""
        url = f"{self.base_url}/api/v1/portfolio?limit=500"
        req = urllib.request.Request(
            url,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Accept": "application/json"
            },
            method="GET"
        )

        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        raw_items = data.get("items", [])
        return [
            VantaInitiative(
                id=item.get("_id") or item.get("id"),
                name=item.get("name", ""),
                description=item.get("description"),
                problem=item.get("problem"),
                solution=item.get("solution"),
                targetCustomer=item.get("targetCustomer"),
                goToMarket=item.get("goToMarket"),
                expectedRevenue=item.get("expectedRevenue") or item.get("monetization"),
                sector=item.get("sector"),
                stage=item.get("stage", "Idea"),
                portfolioTab=item.get("portfolioTab", "bank"),
                assessmentScore=item.get("assessmentScore"),
                assessmentResult=item.get("assessmentResult")
            )
            for item in raw_items
            if item.get("name")
        ]

    def _save_cache(self, items: List[VantaInitiative]):
        try:
            os.makedirs(self.cache_dir, exist_ok=True)
            with open(self.cache_file, "w", encoding="utf-8") as f:
                json.dump([item.model_dump() for item in items], f, indent=2)
        except Exception as e:
            print(f"[Vanta Connector] Could not write cache file: {e}")



vanta_connector = VantaConnector()
