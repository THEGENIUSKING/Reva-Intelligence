import React, { useMemo, useRef, useState } from "react";

const blankBrief = { ideaName: "", sector: "", description: "", problem: "", solution: "", targetCustomer: "", monetization: "" };

export function GlobalBenchmark({ benchmarks = [], onExtractBrief, onRunBenchmark, onUploadDocument }) {
  const [step, setStep] = useState(1);
  const [inputText, setInputText] = useState("");
  const [brief, setBrief] = useState(blankBrief);
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [localReport, setLocalReport] = useState(null);
  const fileInput = useRef(null);

  const selectedReport = useMemo(
    () => localReport || benchmarks.find((report) => report._id === selectedId) || null,
    [benchmarks, localReport, selectedId],
  );

  const updateBrief = (field, value) => setBrief((current) => ({ ...current, [field]: value }));

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    setFileName(file.name);
    try {
      let extracted;
      const extension = file.name.split(".").pop()?.toLowerCase();
      if (extension === "pdf") {
        const documentId = await onUploadDocument(file);
        extracted = await onExtractBrief({ text: inputText.trim() || undefined, documentId });
      } else {
        const { extractLocalDocumentText } = await import("../utils/documentExtractor");
        const documentText = await extractLocalDocumentText(file);
        extracted = await onExtractBrief({ text: [inputText.trim(), documentText].filter(Boolean).join("\n\n") });
      }
      setBrief({ ...blankBrief, ...extracted });
      setStep(2);
    } catch (err) {
      setFileName("");
      setError(err instanceof Error ? err.message : "Could not read this document.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const extractFromText = async (event) => {
    event.preventDefault();
    if (!inputText.trim()) {
      setError("Describe the initiative so Reva can prepare a reviewable brief.");
      return;
    }
    setError("");
    setUploading(true);
    try {
      const extracted = await onExtractBrief({ text: inputText.trim() });
      setBrief({ ...blankBrief, ...extracted });
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not prepare the venture brief.");
    } finally {
      setUploading(false);
    }
  };

  const startResearch = async (event) => {
    event.preventDefault();
    if (!brief.ideaName.trim() && !brief.description.trim() && !brief.problem.trim() && !brief.solution.trim()) {
      setError("Add a name or at least one substantive part of the idea before research.");
      return;
    }
    setError("");
    setRunning(true);
    try {
      const result = await onRunBenchmark({ ...brief, ideaName: brief.ideaName.trim(), sector: brief.sector.trim() });
      setLocalReport(result.report);
      setSelectedId(result.id);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Benchmark research failed.");
    } finally {
      setRunning(false);
    }
  };

  const exportReport = async (format) => {
    if (!selectedReport) return;
    setError("");
    try {
      const exporter = await import("../utils/clientExporter");
      if (format === "pdf") await exporter.exportToPdf(selectedReport);
      else if (format === "docx") await exporter.exportToWord(selectedReport);
      else await exporter.exportToPowerPoint(selectedReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Report export failed.");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Module 01 / On-demand research</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-on-surface">Benchmark an initiative</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-secondary">Start with a prompt or an initiative file. Reva prepares a brief for your review, then researches comparable and contrasting ventures across African, emerging, and global markets.</p>
        </div>
      </header>

      <ol className="grid grid-cols-3 gap-2 rounded-xl border border-border bg-white p-2 text-xs sm:text-sm">
        {["Input idea", "Confirm brief", "Research results"].map((label, index) => <li key={label} className={`rounded-lg px-3 py-2 font-semibold ${step === index + 1 ? "bg-primary text-white" : step > index + 1 ? "bg-primary/10 text-primary" : "text-secondary"}`}><span className="mr-2 opacity-70">0{index + 1}</span>{label}</li>)}
      </ol>

      {step === 1 && <section className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,.85fr)]">
        <form onSubmit={extractFromText} className="space-y-4 rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
          <div><h2 className="text-xl font-semibold text-on-surface">Describe the initiative</h2><p className="mt-1 text-sm text-secondary">Include the customer, problem, proposed solution, market, and business model when known.</p></div>
          <textarea value={inputText} onChange={(event) => setInputText(event.target.value)} rows={9} maxLength={100000} placeholder="What is the idea? Who does it serve, what problem does it solve, and how might it work?" className="w-full resize-y rounded-lg border border-border bg-surface-container-low p-3 text-sm leading-6 outline-none focus:border-primary" />
          <div className="flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-secondary">Text is used to draft your review brief.</span><button type="submit" disabled={uploading} className="h-11 rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60">{uploading ? "Preparing brief…" : "Prepare brief"}</button></div>
        </form>
        <div className="flex flex-col rounded-2xl border border-border bg-surface-container-low p-5 sm:p-6">
          <span className="material-symbols-outlined w-fit rounded-xl bg-primary/10 p-3 text-3xl text-primary">upload_file</span>
          <h2 className="mt-5 text-xl font-semibold text-on-surface">Or upload an initiative</h2>
          <p className="mt-2 text-sm leading-6 text-secondary">PDF files are processed through the configured research service. Text is extracted locally from DOCX, PPTX, TXT, and Markdown files before brief preparation.</p>
          {fileName && <p className="mt-4 truncate rounded-lg bg-white px-3 py-2 text-sm text-on-surface">{fileName}</p>}
          <input ref={fileInput} type="file" accept=".pdf,.docx,.pptx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain" onChange={handleFile} className="sr-only" />
          <button type="button" onClick={() => fileInput.current?.click()} disabled={uploading} className="mt-auto self-start rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold text-on-surface hover:bg-white/70 disabled:opacity-60">{uploading ? "Reading document…" : "Choose PDF, Word, or PowerPoint"}</button>
          <p className="mt-3 text-xs text-secondary">Maximum file size: 10 MB.</p>
        </div>
      </section>}

      {step === 2 && <form onSubmit={startResearch} className="space-y-5 rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-semibold text-on-surface">Review the extracted brief</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-secondary">Correct or complete these fields before Reva searches the web. Research begins only after you confirm.</p></div>{fileName && <span className="max-w-xs truncate rounded-full bg-surface-container-low px-3 py-1 text-xs text-secondary">From {fileName}</span>}</div>
        <div className="grid gap-4 sm:grid-cols-2">
          <BriefField label="Initiative name" value={brief.ideaName} onChange={(value) => updateBrief("ideaName", value)} />
          <BriefField label="Sector" value={brief.sector} onChange={(value) => updateBrief("sector", value)} />
          <BriefField label="Description" value={brief.description} onChange={(value) => updateBrief("description", value)} rows={3} wide />
          <BriefField label="Problem" value={brief.problem} onChange={(value) => updateBrief("problem", value)} rows={3} />
          <BriefField label="Proposed solution" value={brief.solution} onChange={(value) => updateBrief("solution", value)} rows={3} />
          <BriefField label="Target customer" value={brief.targetCustomer} onChange={(value) => updateBrief("targetCustomer", value)} rows={2} />
          <BriefField label="Monetization / business model" value={brief.monetization} onChange={(value) => updateBrief("monetization", value)} rows={2} />
        </div>
        <div className="flex flex-wrap justify-between gap-3 border-t border-border pt-4"><button type="button" onClick={() => { setStep(1); setError(""); }} className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-on-surface">Back to input</button><button type="submit" disabled={running} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60">{running ? "Researching markets…" : "Confirm and start research"}</button></div>
      </form>}

      {error && <p role="alert" className="rounded-lg bg-error/10 px-4 py-3 text-sm text-error">{error}</p>}

      {step === 3 && selectedReport && <ReportView report={selectedReport} onExport={exportReport} onNew={() => { setStep(1); setBrief(blankBrief); setInputText(""); setFileName(""); setLocalReport(null); setError(""); }} />}

      <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-semibold text-on-surface">Your benchmark reports</h2><p className="mt-1 text-sm text-secondary">Reports generated from confirmed initiative briefs.</p></div><span className="text-sm text-secondary">{benchmarks.length} saved</span></div>
        {!benchmarks.length ? <p className="mt-4 rounded-xl bg-surface-container-low p-4 text-sm text-secondary">No saved reports yet. Your first confirmed research run will appear here.</p> : <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{benchmarks.map((report) => <button key={report._id} type="button" onClick={() => { setLocalReport(null); setSelectedId(report._id); setStep(3); }} className="rounded-xl border border-border p-4 text-left hover:border-primary/50"><span className="block truncate font-semibold text-on-surface">{report.ideaName}</span><span className="mt-1 block text-xs text-secondary">{report.sector || "Sector not specified"} · {new Date(report.createdAt).toLocaleDateString()}</span><span className="mt-3 block text-xs text-primary">{report.counts?.total ?? report.benchmarks?.length ?? 0} sourced peers</span></button>)}</div>}
      </section>
    </div>
  );
}

function BriefField({ label, value, onChange, rows = 1, wide = false }) {
  const className = "w-full rounded-lg border border-border bg-surface-container-low px-3 py-2.5 text-sm leading-6 text-on-surface outline-none focus:border-primary";
  return <label className={`block space-y-1.5 text-sm font-medium text-on-surface ${wide ? "sm:col-span-2" : ""}`}>{label}{rows > 1 ? <textarea rows={rows} value={value} onChange={(event) => onChange(event.target.value)} className={className} /> : <input value={value} onChange={(event) => onChange(event.target.value)} className={className} />}</label>;
}

function ReportView({ report, onExport, onNew }) {
  const counts = report.counts || {};
  return <article className="space-y-5 rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-xs font-bold uppercase tracking-wider text-primary">Evidence-backed market comparison</p><h2 className="mt-1 text-2xl font-bold text-on-surface">{report.ideaName}</h2><p className="mt-2 text-sm text-secondary">{report.sector || "Sector not specified"} · {report.createdAt ? new Date(report.createdAt).toLocaleString() : "Just now"}</p><p className="mt-3 max-w-3xl text-sm leading-6 text-on-surface">{report.description}</p></div>
      <div className="flex flex-wrap gap-2"><ExportButton onClick={() => onExport("pdf")}>PDF</ExportButton><ExportButton onClick={() => onExport("docx")}>Word</ExportButton><ExportButton onClick={() => onExport("pptx")}>PowerPoint</ExportButton><button type="button" onClick={onNew} className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white">New benchmark</button></div>
    </div>
    <div className="grid gap-3 sm:grid-cols-3"><Metric label="Sourced peers" value={counts.total ?? report.benchmarks?.length ?? 0} /><Metric label="Nearby Africa" value={counts.nearbyAfrica ?? 0} /><Metric label="Emerging + global" value={(counts.emergingPeers ?? 0) + (counts.globalLeaders ?? 0)} /></div>
    <section><h3 className="mb-3 text-lg font-semibold text-on-surface">Comparable and contrasting initiatives</h3>{report.benchmarks?.length ? <div className="overflow-x-auto rounded-xl border border-border"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-surface-container-low text-xs uppercase text-secondary"><tr>{["Company", "Country / tier", "Status", "Business model", "Operating evidence & lesson", "Citation"].map((label) => <th key={label} className="p-3">{label}</th>)}</tr></thead><tbody>{report.benchmarks.map((peer, index) => <tr key={`${peer.companyName}-${index}`} className="border-t border-border align-top"><td className="p-3 font-semibold text-on-surface">{peer.companyName}</td><td className="p-3">{peer.country}<span className="mt-1 block text-xs text-secondary">{peer.regionTier}</span></td><td className="p-3">{peer.status}</td><td className="p-3">{peer.businessModel}</td><td className="p-3"><span>{peer.operationalScale || "No public scale figure returned."}</span><p className="mt-1 text-secondary">{peer.lessonsLearned}</p></td><td className="p-3"><a href={peer.sourceUrl} target="_blank" rel="noreferrer" className="text-primary underline">{peer.sourceName || "Open source"}</a><span className="mt-1 block text-xs text-secondary">{peer.confidence}</span></td></tr>)}</tbody></table></div> : <p className="rounded-xl bg-surface-container-low p-4 text-sm text-secondary">No sufficiently sourced peer records were returned. The report does not invent comparison data.</p>}</section>
    <div className="grid gap-4 lg:grid-cols-2"><Guidance title="Apply in Nigeria" items={report.blueprint?.whatToApply || []} primary="recommendation" secondary="parallelBenchmark" /><Guidance title="Avoid in Nigeria" items={report.blueprint?.whatToAvoid || []} primary="warning" secondary="pitfallReason" /></div>
    {report.blueprint?.recurringPatterns?.length > 0 && <div className="rounded-xl border border-border p-4"><h3 className="font-semibold text-on-surface">Recurring patterns</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-secondary">{report.blueprint.recurringPatterns.map((item, index) => <li key={index}>{item}</li>)}</ul></div>}
    <div className="rounded-xl bg-primary/10 p-4"><h3 className="font-semibold text-primary">Synthesis</h3><p className="mt-2 text-sm leading-6 text-on-surface">{report.blueprint?.triumStrategicVerdict || "No synthesis was returned."}</p></div>
  </article>;
}

function Metric({ label, value }) { return <div className="rounded-xl bg-surface-container-low p-4"><p className="text-xs font-medium text-secondary">{label}</p><p className="mt-1 text-2xl font-bold tabular-nums text-on-surface">{value}</p></div>; }
function ExportButton({ onClick, children }) { return <button type="button" onClick={onClick} className="rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-low">Export {children}</button>; }
function Guidance({ title, items, primary, secondary }) { return <section className="rounded-xl border border-border p-4"><h3 className="font-semibold text-on-surface">{title}</h3>{items.length ? <ol className="mt-3 space-y-3">{items.map((item, index) => <li key={`${item.title}-${index}`} className="rounded-lg bg-surface-container-low p-3"><p className="text-sm font-semibold text-on-surface">{item.title}</p><p className="mt-1 text-sm leading-6 text-secondary">{item[primary]}</p>{item[secondary] && <p className="mt-1 text-xs text-secondary">{item[secondary]}</p>}</li>)}</ol> : <p className="mt-2 text-sm text-secondary">No guidance was returned.</p>}</section>; }

export default GlobalBenchmark;
