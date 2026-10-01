import React from "react";

export function Dashboard({ user, counts, overview, recentFindings = [], onNavigate }) {
  const metrics = [
    { label: "Benchmark reports", value: counts.benchmarks, route: "benchmark", icon: "query_stats" },
    { label: "Active scout sources", value: overview?.activeEmergingSources + overview?.activePolicySources || 0, route: "sources", icon: "travel_explore" },
    { label: "Articles collected · 24h", value: overview?.articlesLastDay || 0, route: "scraping", icon: "article" },
    { label: "New idea candidates · 24h", value: overview?.ideasLastDay || 0, route: "scraping", icon: "lightbulb" },
  ];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-7 pb-12">
      <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-primary">Trium Idea Intelligence</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-on-surface">Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-secondary">Benchmark initiative ideas on demand and follow public market or regulatory signals through Continuous Scout.</p></div><button type="button" onClick={() => onNavigate("start")} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white">Open modules</button></header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => <button key={metric.label} type="button" onClick={() => onNavigate(metric.route)} className="rounded-2xl border border-border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><span className="material-symbols-outlined text-2xl text-primary">{metric.icon}</span><p className="mt-3 text-sm font-medium text-secondary">{metric.label}</p><p className="mt-1 text-3xl font-bold tabular-nums text-on-surface">{metric.value}</p></button>)}</section>

      <section className="grid gap-4 lg:grid-cols-2"><ModuleCard icon="query_stats" label="Module 01 · On demand" title="Benchmark an initiative" description="Upload a document or write a prompt. Confirm the extracted idea brief, then compare real companies and evidence across markets." button="Start a benchmark" onClick={() => onNavigate("benchmark")} /><ModuleCard icon="travel_explore" label="Module 02 · Continuous" title="Scout the web continuously" description="Run and review emerging-market technology and Nigerian policy scouts from approved public sources." button="Open Continuous Scout" onClick={() => onNavigate("scraping")} /></section>

      <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-semibold text-on-surface">Latest scout findings</h2><p className="mt-1 text-sm text-secondary">Public articles surfaced by your configured scouts.</p></div><button type="button" onClick={() => onNavigate("scraping")} className="text-sm font-semibold text-primary hover:underline">Open scout results</button></div>{recentFindings.length ? <ul className="mt-4 divide-y divide-border">{recentFindings.map((finding) => <li key={finding._id} className="flex flex-wrap items-start justify-between gap-3 py-4"><div><p className="font-semibold text-on-surface">{finding.ideaName}</p><p className="mt-1 text-xs text-secondary">{finding.sector} · {finding.sourceName} · {new Date(finding.createdAt).toLocaleString()}</p><p className="mt-2 max-w-4xl text-sm leading-6 text-secondary">{finding.summary}</p></div><span className="rounded-full bg-surface-container-low px-3 py-1 text-xs font-semibold text-secondary">Needs review</span></li>)}</ul> : <div className="mt-4 rounded-xl bg-surface-container-low p-5"><p className="font-semibold text-on-surface">No idea candidates yet</p><p className="mt-1 text-sm leading-6 text-secondary">Once sources are approved and scanned, evidence-linked candidates will appear here.</p><button type="button" onClick={() => onNavigate("sources")} className="mt-3 text-sm font-semibold text-primary hover:underline">Configure monitored sources →</button></div>}</section>
    </div>
  );
}

function ModuleCard({ icon, label, title, description, button, onClick }) { return <article className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between gap-3"><span className="material-symbols-outlined rounded-lg bg-primary/10 p-2 text-2xl text-primary">{icon}</span><span className="text-[11px] font-bold uppercase tracking-wider text-primary">{label}</span></div><h2 className="mt-4 text-xl font-semibold text-on-surface">{title}</h2><p className="mt-2 min-h-12 text-sm leading-6 text-secondary">{description}</p><button type="button" onClick={onClick} className="mt-4 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-low">{button} →</button></article>; }

export default Dashboard;
