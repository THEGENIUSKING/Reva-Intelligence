"""
Phase 1 Verification Test Suite.
Tests Document Parsing, Benchmark Scanning, Strategic Synthesis,
Multi-Format Exporters (PDF, DOCX, PPTX), and Core Engine.
"""

import os
import unittest
from src.core.engine import TokenBucketRateLimiter, StateRegistry
from src.parsers.doc_parser import doc_parser, IdeaBrief
from src.benchmarking.scanner import benchmark_scanner
from src.benchmarking.synthesizer import benchmark_synthesizer
from src.benchmarking.exporter import benchmark_exporter
from src.benchmarking.pipeline import pipeline


class TestPhase1(unittest.TestCase):

    def setUp(self):
        self.sample_prompt = (
            "Idea Name: AgroFleet Africa\n"
            "Sector: Agri-Logistics & Cold Storage\n"
            "Problem: Tomato and vegetable farmers in Kano and Kaduna lose up to 45% of produce post-harvest.\n"
            "Solution: Shared solar-powered cold storage hubs at local aggregation markets with IoT-managed Pay-as-you-chill daily rates.\n"
            "Target Customer: Peri-urban smallholder farming clusters and FMCG food processors.\n"
            "Monetization: ₦450 per 20kg crate per day plus 8% marketplace brokerage on bulk sales to processors."
        )

    def test_doc_parser_from_prompt(self):
        brief = doc_parser.parse_to_brief(self.sample_prompt, is_file_path=False)
        self.assertIsInstance(brief, IdeaBrief)
        self.assertTrue(len(brief.name) > 0)
        self.assertTrue("AgroFleet" in brief.name or "Agri" in (brief.sector or ""))
        print(f"\n[Test] Parsed Brief: {brief.name} | Sector: {brief.sector}")

    def test_benchmark_scanner(self):
        brief = doc_parser.parse_to_brief(self.sample_prompt, is_file_path=False)
        benchmarks = benchmark_scanner.scan_benchmarks(brief)
        self.assertTrue(len(benchmarks) >= 3)
        
        # Verify Nearby African market representation
        nearby_found = any("nearby" in b.region_tier.lower() for b in benchmarks)
        self.assertTrue(nearby_found, "Nearby African benchmarks must be represented.")
        print(f"[Test] Benchmarks Scanned: {len(benchmarks)} records (Nearby Africa verified).")

    def test_synthesizer_apply_avoid(self):
        brief = doc_parser.parse_to_brief(self.sample_prompt, is_file_path=False)
        benchmarks = benchmark_scanner.scan_benchmarks(brief)
        report = benchmark_synthesizer.synthesize(brief, benchmarks)
        
        self.assertTrue(len(report.blueprint.what_to_apply) >= 2)
        self.assertTrue(len(report.blueprint.what_to_avoid) >= 2)
        self.assertTrue(len(report.blueprint.trium_strategic_verdict) > 20)
        print("[Test] Synthesis verified: What to Apply vs What to Avoid generated.")

    def test_exporters(self):
        brief = doc_parser.parse_to_brief(self.sample_prompt, is_file_path=False)
        benchmarks = benchmark_scanner.scan_benchmarks(brief)
        report = benchmark_synthesizer.synthesize(brief, benchmarks)

        # Word DOCX
        docx_file = benchmark_exporter.export_docx(report)
        self.assertTrue(os.path.exists(docx_file))
        self.assertTrue(os.path.getsize(docx_file) > 1000)

        # PowerPoint PPTX
        pptx_file = benchmark_exporter.export_pptx(report)
        self.assertTrue(os.path.exists(pptx_file))
        self.assertTrue(os.path.getsize(pptx_file) > 1000)

        # PDF
        pdf_file = benchmark_exporter.export_pdf(report)
        self.assertTrue(os.path.exists(pdf_file))
        self.assertTrue(os.path.getsize(pdf_file) > 1000)

        print(f"[Test] Exporters generated: DOCX ({os.path.getsize(docx_file)}B), PPTX ({os.path.getsize(pptx_file)}B), PDF ({os.path.getsize(pdf_file)}B)")

    def test_full_pipeline_run(self):
        result = pipeline.run(self.sample_prompt, is_file_path=False, export_formats=["docx", "pptx", "pdf"])
        self.assertEqual(result["status"], "success")
        self.assertTrue("docx" in result["export_files"])
        self.assertTrue("pptx" in result["export_files"])
        self.assertTrue("pdf" in result["export_files"])
        print("[Test] Full Pipeline Run: Success.")


if __name__ == "__main__":
    unittest.main()
