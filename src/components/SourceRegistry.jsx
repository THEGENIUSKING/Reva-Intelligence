import React, { useState, useEffect, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import { normalizeSector, CANONICAL_SECTORS } from "./Dashboard";

export const SOURCE_CATEGORIES = [
  "Emerging Market Primary",
  "Nigerian Regulatory, Legal and Policy Environment",
  "Global Fallback"
];

const INITIAL_REGISTRY_SOURCES = [
  // Emerging Market Primary
  { id: "s1", name: "Disrupt Africa", url: "https://disrupt-africa.com", region: "Africa (Pan-African)", category: "Emerging Market Primary", sector: "Enterprise & Emerging Tech", dateAdded: Date.now() - 86400000 * 30, revaSigned: true, vantaSigned: true },
  { id: "s2", name: "WeeTracker", url: "https://weetracker.com", region: "Africa (East & Southern)", category: "Emerging Market Primary", sector: "Fintech & Financial Inclusion", dateAdded: Date.now() - 86400000 * 25, revaSigned: true, vantaSigned: true },
  { id: "s3", name: "Tech in Asia", url: "https://www.techinasia.com", region: "Southeast Asia", category: "Emerging Market Primary", sector: "Commerce, Retail & Logistics", dateAdded: Date.now() - 86400000 * 20, revaSigned: true, vantaSigned: true },
  { id: "s4", name: "DailySocial Indonesia", url: "https://dailysocial.id", region: "Southeast Asia (Indonesia)", category: "Emerging Market Primary", sector: "AgriTech & Supply Chain", dateAdded: Date.now() - 86400000 * 18, revaSigned: true, vantaSigned: true },
  { id: "s5", name: "Wamda MENA", url: "https://www.wamda.com", region: "MENA", category: "Emerging Market Primary", sector: "Fintech & Financial Inclusion", dateAdded: Date.now() - 86400000 * 15, revaSigned: true, vantaSigned: true },
  { id: "s6", name: "Inc42 India", url: "https://inc42.com", region: "South Asia (India)", category: "Emerging Market Primary", sector: "Commerce, Retail & Logistics", dateAdded: Date.now() - 86400000 * 14, revaSigned: true, vantaSigned: true },
  { id: "s7", name: "Startups Brazil", url: "https://startups.com.br", region: "Latin America (Brazil)", category: "Emerging Market Primary", sector: "Fintech & Financial Inclusion", dateAdded: Date.now() - 86400000 * 12, revaSigned: true, vantaSigned: true },
  { id: "s8", name: "Enterprise News Egypt", url: "https://enterprise.press", region: "MENA (Egypt)", category: "Emerging Market Primary", sector: "CleanTech & Energy Software", dateAdded: Date.now() - 86400000 * 10, revaSigned: true, vantaSigned: true },
  
  // Nigerian Regulatory, Legal and Policy Environment
  { id: "s9", name: "Central Bank of Nigeria (CBN)", url: "https://www.cbn.gov.ng/Documents/circulars.asp", region: "Nigeria", category: "Nigerian Regulatory, Legal and Policy Environment", sector: "GovTech & Regulatory Tech", dateAdded: Date.now() - 86400000 * 40, revaSigned: true, vantaSigned: true },
  { id: "s10", name: "Securities & Exchange Commission (SEC Nigeria)", url: "https://sec.gov.ng/rules-codes-circulars", region: "Nigeria", category: "Nigerian Regulatory, Legal and Policy Environment", sector: "GovTech & Regulatory Tech", dateAdded: Date.now() - 86400000 * 35, revaSigned: true, vantaSigned: true },
  { id: "s11", name: "Nigerian Electricity Regulatory Commission (NERC)", url: "https://nerc.gov.ng/orders", region: "Nigeria", category: "Nigerian Regulatory, Legal and Policy Environment", sector: "CleanTech & Energy Software", dateAdded: Date.now() - 86400000 * 30, revaSigned: true, vantaSigned: true },
  { id: "s12", name: "National Info Tech Dev Agency (NITDA)", url: "https://nitda.gov.ng/guidelines", region: "Nigeria", category: "Nigerian Regulatory, Legal and Policy Environment", sector: "GovTech & Regulatory Tech", dateAdded: Date.now() - 86400000 * 25, revaSigned: true, vantaSigned: true },
  { id: "s13", name: "Federal Inland Revenue Service (FIRS)", url: "https://www.firs.gov.ng/tax-resources", region: "Nigeria", category: "Nigerian Regulatory, Legal and Policy Environment", sector: "GovTech & Regulatory Tech", dateAdded: Date.now() - 86400000 * 20, revaSigned: true, vantaSigned: true },
  { id: "s14", name: "Federal Ministry of Communications, Innovation & Digital Economy", url: "https://bmdce.gov.ng", region: "Nigeria", category: "Nigerian Regulatory, Legal and Policy Environment", sector: "GovTech & Regulatory Tech", dateAdded: Date.now() - 86400000 * 15, revaSigned: true, vantaSigned: true },

  // Global Fallback
  { id: "s15", name: "Crunchbase News (Global)", url: "https://news.crunchbase.com", region: "Global", category: "Global Fallback", sector: "Enterprise & Emerging Tech", dateAdded: Date.now() - 86400000 * 50, revaSigned: true, vantaSigned: true },
  { id: "s16", name: "TechCrunch Emerging", url: "https://techcrunch.com", region: "Global", category: "Global Fallback", sector: "Enterprise & Emerging Tech", dateAdded: Date.now() - 86400000 * 45, revaSigned: true, vantaSigned: true },
  { id: "s17", name: "Y Combinator Launches", url: "https://www.ycombinator.com/blog", region: "Global", category: "Global Fallback", sector: "Fintech & Financial Inclusion", dateAdded: Date.now() - 86400000 * 30, revaSigned: true, vantaSigned: true },
];

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function SourceRegistry() {
  const dbSources = useQuery(api.sources.listSources, {}) || [];
  const sources = dbSources.length > 0 ? dbSources : [];

  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sectorFilter, setSectorFilter] = useState("All Sectors");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  // Add source modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [formName, setFormName] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formCategory, setFormCategory] = useState("Emerging Market Primary");
  const [formSector, setFormSector] = useState("Fintech & Financial Inclusion");
  const [formRegion, setFormRegion] = useState("");
  const [formError, setFormError] = useState("");

  const [importNotice, setImportNotice] = useState("");
  const fileInputRef = useRef(null);

  const addSource = useMutation(api.sources.addSource);

  // Dynamic filter lists based exclusively on actual database records
  const availableSectors = useMemo(() => {
    const s = new Set();
    sources.forEach(x => { if (x.sector) s.add(normalizeSector(x.sector)); });
    return ["All Sectors", ...Array.from(s).filter(Boolean).sort()];
  }, [sources]);

  const availableCategories = useMemo(() => {
    const c = new Set();
    sources.forEach(x => { if (x.category) c.add(x.category); });
    return Array.from(c).filter(Boolean).sort();
  }, [sources]);

  // Filter sources
  const filteredSources = useMemo(() => {
    return sources.filter((s) => {
      if (categoryFilter !== "all" && s.category !== categoryFilter) return false;
      if (sectorFilter !== "All Sectors" && normalizeSector(s.sector) !== sectorFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return `${s.name} ${s.url} ${s.region || ""} ${s.category} ${s.sector || ""}`.toLowerCase().includes(q);
      }
      return true;
    });
  }, [sources, categoryFilter, sectorFilter, searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [categoryFilter, sectorFilter, searchQuery]);

  const totalPages = Math.ceil(filteredSources.length / PAGE_SIZE) || 1;
  const paginatedSources = filteredSources.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const importSourcesMutation = useMutation(api.sources.importCuratedSources);
  const approveSource = useMutation(api.sources.approveSource);

  const getTierForCategory = (cat) => {
    if (cat === "Global Fallback") return "tier_b_global";
    if (cat === "Nigerian Regulatory, Legal and Policy Environment") return "nigeria_regulator";
    return "tier_a_emerging";
  };

  const handleAddSource = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formName.trim()) { setFormError("Source Name is compulsory."); return; }
    if (!formUrl.trim() || !formUrl.startsWith("http")) { setFormError("Valid HTTPS Website URL is compulsory."); return; }
    if (!formCategory) { setFormError("Category selection is compulsory."); return; }

    try {
      await addSource({
        name: formName.trim(),
        url: formUrl.trim(),
        category: formCategory,
        tier: getTierForCategory(formCategory),
        region: formRegion.trim() || (formCategory === "Nigerian Regulatory, Legal and Policy Environment" ? "Nigeria" : "Emerging Markets")
      });
      setImportNotice(`Source "${formName}" registered successfully.`);
      setFormName("");
      setFormUrl("");
      setFormRegion("");
      setShowAddModal(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to add source");
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportNotice("");

    try {
      const extension = file.name.split(".").pop()?.toLowerCase();
      let importedRows = [];

      if (extension === "xlsx" || extension === "xls") {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        importedRows = XLSX.utils.sheet_to_json(worksheet);
      } else if (extension === "csv" || extension === "txt") {
        const text = await file.text();
        const lines = text.split("\n").filter((l) => l.trim().length > 0);
        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/[^a-z]/g, ""));
        for (let i = 1; i < lines.length; i++) {
          const cells = lines[i].split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
          const row = {};
          headers.forEach((h, idx) => { row[h] = cells[idx] || ""; });
          importedRows.push(row);
        }
      } else {
        throw new Error("Please choose an Excel (.xlsx, .xls) or CSV (.csv) file.");
      }

      if (!importedRows.length) throw new Error("No data rows found in the uploaded file.");

      const newItems = [];
      for (const row of importedRows) {
        const name = row.name || row.sourcename || row.title || row.publication || "";
        const url = row.url || row.website || row.link || "";
        let category = row.category || row.tier || "Emerging Market Primary";

        if (category.toLowerCase().includes("regulat") || category.toLowerCase().includes("policy") || category.toLowerCase().includes("nigeria")) {
          category = "Nigerian Regulatory, Legal and Policy Environment";
        } else if (category.toLowerCase().includes("global")) {
          category = "Global Fallback";
        } else {
          category = "Emerging Market Primary";
        }

        if (name && url && url.startsWith("http")) {
          newItems.push({
            name: String(name).slice(0, 100),
            url: String(url).slice(0, 200),
            category,
            tier: getTierForCategory(category),
            region: row.region || "Global"
          });
        }
      }

      if (newItems.length > 0) {
        const result = await importSourcesMutation({ sources: newItems });
        setImportNotice(`Successfully imported ${result.added} verified sources (${result.alreadyPresent} already present).`);
      } else {
        throw new Error("Could not parse valid sources. Ensure columns include 'Name' and 'URL'.");
      }
    } catch (err) {
      setImportNotice(`Import notice: ${err instanceof Error ? err.message : "File parsing error"}`);
    } finally {
      event.target.value = "";
    }
  };

  const toggleSignOff = async (id, role) => {
    try {
      await approveSource({ id, signatureType: role });
    } catch (err) {
      alert("Failed to toggle signoff: " + err.message);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 pb-12 font-body text-on-surface">
      {/* Top Banner - Compact Vanta Fluid Design */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl bg-white/80 backdrop-blur-xs p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-amber-900/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-primary/10 text-primary">
              Curated Source Registry & Governance
            </span>
            <span className="text-[11px] text-secondary">{sources.length} Verified Feeds</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface font-headline">
            Curated Source Catalog & Dual Governance
          </h1>
          <p className="mt-0.5 text-xs text-secondary max-w-3xl leading-relaxed">
            Per Trium operational governance, sources are categorized into three distinct tiers: Emerging Market Primary, Nigerian Regulatory & Legal, and Global Fallbacks. Import via Excel/CSV or register manually.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv,.txt"
            onChange={handleFileUpload}
            className="sr-only"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-900/15 bg-surface-low hover:bg-white text-xs font-semibold text-on-surface shadow-xs transition-all"
            title="Import Excel or CSV file with Name, URL, Category, Sector"
          >
            <span className="material-symbols-outlined text-[16px] text-emerald-700">file_upload</span>
            <span>Import Excel / CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-container text-xs font-semibold text-white shadow-xs transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            <span>Register Source</span>
          </button>
        </div>
      </header>

      {importNotice && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 text-xs text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-emerald-700">check_circle</span>
            <span>{importNotice}</span>
          </div>
          <button type="button" onClick={() => setImportNotice("")} className="text-emerald-700 text-xs">Dismiss</button>
        </div>
      )}

      {/* Category Pills & Sector Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-amber-900/10 pb-3">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCategoryFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              categoryFilter === "all"
                ? "bg-primary text-white shadow-xs"
                : "bg-surface-low text-secondary hover:text-on-surface"
            }`}
          >
            All Categories ({sources.length})
          </button>

          {availableCategories.map((cat) => {
            const count = sources.filter((s) => s.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  categoryFilter === cat
                    ? "bg-primary text-white shadow-xs"
                    : "bg-surface-low text-secondary hover:text-on-surface"
                }`}
              >
                {cat.split(" ")[0]} {cat.includes("Regulatory") ? "Regulators" : ""} ({count})
              </button>
            );
          })}
        </div>

        {/* Sector Filter & Search */}
        <div className="flex items-center gap-2">
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-surface-low text-secondary border border-amber-900/10 focus:outline-none"
          >
            {CANONICAL_SECTORS.map((sec) => (
              <option key={sec} value={sec}>{sec}</option>
            ))}
          </select>

          <div className="flex items-center gap-2 bg-surface-low px-3 py-1.5 rounded-lg border border-amber-900/10 text-xs">
            <span className="material-symbols-outlined text-[15px] text-secondary">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sources..."
              className="bg-transparent border-none outline-none text-xs text-on-surface placeholder:text-secondary/70 w-32 sm:w-44"
            />
          </div>
        </div>
      </div>

      {/* Sources Table (12 per batch - Requirement 8) */}
      <section className="rounded-xl bg-white/80 p-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-amber-900/10">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left min-w-[750px]">
            <thead className="bg-surface-low text-secondary text-[10px] uppercase font-bold tracking-wider">
              <tr>
                <th className="p-2.5">Source Publication & URL</th>
                <th className="p-2.5">Category</th>
                <th className="p-2.5">Sector</th>
                <th className="p-2.5 text-center">Reva Admin</th>
                <th className="p-2.5 text-center">Vanta Admin</th>
                <th className="p-2.5 text-center">Rotation Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-900/10">
              {paginatedSources.length ? (
                paginatedSources.map((src) => {
                  const isFullyActive = src.signOffRevaAdmin && src.signOffVantaAdmin;
                  return (
                    <tr key={src.id} className="hover:bg-surface-low/40">
                      <td className="p-2.5 max-w-xs">
                        <div className="font-bold text-on-surface text-sm">{src.name}</div>
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-primary hover:underline inline-flex items-center gap-1 font-mono mt-0.5 truncate max-w-sm"
                        >
                          <span>{src.url}</span>
                          <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                        </a>
                      </td>

                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          src.category.includes("Regulatory")
                            ? "bg-amber-500/10 text-amber-800"
                            : src.category.includes("Global")
                            ? "bg-purple-500/10 text-purple-800"
                            : "bg-blue-500/10 text-blue-800"
                        }`}>
                          {src.category}
                        </span>
                        <div className="text-[10px] text-secondary mt-0.5">{src.region || "Global"}</div>
                      </td>

                      <td className="p-2.5">
                        <span className="font-medium text-on-surface">{normalizeSector(src.sector)}</span>
                      </td>

                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSignOff(src._id, "reva")}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                            src.signOffRevaAdmin
                              ? "bg-emerald-500/10 text-emerald-800 border-emerald-500/20"
                              : "bg-surface-low text-secondary border-amber-900/10"
                          }`}
                        >
                          {src.signOffRevaAdmin ? "Approved" : "Sign Off"}
                        </button>
                      </td>

                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSignOff(src._id, "vanta")}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                            src.signOffVantaAdmin
                              ? "bg-emerald-500/10 text-emerald-800 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-800 border-amber-500/20"
                          }`}
                        >
                          {src.signOffVantaAdmin ? "Approved" : "Awaiting"}
                        </button>
                      </td>

                      <td className="p-2.5 text-center">
                        {isFullyActive ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-800">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-800">
                            PENDING SIGNOFF
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-secondary">
                    No sources match your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between pt-3 mt-2 border-t border-amber-900/10 text-xs">
          <span className="text-secondary">
            Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({filteredSources.length} total sources)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-amber-900/15 bg-white text-on-surface hover:bg-surface-low disabled:opacity-40 transition-all font-semibold"
            >
              ← Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg border border-amber-900/15 bg-white text-on-surface hover:bg-surface-low disabled:opacity-40 transition-all font-semibold"
            >
              Next →
            </button>
          </div>
        </div>
      </section>

      {/* Manual Registration Modal (Requirement 7) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-amber-900/15 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-amber-900/10">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">add_link</span>
                <div>
                  <h3 className="text-base font-bold text-on-surface font-headline">Register Scraping Source</h3>
                  <p className="text-[11px] text-secondary">Fields marked * are compulsory</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-secondary hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {formError && (
              <div className="mt-3 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-800">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddSource} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[10px] uppercase tracking-wider text-secondary mb-1">
                  Source Publication Name * (Compulsory)
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Disrupt Africa, DailySocial, CBN Circulars..."
                  className="w-full rounded-lg border border-amber-900/15 bg-surface-low px-3 py-2 text-xs outline-none focus:border-primary focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-[10px] uppercase tracking-wider text-secondary mb-1">
                  Target Website URL * (Compulsory)
                </label>
                <input
                  type="url"
                  required
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-amber-900/15 bg-surface-low px-3 py-2 text-xs outline-none focus:border-primary focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-[10px] uppercase tracking-wider text-secondary mb-1">
                  Category * (Compulsory)
                </label>
                <select
                  required
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full rounded-lg border border-amber-900/15 bg-surface-low px-3 py-2 text-xs outline-none focus:border-primary focus:bg-white font-medium"
                >
                  <option value="Emerging Market Primary">Emerging Market Primary</option>
                  <option value="Nigerian Regulatory, Legal and Policy Environment">Nigerian Regulatory, Legal and Policy Environment</option>
                  <option value="Global Fallback">Global Fallback</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[10px] uppercase tracking-wider text-secondary mb-1">
                    Primary Sector (Optional)
                  </label>
                  <select
                    value={formSector}
                    onChange={(e) => setFormSector(e.target.value)}
                    className="w-full rounded-lg border border-amber-900/15 bg-surface-low px-3 py-2 text-xs outline-none focus:border-primary focus:bg-white"
                  >
                    {CANONICAL_SECTORS.filter((s) => s !== "All Sectors").map((sec) => (
                      <option key={sec} value={sec}>{sec}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[10px] uppercase tracking-wider text-secondary mb-1">
                    Coverage Region (Optional)
                  </label>
                  <input
                    type="text"
                    value={formRegion}
                    onChange={(e) => setFormRegion(e.target.value)}
                    placeholder="e.g. Nigeria, Pan-African, SE Asia"
                    className="w-full rounded-lg border border-amber-900/15 bg-surface-low px-3 py-2 text-xs outline-none focus:border-primary focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-amber-900/10 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-amber-900/15 text-xs font-semibold text-secondary hover:bg-surface-low"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-container shadow-xs"
                >
                  Save Source
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SourceRegistry;
