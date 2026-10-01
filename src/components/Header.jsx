import React, { useState } from "react";

const pageTitles = {
  dashboard: "Overview",
  start: "Workflows",
  benchmark: "Venture benchmarking",
  scraping: "Venture screening",
  sources: "Source registry",
  emails: "Email log",
};

export function Header({ activeTab, setActiveTab, user, onLogout, sidebarCollapsed = false }) {
  const [showDropdown, setShowDropdown] = useState(false);
  return (
    <header className={`fixed right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-surface/95 px-3 shadow-sm backdrop-blur sm:px-5 lg:px-space-lg ${sidebarCollapsed ? "left-[72px]" : "left-[72px] lg:left-[260px]"}`}>
      <span className="text-sm font-semibold text-on-surface">{pageTitles[activeTab] || "Reva"}</span>
      <div className="relative">
        <button type="button" aria-expanded={showDropdown} onClick={() => setShowDropdown(!showDropdown)} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-surface-container-low">
          <span className="grid h-8 w-8 place-items-center rounded-full border border-border bg-primary/10 text-xs font-bold text-primary">{(user?.name || user?.email || "U").slice(0, 1).toUpperCase()}</span>
          <span className="hidden max-w-48 truncate text-sm font-medium text-on-surface sm:block">{user?.name || user?.email}</span>
          <span className="material-symbols-outlined text-base text-secondary">{showDropdown ? "expand_less" : "expand_more"}</span>
        </button>
        {showDropdown && <div className="absolute right-0 mt-2 w-60 rounded-xl border border-border bg-white p-1 shadow-xl">
          <div className="border-b border-border px-3 py-2"><p className="truncate text-sm font-semibold text-on-surface">{user?.name || "Account"}</p><p className="truncate text-xs text-secondary">{user?.email}</p></div>
          <button type="button" onClick={() => { setActiveTab("sources"); setShowDropdown(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-on-surface hover:bg-surface-container-low"><span className="material-symbols-outlined text-base">database</span>Source registry</button>
          <button type="button" onClick={() => { setShowDropdown(false); onLogout(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-error hover:bg-error/5"><span className="material-symbols-outlined text-base">logout</span>Sign out</button>
        </div>}
      </div>
    </header>
  );
}

export default Header;
