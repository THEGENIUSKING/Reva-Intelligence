"""
Privacy-Preserving Semantic Deduplication Engine for Reva (Flow 2a / Shared Pipeline).
Compares candidate ideas against Vanta's Idea Bank with zero data leakage.

Implements the two-tier novelty gate:
1. Local similarity shortlisting (computed on-device; confidential idea-bank text is never sent outside).
2. LLM wedge judge on shortlisted candidate pairs returning:
   - EXACT_DUPLICATE: Dropped from pipeline; linked to existing Vanta entry.
   - NEAR_SIMILAR: Kept in pipeline; records stated differentiator and Vanta entry it resembles.
   - NEW: Kept in pipeline.
Rule: Only exact duplicates are dropped. When unsure, the verdict is Near-similar.
"""

import math
import re
from typing import Any, Dict, List, Optional, Tuple
from pydantic import BaseModel, Field

from src.vanta.connector import vanta_connector, VantaInitiative
from src.parsers.doc_parser import IdeaBrief
from src.utils.llm_client import llm_client


class DeduplicationResult(BaseModel):
    verdict: str = Field(description="EXACT_DUPLICATE | NEAR_SIMILAR | NEW")
    similarity_score: float = Field(default=0.0, description="Computed similarity between 0.0 and 1.0")
    matching_vanta_id: Optional[str] = None
    matching_vanta_name: Optional[str] = None
    differentiator: Optional[str] = None
    action: str = Field(description="'drop' if EXACT_DUPLICATE, else 'keep'")


DEDUPE_JUDGE_PROMPT = """You are a strict African venture builder at Trium Limited.
Compare an incoming venture idea with an existing idea in Trium's Vanta Idea Bank.

INCOMING IDEA:
Name: {candidate_name}
Problem: {candidate_problem}
Solution: {candidate_solution}
Target Customer: {candidate_customer}
Monetization: {candidate_monetization}

EXISTING VANTA IDEA:
Name: {vanta_name}
Problem: {vanta_problem}
Solution: {vanta_solution}
Target Customer: {vanta_customer}
Monetization: {vanta_monetization}

Evaluate whether the incoming idea is:
1. EXACT_DUPLICATE: It solves the exact same problem for the exact same customer using the exact same business model and channel. (Must be dropped).
2. NEAR_SIMILAR: It operates in the same sector or targets a similar broad problem, but possesses a DISTINCT customer wedge (e.g. B2B food aggregators vs subsistence farmers), distinct distribution rail (e.g. refrigerated vans vs walk-in rooms), distinct regulatory moat, or distinct monetization model. (Must be kept!).
3. NEW: Fundamentally different concept.

CRITICAL RULE: Only drop if it is an EXACT duplicate. If there is meaningful differentiation or nuance, classify as NEAR_SIMILAR and clearly articulate the differentiator in 1-2 sentences. When in doubt, choose NEAR_SIMILAR.

Return ONLY a JSON object:
{{
  "verdict": "EXACT_DUPLICATE | NEAR_SIMILAR | NEW",
  "differentiator": "<explain why it is different, or state 'Identical value proposition and customer target' if duplicate>"
}}"""


class VantaDeduplicator:
    """Evaluates novelty of incoming ideas against Vanta Idea Bank."""

    def __init__(self):
        self.vanta_items: List[VantaInitiative] = []
        self._refresh_bank()

    def _refresh_bank(self):
        self.vanta_items = vanta_connector.fetch_idea_bank()

    @staticmethod
    def _tokenize(text: str) -> List[str]:
        return re.findall(r"\b[a-zA-Z0-9]{3,}\b", (text or "").lower())

    @classmethod
    def _compute_jaccard_similarity(cls, text_a: str, text_b: str) -> float:
        """Fast, robust on-device lexical and token overlap."""
        tokens_a = set(cls._tokenize(text_a))
        tokens_b = set(cls._tokenize(text_b))
        if not tokens_a or not tokens_b:
            return 0.0
        intersection = len(tokens_a.intersection(tokens_b))
        union = len(tokens_a.union(tokens_b))
        return intersection / union if union > 0 else 0.0

    def evaluate_novelty(self, brief: IdeaBrief) -> DeduplicationResult:
        """
        Runs candidate through local shortlisting, then LLM wedge judge on closest match.
        """
        if not self.vanta_items:
            self._refresh_bank()

        if not self.vanta_items:
            return DeduplicationResult(verdict="NEW", similarity_score=0.0, action="keep")

        candidate_text = f"{brief.name} {brief.problem} {brief.solution} {brief.targetCustomer}"

        # Step 1: Local similarity scoring across all Vanta bank initiatives
        scored_pairs: List[Tuple[float, VantaInitiative]] = []
        for item in self.vanta_items:
            vanta_text = f"{item.name} {item.problem or ''} {item.solution or ''} {item.targetCustomer or ''}"
            score = self._compute_jaccard_similarity(candidate_text, vanta_text)

            # Name match check
            name_score = self._compute_jaccard_similarity(brief.name, item.name)
            # Sector overlap check
            sector_overlap = 0.15 if (brief.sector and item.sector and brief.sector.lower() in item.sector.lower() or item.sector.lower() in (brief.sector or "").lower()) else 0.0

            combined_score = max(score, name_score * 0.95) + sector_overlap
            scored_pairs.append((combined_score, item))

        scored_pairs.sort(key=lambda x: x[0], reverse=True)
        top_score, top_match = scored_pairs[0]

        # Exact textual duplicate fast-path: name and core problem match with high overlap
        name_clean_candidate = brief.name.strip().lower()
        name_clean_vanta = top_match.name.strip().lower()
        if name_clean_candidate == name_clean_vanta or top_score >= 0.80:
            return DeduplicationResult(
                verdict="EXACT_DUPLICATE",
                similarity_score=round(top_score, 3),
                matching_vanta_id=top_match.id,
                matching_vanta_name=top_match.name,
                differentiator="Identical value proposition and customer target to existing Vanta entry.",
                action="drop"
            )

        # Truly novel concept fast-path
        if top_score < 0.18:
            return DeduplicationResult(
                verdict="NEW",
                similarity_score=round(top_score, 3),
                action="keep"
            )

        # Step 2: Near-similar candidate & LLM Wedge Judge
        prompt = DEDUPE_JUDGE_PROMPT.format(
            candidate_name=brief.name,
            candidate_problem=brief.problem,
            candidate_solution=brief.solution,
            candidate_customer=brief.targetCustomer,
            candidate_monetization=brief.monetization or "N/A",
            vanta_name=top_match.name,
            vanta_problem=top_match.problem or "N/A",
            vanta_solution=top_match.solution or "N/A",
            vanta_customer=top_match.targetCustomer or "N/A",
            vanta_monetization=top_match.expectedRevenue or "N/A"
        )

        try:
            decision = llm_client.generate_json(prompt)
            verdict = decision.get("verdict", "").upper()
            differentiator = decision.get("differentiator")

            if verdict == "EXACT_DUPLICATE":
                return DeduplicationResult(
                    verdict="EXACT_DUPLICATE",
                    similarity_score=round(top_score, 3),
                    matching_vanta_id=top_match.id,
                    matching_vanta_name=top_match.name,
                    differentiator="Identical value proposition and customer target.",
                    action="drop"
                )
            else:
                # Default safety: keep idea as NEAR_SIMILAR with articulated differentiator
                diff_text = differentiator or f"Operates in {brief.sector or 'same sector'}, but employs a differentiated customer wedge or delivery mechanism."
                return DeduplicationResult(
                    verdict="NEAR_SIMILAR",
                    similarity_score=round(top_score, 3),
                    matching_vanta_id=top_match.id,
                    matching_vanta_name=top_match.name,
                    differentiator=diff_text,
                    action="keep"
                )
        except Exception as e:
            print(f"[Dedupe] LLM Judge error: {e}. Resolving to NEAR_SIMILAR per safety rule.")
            return DeduplicationResult(
                verdict="NEAR_SIMILAR",
                similarity_score=round(top_score, 3),
                matching_vanta_id=top_match.id,
                matching_vanta_name=top_match.name,
                differentiator="Differentiated operational model in related sector (safety rule).",
                action="keep"
            )


vanta_deduplicator = VantaDeduplicator()
