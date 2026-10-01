import React, { useEffect, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function ContinuousScout({ onNavigate }) {
  const [now, setNow] = useState(() => Date.now());
  const [runningType, setRunningType] = useState("");
  const [analyzingId, setAnalyzingId] = useState("");
  const [selectedArticleId, setSelectedArticleId] = useState("");
  const [articleSearch, setArticleSearch] = useState("");
  const [articleSort, setArticleSort] = useState("newest");
  const [findingSearch, setFindingSearch] = useState("");
  const [initiativeFilter, setInitiativeFilter] = useState("all");
  const [initiativeSort, setInitiativeSort] = useState("newest");
  const [notice, setNotice] = useState("");
  const [noticeKind, setNoticeKind] = useState("success");
  const [error, setError] = useState("");
  const [vantaConnection, setVantaConnection] = useState(null);
  const overview = useQuery(api.scouting.getOverview, { now });
  const runs = useQuery(api.scouting.listRecentRuns, { limit: 20 }) || [];
  const findings = useQuery(api.scouting.listRecentFindings, { limit: 40 }) || [];
  const articles = useQuery(api.scouting.listRecentArticles, { limit: 80 }) || [];
  const initiatives = useQuery(api.initiatives.listInitiatives, { limit: 40 }) || [];
  const screenedInitiatives = initiatives.filter((item) => item.sourceType === "emerging_tech_scout" || item.sourceType === "nigeria_policy_scout");
  const visibleArticles = articles.filter((item) => (item.title + " " + item.sourceName + " " + (item.aiSector || "")).toLowerCase().includes(articleSearch.toLowerCase())).sort((a, b) => articleSort === "oldest" ? a.processedAt - b.processedAt : articleSort === "title" ? a.title.localeCompare(b.title) : b.processedAt - a.processedAt);
  const visibleFindings = findings.filter((item) => (item.ideaName + " " + item.sector + " " + item.summary).toLowerCase().includes(findingSearch.toLowerCase()));
  const visibleInitiatives = screenedInitiatives.filter((item) => initiativeFilter === "all" || item.status === initiativeFilter).sort((a, b) => initiativeSort === "score" ? b.vantaScore - a.vantaScore : b.createdAt - a.createdAt);
  const runNow = useAction(api.scouting.runNow);
  const analyzeArticle = useAction(api.scouting.analyzeArticle);
  const checkVanta = useAction(api.vanta.checkConnection);
  const recoverStaleRuns = useMutation(api.scouting.recoverStaleRuns);
  const selectedArticle = articles.find((article) => article._id === selectedArticleId);

  useEffect(() => {
    void recoverStaleRuns({ now: Date.now() }).catch(() => {});
  }, [recoverStaleRuns]);

  const run = async (scoutType) => {
    setError(""); setNotice(""); setRunningType(scoutType);
    try {
      const result = await runNow({ scoutType });
      setNotice(result.message);
      setNoticeKind(result.status === "failed" ? "error" : result.status === "partial" ? "warning" : "success");
      setNow(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "The scout could not complete this run.");
    } finally { setRunningType(""); }
  };

  const analyze = async (article) => {
    setError(""); setAnalyzingId(article._id);
    try {
      await analyzeArticle({ id: article._id });
      setNotice("Article summary and opportunity analysis are ready.");
      setNoticeKind("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not analyze this article.");
    } finally { setAnalyzingId(""); }
  };

  const loadVantaStatus = () => {
    if (vantaConnection) return;
    void checkVanta().then(setVantaConnection)
      .catch(() => setVantaConnection({ connected: false, message: "Connection check failed." }));
  };
  const ready = Boolean(overview?.geminiConfigured);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-12">
      <header className="relative overflow-hidden rounded-[24px] border border-[#F4D8BC] bg-gradient-to-br from-[#FFF8F0] via-white to-[#F7F8FA] p-6 shadow-[0_8px_28px_-16px_rgba(43,43,43,.16)] sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full bg-[#FFE7CE]/55 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div><p className="text-xs font-bold uppercase tracking-[.16em] text-primary">Module 02 / Continuous discovery</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">Continuous Scout</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-secondary">Follow public technology and policy signals, inspect the source articles, and turn promising evidence into initiative candidates.</p></div>
          <button type="button" onClick={() => onNavigate("sources")} className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-on-surface shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">Manage sources <span aria-hidden="true">↗</span></button>
        </div>
      </header>

      {error && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
      {notice && <p role="status" className={`rounded-2xl border px-4 py-3 text-sm ${noticeKind === "error" ? "border-red-200 bg-red-50 text-red-800" : noticeKind === "warning" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}>{notice}</p>}

      <section className="grid gap-4 lg:grid-cols-2">
        <ScoutCard title="Emerging-market technology" description="Track public startup and technology feeds across emerging markets. Nigeria-focused articles are excluded from this scout." sourceCount={overview?.activeEmergingSources ?? 0} schedule="Daily · 05:00 WAT" running={runningType === "emerging_tech"} disabled={!ready || runningType !== ""} onRun={() => void run("emerging_tech")} />
        <ScoutCard title="Nigerian policy and regulation" description="Monitor regulators, gazettes, draft rules and policy changes that could create venture opportunities." sourceCount={overview?.activePolicySources ?? 0} schedule="Daily · 06:00 WAT" running={runningType === "nigeria_policy"} disabled={!ready || runningType !== ""} onRun={() => void run("nigeria_policy")} />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Active scout sources" value={overview ? overview.activeEmergingSources + overview.activePolicySources : "—"} />
        <Metric label="Articles collected · 24h" value={overview?.articlesLastDay ?? "—"} />
        <Metric label="Idea candidates · 24h" value={overview?.ideasLastDay ?? "—"} />
        <Metric label="Registered sources" value={overview?.registeredSources ?? "—"} />
      </section>

      <details className="group rounded-2xl border border-border bg-white shadow-sm" onToggle={(event) => { if (event.currentTarget.open) loadVantaStatus(); }}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-5 py-4 transition hover:bg-surface-container-low sm:px-6 [&::-webkit-details-marker]:hidden">
          <span><span className="block font-semibold text-on-surface">Service connections</span><span className="mt-1 block text-sm text-secondary">Expand to check Gemini, Vanta, Firecrawl and Resend status.</span></span>
          <span className="material-symbols-outlined text-secondary transition-transform group-open:rotate-180">expand_more</span>
        </summary>
        <div className="grid gap-3 border-t border-border p-4 sm:grid-cols-2 sm:p-5">
          <ServiceStatus label="Gemini analysis" ready={overview?.geminiConfigured} detail={overview?.geminiConfigured ? "Configured for article analysis." : "Add GEMINI_API_KEY to the Reva Convex deployment."} />
          <ServiceStatus label="Vanta read API" ready={vantaConnection?.connected} detail={vantaConnection ? `${vantaConnection.message}${vantaConnection.connected ? ` Idea Bank records visible: ${vantaConnection.ideaBankRecords}.` : ""}` : "Not checked yet."} />
          <ServiceStatus label="Firecrawl extraction" ready detail="Keyless fallback is enabled for web pages that direct feed parsing cannot read." />
          <ServiceStatus label="Resend email" ready={overview?.resendConfigured} detail={overview?.resendConfigured ? "Configured for automatic emails when scout candidates pass screening." : "Add Resend credentials before enabling automated DIT alerts."} />
        </div>
      </details>

      <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-semibold text-on-surface">Screened scout opportunities</h2><p className="mt-1 text-sm text-secondary">Nigeria viability, Vanta portfolio matching and seven-criteria grades from each scout run.</p></div><div className="flex gap-2"><select value={initiativeFilter} onChange={(event) => setInitiativeFilter(event.target.value)} aria-label="Filter screened ideas" className="rounded-lg border border-border bg-white px-3 py-2 text-xs"><option value="all">All outcomes</option><option value="passed">Passed</option><option value="parked_below_viability">Below viability</option><option value="parked_below_pass">Below pass</option><option value="dropped_exact_duplicate">Exact duplicates</option></select><select value={initiativeSort} onChange={(event) => setInitiativeSort(event.target.value)} aria-label="Sort screened ideas" className="rounded-lg border border-border bg-white px-3 py-2 text-xs"><option value="newest">Newest</option><option value="score">Highest grade</option></select></div></div>
        {!screenedInitiatives.length ? <p className="mt-4 rounded-xl bg-surface-container-low p-4 text-sm text-secondary">No scout candidates have completed screening yet. New findings are assessed automatically after Vanta read access is available.</p> : <div className="mt-4 grid gap-3 lg:grid-cols-2">{visibleInitiatives.slice(0, 20).map((item) => <article key={item._id} className="rounded-xl border border-border p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold text-on-surface">{item.name}</h3><span className="rounded-full bg-[#FFF4E8] px-2.5 py-1 text-xs font-bold text-primary">{item.vantaGrade} - {item.vantaScore}/100</span></div><p className="mt-2 text-sm leading-6 text-secondary">{item.overallComments}</p><div className="mt-3 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-surface-container-low px-2.5 py-1">Nigeria fit: {item.viabilityRating}</span><span className="rounded-full bg-surface-container-low px-2.5 py-1">Vanta match: {item.dedupeVerdict}</span><span className="rounded-full bg-surface-container-low px-2.5 py-1">Idea Bank: {item.vantaSubmissionStatus || "not submitted"}</span></div>{item.matchingVantaName && <p className="mt-2 text-xs text-secondary">Closest Vanta initiative: <strong className="text-on-surface">{item.matchingVantaName}</strong>{item.dedupeDifferentiator ? " | " + item.dedupeDifferentiator : ""}</p>}{item.sourceUrl && <a className="mt-3 inline-block text-xs font-semibold text-primary underline" href={item.sourceUrl} target="_blank" rel="noreferrer">Assessment source</a>}</article>)}</div>}
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-semibold text-on-surface">Collected articles</h2><p className="mt-1 text-sm text-secondary">Read the captured text, open the original, or generate an AI summary and opportunity.</p></div><span className="rounded-full bg-surface-container-low px-3 py-1 text-xs font-semibold text-secondary">{articles.length} recent</span></div>
          <div className="mt-4 flex flex-wrap gap-2"><input value={articleSearch} onChange={(event) => setArticleSearch(event.target.value)} placeholder="Search articles" aria-label="Search articles" className="min-w-48 flex-1 rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary" /><select value={articleSort} onChange={(event) => setArticleSort(event.target.value)} aria-label="Sort articles" className="rounded-lg border border-border bg-white px-3 py-2 text-sm"><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="title">Title A-Z</option></select></div>
          {!articles.length ? <Empty title="No articles collected yet" body="Run a scout after approving sources. Each saved article will appear here for review." action="Review sources" onClick={() => onNavigate("sources")} /> : <ul className="mt-4 space-y-3">{visibleArticles.map((article) => <li key={article._id} className="rounded-2xl border border-border bg-white p-4 transition duration-200 hover:-translate-y-0.5 hover:border-[#E9C29D] hover:shadow-[0_8px_24px_-16px_rgba(43,43,43,.22)]">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-primary">{article.sourceName} · {article.sourceType === "emerging_tech" ? "Emerging tech" : "Nigeria policy"}</p><h3 className="mt-1 line-clamp-2 font-semibold text-on-surface">{article.title}</h3><p className="mt-1 text-xs text-secondary">Collected {new Date(article.processedAt).toLocaleString()}</p></div><span className="material-symbols-outlined shrink-0 rounded-xl bg-surface-container-low p-2 text-primary">article</span></div>
            {article.aiSummary && <p className="mt-3 line-clamp-3 text-sm leading-6 text-secondary">{article.aiSummary}</p>}
            {article.potentialIdea && <p className="mt-3 rounded-xl bg-[#FFF8F0] p-3 text-sm text-on-surface"><span className="font-semibold">Opportunity:</span> {article.potentialIdea}</p>}
            <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => setSelectedArticleId(article._id)} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-on-surface transition hover:border-primary/50 hover:bg-[#FFF8F0]">Read article</button><button type="button" disabled={analyzingId === article._id} onClick={() => void analyze(article)} className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50">{analyzingId === article._id ? "Analyzing…" : article.aiSummary ? "Refresh AI summary" : "Generate AI summary"}</button><a href={article.url} target="_blank" rel="noreferrer" className="rounded-lg px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/5">Open source ↗</a></div>
          </li>)}</ul>}
        </div>

        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-semibold text-on-surface">Potential initiative ideas</h2><p className="mt-1 text-sm text-secondary">Initial concepts extracted from source articles; completed Nigeria and Vanta assessments appear in Screened scout opportunities.</p></div><span className="rounded-full bg-surface-container-low px-3 py-1 text-xs font-semibold text-secondary">{findings.length} recent</span></div>
          <input value={findingSearch} onChange={(event) => setFindingSearch(event.target.value)} placeholder="Search opportunity candidates" aria-label="Search opportunity candidates" className="mt-4 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary" />
          {!findings.length ? <Empty title="No idea candidates yet" body="Newly collected articles are analyzed when Gemini is available. You can also generate a summary and opportunity from any article." action="Manage sources" onClick={() => onNavigate("sources")} /> : <ul className="mt-4 space-y-3">{visibleFindings.map((finding) => <li key={finding._id} className="rounded-2xl border border-border p-4 transition hover:border-[#E9C29D] hover:shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold text-on-surface">{finding.ideaName}</h3><p className="mt-1 text-xs text-secondary">{finding.sector} · {finding.scoutType === "emerging_tech" ? "Emerging tech" : "Nigerian policy"}</p></div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">Extracted candidate</span></div><p className="mt-3 text-sm leading-6 text-secondary">{finding.summary}</p><a className="mt-3 inline-block text-sm font-semibold text-primary hover:underline" href={finding.articleUrl} target="_blank" rel="noreferrer">Read {finding.articleTitle} ↗</a><span className="ml-2 text-xs text-secondary">{finding.sourceName}</span></li>)}</ul>}
        </div>
      </section>

      <section className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-wide text-amber-800">Next assessment stage</p><h2 className="mt-1 font-semibold text-amber-950">Article analysis is available; initiative screening is still pending.</h2><p className="mt-2 max-w-4xl text-sm leading-6 text-amber-900">The current scout can collect articles, summarize them and suggest possible initiatives. Nigerian market viability, duplicate checks against Vanta, the official Vanta criteria score, and automatic DIT email dispatch are not yet connected to this flow.</p></section>

      <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm"><div className="border-b border-border px-5 py-4 sm:px-6"><h2 className="font-semibold text-on-surface">Scout run history</h2><p className="mt-1 text-sm text-secondary">Scheduled jobs run at 05:00 and 06:00 West Africa Time when approved sources are active.</p></div>{!runs.length ? <p className="p-5 text-sm text-secondary">No scout runs have been recorded. Scheduled jobs stay idle until their approved source lists are available.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-surface-container-low text-xs uppercase text-secondary"><tr><th className="p-3">Started</th><th className="p-3">Scout</th><th className="p-3">Status</th><th className="p-3">Sources</th><th className="p-3">Articles</th><th className="p-3">Idea candidates</th></tr></thead><tbody>{runs.map((run) => <tr key={run._id} className="border-t border-border"><td className="p-3">{new Date(run.startedAt).toLocaleString()}</td><td className="p-3">{run.scoutType === "emerging_tech" ? "Emerging technology" : "Nigerian policy"}<span className="mt-1 block text-xs text-secondary">{run.trigger}</span></td><td className="p-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${run.status === "completed" ? "bg-success-bg text-success" : run.status === "failed" ? "bg-error/10 text-error" : run.status === "partial" ? "bg-amber-50 text-amber-900" : "bg-surface-container-low text-secondary"}`}>{run.status}</span>{run.error && <span className="mt-1 block max-w-xs text-xs text-secondary">{run.error}</span>}</td><td className="p-3">{run.sourcesChecked}</td><td className="p-3">{run.newArticles} new / {run.articlesFound} found</td><td className="p-3">{run.ideasFound}</td></tr>)}</tbody></table></div>}</section>

      {selectedArticle && <div className="fixed inset-0 z-[100] flex items-end justify-center bg-[#202124]/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedArticleId(""); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="article-title" className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[24px] border border-border bg-white shadow-2xl sm:rounded-[24px]">
          <header className="flex items-start justify-between gap-4 border-b border-border p-5 sm:p-6"><div><p className="text-xs font-bold uppercase tracking-wide text-primary">{selectedArticle.sourceName}</p><h2 id="article-title" className="mt-1 text-xl font-bold text-on-surface">{selectedArticle.title}</h2><p className="mt-2 text-xs text-secondary">Collected {new Date(selectedArticle.processedAt).toLocaleString()}</p></div><button type="button" aria-label="Close article" onClick={() => setSelectedArticleId("")} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-container-low text-on-surface hover:bg-surface-container-high">×</button></header>
          <div className="space-y-5 overflow-y-auto p-5 sm:p-6">
            <div className="flex flex-wrap gap-2"><a href={selectedArticle.url} target="_blank" rel="noreferrer" className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-primary hover:bg-[#FFF8F0]">Open original article ↗</a><button type="button" disabled={analyzingId === selectedArticle._id} onClick={() => void analyze(selectedArticle)} className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50">{analyzingId === selectedArticle._id ? "Analyzing…" : selectedArticle.aiSummary ? "Refresh summary" : "Generate summary and idea"}</button></div>
            {selectedArticle.aiSummary && <div className="rounded-2xl border border-[#F4D8BC] bg-[#FFF8F0] p-4"><h3 className="font-semibold text-on-surface">AI article summary</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-secondary">{selectedArticle.aiSummary}</p>{selectedArticle.potentialIdea && <div className="mt-4 border-t border-[#F4D8BC] pt-3"><p className="text-xs font-bold uppercase tracking-wide text-primary">Potential initiative · {selectedArticle.aiSector || "Sector not specified"}</p><p className="mt-1 text-sm leading-6 text-on-surface">{selectedArticle.potentialIdea}</p></div>}</div>}
            <div><h3 className="font-semibold text-on-surface">Captured article text</h3>{selectedArticle.content ? <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-secondary">{selectedArticle.content}</p> : <p className="mt-2 text-sm leading-6 text-secondary">The source provided a title and link but no article body to store. Open the original source to read the full article.</p>}</div>
            <p className="rounded-xl bg-surface-container-low p-3 text-xs leading-5 text-secondary">This AI summary identifies a possible opportunity only. It does not represent a Nigerian market viability assessment or a Vanta score.</p>
          </div>
        </section>
      </div>}
    </div>
  );
}

function ScoutCard({ title, description, sourceCount, schedule, running, disabled, onRun }) {
  return <article className="group flex flex-col rounded-[20px] border border-border bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-[#E9C29D] hover:shadow-[0_12px_32px_-18px_rgba(43,43,43,.28)] sm:p-6"><div className="flex items-start justify-between gap-3"><span className="material-symbols-outlined rounded-2xl bg-[#FFF4E8] p-3 text-3xl text-primary transition group-hover:rotate-3">{title.startsWith("Emerging") ? "travel_explore" : "account_balance"}</span><span className="rounded-full bg-surface-container-low px-3 py-1 text-xs font-semibold text-secondary">{schedule}</span></div><h2 className="mt-4 text-xl font-semibold text-on-surface">{title}</h2><p className="mt-2 min-h-12 text-sm leading-6 text-secondary">{description}</p><div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4"><span className="text-sm text-secondary">{sourceCount} active sources</span><button type="button" onClick={onRun} disabled={disabled || sourceCount === 0} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50">{running ? "Scanning feeds…" : "Run scout"}</button></div></article>;
}
function Metric({ label, value }) { return <div className="rounded-2xl border border-border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><p className="text-xs text-secondary">{label}</p><p className="mt-1 text-2xl font-bold tabular-nums text-on-surface">{value}</p></div>; }
function ServiceStatus({ label, ready, detail }) { return <div className="flex items-start gap-3 rounded-xl bg-surface-container-low p-3"><span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${ready ? "bg-success" : "bg-amber-500"}`} /><div><p className="text-sm font-semibold text-on-surface">{label} <span className="ml-1 text-xs font-medium text-secondary">{ready ? "Connected" : "Action needed"}</span></p><p className="mt-1 text-xs leading-5 text-secondary">{detail}</p></div></div>; }
function Empty({ title, body, action, onClick }) { return <div className="mt-5 rounded-2xl bg-surface-container-low p-5"><h3 className="font-semibold text-on-surface">{title}</h3><p className="mt-1 text-sm leading-6 text-secondary">{body}</p><button type="button" onClick={onClick} className="mt-4 text-sm font-semibold text-primary hover:underline">{action} →</button></div>; }

export default ContinuousScout;
