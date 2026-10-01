"""
Strategic Synthesis Engine for Reva.
Synthesizes benchmark findings and generates the localized
"What to Apply in Nigeria" and "What to Avoid in Nigeria" operational blueprints.
"""

from typing import Any, Dict, List
from pydantic import BaseModel, Field

from src.parsers.doc_parser import IdeaBrief
from src.benchmarking.scanner import BenchmarkRecord
from src.utils.llm_client import llm_client


class StrategicBlueprint(BaseModel):
    what_to_apply: List[Dict[str, str]] = Field(
        description="List of strategies to adopt in Nigeria, each with 'title', 'recommendation', and 'parallel_benchmark'"
    )
    what_to_avoid: List[Dict[str, str]] = Field(
        description="List of costly pitfalls to avoid in Nigeria, each with 'title', 'warning', and 'pitfall_reason'"
    )
    recurring_patterns: List[str] = Field(
        description="Key patterns across what worked and what failed globally/emerging markets"
    )
    trium_strategic_verdict: str = Field(
        description="Executive summary and recommended next steps for Trium's venture studio team"
    )


class BenchmarkReport(BaseModel):
    brief: IdeaBrief
    benchmarks: List[BenchmarkRecord]
    blueprint: StrategicBlueprint
    total_benchmarks_count: int
    nearby_africa_count: int
    emerging_peer_count: int
    global_leader_count: int


SYNTHESIS_SYSTEM_PROMPT = """You are a senior venture builder at Trium Limited, evaluating how to localize a business concept for the Nigerian market.
Analyze the provided idea brief and empirical benchmark records from nearby Africa and emerging markets.

Synthesize an executive-level strategic blueprint:
1. 'what_to_apply': Exactly 3 concrete, high-margin, actionable strategies to deploy in Nigeria (e.g. offline agent networks, USSD rails, corporate off-taker anchor contracts, FX hedging, hybrid cash/digital touchpoints).
2. 'what_to_avoid': Exactly 3 dangerous pitfalls to avoid in Nigeria (e.g. credit-card recurring billing, unhedged foreign CapEx, direct asset sales to low-liquidity segments, assuming high customer willingness-to-pay for software-only utilities).
3. 'recurring_patterns': 3 to 4 recurring themes across what worked vs what failed.
4. 'trium_strategic_verdict': A 3-4 sentence IC verdict summarizing whether this idea represents a compelling venture studio build for Trium.

Return ONLY a JSON object:
{
  "what_to_apply": [
    {"title": "...", "recommendation": "...", "parallel_benchmark": "..."}
  ],
  "what_to_avoid": [
    {"title": "...", "warning": "...", "pitfall_reason": "..."}
  ],
  "recurring_patterns": [
    "...", "..."
  ],
  "trium_strategic_verdict": "..."
}"""


class BenchmarkSynthesizer:
    """Synthesizes benchmarks and contextualizes them for Nigerian deployment."""

    def synthesize(self, brief: IdeaBrief, benchmarks: List[BenchmarkRecord]) -> BenchmarkReport:
        benchmarks_summary = "\n\n".join([
            f"- Company: {b.company_name} ({b.country} | Tier: {b.region_tier})\n"
            f"  Numbers: {b.funding_raised} | Scale: {b.operational_scale}\n"
            f"  Model: {b.business_model}\n"
            f"  Lessons Learned: {b.lessons_learned}"
            for b in benchmarks
        ])

        prompt = f"""Concept Name: {brief.name}
Sector: {brief.sector}
Description: {brief.description}
Problem: {brief.problem}
Solution: {brief.solution}
Target Customer: {brief.targetCustomer}
Monetization: {brief.monetization}

Benchmark Records from Peer Markets:
{benchmarks_summary}

Synthesize the localized 'What to Apply' and 'What to Avoid' in Nigeria."""

        raw_data = llm_client.generate_json(prompt, system_instruction=SYNTHESIS_SYSTEM_PROMPT)

        if not isinstance(raw_data, dict):
            raise RuntimeError("The LLM provider did not return a strategic blueprint.")
        blueprint = StrategicBlueprint(**raw_data)

        # Compute tier metrics
        nearby_count = sum(1 for b in benchmarks if "nearby" in b.region_tier.lower())
        emerging_count = sum(1 for b in benchmarks if "emerging" in b.region_tier.lower())
        global_count = sum(1 for b in benchmarks if "global" in b.region_tier.lower())

        return BenchmarkReport(
            brief=brief,
            benchmarks=benchmarks,
            blueprint=blueprint,
            total_benchmarks_count=len(benchmarks),
            nearby_africa_count=nearby_count,
            emerging_peer_count=emerging_count,
            global_leader_count=global_count
        )



benchmark_synthesizer = BenchmarkSynthesizer()
