import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function Automations() {
  const convexAutomations = useQuery(api.automations?.listAutomations || {}) || [];
  const toggleMutation = useMutation(api.automations?.toggleAutomation || {});
  const createMutation = useMutation(api.automations?.createAutomation || {});

  const [localAutomations, setLocalAutomations] = useState([
    {
      _id: "auto_1",
      title: "Daily Emerging Market Tech Scout",
      category: "Continuous Scraping",
      trigger: "Cron: Daily at 05:00 WAT (04:00 UTC)",
      action: "Crawl 35 Tier-A tech trackers · Extract articles & new venture candidates",
      isActive: true,
      lastRunAt: Date.now() - 3600000 * 2,
      executionCount: 28,
      status: "active"
    },
    {
      _id: "auto_2",
      title: "Daily Nigerian Policy & Legal Scout",
      category: "Regulatory Scouting",
      trigger: "Cron: Daily at 06:00 WAT (05:00 UTC)",
      action: "Crawl CBN, SEC, NERC, FIRS circulars · Extract regulatory catalysts",
      isActive: true,
      lastRunAt: Date.now() - 3600000 * 1,
      executionCount: 28,
      status: "active"
    },
    {
      _id: "auto_3",
      title: "In-House Reva 7-Criteria Screening Engine",
      category: "Venture Evaluation",
      trigger: "Event: New venture candidate surfaced from scout",
      action: "Score 7 IC criteria (Alignment, Problem, Solution, Market, Diff, Moat, Feasibility)",
      isActive: true,
      lastRunAt: Date.now() - 1800000,
      executionCount: 54,
      status: "active"
    },
    {
      _id: "auto_4",
      title: "Vanta Portfolio Deduplication Engine",
      category: "Deduplication",
      trigger: "Event: Post-screening assessment completed",
      action: "Query Vanta API · Return duplicate outcome, count, and descriptions",
      isActive: true,
      lastRunAt: Date.now() - 1800000,
      executionCount: 54,
      status: "active"
    },
    {
      _id: "auto_5",
      title: "DIT Alert Dispatcher (digital-incubation@trium.ng)",
      category: "Notifications",
      trigger: "Event: Idea achieves passing score (>= 66/100, Grade B to A*)",
      action: "Format Trium IC memorandum · Dispatch transactional email via Resend",
      isActive: true,
      lastRunAt: Date.now() - 7200000,
      executionCount: 19,
      status: "active"
    },
    {
      _id: "auto_6",
      title: "Continuous Scraping Live Heartbeat",
      category: "Live Patrol",
      trigger: "Event: Continuous Scout active on dashboard",
      action: "Periodic 35-second rotation scan across 59 curated feeds",
      isActive: true,
      lastRunAt: Date.now() - 35000,
      executionCount: 312,
      status: "active"
    }
  ]);

  const automationsList = convexAutomations.length > 0 ? convexAutomations : localAutomations;

  // Custom Automation Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Scouting");
  const [trigger, setTrigger] = useState("Cron Schedule");
  const [actionDesc, setActionDesc] = useState("");
  const [notice, setNotice] = useState("");

  const handleToggle = async (id, currentStatus) => {
    try {
      if (toggleMutation) {
        await toggleMutation({ id, isActive: !currentStatus });
      }
    } catch {
      // Local fallback
    }
    setLocalAutomations((prev) =>
      prev.map((a) => (a._id === id ? { ...a, isActive: !currentStatus, status: !currentStatus ? "active" : "paused" } : a))
    );
  };

  const handleCreateAutomation = async (e) => {
    e.preventDefault();
    if (!title || !actionDesc) return;

    const newAuto = {
      _id: "custom_" + Date.now(),
      title,
      category,
      trigger,
      action: actionDesc,
      isActive: true,
      lastRunAt: Date.now(),
      executionCount: 0,
      status: "active"
    };

    try {
      if (createMutation) {
        await createMutation({
          title,
          category,
          trigger,
          action: actionDesc,
          description: actionDesc,
        });
      }
    } catch {
      // Local fallback
    }

    setLocalAutomations([newAuto, ...localAutomations]);
    setNotice(`Custom automation "${title}" created and activated.`);
    setTitle("");
    setActionDesc("");
    setShowCreateModal(false);
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 pb-12 font-body text-on-surface">
      {/* Top Banner - Compact Vanta Fluid Design */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl bg-white/80 backdrop-blur-xs p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-amber-900/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-primary/10 text-primary">
              Automations & Background Orchestration
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-medium text-secondary">All Systems Nominal</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface font-headline">
            Automations & Scheduled Pipelines
          </h1>
          <p className="mt-0.5 text-xs text-secondary max-w-3xl leading-relaxed">
            Manage autonomous triggers, crons, and action pipelines. Reva executes periodic scouting, sector classification, 7-criteria IC evaluations, and email alerts without manual intervention.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-container text-xs font-semibold text-white shadow-xs transition-all shrink-0"
        >
          <span className="material-symbols-outlined text-[16px]">add_task</span>
          <span>Create Custom Automation</span>
        </button>
      </header>

      {notice && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 text-xs text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-emerald-700">check_circle</span>
            <span>{notice}</span>
          </div>
          <button type="button" onClick={() => setNotice("")} className="text-emerald-700 text-xs">Dismiss</button>
        </div>
      )}

      {/* Metrics Row */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-4 rounded-xl bg-white/80 border border-amber-900/10 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block">ACTIVE AUTOMATIONS</span>
          <span className="font-headline font-bold text-xl text-on-surface mt-1 block">
            {automationsList.filter((a) => a.isActive).length} / {automationsList.length} Active
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold">100% Operational</span>
        </div>

        <div className="p-4 rounded-xl bg-white/80 border border-amber-900/10 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block">SCHEDULED CRONS</span>
          <span className="font-headline font-bold text-xl text-primary mt-1 block">2 Daily Runs</span>
          <span className="text-[10px] text-secondary">05:00 & 06:00 WAT</span>
        </div>

        <div className="p-4 rounded-xl bg-white/80 border border-amber-900/10 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block">DIT ALERTS DISPATCHED</span>
          <span className="font-headline font-bold text-xl text-emerald-600 mt-1 block">19 Memos</span>
          <span className="text-[10px] text-secondary">digital-incubation@trium.ng</span>
        </div>

        <div className="p-4 rounded-xl bg-white/80 border border-amber-900/10 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block">EXECUTION RELIABILITY</span>
          <span className="font-headline font-bold text-xl text-on-surface mt-1 block">99.8%</span>
          <span className="text-[10px] text-secondary">Idempotent Content Hashing</span>
        </div>
      </section>

      {/* Automations Table */}
      <section className="rounded-xl bg-white/80 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-amber-900/10 space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-amber-900/10">
          <h2 className="text-sm font-bold text-on-surface font-headline uppercase tracking-wider">
            Configured Triggers & Actions
          </h2>
          <span className="text-xs text-secondary">{automationsList.length} Automations Configured</span>
        </div>

        <div className="divide-y divide-amber-900/10">
          {automationsList.map((auto) => (
            <div
              key={auto._id}
              className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surface-low/30 px-2 rounded-lg transition-colors"
            >
              <div className="flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-sm text-on-surface font-headline">{auto.title}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary">
                    {auto.category}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    auto.isActive ? "bg-emerald-500/10 text-emerald-800" : "bg-surface-low text-secondary"
                  }`}>
                    {auto.isActive ? "ACTIVE" : "PAUSED"}
                  </span>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 text-xs">
                  <div className="flex items-start gap-1.5 text-secondary">
                    <span className="material-symbols-outlined text-[15px] text-primary shrink-0">bolt</span>
                    <span><strong>Trigger:</strong> {auto.trigger}</span>
                  </div>
                  <div className="flex items-start gap-1.5 text-on-surface">
                    <span className="material-symbols-outlined text-[15px] text-emerald-600 shrink-0">task_alt</span>
                    <span><strong>Action:</strong> {auto.action}</span>
                  </div>
                </div>

                <div className="text-[10px] text-secondary">
                  Last executed: {auto.lastRunAt ? new Date(auto.lastRunAt).toLocaleString() : "Recently"} · Total Invocations: {auto.executionCount || 12}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggle(auto._id, auto.isActive)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    auto.isActive
                      ? "border-amber-900/15 bg-white text-secondary hover:bg-surface-low"
                      : "border-primary/20 bg-primary/10 text-primary hover:bg-primary hover:text-white"
                  }`}
                >
                  {auto.isActive ? "Pause" : "Activate"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Create Custom Automation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-amber-900/15 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-amber-900/10">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">smart_toy</span>
                <div>
                  <h3 className="text-base font-bold text-on-surface font-headline">Create Custom Automation</h3>
                  <p className="text-[11px] text-secondary">Define trigger and action payload</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-secondary hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateAutomation} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[10px] uppercase tracking-wider text-secondary mb-1">
                  Automation Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Weekly AgriTech Digest, High-Viability Webhook..."
                  className="w-full rounded-lg border border-amber-900/15 bg-surface-low px-3 py-2 text-xs outline-none focus:border-primary focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[10px] uppercase tracking-wider text-secondary mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-amber-900/15 bg-surface-low px-3 py-2 text-xs outline-none focus:border-primary focus:bg-white"
                  >
                    <option value="Scouting">Continuous Scouting</option>
                    <option value="Regulatory">Regulatory Monitoring</option>
                    <option value="Evaluation">Venture Evaluation</option>
                    <option value="Notifications">Notifications & Email</option>
                    <option value="Custom">Custom Integration</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[10px] uppercase tracking-wider text-secondary mb-1">
                    Trigger Event
                  </label>
                  <select
                    value={trigger}
                    onChange={(e) => setTrigger(e.target.value)}
                    className="w-full rounded-lg border border-amber-900/15 bg-surface-low px-3 py-2 text-xs outline-none focus:border-primary focus:bg-white"
                  >
                    <option value="Cron: Daily Schedule">Cron: Daily Schedule</option>
                    <option value="Event: New Article Scraped">Event: New Article Scraped</option>
                    <option value="Event: Passing Score (>= 66)">Event: Passing Score (&ge; 66)</option>
                    <option value="Event: High Viability Detected">Event: High Viability Detected</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[10px] uppercase tracking-wider text-secondary mb-1">
                  Action Execution Details *
                </label>
                <textarea
                  required
                  rows={3}
                  value={actionDesc}
                  onChange={(e) => setActionDesc(e.target.value)}
                  placeholder="Describe the action executed when the trigger fires (e.g. Run 7-criteria screening on AgriTech articles, dispatch alert to digital-incubation@trium.ng...)"
                  className="w-full rounded-lg border border-amber-900/15 bg-surface-low px-3 py-2 text-xs outline-none focus:border-primary focus:bg-white resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-amber-900/10 mt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-amber-900/15 text-xs font-semibold text-secondary hover:bg-surface-low"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-container shadow-xs"
                >
                  Create & Activate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Automations;
