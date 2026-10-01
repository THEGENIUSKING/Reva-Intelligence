"""
Phase 2 Verification Test Suite.
Tests Vanta API Connector, Privacy-Preserving Deduplication (Exact vs Near vs New),
Nigeria Viability Evaluator (6 Dimensions), and 7-Criteria Vanta Grader.
"""

import unittest
from src.parsers.doc_parser import IdeaBrief
from src.vanta.connector import vanta_connector
from src.vanta.dedupe import vanta_deduplicator
from src.viability.evaluator import viability_evaluator
from src.viability.grader import vanta_grader
from src.viability.pipeline_2a import pipeline_2a


class TestPhase2(unittest.TestCase):

    def setUp(self):
        # 1. Near-similar candidate (Similar domain to ColdHubs, but distinct B2B FMCG off-taker model)
        self.near_similar_brief = IdeaBrief(
            name="AgroFleet Africa",
            sector="Agriculture & Cold Chain",
            description="Refrigerated van-sharing and market-hub pre-cooling for commercial food processors and tomato FMCG aggregators.",
            problem="Tomato and vegetable post-harvest transit spoilage between farm clusters and commercial paste processing factories.",
            solution="Shared refrigerated fleet booking platform with IoT temperature logging and anchor take-or-pay processor agreements.",
            targetCustomer="Large commercial food processors (Tomato Jos, GB Foods) and regional produce aggregator co-operatives.",
            monetization="Per-kilometer refrigerated transit fee plus 6% cargo value brokerage."
        )

        # 2. Exact duplicate candidate (Mirrors seed-001 ColdHubs exactly)
        self.exact_duplicate_brief = IdeaBrief(
            name="ColdHubs Solar Storage",
            sector="Agriculture & Cold Chain",
            description="Pay-as-you-store solar powered walk-in cold rooms deployed in outdoor food markets for smallholders.",
            problem="Post-harvest losses of fruits and vegetables in outdoor open-air markets due to lack of cold storage.",
            solution="Walk-in solar cold rooms where farmers pay a flat daily rate per crate stored.",
            targetCustomer="Market women, smallholder tomato and pepper farmers in Northern and Southern Nigeria.",
            monetization="₦300–₦500 per crate per day cash payment at collection hub."
        )

        # 3. Completely new candidate (Edtech / Vocational apprenticeship)
        self.new_brief = IdeaBrief(
            name="SkillGrid Vocational Escrow",
            sector="EdTech & Future of Work",
            description="Escrow-protected apprenticeship placement and vocational certification platform for technical artisans.",
            problem="High youth unemployment combined with employer distrust of unverified artisans in construction and plumbing.",
            solution="Verified skill testing centers, employer wage escrows, and performance-backed micro-insurance.",
            targetCustomer="Technical vocational schools, SME construction contractors, and young artisans.",
            monetization="10% employer placement fee and certification testing charges."
        )

    def test_vanta_connector(self):
        items = vanta_connector.fetch_idea_bank()
        self.assertTrue(len(items) >= 4)
        print(f"\n[Test] Vanta Connector: Loaded {len(items)} Idea Bank initiatives.")

    def test_deduplicator_new_concept(self):
        res = vanta_deduplicator.evaluate_novelty(self.new_brief)
        self.assertEqual(res.verdict, "NEW")
        self.assertEqual(res.action, "keep")
        print(f"[Test] Dedupe Novel Concept: Verdict={res.verdict}, Action={res.action}")

    def test_deduplicator_exact_duplicate(self):
        res = vanta_deduplicator.evaluate_novelty(self.exact_duplicate_brief)
        self.assertEqual(res.verdict, "EXACT_DUPLICATE")
        self.assertEqual(res.action, "drop")
        self.assertIsNotNone(res.matching_vanta_name)
        print(f"[Test] Dedupe Exact Duplicate: Verdict={res.verdict}, Matched='{res.matching_vanta_name}', Action={res.action}")

    def test_deduplicator_near_similar(self):
        res = vanta_deduplicator.evaluate_novelty(self.near_similar_brief)
        self.assertIn(res.verdict, ["NEAR_SIMILAR", "NEW"])
        self.assertEqual(res.action, "keep")
        self.assertIsNotNone(res.differentiator)
        print(f"[Test] Dedupe Near-Similar: Verdict={res.verdict}, Differentiator='{res.differentiator}', Action={res.action}")

    def test_viability_evaluator(self):
        assessment = viability_evaluator.evaluate_viability(self.near_similar_brief)
        self.assertIn(assessment.overall_rating, ["High", "Medium"])
        self.assertEqual(assessment.status, "passed")
        self.assertEqual(len(assessment.dimensions), 6)
        print(f"[Test] Viability Evaluator: Rating={assessment.overall_rating} ({assessment.score_percentage}%), Status={assessment.status}")

    def test_vanta_grader(self):
        viability = viability_evaluator.evaluate_viability(self.near_similar_brief)
        scorecard = vanta_grader.draft_and_grade(self.near_similar_brief, viability)
        
        self.assertGreaterEqual(scorecard.ai_total, 66)
        self.assertIn(scorecard.ai_grade, ["B", "A", "A*"])
        self.assertEqual(scorecard.result, "passed")
        self.assertEqual(len(scorecard.criteria), 7)
        self.assertTrue(len(scorecard.draft_submission) >= 5)
        print(f"[Test] Vanta Grader: Score={scorecard.ai_total}/100, Grade={scorecard.ai_grade}, Result={scorecard.result}")

    def test_pipeline_2a_end_to_end(self):
        results = pipeline_2a.run(
            "Idea Name: AgroFleet Africa\n"
            "Sector: Agri-Logistics & Cold Storage\n"
            "Problem: Tomato and vegetable farmers in Kano and Kaduna lose up to 45% of produce post-harvest.\n"
            "Solution: Shared solar-powered cold storage hubs at local aggregation markets with IoT-managed Pay-as-you-chill daily rates.\n"
            "Target Customer: Peri-urban smallholder farming clusters and FMCG food processors.\n"
            "Monetization: ₦450 per 20kg crate per day plus 8% marketplace brokerage on bulk sales to processors."
        )
        self.assertEqual(len(results), 1)
        res = results[0]
        self.assertEqual(res.fate, "passed")
        self.assertIsNotNone(res.scorecard)
        self.assertGreaterEqual(res.scorecard.ai_total, 66)
        print(f"[Test] Pipeline 2a End-to-End: Fate={res.fate}, Summary='{res.summary_message}'")


if __name__ == "__main__":
    unittest.main()
