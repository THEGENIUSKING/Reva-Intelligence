import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType
} from "docx";
import { jsPDF } from "jspdf";
import pptxgen from "pptxgenjs";

export async function exportToPowerPoint(report) {
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Trium Limited";
  pptx.subject = "Venture benchmark research";
  pptx.title = `Benchmark: ${report.ideaName || "Venture"}`;
  pptx.company = "Trium Limited";
  pptx.theme = {
    headFontFace: "Aptos Display",
    bodyFontFace: "Aptos",
    lang: "en-NG",
  };
  const color = { ink: "1B1C19", muted: "625B53", accent: "924700", paper: "FBF9F4", card: "F1EFE9" };
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: color.paper };
  titleSlide.addText("TRIUM  /  VENTURE INTELLIGENCE", { x: 0.65, y: 0.45, w: 8, h: 0.25, fontSize: 10, bold: true, charSpacing: 1.5, color: color.accent });
  titleSlide.addText(report.ideaName || "Venture benchmark", { x: 0.65, y: 1.2, w: 12, h: 0.8, fontSize: 30, bold: true, color: color.ink, breakLine: false });
  titleSlide.addText(report.sector || "Sector not specified", { x: 0.68, y: 2.0, w: 12, h: 0.4, fontSize: 15, color: color.muted });
  titleSlide.addText(report.description || "No concept description supplied.", { x: 0.68, y: 2.8, w: 11.5, h: 1.2, fontSize: 18, color: color.ink, breakLine: false, valign: "top", fit: "shrink" });
  titleSlide.addText(`Prepared ${new Date(report.createdAt || Date.now()).toLocaleDateString()}`, { x: 0.68, y: 6.7, w: 6, h: 0.3, fontSize: 10, color: color.muted });

  if (report.scoringCriteria) {
    const slide = pptx.addSlide();
    slide.background = { color: "FFFFFF" };
    slide.addText("TRIUM / CORONATION GROUP", { x: 0.55, y: 0.35, w: 5, h: 0.25, fontSize: 10, bold: true, charSpacing: 1.3, color: color.accent });
    slide.addText("Assessment guide", { x: 0.55, y: 0.7, w: 12, h: 0.5, fontSize: 23, bold: true, color: color.ink });
    const criteriaRows = [["Criterion", "Score", "Evidence-based assessment"]];
    for (const [name, value] of Object.entries(report.scoringCriteria)) {
      if (!value || typeof value !== "object" || !("score" in value)) continue;
      const criterion = value;
      criteriaRows.push([name.replace(/([A-Z])/g, " $1"), `${criterion.score}/${criterion.max}`, criterion.rationale || "No rationale returned."]);
    }
    slide.addTable(criteriaRows, {
      x: 0.55, y: 1.45, w: 12.2, h: 5.3,
      border: { type: "solid", color: "DED8CE", pt: 0.6 },
      fill: "FFFFFF", color: color.ink, fontFace: "Aptos", fontSize: 11,
      rowH: 0.65, colW: [2.3, 1.2, 8.7], margin: 0.12, valign: "mid", autoFit: false,
    });
    slide.addText(`Composite score ${report.scoringCriteria.totalScore ?? "—"}/100 · Grade ${report.scoringCriteria.grade || "Not scored"}`, { x: 0.55, y: 6.85, w: 12, h: 0.25, fontSize: 10, color: color.muted });
  }

  const peers = report.benchmarks || [];
  for (let offset = 0; offset < peers.length; offset += 4) {
    const slide = pptx.addSlide();
    slide.background = { color: "FFFFFF" };
    slide.addText("BENCHMARK COHORT", { x: 0.55, y: 0.35, w: 4, h: 0.25, fontSize: 10, bold: true, charSpacing: 1.3, color: color.accent });
    slide.addText(`${report.ideaName || "Venture"}: comparable initiatives`, { x: 0.55, y: 0.7, w: 12, h: 0.5, fontSize: 23, bold: true, color: color.ink });
    const rows = [["Company", "Country / tier", "Business model", "Evidence & lesson", "Source"]];
    for (const peer of peers.slice(offset, offset + 4)) {
      rows.push([
        peer.companyName || "Unspecified",
        `${peer.country || "Not verified"} / ${peer.regionTier || "Not classified"}`,
        peer.businessModel || "Not verified",
        [
          `Scale: ${peer.operationalScale || "Not publicly reported"}`,
          `Customers/revenue: ${peer.customersAndRevenues || "Not publicly reported"}`,
          `ROI/viability: ${peer.roiAndViability || "Not publicly reported"}`,
          `Partners: ${peer.keyPartners || "Not publicly reported"}`,
          `Lesson: ${peer.lessonsLearned || "Not stated"}`,
        ].join("\n"),
        peer.sourceUrl || "No verified citation",
      ]);
    }
    slide.addTable(rows, {
      x: 0.55, y: 1.5, w: 12.2, h: 4.9,
      border: { type: "solid", color: "DED8CE", pt: 0.6 },
      fill: "FFFFFF", color: color.ink, fontFace: "Aptos", fontSize: 11,
      rowH: 0.9, colW: [2.0, 1.7, 2.5, 3.7, 2.3],
      margin: 0.12, valign: "mid",
      autoFit: false,
      bold: false,
      rowColors: [color.card],
    });
    slide.addText(`Sources are linked for verification. ${peers.length} sourced peers returned.`, { x: 0.55, y: 6.75, w: 12, h: 0.25, fontSize: 9, color: color.muted });
  }

  const sourceArticles = report.sourceArticles || [];
  for (let offset = 0; offset < sourceArticles.length; offset += 4) {
    const slide = pptx.addSlide();
    slide.background = { color: "FFFFFF" };
    slide.addText("CRAWLED SOURCE EVIDENCE", { x: 0.55, y: 0.35, w: 5, h: 0.25, fontSize: 10, bold: true, charSpacing: 1.3, color: color.accent });
    slide.addText(`${report.ideaName || "Initiative"}: source articles`, { x: 0.55, y: 0.7, w: 12, h: 0.5, fontSize: 23, bold: true, color: color.ink });
    sourceArticles.slice(offset, offset + 4).forEach((article, index) => {
      const y = 1.45 + index * 1.3;
      slide.addText(article.title, { x: 0.65, y, w: 11.8, h: 0.25, fontSize: 14, bold: true, color: color.ink, fit: "shrink" });
      slide.addText(`${article.sourceName} · ${article.sourceRegion}${article.publishedDate ? ` · ${article.publishedDate}` : ""}`, { x: 0.65, y: y + 0.27, w: 11.8, h: 0.2, fontSize: 9, color: color.muted });
      slide.addText(article.summary, { x: 0.65, y: y + 0.49, w: 11.8, h: 0.42, fontSize: 10, color: color.ink, fit: "shrink", valign: "top" });
      slide.addText(`Initiatives: ${(article.relatedInitiatives || []).join(", ") || "None stated"} · ${article.url}`, { x: 0.65, y: y + 0.93, w: 11.8, h: 0.24, fontSize: 8, color: color.accent, fit: "shrink" });
    });
  }

  const guidance = report.blueprint || {};
  for (const [heading, items, field, supporting] of [
    ["Apply in Nigeria", guidance.whatToApply || [], "recommendation", "parallelBenchmark"],
    ["Avoid in Nigeria", guidance.whatToAvoid || [], "warning", "pitfallReason"],
  ]) {
    const slide = pptx.addSlide();
    slide.background = { color: color.paper };
    slide.addText("LOCALIZATION BLUEPRINT", { x: 0.6, y: 0.4, w: 5, h: 0.25, fontSize: 10, bold: true, charSpacing: 1.4, color: color.accent });
    slide.addText(heading, { x: 0.6, y: 0.82, w: 12, h: 0.55, fontSize: 25, bold: true, color: color.ink });
    items.slice(0, 5).forEach((item, index) => {
      const y = 1.7 + index * 0.92;
      slide.addText(`${index + 1}. ${item.title || "Recommendation"}`, { x: 0.7, y, w: 11.8, h: 0.3, fontSize: 15, bold: true, color: color.accent });
      slide.addText([item[field], item[supporting]].filter(Boolean).join(" — "), { x: 0.98, y: y + 0.32, w: 11.3, h: 0.45, fontSize: 12, color: color.ink, fit: "shrink" });
    });
  }
  const verdict = pptx.addSlide();
  verdict.background = { color: "FFFFFF" };
  verdict.addText("SYNTHESIS", { x: 0.6, y: 0.45, w: 5, h: 0.25, fontSize: 10, bold: true, charSpacing: 1.4, color: color.accent });
  verdict.addText("What the evidence suggests", { x: 0.6, y: 0.9, w: 12, h: 0.55, fontSize: 25, bold: true, color: color.ink });
  verdict.addText(guidance.triumStrategicVerdict || "No synthesis was returned.", { x: 0.7, y: 1.8, w: 11.5, h: 1.4, fontSize: 18, color: color.ink, valign: "top", fit: "shrink" });
  const patterns = guidance.recurringPatterns || [];
  if (patterns.length) {
    verdict.addText("Recurring patterns", { x: 0.7, y: 3.7, w: 6, h: 0.3, fontSize: 15, bold: true, color: color.accent });
    verdict.addText(patterns.map((pattern) => `• ${pattern}`).join("\n"), { x: 0.85, y: 4.1, w: 11.3, h: 1.6, fontSize: 14, color: color.ink, breakLine: false, fit: "shrink" });
  }
  const safeName = (report.ideaName || "Venture-Benchmark").replace(/[^\w-]+/g, "-");
  await pptx.writeFile({ fileName: `Trium-Benchmark-${safeName}.pptx` });
}

/**
 * Generates and downloads a genuine Microsoft Word (.docx) executive memo
 */
export async function exportToWord(report) {
  try {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: "TRIUM LIMITED — DIGITAL INCUBATION STUDIO",
              heading: HeadingLevel.HEADING_2,
              alignment: AlignmentType.CENTER,
              spacing: { after: 120 }
            }),
            new Paragraph({
              text: `Executive Venture Benchmark Memo: ${report.ideaName || "Concept Benchmark"}`,
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Sector: ", bold: true }),
                new TextRun(report.sector || "Uncategorized"),
                new TextRun({ text: "   |   Date: ", bold: true }),
                new TextRun(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })),
                new TextRun({ text: "   |   Scope: ", bold: true }),
                new TextRun(report.scope || "Scope not specified")
              ],
              spacing: { after: 300 }
            }),

            // Concept Brief
            new Paragraph({
              text: "1. Venture Concept & Core Thesis",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 200, after: 100 }
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Problem Statement: ", bold: true }),
                new TextRun(report.problem || report.description || "N/A")
              ],
              spacing: { after: 100 }
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Proposed Solution: ", bold: true }),
                new TextRun(report.solution || report.description || "N/A")
              ],
              spacing: { after: 100 }
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Target Customer & Market: ", bold: true }),
                new TextRun(report.targetCustomer || "Not specified")
              ],
              spacing: { after: 250 }
            }),

            ...(report.scoringCriteria ? [
              new Paragraph({ text: "Trium 7-Criteria Assessment", heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 100 } }),
              new Paragraph({ text: `Composite score: ${report.scoringCriteria.totalScore ?? "Not scored"}/100 · Grade ${report.scoringCriteria.grade || "Not graded"}`, spacing: { after: 120 } }),
              ...Object.entries(report.scoringCriteria)
                .filter(([, value]) => value && typeof value === "object" && "score" in value)
                .map(([name, value]) => new Paragraph({
                  children: [
                    new TextRun({ text: `${name.replace(/([A-Z])/g, " $1")}: ${value.score}/${value.max} — `, bold: true }),
                    new TextRun(value.rationale || "No rationale returned."),
                  ],
                  spacing: { after: 80 },
                })),
            ] : []),

            // Localization Blueprint
            new Paragraph({
              text: "2. Strategic Execution Blueprint: Nigeria In-Depth",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 200, after: 100 }
            }),

            // What to Apply
            new Paragraph({
              text: "WHAT TO APPLY IN NIGERIA (Tactical Playbook Directives):",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 150, after: 100 }
            }),
            ...(report.blueprint?.whatToApply?.map((item, i) =>
              new Paragraph({
                children: [
                  new TextRun({ text: `${i + 1}. ${item.title}: `, bold: true }),
                  new TextRun(item.recommendation),
                  new TextRun({ text: `\n   → Parallel Evidence: ${item.parallelBenchmark}`, italics: true })
                ],
                spacing: { after: 120 }
              })
            ) || []),

            // What to Avoid
            new Paragraph({
              text: "WHAT TO AVOID IN NIGERIA (Capital Preservation & Failure Pitfalls):",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 }
            }),
            ...(report.blueprint?.whatToAvoid?.map((item, i) =>
              new Paragraph({
                children: [
                  new TextRun({ text: `${i + 1}. ${item.title}: `, bold: true }),
                  new TextRun(item.warning),
                  new TextRun({ text: `\n   × Risk Driver: ${item.pitfallReason}`, italics: true })
                ],
                spacing: { after: 120 }
              })
            ) || []),

            // Investment Committee Verdict
            new Paragraph({
              text: "3. Trium Studio Investment Committee Verdict",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 250, after: 100 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: report.blueprint?.triumStrategicVerdict || "No strategic verdict was returned.",
                  bold: true
                })
              ],
              spacing: { after: 250 }
            }),

            // Benchmark Peers Table
            new Paragraph({
              text: "4. Empirical Precedent Matrix",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 200, after: 100 }
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: "Company & Country", bold: true })] }),
                    new TableCell({ children: [new Paragraph({ text: "Region Tier", bold: true })] }),
                    new TableCell({ children: [new Paragraph({ text: "Funding, scale & customer evidence", bold: true })] }),
                    new TableCell({ children: [new Paragraph({ text: "Model & viability", bold: true })] }),
                    new TableCell({ children: [new Paragraph({ text: "Partners, lesson & source", bold: true })] })
                  ]
                }),
                ...(report.benchmarks?.map(bm =>
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph(`${bm.companyName} (${bm.country || "Global"})`)] }),
                      new TableCell({ children: [new Paragraph(bm.regionTier || "Nearby Africa")] }),
                      new TableCell({ children: [new Paragraph([`Funding: ${bm.fundingRaised || "Not publicly reported"}`, `Scale: ${bm.operationalScale || "Not publicly reported"}`, `Customers/revenue: ${bm.customersAndRevenues || "Not publicly reported"}`].join("\n"))] }),
                      new TableCell({ children: [new Paragraph([bm.businessModel || "Not reported", `ROI/viability: ${bm.roiAndViability || "Not publicly reported"}`].join("\n"))] }),
                      new TableCell({ children: [new Paragraph([`Partners: ${bm.keyPartners || "Not publicly reported"}`, bm.lessonsLearned || "No lesson stated", bm.sourceUrl].join("\n"))] })
                    ]
                  })
                ) || [])
              ]
            }),
            new Paragraph({
              text: "5. Crawled Source Articles",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 220, after: 100 }
            }),
            ...(report.sourceArticles?.map((article, index) => new Paragraph({
              children: [
                new TextRun({ text: `${index + 1}. ${article.title} — ${article.sourceName} (${article.sourceRegion})\n`, bold: true }),
                new TextRun(`${article.summary}\n`),
                new TextRun({ text: `Initiatives identified: ${(article.relatedInitiatives || []).join(", ") || "None stated"}\n`, italics: true }),
                new TextRun({ text: article.url, color: "0563C1", underline: {} }),
              ],
              spacing: { after: 140 }
            })) || [])
          ]
        }
      ]
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Trium_Benchmark_${(report.ideaName || "Report").replace(/\s+/g, "_")}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Word export failed:", err);
    throw err;
  }
}

/**
 * Generates and downloads a clean, executive vector PDF
 */
export function exportToPdf(report) {
  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const orange = [224, 112, 0];
    const dark = [27, 28, 25];
    const muted = [95, 94, 94];

    // Header Bar
    doc.setFillColor(...orange);
    doc.rect(0, 0, 210, 16, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("TRIUM LIMITED — DIGITAL INCUBATION STUDIO", 15, 11);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("GLOBAL BENCHMARK & LOCALIZATION BLUEPRINT", 210 - 15, 11, { align: "right" });

    let y = 28;

    // Title
    doc.setTextColor(...dark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(report.ideaName || "Benchmark Report", 15, y);
    y += 7;

    // Subtitle / Meta
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...muted);
    doc.text(`Sector: ${report.sector || "Uncategorized"}  |  Date: ${new Date().toLocaleDateString()}`, 15, y);
    y += 10;

    // Concept Summary Box
    doc.setFillColor(245, 244, 239);
    doc.rect(15, y, 180, 20, "F");
    doc.setTextColor(...dark);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Concept Overview:", 18, y + 5);
    doc.setFont("helvetica", "normal");
    const descLines = doc.splitTextToSize(report.description || report.problem || "", 174);
    doc.text(descLines.slice(0, 2), 18, y + 11);
    y += 28;

    if (report.scoringCriteria) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...dark);
      doc.text("Trium 7-Criteria Assessment", 15, y);
      y += 6;
      doc.setFontSize(8.5);
      doc.text(`Composite score: ${report.scoringCriteria.totalScore ?? "Not scored"}/100 · Grade ${report.scoringCriteria.grade || "Not graded"}`, 15, y);
      y += 5;
      for (const [name, criterion] of Object.entries(report.scoringCriteria)) {
        if (!criterion || typeof criterion !== "object" || !("score" in criterion)) continue;
        const scoreText = `${name.replace(/([A-Z])/g, " $1")}: ${criterion.score}/${criterion.max} · ${criterion.rationale || "No rationale returned."}`;
        const scoreLines = doc.splitTextToSize(scoreText, 180);
        if (y + scoreLines.length * 3.5 > 280) {
          doc.addPage();
          y = 20;
        }
        doc.setFont("helvetica", "normal");
        doc.text(scoreLines, 15, y);
        y += scoreLines.length * 3.5 + 1;
      }
      y += 3;
    }

    // Section: What to Apply
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 130, 76); // Green
    doc.text("WHAT TO APPLY IN NIGERIA", 15, y);
    y += 5;

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...dark);
    if (report.blueprint?.whatToApply?.length) {
      report.blueprint.whatToApply.forEach((item, idx) => {
        doc.setFont("helvetica", "bold");
        doc.text(`${idx + 1}. ${item.title}`, 15, y);
        y += 4;
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(item.recommendation, 180);
        doc.text(lines, 15, y);
        y += lines.length * 3.8 + 2;
      });
    }
    y += 3;

    // Section: What to Avoid
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(186, 26, 26); // Red
    doc.text("WHAT TO AVOID IN NIGERIA", 15, y);
    y += 5;

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...dark);
    if (report.blueprint?.whatToAvoid?.length) {
      report.blueprint.whatToAvoid.forEach((item, idx) => {
        doc.setFont("helvetica", "bold");
        doc.text(`${idx + 1}. ${item.title}`, 15, y);
        y += 4;
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(item.warning, 180);
        doc.text(lines, 15, y);
        y += lines.length * 3.8 + 2;
      });
    }
    y += 5;

    // IC Verdict Box
    doc.setFillColor(255, 244, 232);
    doc.setDrawColor(224, 112, 0);
    doc.rect(15, y, 180, 16, "FD");
    doc.setTextColor(146, 71, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("Trium Investment Committee Strategic Recommendation:", 18, y + 5);
    doc.setFont("helvetica", "normal");
    const verdictLines = doc.splitTextToSize(
      report.blueprint?.triumStrategicVerdict || "No strategic verdict was returned.",
      174
    );
    doc.text(verdictLines.slice(0, 2), 18, y + 10);
    y += 24;

    // Empirical Benchmarks Summary
    doc.setTextColor(...dark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Empirical Precedent Benchmarks", 15, y);
    y += 6;

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    if (report.benchmarks?.length) {
      report.benchmarks.forEach((bm) => {
        const details = [
          `Model: ${bm.businessModel || "Not reported"}`,
          `Customers/revenue: ${bm.customersAndRevenues || "Not publicly reported"}`,
          `ROI/viability: ${bm.roiAndViability || "Not publicly reported"}`,
          `Partners: ${bm.keyPartners || "Not publicly reported"}`,
          `Scale: ${bm.operationalScale || "Not reported"}`,
          `Lesson: ${bm.lessonsLearned || "Not stated"}`,
          `Source: ${bm.sourceUrl}`,
        ].join("\n");
        const detailLines = doc.splitTextToSize(details, 180);
        const blockHeight = 8 + detailLines.length * 3.6;
        if (y + blockHeight > 280) {
          doc.addPage();
          y = 20;
        }
        doc.setFont("helvetica", "bold");
        doc.text(`${bm.companyName} (${bm.country || "Not stated"} · ${bm.regionTier || "Unclassified"})`, 15, y);
        doc.setFont("helvetica", "normal");
        doc.text(detailLines, 15, y + 4);
        y += blockHeight;
      });
    }

    const sourceArticles = report.sourceArticles || [];
    if (sourceArticles.length) {
      doc.addPage();
      y = 20;
      doc.setTextColor(...dark);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Crawled Source Articles", 15, y);
      y += 7;
      sourceArticles.forEach((article, index) => {
        const text = [
          `${index + 1}. ${article.title}`,
          `${article.sourceName} · ${article.sourceRegion} · ${article.publishedDate || "Date not stated"}`,
          article.summary,
          `Initiatives identified: ${(article.relatedInitiatives || []).join(", ") || "None stated"}`,
          `Source: ${article.url}`,
        ].join("\n");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        const lines = doc.splitTextToSize(text, 180);
        const blockHeight = lines.length * 4 + 5;
        if (y + blockHeight > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(lines, 15, y);
        y += blockHeight;
      });
    }

    // Footer
    doc.setFontSize(7.5);
    doc.setTextColor(...muted);
    doc.text("Confidential — For Internal Trium Studio & Investment Committee Use Only", 105, 290, { align: "center" });

    doc.save(`Trium_Benchmark_${(report.ideaName || "Report").replace(/\s+/g, "_")}.pdf`);
  } catch (err) {
    console.error("PDF export failed:", err);
    throw err;
  }
}
