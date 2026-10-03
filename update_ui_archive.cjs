const fs = require("fs");
let content = fs.readFileSync("src/components/ContinuousScout.jsx", "utf8");

// 1. Add viewingArchived state
if (!content.includes("viewingArchived")) {
  content = content.replace(
    'const [searchQuery, setSearchQuery] = useState("");',
    'const [searchQuery, setSearchQuery] = useState("");\n  const [viewingArchived, setViewingArchived] = useState(false);\n  const [isArchiving, setIsArchiving] = useState(false);'
  );
}

// 2. Add archiveArticles action
if (!content.includes("archiveArticles")) {
  content = content.replace(
    'const runNow = useAction(api.scouting.runNow);',
    'const runNow = useAction(api.scouting.runNow);\n  const archiveArticles = useMutation(api.scouting.archiveArticles);'
  );
}

// 3. Update usePaginatedQuery for articles
content = content.replace(
  'usePaginatedQuery(api.scouting.listRecentArticlesPage, {}, { initialNumItems: 10 });',
  'usePaginatedQuery(api.scouting.listRecentArticlesPage, { isArchived: viewingArchived ? true : false }, { initialNumItems: 10 });'
);

// 4. Add UI for Archiving (Inside activeTab === "articles")
const archiveUI = `
      {/* TAB 4: Crawled Articles Archive (Session History) */}
      {activeTab === "articles" && (
        <div className="space-y-3">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewingArchived(false)}
                className={\`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors \${!viewingArchived ? "bg-primary text-white shadow-xs" : "bg-surface-low text-secondary hover:text-primary"}\`}
              >
                Active Articles
              </button>
              <button
                type="button"
                onClick={() => setViewingArchived(true)}
                className={\`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors \${viewingArchived ? "bg-primary text-white shadow-xs" : "bg-surface-low text-secondary hover:text-primary"}\`}
              >
                Archived
              </button>
            </div>
            {!viewingArchived && (
              <div className="flex items-center gap-2">
                <select
                  id="archiveSelect"
                  className="bg-white border border-amber-900/20 text-secondary text-xs rounded-lg px-2 py-1.5 outline-none"
                  defaultValue=""
                >
                  <option value="" disabled>Archive Old Articles...</option>
                  <option value="2">Older than 2 Days</option>
                  <option value="7">Older than 7 Days</option>
                  <option value="30">Older than 30 Days</option>
                </select>
                <button
                  type="button"
                  onClick={async () => {
                    const sel = document.getElementById("archiveSelect").value;
                    if (!sel) return;
                    setIsArchiving(true);
                    try {
                      const count = await archiveArticles({ olderThanDays: Number(sel) });
                      setNotice(\`Successfully archived \${count} old articles from the active view.\`);
                    } catch(e) {
                      setError(e.message);
                    } finally {
                      setIsArchiving(false);
                      document.getElementById("archiveSelect").value = "";
                    }
                  }}
                  disabled={isArchiving}
                  className="px-3 py-1.5 rounded-lg bg-surface-low border border-amber-900/20 hover:bg-white text-xs font-bold text-secondary flex items-center gap-1.5 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[14px]">inventory_2</span>
                  {isArchiving ? "Moving..." : "Archive Selected"}
                </button>
              </div>
            )}
          </div>
`;

content = content.replace(
  /\{\/\* TAB 4: Crawled Articles Archive \(Session History\) \*\/\}[\s\S]*?\{activeTab === "articles" && \(\s*<div className="space-y-3">/,
  archiveUI
);

fs.writeFileSync("src/components/ContinuousScout.jsx", content);
