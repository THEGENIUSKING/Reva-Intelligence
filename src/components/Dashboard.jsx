import { PageLoader } from "./Loader";
import React, { useState, useMemo, useEffect } from "react";

export const CANONICAL_SECTORS = [
  "All Sectors",
  "Fintech & Financial Inclusion",
  "AgriTech & Supply Chain",
  "GovTech & Regulatory Tech",
  "CleanTech & Energy Software",
  "HealthTech & Life Sciences",
  "Commerce, Retail & Logistics",
  "InsurTech & Risk Analytics",
  "Mobility & Smart Transit",
  "Enterprise & Emerging Tech",
  "Uncategorized"
];

export function normalizeSector(sectorStr = "") {
  if (!sectorStr) return "Uncategorized";
  const s = sectorStr.toLowerCase();
  if (s.includes("agri") || s.includes("farm") || s.includes("crop")) return "AgriTech & Supply Chain";
  if (s.includes("clean") || s.includes("energy") || s.includes("solar") || s.includes("power")) return "CleanTech & Energy Software";
  if (s.includes("gov") || s.includes("regulat") || s.includes("policy") || s.includes("legal")) return "GovTech & Regulatory Tech";
  if (s.includes("health") || s.includes("med") || s.includes("clinic")) return "HealthTech & Life Sciences";
  if (s.includes("logist") || s.includes("freight") || s.includes("retail") || s.includes("commerce")) return "Commerce, Retail & Logistics";
  if (s.includes("insur")) return "InsurTech & Risk Analytics";
  if (s.includes("transit") || s.includes("mobility") || s.includes("transport")) return "Mobility & Smart Transit";
  if (s.includes("fintech") || s.includes("pay") || s.includes("bank") || s.includes("lend") || s.includes("credit")) return "Fintech & Financial Inclusion";
  return "Uncategorized";
}

export function Dashboard({ user, counts, overview, recentFindings = [], onNavigate }) {
  const [timeFilter, setTimeFilter] = useState("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [sectorFilter, setSectorFilter] = useState("All Sectors");
  const [industryFilter, setIndustryFilter] = useState("All Industries");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // Time filter calculations
  
  if (overview === undefined || initiatives === undefined || recentFindings === undefined) {
    return <PageLoader label="Loading Overview..." />;
  }

  const now = Date.now();
  const timeThresholds = {
    "24h": now - 24 * 60 * 60 * 1000,
    "7d": now - 7 * 24 * 60 * 60 * 1000,
    "30d": now - 30 * 24 * 60 * 60 * 1000,
    "365d": now - 365 * 24 * 60 * 60 * 1000,
    today: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime(),
    month: new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime(),
    year: new Date(new Date().getFullYear(), 0, 1).getTime(),
    "all": 0,
  };

  const filteredFindings = useMemo(() => {
    const threshold = timeThresholds[timeFilter] || 0;
    const start = customStart ? new Date(`${customStart}T00:00:00`).getTime() : 0;
    const end = customEnd ? new Date(`${customEnd}T23:59:59.999`).getTime() : now;
    return recentFindings.filter((item) => {
      // Time filter
      const itemTime = item.createdAt || item._creationTime || 0;
      if (timeFilter === "custom" && ((start && itemTime < start) || (customEnd && itemTime > end))) return false;
      if (timeFilter !== "custom" && threshold > 0 && itemTime < threshold) return false;

      // Sector filter
      const normSector = normalizeSector(item.sector);
      if (sectorFilter !== "All Sectors" && normSector !== sectorFilter) return false;
      if (industryFilter !== "All Industries" && item.industry !== industryFilter) return false;

      // Text search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const text = `${item.ideaName || ""} ${item.summary || ""} ${item.sourceName || ""} ${normSector} ${item.industry || ""}`.toLowerCase();
        if (!text.includes(query)) return false;
      }

      return true;
    });
  }, [recentFindings, timeFilter, customStart, customEnd, sectorFilter, industryFilter, searchQuery, now]);

  const availableIndustries = useMemo(() => {
    return ["All Industries", ...Array.from(new Set(recentFindings.map((item) => item.industry).filter(Boolean))).sort()];
  }, [recentFindings]);
  const totalPages = Math.ceil(filteredFindings.length / PAGE_SIZE) || 1;
  const pageFindings = filteredFindings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => setPage(1), [timeFilter, customStart, customEnd, sectorFilter, industryFilter, searchQuery]);

  // Sector breakdown count for interactive chips
  const sectorCounts = useMemo(() => {
    const map = {};
    for (const f of recentFindings) {
      const s = normalizeSector(f.sector);
      map[s] = (map[s] || 0) + 1;
    }
    return map;
  }, [recentFindings]);

  const availableSectors = useMemo(() => {
    const arr = Object.keys(sectorCounts).sort();
    return ["All Sectors", ...arr];
  }, [sectorCounts]);

  const metrics = [
    { label: "Benchmark Reports", value: counts.benchmarks, route: "benchmark", icon: "insights", desc: "Sourced Precedent Reports" },
    { label: "Active Scout Sources", value: (overview?.activeEmergingSources || 0) + (overview?.activePolicySources || 0), route: "sources", icon: "travel_explore", desc: "Active Registry Sources" },
    { label: "Articles Ingested (24h)", value: overview?.articlesLastDay || 0, route: "scraping", icon: "feed", desc: "Auto-Scraped Signals" },
    { label: "New Scout Findings", value: overview?.ideasLastDay || 0, route: "scraping", icon: "lightbulb", desc: "Gemini-Derived Signals" },
  ];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 pb-12 font-body text-on-surface">
      {/* Top Banner - Compact Vanta Fluid Design */}
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white/70 backdrop-blur-xs p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-amber-900/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-primary/10 text-primary">
              Trium Venture Studio OS
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-medium text-secondary">{overview?.geminiConfigured ? "Scheduled Scout Ready" : "Gemini Not Configured"}</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-on-surface font-headline">
            Operational Intelligence Dashboard
          </h1>
          <p className="mt-0.5 max-w-2xl text-xs text-secondary leading-relaxed">
            Continuously monitor emerging market innovations and Nigerian regulatory circulars, or benchmark initiatives against empirical global peers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate("benchmark")}
            className="flex items-center gap-1.5 rounded-lg bg-primary hover:bg-primary-container px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-all duration-150"
          >
            <span className="material-symbols-outlined text-[16px]">add_chart</span>
            <span>New Benchmark</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate("scraping")}
            className="flex items-center gap-1.5 rounded-lg bg-surface-lowest hover:bg-surface-low border border-amber-900/10 px-3.5 py-2 text-xs font-semibold text-on-surface transition-all duration-150"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">radar</span>
            <span>Continuous Scout</span>
          </button>
        </div>
      </header>

      {/* Metrics Row - Compact & Fluid */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <button
            key={metric.label}
            type="button"
            onClick={() => onNavigate(metric.route)}
            className="group rounded-xl bg-white/70 backdrop-blur-xs p-4 text-left shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-amber-900/10 hover:border-primary/30 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-xl text-primary p-2 rounded-lg bg-primary/10 group-hover:bg-primary group-hover:text-white transition-colors duration-200">
                {metric.icon}
              </span>
              <span className="text-[10px] font-semibold text-secondary uppercase tracking-wider">{metric.desc}</span>
            </div>
            <p className="mt-3 text-2xl font-bold tabular-nums text-on-surface font-headline">{metric.value}</p>
            <p className="mt-0.5 text-xs font-medium text-secondary">{metric.label}</p>
          </button>
        ))}
      </section>

      {/* Pathways - 2 Clean Vanta Cards */}
      <section className="grid gap-3.5 lg:grid-cols-2">
        <article className="rounded-xl bg-white/80 p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-amber-900/10 hover:border-primary/25 transition-all">
          <div className="flex items-center justify-between gap-3">
            <span className="material-symbols-outlined rounded-lg bg-primary/10 p-2 text-xl text-primary">query_stats</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Module 01 · On Demand</span>
          </div>
          <h2 className="mt-3 text-lg font-bold text-on-surface font-headline">Benchmark an Initiative</h2>
          <p className="mt-1 text-xs leading-relaxed text-secondary min-h-10">
            Compare emerging models against nearby Africa, emerging peers, and global leaders with automated 7-Criteria IC Scoring and Gap-driven venture generation.
          </p>
          <button
            type="button"
            onClick={() => onNavigate("benchmark")}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-amber-900/15 bg-white px-3.5 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-low transition-all"
          >
            <span>Launch Benchmark Wizard</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </article>

        <article className="rounded-xl bg-white/80 p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-amber-900/10 hover:border-primary/25 transition-all">
          <div className="flex items-center justify-between gap-3">
            <span className="material-symbols-outlined rounded-lg bg-primary/10 p-2 text-xl text-primary">travel_explore</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Module 02 · Continuous</span>
          </div>
          <h2 className="mt-3 text-lg font-bold text-on-surface font-headline">Continuous Scout & Viability Patrol</h2>
          <p className="mt-1 text-xs leading-relaxed text-secondary min-h-10">
            Automated patrol across {((overview?.activeEmergingSources || 0) + (overview?.activePolicySources || 0)) || 0} curated publications and Nigerian regulators (CBN, SEC, NERC, FIRS) with instant sector classification and Vanta duplicate outcomes.
          </p>
          <button
            type="button"
            onClick={() => onNavigate("scraping")}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-amber-900/15 bg-white px-3.5 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-low transition-all"
          >
            <span>Open Scout Radar</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </article>
      </section>

      {/* Scout Findings Section with Time & Sector Filters */}
      <section className="rounded-xl bg-white/80 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-amber-900/10">
        {/* Section Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-amber-900/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">filter_alt</span>
              <h2 className="text-base font-bold text-on-surface font-headline">
                Scout Findings & Opportunity Signals
              </h2>
            </div>
            <p className="text-xs text-secondary mt-0.5">
              Filtered and categorized in real time by Gemini AI. Filter by timeframe or sector.
            </p>
          </div>

          {/* Time Filter Pills */}
          <div className="flex flex-wrap items-center gap-1 bg-surface-low p-1 rounded-lg border border-amber-900/10 text-xs">
            <span className="px-2 text-[10px] font-bold uppercase text-secondary tracking-wider">Time:</span>
            {[
              { id: "all", label: "All Time" },
              { id: "24h", label: "24 Hours" },
              { id: "today", label: "Today" },
              { id: "7d", label: "7 Days" },
              { id: "30d", label: "30 Days" },
              { id: "month", label: "This Month" },
              { id: "year", label: "This Year" },
              { id: "custom", label: "Custom" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTimeFilter(t.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  timeFilter === t.id
                    ? "bg-primary text-white font-semibold shadow-xs"
                    : "text-secondary hover:text-on-surface"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {timeFilter === "custom" && (
            <div className="flex items-center gap-2 text-xs">
              <label className="text-secondary">From <input type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} className="rounded-md border border-amber-900/10 bg-white px-2 py-1 text-on-surface" /></label>
              <label className="text-secondary">To <input type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} className="rounded-md border border-amber-900/10 bg-white px-2 py-1 text-on-surface" /></label>
            </div>
          )}
        </div>

        {/* Sector Filter Bar & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3">
          {/* Sector Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary mr-1">Sector:</span>
            {availableSectors.slice(0, 6).map((sec) => {
              const count = sec === "All Sectors" ? recentFindings.length : (sectorCounts[sec] || 0);
              return (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setSectorFilter(sec)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border ${
                    sectorFilter === sec
                      ? "bg-on-surface text-surface-lowest border-on-surface font-semibold"
                      : "bg-surface-lowest text-secondary border-amber-900/10 hover:bg-surface-low"
                  }`}
                >
                  {sec.split(" & ")[0]}
                  {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
                </button>
              );
            })}

            {/* Dropdown for remaining sectors */}
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="px-2 py-1 rounded-full text-[11px] font-medium bg-surface-lowest text-secondary border border-amber-900/10 focus:outline-none"
            >
              <option value="All Sectors">More Sectors...</option>
              {availableSectors.slice(6).map((sec) => (
                <option key={sec} value={sec}>{sec}</option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="flex flex-wrap items-center gap-2">
            <select value={industryFilter} onChange={(event) => setIndustryFilter(event.target.value)} className="px-2.5 py-1.5 rounded-lg text-xs bg-surface-low text-secondary border border-amber-900/10" aria-label="Filter findings by industry">
              {availableIndustries.map((industry) => <option key={industry} value={industry}>{industry}</option>)}
            </select>
            <div className="flex items-center gap-2 bg-surface-low px-3 py-1.5 rounded-lg border border-amber-900/10 text-xs shrink-0">
            <span className="material-symbols-outlined text-[15px] text-secondary">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search findings..."
              className="bg-transparent border-none outline-none text-xs text-on-surface placeholder:text-secondary/70 w-36 sm:w-48"
            />
            </div>
          </div>
        </div>

        {/* Findings List */}
        <div className="mt-4">
          {filteredFindings.length ? (
            <ul className="divide-y divide-amber-900/10">
              {pageFindings.map((finding) => {
                const normSector = normalizeSector(finding.sector);
                return (
                  <li
                    key={finding._id || finding.articleUrl}
                    className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 py-3.5 hover:bg-surface-low/50 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-on-surface font-headline">{finding.ideaName}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary">
                          {normSector}
                        </span>
                        <span className="text-[11px] text-secondary">
                          {finding.sourceName} · {finding.createdAt ? new Date(finding.createdAt).toLocaleDateString() : "Recent"} {finding.industry ? `· ${finding.industry}` : ""}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-secondary leading-relaxed line-clamp-2">
                        {finding.summary}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelectedFinding(finding)}
                        className="px-2.5 py-1 rounded text-[11px] font-semibold text-primary hover:bg-primary/10 border border-primary/20 transition-all"
                      >
                        Inspect
                      </button>
                      {finding.articleUrl && (
                        <a
                          href={finding.articleUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded text-secondary hover:text-on-surface transition-colors"
                          title="Open source article"
                        >
                          <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                        </a>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="rounded-xl bg-surface-low p-6 text-center">
              <span className="material-symbols-outlined text-3xl text-secondary">manage_search</span>
              <p className="mt-2 font-semibold text-sm text-on-surface">No findings matching your filter</p>
              <p className="mt-1 text-xs text-secondary">
                Adjust your time or sector filter, or trigger a continuous scout scan.
              </p>
              <button
                type="button"
                onClick={() => { setTimeFilter("all"); setCustomStart(""); setCustomEnd(""); setSectorFilter("All Sectors"); setIndustryFilter("All Industries"); setSearchQuery(""); }}
                className="mt-3 text-xs font-semibold text-primary hover:underline"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>
        {filteredFindings.length > PAGE_SIZE && (
          <div className="mt-3 flex items-center justify-between border-t border-amber-900/10 pt-3 text-xs">
            <span className="text-secondary">Page {page} of {totalPages} · {filteredFindings.length} findings</span>
            <div className="flex gap-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="rounded-md bg-surface-low px-3 py-1.5 font-semibold text-on-surface disabled:opacity-40">Previous</button>
              <button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} className="rounded-md bg-surface-low px-3 py-1.5 font-semibold text-on-surface disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </section>

      {/* Inspect Finding Detail Modal */}
      {selectedFinding && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-amber-900/15 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-amber-900/10">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary uppercase">
                  {normalizeSector(selectedFinding.sector)}
                </span>
                <h3 className="mt-1.5 text-lg font-bold text-on-surface font-headline">{selectedFinding.ideaName}</h3>
                <p className="text-xs text-secondary">{selectedFinding.sourceName} · {selectedFinding.articleTitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFinding(null)}
                className="text-secondary hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs leading-relaxed text-on-surface">
              <div>
                <div className="font-bold uppercase tracking-wider text-[10px] text-secondary mb-1">OPPORTUNITY SUMMARY</div>
                <p className="bg-surface-low p-3 rounded-lg border border-amber-900/10">{selectedFinding.summary}</p>
              </div>

              {selectedFinding.articleUrl && (
                <div>
                  <div className="font-bold uppercase tracking-wider text-[10px] text-secondary mb-1">PROVENANCE SOURCE</div>
                  <a
                    href={selectedFinding.articleUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline flex items-center gap-1 font-mono text-[11px]"
                  >
                    <span>{selectedFinding.articleUrl}</span>
                    <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                  </a>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-2 pt-3 border-t border-amber-900/10">
              <button
                type="button"
                onClick={() => setSelectedFinding(null)}
                className="px-3 py-1.5 rounded-lg border border-amber-900/15 text-xs font-semibold text-secondary hover:bg-surface-low"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedFinding(null);
                  onNavigate("scraping");
                }}
                className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-container"
              >
                Open in Continuous Scout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
