const fs = require("fs");
let content = fs.readFileSync("src/components/ContinuousScout.jsx", "utf8");

// 1. Change activeTab default
content = content.replace('useState("emerging");', 'useState("ideas");');

// 2. Add ideasTypeFilter
content = content.replace(
  'const [timeFilter, setTimeFilter] = useState("all");',
  'const [ideasTypeFilter, setIdeasTypeFilter] = useState("all");\n  const [timeFilter, setTimeFilter] = useState("all");'
);

// 3. Update the queries
content = content.replace(
  'const recentFindings = useQuery(api.scouting.listRecentFindings, { limit: 60 }) || [];',
  `const { results: recentFindings, status: findingsStatus, loadMore: loadMoreFindings } = usePaginatedQuery(api.scouting.listFindingsPage, { typeFilter: ideasTypeFilter === "all" ? undefined : ideasTypeFilter }, { initialNumItems: 20 });`
);

// 4. Remove emergingFindings and policyFindings
content = content.replace(
  /const emergingFindings = useMemo\(\(\) => \{[\s\S]*?\}, \[recentFindings, timeFilter, sectorFilter, searchQuery\]\);\n\n  const policyFindings = useMemo\(\(\) => \{[\s\S]*?\}, \[recentFindings, timeFilter, sectorFilter, searchQuery\]\);\n/,
  ""
);

// 5. Remove paginatedEmerging and paginatedPolicy
content = content.replace(
  /const paginatedEmerging = emergingFindings\.slice\(\(page - 1\) \* PAGE_SIZE, page \* PAGE_SIZE\);\n  const paginatedPolicy = policyFindings\.slice\(\(page - 1\) \* PAGE_SIZE, page \* PAGE_SIZE\);\n/,
  ""
);

// 6. Add filteredFindings and findingsByDay BEFORE screenedOpportunities
const groupLogic = `
  const filteredFindings = useMemo(() => {
    const threshold = timeThresholds[timeFilter] || 0;
    return recentFindings.filter(item => {
      const itemTime = item.createdAt || 0;
      if (threshold > 0 && itemTime < threshold) return false;
      if (sectorFilter !== "All Sectors" && normalizeSector(item.sector) !== sectorFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return \`\${item.ideaName} \${item.summary} \${item.sourceName}\`.toLowerCase().includes(q);
      }
      return true;
    });
  }, [recentFindings, timeFilter, sectorFilter, searchQuery]);

  const findingsByDay = useMemo(() => {
    const groups = {};
    filteredFindings.forEach(item => {
      const day = item.createdAt ? new Date(item.createdAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : "Unknown Date";
      if (!groups[day]) groups[day] = [];
      groups[day].push(item);
    });
    return Object.entries(groups).sort((a, b) => {
      if (a[0] === "Unknown Date") return 1;
      if (b[0] === "Unknown Date") return -1;
      return new Date(b[0]).getTime() - new Date(a[0]).getTime();
    });
  }, [filteredFindings]);
`;
content = content.replace(
  "  const screenedOpportunities = useMemo(() => {",
  groupLogic + "\n  const screenedOpportunities = useMemo(() => {"
);

// 7. Update tabs array
content = content.replace(
  '{ id: "emerging", label: "Emerging Tech Signals", count: emergingFindings.length, icon: "public" },\n            { id: "policy", label: "Nigerian Policy & Regulatory", count: policyFindings.length, icon: "gavel" },',
  '{ id: "ideas", label: "Ideas Surfaced (AI Scouted)", count: overview?.totalFindingsAllTime || 0, icon: "lightbulb" },'
);

// 8. Fix totalPages
content = content.replace(
  'const totalPages = Math.ceil((\n    activeTab === "emerging"\n      ? emergingFindings.length\n      : activeTab === "policy"\n      ? policyFindings.length\n      : activeTab === "screened"\n      ? screenedOpportunities.length\n      : filteredArticles.length\n  ) / PAGE_SIZE);',
  'const totalPages = Math.ceil((\n    activeTab === "screened"\n      ? screenedOpportunities.length\n      : activeTab === "articles"\n      ? filteredArticles.length\n      : 1\n  ) / PAGE_SIZE);'
);


// 9. Make metric cards clickable
content = content.replace(
  '<span className="text-[10px] font-bold uppercase tracking-wider text-secondary block">ARTICLES INGESTED (24H)</span>',
  '<button onClick={() => setActiveTab("articles")} className="text-left w-full hover:opacity-80 transition-opacity">\n<span className="text-[10px] font-bold uppercase tracking-wider text-secondary block hover:text-primary">ARTICLES INGESTED (24H) &rarr;</span>'
);
content = content.replace(
  '<span className="text-[10px] text-secondary">{overview?.geminiConfigured ? "Gemini enabled" : "Gemini not configured"}</span>\n          </div>',
  '<span className="text-[10px] text-secondary">{overview?.geminiConfigured ? "Gemini enabled" : "Gemini not configured"}</span>\n          </button>\n          </div>'
);

content = content.replace(
  '<span className="text-[10px] font-bold uppercase tracking-wider text-secondary block">IDEAS SURFACED (24H)</span>',
  '<button onClick={() => setActiveTab("ideas")} className="text-left w-full hover:opacity-80 transition-opacity">\n<span className="text-[10px] font-bold uppercase tracking-wider text-secondary block hover:text-primary">IDEAS SURFACED (24H) &rarr;</span>'
);
content = content.replace(
  '<span className="text-[10px] text-secondary">New AI-derived findings</span>\n          </div>',
  '<span className="text-[10px] text-secondary">New AI-derived findings</span>\n          </button>\n          </div>'
);

// 10. Add ideasTypeFilter to the UI filters bar
const typeFilterDropdown = `
          {activeTab === "ideas" && (
            <select
              value={ideasTypeFilter}
              onChange={(e) => setIdeasTypeFilter(e.target.value)}
              className="bg-transparent border-none outline-none text-xs font-semibold text-primary cursor-pointer pr-1"
            >
              <option value="all">All Scout Types</option>
              <option value="emerging_tech">Emerging Tech Signals</option>
              <option value="nigeria_policy">Nigerian Policy & Regulatory</option>
            </select>
          )}
`;
content = content.replace(
  '{/* Dynamic Sector Filter */}',
  typeFilterDropdown + '\n          {/* Dynamic Sector Filter */}'
);

// 11. Completely replace Tab 1 (emerging) and Tab 2 (policy) with Tab "ideas" (INCLUDING BUTTONS)
const startEmerging = content.indexOf("{/* TAB 1: Emerging Tech Signals */}");
const endPolicy = content.indexOf("{/* TAB 3: Screened Ideas Archive */}");
if (startEmerging !== -1 && endPolicy !== -1) {
  const newIdeasTab = `
      {/* TAB 1 & 2 MERGED: Ideas Surfaced */}
      {activeTab === "ideas" && (
        <div className="space-y-6">
          <div className="flex justify-end gap-2 mb-2">
            <button
              type="button"
              onClick={() => handleCheckDuplicatesAllVisible(ideasTypeFilter === "all" ? "emerging_tech" : ideasTypeFilter)}
              disabled={isCheckingBatch || isScreeningBatch || filteredFindings.length === 0}
              className="px-4 py-1.5 rounded-lg border border-amber-900/15 bg-white hover:bg-surface-low text-xs font-bold text-on-surface shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px] text-primary">fingerprint</span>
              <span>{isCheckingBatch ? "Checking..." : "Check Duplicates (Visible)"}</span>
            </button>
            <button
              type="button"
              onClick={() => handleScreenAllVisible(ideasTypeFilter === "all" ? "emerging_tech" : ideasTypeFilter)}
              disabled={isCheckingBatch || isScreeningBatch || filteredFindings.length === 0}
              className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-xs font-bold text-white shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">
                {isScreeningBatch ? "hourglass_empty" : "checklist"}
              </span>
              <span>{isScreeningBatch ? "Screening..." : "Screen Initiatives (Visible)"}</span>
            </button>
          </div>
          
          {findingsByDay.length ? (
            findingsByDay.map(([day, items]) => (
              <div key={day} className="space-y-3">
                <div className="flex items-center justify-between border-b border-amber-900/10 pb-1.5 px-1">
                  <h3 className="font-bold text-sm text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                    {day}
                  </h3>
                  <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">{items.length} {items.length === 1 ? "Idea" : "Ideas"} Surfaced</span>
                </div>
                
                {items.map((item, idx) => (
                  <article
                    key={item._id || idx}
                    className="rounded-xl bg-white/80 p-4.5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-amber-900/10 hover:border-primary/25 transition-all flex flex-col md:flex-row md:items-start justify-between gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="font-bold text-sm text-on-surface font-headline">{item.ideaName}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary">
                          {normalizeSector(item.sector)}
                        </span>
                        <span className="text-[11px] text-secondary flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">{item.scoutType === "nigeria_policy" ? "gavel" : "public"}</span>
                          {item.sourceName}
                        </span>
                        <span className={\`px-2 py-0.5 rounded text-[10px] font-bold \${item.isNewInSession ? "bg-emerald-500/10 text-emerald-800" : "bg-surface-low text-secondary"}\`}>
                          {item.isNewInSession ? \`New • \${item.sessionDate || "first seen"}\` : "Previously scouted"}
                        </span>
                      </div>
                      <p className="text-xs text-secondary leading-relaxed max-w-3xl">{item.summary}</p>
                    </div>
                  </article>
                ))}
              </div>
            ))
          ) : (
            <div className="rounded-xl bg-white/70 p-8 text-center border border-amber-900/10">
              <span className="material-symbols-outlined text-4xl text-amber-900/20 mb-2">lightbulb</span>
              <p className="text-sm font-semibold text-secondary">No AI-surfaced ideas match your filters.</p>
              <p className="text-xs text-secondary/70 mt-1">Check back later or adjust the time/sector dropdowns.</p>
            </div>
          )}

          {findingsStatus === "CanLoadMore" && (
            <div className="flex justify-center mt-6 pt-4 border-t border-amber-900/10">
              <button
                type="button"
                onClick={() => loadMoreFindings(20)}
                className="px-6 py-2 rounded-full border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-bold transition-colors"
              >
                Load Previous Days...
              </button>
            </div>
          )}
          {findingsStatus === "LoadingMore" && (
            <div className="text-center text-xs text-secondary mt-6">Loading more ideas...</div>
          )}
        </div>
      )}

`;
  
  content = content.slice(0, startEmerging) + newIdeasTab + content.slice(endPolicy);
}

// 12. Fix the pagination at the bottom (remove for ideas, keep for articles and screened)
content = content.replace(
  '<div className="flex items-center justify-between border-t border-amber-900/10 pt-4 mt-8">',
  '{activeTab !== "ideas" && (<div className="flex items-center justify-between border-t border-amber-900/10 pt-4 mt-8">'
);
content = content.replace(
  '</button>\n        </div>',
  '</button>\n        </div>\n      )}'
);

fs.writeFileSync("src/components/ContinuousScout.jsx", content, "utf8");
