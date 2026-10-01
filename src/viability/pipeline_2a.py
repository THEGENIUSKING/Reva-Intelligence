"""
Flow 2a & Shared Idea Pipeline Orchestrator for Reva.
Extracts ideas, performs privacy-preserving Vanta deduplication,
screens for Nigerian viability, and drafts passing 7-criteria submission responses.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from src.parsers.doc_parser import doc_parser, IdeaBrief
from src.vanta.dedupe import vanta_deduplicator, DeduplicationResult
from src.viability.evaluator import viability_evaluator, ViabilityAssessment
from src.viability.grader import vanta_grader, VantaScorecard


class EvaluatedIdeaResult(BaseModel):
    brief: IdeaBrief
    fate: str = Field(description="'passed' | 'dropped_exact_duplicate' | 'parked_below_viability' | 'parked_below_pass'")
    dedupe: DeduplicationResult
    viability: Optional[ViabilityAssessment] = None
    scorecard: Optional[VantaScorecard] = None
    summary_message: str


class Pipeline2a:
    """Shared Idea Pipeline used across Flow 2a, Flow 2b, and Flow 2c."""

    def process_idea(self, brief: IdeaBrief) -> EvaluatedIdeaResult:
        print(f"\n[Shared Pipeline] Processing idea: '{brief.name}'...")

        # Step 1: Privacy-Preserving Deduplication vs Vanta Idea Bank
        dedupe_res = vanta_deduplicator.evaluate_novelty(brief)
        print(f"  [1. Dedupe] Verdict: {dedupe_res.verdict} (Similarity: {dedupe_res.similarity_score})")

        if dedupe_res.action == "drop":
            return EvaluatedIdeaResult(
                brief=brief,
                fate="dropped_exact_duplicate",
                dedupe=dedupe_res,
                summary_message=f"Dropped as exact duplicate of Vanta initiative '{dedupe_res.matching_vanta_name}'."
            )

        # Step 2: Nigeria Market Viability Assessment (6 Dimensions)
        viability_res = viability_evaluator.evaluate_viability(brief)
        print(f"  [2. Viability] Rating: {viability_res.overall_rating} ({viability_res.score_percentage}%) - Status: {viability_res.status}")

        if viability_res.status != "passed":
            return EvaluatedIdeaResult(
                brief=brief,
                fate="parked_below_viability",
                dedupe=dedupe_res,
                viability=viability_res,
                summary_message=f"Parked below viability threshold (Rating: {viability_res.overall_rating}). Gaps: {viability_res.executive_verdict}"
            )

        # Step 3: Trium 7-Criteria Drafting & Scoring (Targeting Grade B to A)
        scorecard = vanta_grader.draft_and_grade(brief, viability_res)
        print(f"  [3. Grading] Score: {scorecard.ai_total}/100 | Grade: {scorecard.ai_grade} ({scorecard.result}) | Revisions: {scorecard.revision_rounds_used}")

        if scorecard.ai_total < 66:
            return EvaluatedIdeaResult(
                brief=brief,
                fate="parked_below_pass",
                dedupe=dedupe_res,
                viability=viability_res,
                scorecard=scorecard,
                summary_message=f"Parked below pass threshold (Score: {scorecard.ai_total}/100, Grade {scorecard.ai_grade}). Does not qualify for DIT promotion."
            )

        return EvaluatedIdeaResult(
            brief=brief,
            fate="passed",
            dedupe=dedupe_res,
            viability=viability_res,
            scorecard=scorecard,
            summary_message=f"PASSED Trium assessment with Score {scorecard.ai_total}/100 (Grade {scorecard.ai_grade}). Ready for Vanta intake / DIT notification."
        )

    def run(self, raw_input: str, is_file_path: bool = False) -> List[EvaluatedIdeaResult]:
        """
        Runs on-demand viability screening on input prompt or uploaded document.
        Disaggregates into discrete ideas if multi-idea input.
        """
        brief = doc_parser.parse_to_brief(raw_input, is_file_path=is_file_path)
        # In v1, single or primary idea is evaluated through the shared pipeline
        result = self.process_idea(brief)
        return [result]


pipeline_2a = Pipeline2a()
