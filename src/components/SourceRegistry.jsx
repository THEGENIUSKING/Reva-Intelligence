import React, { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import emergingCatalog from "../../config/sites_emerging_tech.json";
import policyCatalog from "../../config/sites_nigeria_policy.json";

function curatedSources() {
  const sources = [
    ...emergingCatalog.emerging_markets_sources.map((source) => ({ ...source, tier: "tier_a_emerging" })),
    ...emergingCatalog.global_fallback_sources.map((source) => ({ ...source, tier: "tier_b_global" })),
    ...policyCatalog.government_and_regulatory_sources.map((source) => ({
      name: source.name, url: source.url, region: source.agency, category: source.sector, tier: "nigeria_regulator",
    })),
    ...policyCatalog.legal_and_policy_intelligence_sources.map((source) => ({
      name: source.name, url: source.url, region: "Nigeria", category: source.focus, tier: "nigeria_legal",
    })),
  ];
  return [...new Map(sources.map((source) => [source.url.replace(/\/$/, ""), source])).values()];
}

export function SourceRegistry() {
  const sources = useQuery(api.sources.listSources, {}) || [];
  const addSource = useMutation(api.sources.addSource);
  const importSources = useMutation(api.sources.importCuratedSources);
  const approveSource = useMutation(api.sources.approveSource);
  const approvalRole = useQuery(api.sources.myApprovalRole, {});
  const approvalSetup = useQuery(api.sources.approvalSetup, {});
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [feedUrl, setFeedUrl] = useState("");
  const [region, setRegion] = useState("");
  const [category, setCategory] = useState("");
  const [tier, setTier] = useState("tier_a_emerging");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [sourceSearch, setSourceSearch] = useState("");
  const [sourceTierFilter, setSourceTierFilter] = useState("all");
  const [sourceSort, setSourceSort] = useState("name");
  const visibleSources = sources.filter((source) => (source.name + " " + source.region + " " + source.category).toLowerCase().includes(sourceSearch.toLowerCase()) && (sourceTierFilter === "all" || source.tier === sourceTierFilter)).sort((a, b) => sourceSort === "recent" ? (b.lastScrapedAt || 0) - (a.lastScrapedAt || 0) : a.name.localeCompare(b.name));
  const sourceCount = useMemo(() => ({ active: sources.filter((source) => source.isActive).length, pending: sources.filter((source) => !source.isActive).length }), [sources]);

  const submit = async (event) => {
    event.preventDefault();
    setError(""); setNotice(""); setSaving(true);
    try {
      const parsed = new URL(url.trim());
      if (parsed.protocol !== "https:") throw new Error("Use an HTTPS source URL.");
      const parsedFeed = feedUrl.trim() ? new URL(feedUrl.trim()) : null;
      if (parsedFeed && parsedFeed.protocol !== "https:") throw new Error("Use an HTTPS feed URL.");
      await addSource({ name: name.trim(), url: parsed.toString(), ...(parsedFeed ? { feedUrl: parsedFeed.toString() } : {}), region: region.trim(), category: category.trim(), tier });
      setNotice("Source submitted. It stays inactive until the Reva administrator approves it.");
      setName(""); setUrl(""); setFeedUrl(""); setRegion(""); setCategory("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not register this source.");
    } finally { setSaving(false); }
  };

  const importCuratedCatalog = async () => {
    setError(""); setNotice(""); setImporting(true);
    try {
      const result = await importSources({ sources: curatedSources() });
      setNotice(`Catalog import complete: ${result.added} added, ${result.alreadyPresent} already registered. New sources need one Reva administrator approval before crawling.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not import the curated source catalog.");
    } finally { setImporting(false); }
  };

  const review = async (source, approved) => {
    setError(""); setNotice("");
    try { await approveSource({ id: source._id, approved }); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not save this approval."); }
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-widest text-primary">Continuous Scout / Configuration</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-on-surface">Source registry</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-secondary">Manage public sources for emerging-market technology and Nigerian policy monitoring. A source becomes crawlable after the configured Reva administrator approves it.</p></div>
        <button type="button" onClick={() => void importCuratedCatalog()} disabled={importing} className="rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container-low disabled:opacity-60">{importing ? "Importing catalog…" : "Import PRD source catalog"}</button>
      </header>

      <section className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-on-surface" aria-live="polite">
        <p className="font-semibold">Source approvals happen here in Reva.</p>
        {approvalSetup === undefined ? <p className="mt-1 text-secondary">Checking approval access…</p> : approvalSetup.role ? (
          <p className="mt-1 text-secondary">You are the Reva approver. Import sources to show their approval controls in the Registered sources table. One approval activates the source for scouting.</p>
        ) : !approvalSetup.authorized ? (
          <p className="mt-1 text-secondary">This session is not an approved Trium account, so approval controls are unavailable.</p>
        ) : !approvalSetup.revaAdminConfigured ? (
          <p className="mt-1 text-secondary">Approval controls are hidden until the Reva administrator email is configured in Reva Convex.</p>
        ) : (
          <p className="mt-1 text-secondary">Your signed-in email is not the configured Reva administrator. Only the Reva administrator can approve sources.</p>
        )}
      </section>

      <div className="grid gap-3 sm:grid-cols-3"><Metric label="Registered sources" value={sources.length} /><Metric label="Reva-approved and active" value={sourceCount.active} /><Metric label="Awaiting approval" value={sourceCount.pending} /></div>

      <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-border bg-white p-5 shadow-sm sm:grid-cols-2">
        <div className="sm:col-span-2"><h2 className="text-lg font-semibold text-on-surface">Propose a source</h2><p className="mt-1 text-sm text-secondary">RSS or Atom feed URLs are preferred. If omitted, Reva looks for a feed on the HTTPS site.</p></div>
        <input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Source name" className={inputClass} />
        <input required type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://source.example" className={inputClass} />
        <input type="url" value={feedUrl} onChange={(event) => setFeedUrl(event.target.value)} placeholder="RSS / Atom feed URL (optional)" className={inputClass} />
        <select value={tier} onChange={(event) => setTier(event.target.value)} className={inputClass}><option value="tier_a_emerging">Tier A · Emerging markets</option><option value="tier_b_global">Tier B · Global fallback</option><option value="nigeria_regulator">Nigeria regulator</option><option value="nigeria_legal">Nigeria legal and policy</option></select>
        <input required value={region} onChange={(event) => setRegion(event.target.value)} placeholder="Region / agency" className={inputClass} />
        <input required value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Coverage / sector" className={inputClass} />
        <button disabled={saving} className="h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60 sm:col-span-2">{saving ? "Submitting…" : "Submit for Reva approval"}</button>
        {error && <p role="alert" className="sm:col-span-2 text-sm text-error">{error}</p>}
        {notice && <p role="status" className="sm:col-span-2 text-sm text-success">{notice}</p>}
      </form>

      <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border px-5 py-4"><div><h2 className="font-semibold text-on-surface">Registered sources</h2><p className="mt-1 text-sm text-secondary">Only Reva-approved sources are included in scheduled scout runs.</p></div><div className="flex flex-wrap gap-2"><input value={sourceSearch} onChange={(event) => setSourceSearch(event.target.value)} placeholder="Search sources" aria-label="Search sources" className="rounded-lg border border-border px-3 py-2 text-xs" /><select value={sourceTierFilter} onChange={(event) => setSourceTierFilter(event.target.value)} aria-label="Filter source tier" className="rounded-lg border border-border bg-white px-3 py-2 text-xs"><option value="all">All tiers</option><option value="tier_a_emerging">Tier A</option><option value="tier_b_global">Tier B</option><option value="nigeria_regulator">Nigeria regulators</option><option value="nigeria_legal">Nigeria policy</option></select><select value={sourceSort} onChange={(event) => setSourceSort(event.target.value)} aria-label="Sort sources" className="rounded-lg border border-border bg-white px-3 py-2 text-xs"><option value="name">Name A-Z</option><option value="recent">Recently scraped</option></select></div>{approvalRole && <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Reva administrator</span>}</div>
        {!sources.length ? <div className="p-6 text-sm text-secondary"><p>The registry is empty. Import the PRD catalog here; after import, each registered source will appear in this table and the Reva administrator will see its approval control.</p><button type="button" onClick={() => void importCuratedCatalog()} disabled={importing} className="mt-4 rounded-lg bg-primary px-4 py-2.5 font-semibold text-white disabled:opacity-60">{importing ? "Importing…" : "Import curated catalog"}</button></div> : <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-surface-container-low text-xs uppercase text-secondary"><tr><th className="p-3">Source</th><th className="p-3">Coverage</th><th className="p-3">Tier</th><th className="p-3">Health</th><th className="p-3">Approval state</th>{approvalRole && <th className="p-3">Reva decision</th>}</tr></thead><tbody>{visibleSources.map((source) => <tr key={source._id} className="border-t border-border align-top"><td className="p-3"><a className="font-semibold text-primary underline" href={source.url} target="_blank" rel="noreferrer">{source.name}</a><span className="mt-1 block max-w-xs truncate text-xs text-secondary">{source.feedUrl || source.url}</span></td><td className="p-3">{source.region}<span className="mt-1 block text-xs text-secondary">{source.category}</span></td><td className="p-3">{tierLabel(source.tier)}</td><td className="p-3">{source.lastScrapedAt ? <><span>{new Date(source.lastScrapedAt).toLocaleString()}</span><span className="mt-1 block text-xs text-secondary">{source.failureCount} consecutive failures</span></> : <span className="text-secondary">Not crawled</span>}</td><td className="p-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${source.isActive ? "bg-success-bg text-success" : "bg-surface-container-low text-secondary"}`}>{source.isActive ? "Active" : "Pending"}</span><span className="mt-2 block text-xs text-secondary">Reva {source.signOffRevaAdmin ? "approved" : "not approved"}</span></td>{approvalRole && <td className="p-3"><button type="button" onClick={() => void review(source, !source.isActive)} className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-on-surface">{source.isActive ? "Revoke approval" : "Approve source"}</button></td>}</tr>)}</tbody></table></div>}
      </section>
    </div>
  );
}

function Metric({ label, value }) { return <div className="rounded-xl border border-border bg-white p-4"><p className="text-xs text-secondary">{label}</p><p className="mt-1 text-2xl font-bold tabular-nums text-on-surface">{value}</p></div>; }
function tierLabel(tier) { return ({ tier_a_emerging: "Tier A · Emerging", tier_b_global: "Tier B · Global", nigeria_regulator: "Nigeria regulator", nigeria_legal: "Nigeria policy" })[tier] || tier; }
const inputClass = "h-11 w-full rounded-lg border border-border bg-surface-container-low px-3 text-sm outline-none focus:border-primary";
export default SourceRegistry;
