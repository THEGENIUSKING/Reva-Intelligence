const fs = require("fs");
let content = fs.readFileSync("src/components/ContinuousScout.jsx", "utf8");

// 1. Add `usePaginatedQuery` import
if (!content.includes("usePaginatedQuery")) {
  content = content.replace("useQuery } from \"convex/react\"", "useQuery, usePaginatedQuery } from \"convex/react\"");
}

// 2. Change activeTab default
content = content.replace('useState("emerging");', 'useState("ideas");');

// 3. Add ideasTypeFilter
content = content.replace(
  'const [timeFilter, setTimeFilter] = useState("all");',
  'const [ideasTypeFilter, setIdeasTypeFilter] = useState("all");\n  const [timeFilter, setTimeFilter] = useState("all");'
);

// 4. Update the queries
// Replace recentFindings with usePaginatedQuery
content = content.replace(
  'const recentFindings = useQuery(api.scouting.listRecentFindings, { limit: 60 }) || [];',
  `const { results: recentFindings, status: findingsStatus, loadMore: loadMoreFindings } = usePaginatedQuery(api.scouting.listFindingsPage, { typeFilter: ideasTypeFilter === "all" ? undefined : ideasTypeFilter }, { initialNumItems: 20 });`
);

// 5. Update tabs array
content = content.replace(
  '{ id: "emerging", label: "Emerging Tech Signals", count: emergingFindings.length, icon: "public" },\n            { id: "policy", label: "Nigerian Policy & Regulatory", count: policyFindings.length, icon: "gavel" },',
  '{ id: "ideas", label: "Ideas Surfaced (AI)", count: overview?.totalFindingsAllTime || 0, icon: "lightbulb" },'
);

// 6. Fix activeTab logic
content = content.replace(
  'activeTab === "emerging"',
  'activeTab === "ideas"'
);
content = content.replace(
  '? emergingFindings',
  '? recentFindings'
);
content = content.replace(
  ': activeTab === "policy"',
  ''
);
content = content.replace(
  '? policyFindings',
  ''
);

// 7. Make metric cards clickable
content = content.replace(
  '<div className="p-3 rounded-lg bg-surface-low/80 border border-amber-900/10">',
  '<div className="p-3 rounded-lg bg-surface-low/80 border border-amber-900/10">'
);
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

fs.writeFileSync("src/components/ContinuousScout.jsx", content, "utf8");
