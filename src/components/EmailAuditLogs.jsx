import React from "react";

export function EmailAuditLogs({ emailLogs = [] }) {
  const sent = emailLogs.filter((item) => item.status === "sent").length;
  const failed = emailLogs.filter((item) => item.status === "failed").length;
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-12">
      <header><p className="text-xs font-bold uppercase tracking-widest text-primary">Delivery history</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-on-surface">Email log</h1><p className="mt-2 text-sm leading-6 text-secondary">Provider delivery attempts for your screening alerts.</p></header>
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label="Total attempts" value={emailLogs.length} />
        <Metric label="Accepted by Resend" value={sent} />
        <Metric label="Failed attempts" value={failed} />
      </div>
      <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        {emailLogs.length === 0 ? <div className="grid min-h-48 place-items-center p-6 text-center"><div><span className="material-symbols-outlined text-3xl text-primary">mail</span><h2 className="mt-2 font-semibold text-on-surface">No email attempts yet</h2><p className="mt-1 text-sm text-secondary">Alerts will appear here after configured screening runs meet the notification threshold.</p></div></div> : <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-surface-container-low text-xs uppercase text-secondary"><tr><th className="p-3">Venture</th><th className="p-3">Subject</th><th className="p-3">Recipient</th><th className="p-3">Status</th><th className="p-3">Time</th><th className="p-3">Provider details</th></tr></thead><tbody>{emailLogs.map((log) => <tr key={log._id} className="border-t border-border align-top"><td className="p-3"><p className="font-semibold text-on-surface">{log.initiativeName}</p><p className="mt-1 text-xs text-secondary">AI score {log.vantaScore}/100 · {log.vantaGrade}</p></td><td className="max-w-xs p-3">{log.subject}</td><td className="p-3">{log.recipient}</td><td className="p-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${log.status === "sent" ? "bg-success-bg text-success" : "bg-error/10 text-error"}`}>{log.status}</span></td><td className="whitespace-nowrap p-3">{new Date(log.dispatchedAt).toLocaleString()}</td><td className="max-w-xs break-words p-3 text-xs text-secondary">{log.error || log.messageId || ""}</td></tr>)}</tbody></table></div>}
      </section>
    </div>
  );
}

function Metric({ label, value }) { return <div className="rounded-2xl border border-border bg-white p-5 shadow-sm"><p className="text-sm text-secondary">{label}</p><p className="mt-2 text-3xl font-bold tabular-nums text-on-surface">{value}</p></div>; }
export default EmailAuditLogs;
