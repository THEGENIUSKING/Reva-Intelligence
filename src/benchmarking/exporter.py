"""
Multi-Format Export Engine for Reva (Flow 1).
Generates institutional-quality outputs in:
1. Executive PDF (using Chrome headless or ReportLab)
2. Microsoft Word DOCX (using python-docx)
3. Microsoft PowerPoint PPTX (using python-pptx)
All styled using Trium's brand tokens (Orange #FF6A13, Warm Paper #F6F5F2, Charcoal #141310).
"""

import os
import subprocess
from typing import Optional
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
from pptx import Presentation
from pptx.util import Inches as PptxInches, Pt as PptxPt
from pptx.dml.color import RGBColor as PptxRGBColor
from pptx.enum.text import PP_ALIGN

from src.benchmarking.synthesizer import BenchmarkReport


class BenchmarkExporter:
    """Exports BenchmarkReport to PDF, Word (DOCX), or PowerPoint (PPTX)."""

    def __init__(self, output_dir: Optional[str] = None):
        if output_dir is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            output_dir = os.path.join(base_dir, "outputs")
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)

    # =====================================================================
    # 1. MICROSOFT WORD (DOCX) EXPORT
    # =====================================================================
    def export_docx(self, report: BenchmarkReport, filename: Optional[str] = None) -> str:
        if filename is None:
            safe_name = "".join(c for c in report.brief.name if c.isalnum() or c in (" ", "-", "_")).strip()
            filename = f"Benchmark_{safe_name.replace(' ', '_')}.docx"
        file_path = os.path.join(self.output_dir, filename)

        doc = Document()

        # Set Margins
        for section in doc.sections:
            section.top_margin = Inches(0.8)
            section.bottom_margin = Inches(0.8)
            section.left_margin = Inches(0.8)
            section.right_margin = Inches(0.8)

        # Brand Colors
        c_orange = RGBColor(255, 106, 19)   # #FF6A13
        c_charcoal = RGBColor(20, 19, 16)   # #141310
        c_muted = RGBColor(96, 94, 91)      # #605E5B

        # Header Title
        p_tag = doc.add_paragraph()
        run_tag = p_tag.add_run("TRIUM LIMITED • VENTURE BENCHMARKING REPORT")
        run_tag.font.size = Pt(8.5)
        run_tag.font.bold = True
        run_tag.font.color.rgb = c_orange

        p_title = doc.add_paragraph()
        run_title = p_title.add_run(f"Global Benchmark Analysis: {report.brief.name}")
        run_title.font.size = Pt(20)
        run_title.font.bold = True
        run_title.font.color.rgb = c_charcoal

        p_sub = doc.add_paragraph()
        run_sub = p_sub.add_run(f"Sector: {report.brief.sector or 'Venture Tech'}  |  Nearby African & Emerging Peer Focus")
        run_sub.font.size = Pt(10)
        run_sub.font.color.rgb = c_muted

        doc.add_paragraph()  # spacing

        # Section 1: Concept Brief
        h1 = doc.add_heading(level=1)
        r_h1 = h1.add_run("1. Executive Concept Brief")
        r_h1.font.color.rgb = c_charcoal

        table_brief = doc.add_table(rows=4, cols=2)
        table_brief.alignment = WD_TABLE_ALIGNMENT.CENTER
        table_brief.autofit = False

        specs = [
            ("Problem Addressed", report.brief.problem),
            ("Proposed Solution", report.brief.solution),
            ("Target Customer", report.brief.targetCustomer),
            ("Monetization & Unit Economics", report.brief.monetization or "To be determined during ideation"),
        ]

        for i, (label, val) in enumerate(specs):
            row = table_brief.rows[i]
            cell_lbl = row.cells[0]
            cell_val = row.cells[1]
            cell_lbl.width = Inches(2.2)
            cell_val.width = Inches(4.6)

            cell_lbl.paragraphs[0].add_run(label).font.bold = True
            cell_lbl.paragraphs[0].runs[0].font.size = Pt(9.5)
            cell_val.paragraphs[0].add_run(val).font.size = Pt(9.5)

            # Subtle background fill on label cell
            shading = parse_xml(r'<w:shd {} w:fill="F6F5F2"/>'.format(nsdecls('w')))
            cell_lbl._tc.get_or_add_tcPr().append(shading)

        doc.add_paragraph()  # spacing

        # Section 2: Empirical Benchmarks Table
        h2 = doc.add_heading(level=1)
        r_h2 = h2.add_run("2. Empirical Benchmarks Across Peer Markets")
        r_h2.font.color.rgb = c_charcoal

        table_bm = doc.add_table(rows=1 + len(report.benchmarks), cols=5)
        table_bm.alignment = WD_TABLE_ALIGNMENT.CENTER

        headers = ["Company / Country", "Region Tier", "Scale & Metrics", "Business Model", "Lessons Learned"]
        hdr_row = table_bm.rows[0]
        for idx, text in enumerate(headers):
            cell = hdr_row.cells[idx]
            run = cell.paragraphs[0].add_run(text)
            run.font.bold = True
            run.font.size = Pt(9)
            run.font.color.rgb = RGBColor(255, 255, 255)
            shading = parse_xml(r'<w:shd {} w:fill="141310"/>'.format(nsdecls('w')))
            cell._tc.get_or_add_tcPr().append(shading)

        for row_idx, b in enumerate(report.benchmarks):
            row = table_bm.rows[row_idx + 1]
            row.cells[0].paragraphs[0].add_run(f"{b.company_name}\n({b.country})").font.size = Pt(8.5)
            row.cells[1].paragraphs[0].add_run(b.region_tier).font.size = Pt(8.5)
            row.cells[2].paragraphs[0].add_run(f"Funding: {b.funding_raised}\nScale: {b.operational_scale}").font.size = Pt(8.5)
            row.cells[3].paragraphs[0].add_run(b.business_model).font.size = Pt(8.5)
            row.cells[4].paragraphs[0].add_run(b.lessons_learned).font.size = Pt(8.5)

        doc.add_paragraph()  # spacing

        # Section 3: Nigeria Localization (Apply vs Avoid)
        h3 = doc.add_heading(level=1)
        r_h3 = h3.add_run("3. Strategic Localization for the Nigerian Market")
        r_h3.font.color.rgb = c_charcoal

        p_apply_hdr = doc.add_paragraph()
        r_ah = p_apply_hdr.add_run("✓ WHAT TO APPLY IN NIGERIA")
        r_ah.font.bold = True
        r_ah.font.size = Pt(11)
        r_ah.font.color.rgb = RGBColor(21, 128, 61)  # Green

        for item in report.blueprint.what_to_apply:
            p = doc.add_paragraph(style='List Bullet')
            r_bold = p.add_run(item.get("title", "") + ": ")
            r_bold.font.bold = True
            p.add_run(item.get("recommendation", "") + " ")
            r_par = p.add_run(f"[Parallel: {item.get('parallel_benchmark', '')}]")
            r_par.font.italic = True
            r_par.font.size = Pt(8.5)

        p_avoid_hdr = doc.add_paragraph()
        r_vh = p_avoid_hdr.add_run("✗ WHAT TO AVOID IN NIGERIA (CRITICAL PITFALLS)")
        r_vh.font.bold = True
        r_vh.font.size = Pt(11)
        r_vh.font.color.rgb = RGBColor(185, 28, 28)  # Red

        for item in report.blueprint.what_to_avoid:
            p = doc.add_paragraph(style='List Bullet')
            r_bold = p.add_run(item.get("title", "") + ": ")
            r_bold.font.bold = True
            p.add_run(item.get("warning", "") + " ")
            r_rea = p.add_run(f"[Risk Factor: {item.get('pitfall_reason', '')}]")
            r_rea.font.italic = True
            r_rea.font.size = Pt(8.5)

        # Section 4: Trium IC Verdict
        doc.add_paragraph()
        h4 = doc.add_heading(level=1)
        r_h4 = h4.add_run("4. Trium Venture Studio Verdict & Recommended Next Step")
        r_h4.font.color.rgb = c_charcoal

        p_verdict = doc.add_paragraph()
        r_vtext = p_verdict.add_run(report.blueprint.trium_strategic_verdict)
        r_vtext.font.size = Pt(10)

        doc.save(file_path)
        return file_path

    # =====================================================================
    # 2. MICROSOFT POWERPOINT (PPTX) EXPORT
    # =====================================================================
    def export_pptx(self, report: BenchmarkReport, filename: Optional[str] = None) -> str:
        if filename is None:
            safe_name = "".join(c for c in report.brief.name if c.isalnum() or c in (" ", "-", "_")).strip()
            filename = f"Benchmark_{safe_name.replace(' ', '_')}.pptx"
        file_path = os.path.join(self.output_dir, filename)

        prs = Presentation()
        prs.slide_width = PptxInches(13.333)   # 16:9 Widescreen
        prs.slide_height = PptxInches(7.5)

        blank_layout = prs.slide_layouts[6]

        # Colors
        c_orange = PptxRGBColor(255, 106, 19)
        c_charcoal = PptxRGBColor(20, 19, 16)
        c_paper = PptxRGBColor(246, 245, 242)
        c_white = PptxRGBColor(255, 255, 255)
        c_gray = PptxRGBColor(96, 94, 91)

        # --- SLIDE 1: Cover Slide ---
        s1 = prs.slides.add_slide(blank_layout)
        tb1 = s1.shapes.add_textbox(PptxInches(1.2), PptxInches(2.2), PptxInches(10.5), PptxInches(3.5))
        tf1 = tb1.text_frame
        tf1.word_wrap = True

        p_tag = tf1.paragraphs[0]
        p_tag.text = "TRIUM LIMITED • VENTURE BENCHMARK BRIEFING"
        p_tag.font.size = PptxPt(12)
        p_tag.font.bold = True
        p_tag.font.color.rgb = c_orange

        p_main = tf1.add_paragraph()
        p_main.text = f"{report.brief.name}\nGlobal & Emerging Market Benchmarks"
        p_main.font.size = PptxPt(36)
        p_main.font.bold = True
        p_main.font.color.rgb = c_charcoal

        p_sub = tf1.add_paragraph()
        p_sub.text = f"Sector: {report.brief.sector or 'Venture Tech'} | Focus: Nearby Africa & Emerging Peers"
        p_sub.font.size = PptxPt(16)
        p_sub.font.color.rgb = c_gray

        # --- SLIDE 2: Concept Overview & Problem-Solution ---
        s2 = prs.slides.add_slide(blank_layout)
        tb2 = s2.shapes.add_textbox(PptxInches(1.0), PptxInches(0.8), PptxInches(11.3), PptxInches(5.8))
        tf2 = tb2.text_frame
        tf2.word_wrap = True

        p2_hdr = tf2.paragraphs[0]
        p2_hdr.text = "1. Executive Concept Overview"
        p2_hdr.font.size = PptxPt(22)
        p2_hdr.font.bold = True
        p2_hdr.font.color.rgb = c_charcoal

        items = [
            ("Core Problem:", report.brief.problem),
            ("Proposed Solution:", report.brief.solution),
            ("Target Audience:", report.brief.targetCustomer),
            ("Monetization Model:", report.brief.monetization or "To be validated during ideation"),
        ]
        for label, desc in items:
            p_lbl = tf2.add_paragraph()
            p_lbl.text = f"\n{label}"
            p_lbl.font.size = PptxPt(14)
            p_lbl.font.bold = True
            p_lbl.font.color.rgb = c_orange

            p_desc = tf2.add_paragraph()
            p_desc.text = desc
            p_desc.font.size = PptxPt(13)
            p_desc.font.color.rgb = c_charcoal

        # --- SLIDE 3: Empirical Benchmarks Matrix ---
        s3 = prs.slides.add_slide(blank_layout)
        tb3 = s3.shapes.add_textbox(PptxInches(1.0), PptxInches(0.8), PptxInches(11.3), PptxInches(5.8))
        tf3 = tb3.text_frame
        tf3.word_wrap = True

        p3_hdr = tf3.paragraphs[0]
        p3_hdr.text = "2. Empirical Peer Market Case Studies"
        p3_hdr.font.size = PptxPt(22)
        p3_hdr.font.bold = True
        p3_hdr.font.color.rgb = c_charcoal

        for b in report.benchmarks[:3]:
            p_co = tf3.add_paragraph()
            p_co.text = f"\n• {b.company_name} ({b.country} — {b.region_tier})"
            p_co.font.size = PptxPt(14)
            p_co.font.bold = True
            p_co.font.color.rgb = c_orange

            p_det = tf3.add_paragraph()
            p_det.text = f"  Scale: {b.operational_scale} | Model: {b.business_model}\n  Lesson: {b.lessons_learned}"
            p_det.font.size = PptxPt(12)
            p_det.font.color.rgb = c_charcoal

        # --- SLIDE 4: Nigeria Strategic Blueprint ---
        s4 = prs.slides.add_slide(blank_layout)
        tb4 = s4.shapes.add_textbox(PptxInches(1.0), PptxInches(0.8), PptxInches(11.3), PptxInches(5.8))
        tf4 = tb4.text_frame
        tf4.word_wrap = True

        p4_hdr = tf4.paragraphs[0]
        p4_hdr.text = "3. Nigeria Deployment Blueprint: What to Apply vs Avoid"
        p4_hdr.font.size = PptxPt(22)
        p4_hdr.font.bold = True
        p4_hdr.font.color.rgb = c_charcoal

        p4_app = tf4.add_paragraph()
        p4_app.text = "\nWHAT TO APPLY IN NIGERIA:"
        p4_app.font.size = PptxPt(13)
        p4_app.font.bold = True
        p4_app.font.color.rgb = PptxRGBColor(21, 128, 61)

        for a in report.blueprint.what_to_apply[:2]:
            p_a = tf4.add_paragraph()
            p_a.text = f"• {a.get('title')}: {a.get('recommendation')}"
            p_a.font.size = PptxPt(11.5)
            p_a.font.color.rgb = c_charcoal

        p4_avd = tf4.add_paragraph()
        p4_avd.text = "\nWHAT TO AVOID IN NIGERIA:"
        p4_avd.font.size = PptxPt(13)
        p4_avd.font.bold = True
        p4_avd.font.color.rgb = PptxRGBColor(185, 28, 28)

        for v in report.blueprint.what_to_avoid[:2]:
            p_v = tf4.add_paragraph()
            p_v.text = f"• {v.get('title')}: {v.get('warning')}"
            p_v.font.size = PptxPt(11.5)
            p_v.font.color.rgb = c_charcoal

        prs.save(file_path)
        return file_path

    # =====================================================================
    # 3. EXECUTIVE PDF EXPORT
    # =====================================================================
    def export_pdf(self, report: BenchmarkReport, filename: Optional[str] = None) -> str:
        if filename is None:
            safe_name = "".join(c for c in report.brief.name if c.isalnum() or c in (" ", "-", "_")).strip()
            filename = f"Benchmark_{safe_name.replace(' ', '_')}.pdf"
        file_path = os.path.join(self.output_dir, filename)
        html_path = os.path.join(self.output_dir, f"{os.path.splitext(filename)[0]}.html")

        # Build clean HTML template
        html_content = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=DM+Serif+Display&display=swap');
  @page {{ size: A4 portrait; margin: 18mm 16mm; }}
  body {{ font-family: 'Plus Jakarta Sans', sans-serif; color: #1D1B18; font-size: 9.5pt; line-height: 1.5; background: #FFF; }}
  .tag {{ color: #FF6A13; font-weight: 700; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.5px; }}
  h1 {{ font-family: 'DM Serif Display', serif; font-size: 22pt; margin: 4px 0 8px 0; color: #141310; }}
  .sub {{ color: #605E5B; font-size: 9.5pt; margin-bottom: 20px; }}
  .card {{ background: #F6F5F2; border-radius: 8px; padding: 14px; margin-bottom: 16px; border: 1px solid #E2DFD9; }}
  table {{ width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 8.5pt; }}
  th {{ background: #141310; color: #FFF; text-align: left; padding: 6px 10px; font-size: 8pt; text-transform: uppercase; }}
  td {{ padding: 6px 10px; border: 1px solid #E2DFD9; vertical-align: top; }}
  tr:nth-child(even) td {{ background: #FAF9F6; }}
  .apply-box {{ border-left: 3.5px solid #16A34A; background: #F0FDF4; padding: 10px 12px; margin-bottom: 10px; }}
  .avoid-box {{ border-left: 3.5px solid #DC2626; background: #FEF2F2; padding: 10px 12px; margin-bottom: 10px; }}
  h2 {{ font-size: 12pt; border-bottom: 1.5px solid #FF6A13; padding-bottom: 4px; margin-top: 18px; color: #141310; }}
</style>
</head>
<body>
  <div class="tag">TRIUM LIMITED • VENTURE BENCHMARKING REPORT</div>
  <h1>{report.brief.name}</h1>
  <div class="sub">Sector: {report.brief.sector} | Regional Focus: Nearby Africa & Emerging Peers</div>

  <div class="card">
    <strong>Executive Concept Overview:</strong> {report.brief.description}<br><br>
    <strong>Problem:</strong> {report.brief.problem}<br>
    <strong>Proposed Solution:</strong> {report.brief.solution}<br>
    <strong>Target Customer:</strong> {report.brief.targetCustomer}<br>
    <strong>Monetization Model:</strong> {report.brief.monetization or 'To be validated'}
  </div>

  <h2>Empirical Peer Benchmarks</h2>
  <table>
    <thead>
      <tr>
        <th>Company</th>
        <th>Region Tier</th>
        <th>Scale & Funding</th>
        <th>Business Model</th>
        <th>Lessons Learned</th>
      </tr>
    </thead>
    <tbody>
      {''.join([f"<tr><td><strong>{b.company_name}</strong><br>({b.country})</td><td>{b.region_tier}</td><td>{b.funding_raised}<br>{b.operational_scale}</td><td>{b.business_model}</td><td>{b.lessons_learned}</td></tr>" for b in report.benchmarks])}
    </tbody>
  </table>

  <h2>Strategic Localization for Nigeria</h2>
  <div class="apply-box">
    <strong style="color:#15803D;">✓ WHAT TO APPLY IN NIGERIA:</strong>
    <ul>
      {''.join([f"<li><strong>{a.get('title')}:</strong> {a.get('recommendation')}</li>" for a in report.blueprint.what_to_apply])}
    </ul>
  </div>

  <div class="avoid-box">
    <strong style="color:#B91C1C;">✗ WHAT TO AVOID IN NIGERIA (CRITICAL PITFALLS):</strong>
    <ul>
      {''.join([f"<li><strong>{v.get('title')}:</strong> {v.get('warning')}</li>" for v in report.blueprint.what_to_avoid])}
    </ul>
  </div>

  <h2>Trium Venture Studio Verdict</h2>
  <p>{report.blueprint.trium_strategic_verdict}</p>
</body>
</html>
"""
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(html_content)

        chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
        if not os.path.exists(chrome_path):
            chrome_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

        cmd = [
            chrome_path,
            "--headless=new",
            "--disable-gpu",
            "--no-pdf-header-footer",
            f"--print-to-pdf={file_path}",
            html_path
        ]
        subprocess.run(cmd, capture_output=True, text=True)
        return file_path


benchmark_exporter = BenchmarkExporter()
