"""
Global & Emerging Market Benchmark Scanner for Reva.
Queries Tavily Search API, Exa API, or web search across three tiers:
1. Nearby African Markets (Ghana, Kenya, Egypt, South Africa, Rwanda, Senegal, etc.)
2. Emerging Peer Markets (India, Indonesia, Vietnam, Brazil, Mexico, Colombia, etc.)
3. Global Leaders (US, Europe)
Extracts operational metrics, coverage, monetization, lessons learned, and sources.
"""

import json
import os
from typing import Any, Dict, List, Optional
import urllib.request
from pydantic import BaseModel, Field

from src.parsers.doc_parser import IdeaBrief
from src.utils.llm_client import llm_client


class BenchmarkRecord(BaseModel):
    company_name: str
    country: str
    region_tier: str  # "Nearby Africa" | "Emerging Peer" | "Global Leader"
    launch_year: Optional[str] = "N/A"
    status: str = "Active"  # "Active" | "Pivoted" | "Shut down"
    funding_raised: Optional[str] = "Not disclosed"
    operational_scale: Optional[str] = "Not disclosed"  # Users, revenue, GMV, volume
    business_model: str
    lessons_learned: str  # What worked, what failed, pivot post-mortems
    source_url: str
    source_name: str
    confidence: str = "High"  # "High" | "Medium" | "Low"


SCANNER_SYSTEM_PROMPT = """You are a global venture research analyst at Trium Limited.
Given an idea brief and market context, identify empirical benchmark companies operating in:
1. Nearby African markets (Kenya, Ghana, Egypt, South Africa, Rwanda, Senegal, Ivory Coast)
2. Emerging peer markets (India, Indonesia, Vietnam, Brazil, Mexico, Colombia)
3. Global market leaders (US, Europe)

For each company, extract concrete publicly known facts:
- Funding raised, users, scale, or revenue metrics. If unknown, state 'Not disclosed'.
- Business model & monetization mechanisms.
- Lessons learned, pivots, or known operational bottlenecks.
- Cite realistic source URLs or reputable industry publications (e.g. Disrupt Africa, TechCrunch, Inc42, Rest of World).

Output a JSON array of benchmark objects:
[
  {
    "company_name": "...",
    "country": "...",
    "region_tier": "Nearby Africa | Emerging Peer | Global Leader",
    "launch_year": "...",
    "status": "Active | Pivoted | Shut down",
    "funding_raised": "...",
    "operational_scale": "...",
    "business_model": "...",
    "lessons_learned": "...",
    "source_url": "...",
    "source_name": "...",
    "confidence": "High | Medium | Low"
  }
]"""


class BenchmarkScanner:
    """Scans online data sources for global, emerging, and nearby market benchmarks."""

    def __init__(self):
        self.tavily_key = os.getenv("TAVILY_API_KEY", "").strip()

    def search_online(self, query: str, max_results: int = 5) -> List[Dict[str, str]]:
        """Search Tavily if API key is present."""
        if not self.tavily_key or self.tavily_key.startswith("your_"):
            return []

        url = "https://api.tavily.com/search"
        payload = {
            "api_key": self.tavily_key,
            "query": query,
            "search_depth": "advanced",
            "max_results": max_results,
            "include_answer": True,
        }

        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=20) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            return [
                {
                    "title": r.get("title", ""),
                    "url": r.get("url", ""),
                    "content": r.get("content", "")
                }
                for r in data.get("results", [])
            ]
        except Exception as e:
            print(f"[Scanner] Tavily search error: {e}")
            return []

    def scan_benchmarks(self, brief: IdeaBrief) -> List[BenchmarkRecord]:
        """
        Executes targeted research across Nearby Africa, Emerging Peers, and Global Leaders.
        """
        # Execute live search if Tavily is configured
        search_query = f"{brief.name} {brief.sector} business model benchmarks startups Africa emerging markets"
        live_results = self.search_online(search_query)
        if not live_results:
            raise RuntimeError("No live search results were returned. Configure TAVILY_API_KEY and verify provider access.")

        live_context = "\n".join([f"Source ({r['title']}): {r['content']} [URL: {r['url']}]" for r in live_results])

        prompt = f"""Idea Name: {brief.name}
Sector: {brief.sector}
Description: {brief.description}
Problem: {brief.problem}
Solution: {brief.solution}
Target Customer: {brief.targetCustomer}
Monetization: {brief.monetization}

Live Web Search Context:
{live_context if live_context else 'No live search results available. Do not invent peer companies or facts.'}

Extract only companies supported by the supplied search results. Do not invent peers or statistics. Return fewer results when evidence is insufficient."""

        raw_data = llm_client.generate_json(prompt, system_instruction=SCANNER_SYSTEM_PROMPT)

        records: List[BenchmarkRecord] = []
        if isinstance(raw_data, list):
            items = raw_data
        elif isinstance(raw_data, dict) and "benchmarks" in raw_data:
            items = raw_data["benchmarks"]
        else:
            items = []

        for item in items:
            try:
                records.append(BenchmarkRecord(**item))
            except Exception:
                continue

        if not records:
            raise RuntimeError("No sourced benchmark records were returned. Configure live search and an LLM provider.")
        return records



benchmark_scanner = BenchmarkScanner()
