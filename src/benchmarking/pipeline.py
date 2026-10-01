"""
End-to-End Benchmarking Pipeline for Flow 1 (Phase 1).
Coordinates input parsing, deep web scan, strategic synthesis, and multi-format export.
"""

from typing import Dict, Any, Optional
from src.parsers.doc_parser import doc_parser, IdeaBrief
from src.benchmarking.scanner import benchmark_scanner
from src.benchmarking.synthesizer import benchmark_synthesizer, BenchmarkReport
from src.benchmarking.exporter import benchmark_exporter
from src.core.engine import global_registry


class BenchmarkingPipeline:
    """Orchestrates Flow 1 from raw input to generated exports."""

    def run(
        self,
        raw_input: str,
        is_file_path: bool = False,
        export_formats: Optional[list] = None
    ) -> Dict[str, Any]:
        if export_formats is None:
            export_formats = ["pdf", "docx", "pptx"]

        print(f"[Flow 1] Step 1: Parsing input ({'File' if is_file_path else 'Prompt'})...")
        brief: IdeaBrief = doc_parser.parse_to_brief(raw_input, is_file_path=is_file_path)

        # Check Cache
        cached_json = global_registry.get_cached_benchmark(brief.description)
        if cached_json:
            print(f"[Flow 1] Cache Hit: Retrieved existing benchmark report for '{brief.name}'.")

        print(f"[Flow 1] Step 2: Scanning peer benchmarks across Nearby Africa & Emerging Peers...")
        benchmarks = benchmark_scanner.scan_benchmarks(brief)

        print(f"[Flow 1] Step 3: Synthesizing 'What to Apply vs Avoid in Nigeria' blueprint...")
        report: BenchmarkReport = benchmark_synthesizer.synthesize(brief, benchmarks)

        # Cache the report
        global_registry.cache_benchmark(
            concept_text=brief.description,
            idea_name=brief.name,
            sector=brief.sector or "Tech",
            benchmark_json=report.model_dump_json()
        )

        print(f"[Flow 1] Step 4: Generating selected export formats ({', '.join(export_formats)})...")
        export_files: Dict[str, str] = {}

        if "docx" in export_formats:
            docx_path = benchmark_exporter.export_docx(report)
            export_files["docx"] = docx_path
            print(f"  [OK] Word Memo: {docx_path}")

        if "pptx" in export_formats:
            pptx_path = benchmark_exporter.export_pptx(report)
            export_files["pptx"] = pptx_path
            print(f"  [OK] PowerPoint Deck: {pptx_path}")

        if "pdf" in export_formats:
            pdf_path = benchmark_exporter.export_pdf(report)
            export_files["pdf"] = pdf_path
            print(f"  [OK] Executive PDF: {pdf_path}")

        return {
            "status": "success",
            "concept_name": brief.name,
            "sector": brief.sector,
            "benchmarks_found": len(benchmarks),
            "nearby_africa_count": report.nearby_africa_count,
            "emerging_peer_count": report.emerging_peer_count,
            "global_leader_count": report.global_leader_count,
            "what_to_apply_count": len(report.blueprint.what_to_apply),
            "what_to_avoid_count": len(report.blueprint.what_to_avoid),
            "export_files": export_files,
            "report": report
        }


pipeline = BenchmarkingPipeline()
