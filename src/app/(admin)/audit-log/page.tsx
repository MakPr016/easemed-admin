"use client";
import { useState } from "react";
import { Search, Download, ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { AUDIT_LOG } from "@/lib/data";
import { relTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const ACTION_VARIANT: Record<string, string> = {
  Create: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Update: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Delete: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  Login: "bg-muted text-muted-foreground",
  Approve: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  Reject: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  Export: "bg-muted text-muted-foreground",
  Suspend: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  Activate: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

export default function AuditLogPage() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const rows = AUDIT_LOG;

  const filtered = rows.filter(l => {
    if (!search) return true;
    const q = search.toLowerCase();
    return l.actor.toLowerCase().includes(q) || l.entity.toLowerCase().includes(q) || l.entityId.toLowerCase().includes(q) || l.action.toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-border bg-card">
        <div>
          <h1 className="text-[18px] font-semibold tracking-tight">Audit Log</h1>
          <p className="text-[12.5px] text-muted-foreground mt-0.5">{rows.length} events · immutable record of all system activity</p>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Button variant="outline" size="sm" className="gap-1.5"><Download size={13} />Export CSV</Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-4 flex flex-col gap-3">
        {/* Filter bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="text-[12.5px]">Last 30 days</Button>
          <select className="h-8 px-2.5 rounded border border-border bg-card text-[12.5px] focus:outline-none w-[140px]">
            <option>All actors</option><option>Admin</option><option>Client</option><option>System</option>
          </select>
          <select className="h-8 px-2.5 rounded border border-border bg-card text-[12.5px] focus:outline-none w-[140px]">
            <option>All actions</option>
            {["Create", "Update", "Delete", "Login", "Approve", "Reject", "Export", "Suspend", "Activate"].map(a => <option key={a}>{a}</option>)}
          </select>
          <select className="h-8 px-2.5 rounded border border-border bg-card text-[12.5px] focus:outline-none w-[140px]">
            <option>All entities</option>
          </select>
          <div className="flex items-center gap-1.5 h-8 px-2.5 rounded border border-border bg-card flex-1 max-w-[280px]">
            <Search size={13} className="text-muted-foreground shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search events…"
              className="flex-1 bg-transparent text-[12.5px] outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="w-8" />
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Timestamp</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Actor</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Type</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Action</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Entity</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Entity ID</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 16).map(l => (
                  <>
                    <tr
                      key={l.id}
                      className="border-b border-border hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => setExpanded(expanded === l.id ? null : l.id)}
                    >
                      <td className="px-2 py-2.5 text-center">
                        <button className="w-5 h-5 grid place-items-center rounded hover:bg-muted text-muted-foreground">
                          {expanded === l.id ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </button>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[11.5px] text-muted-foreground">{relTime(l.timestamp)}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <Avatar name={l.actor} size="sm" />
                          <span>{l.actor}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="px-1.5 py-0.5 rounded bg-muted text-[11px] font-medium">{l.actorType}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={cn("px-1.5 py-0.5 rounded text-[11px] font-medium", ACTION_VARIANT[l.action] || "bg-muted text-muted-foreground")}>{l.action}</span>
                      </td>
                      <td className="px-3 py-2.5">{l.entity}</td>
                      <td className="px-3 py-2.5 font-mono text-[11px] text-muted-foreground">{l.entityId}</td>
                      <td className="px-3 py-2.5 font-mono text-[11px] text-muted-foreground">{l.ipAddress}</td>
                    </tr>
                    {expanded === l.id && (
                      <tr key={`${l.id}-exp`} className="border-b border-border">
                        <td colSpan={8} className="bg-muted/30 px-4 py-3.5 pl-12">
                          <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Details</div>
                          {l.before ? (
                            <div className="grid grid-cols-2 gap-3 max-w-xl">
                              {([["Before", l.before], ["After", l.after]] as [string, Record<string,string> | null][]).map(([label, data]) => (
                                <div key={label}>
                                  <div className="text-[11px] text-muted-foreground mb-1.5">{label}</div>
                                  <pre className="px-3 py-2.5 bg-card border border-border rounded-lg text-[11.5px] font-mono overflow-auto max-h-32">{JSON.stringify(data, null, 2)}</pre>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-[12px] text-muted-foreground">
                              Event by <b className="text-foreground">{l.actor}</b> ({l.actorEmail}) at {new Date(l.timestamp).toLocaleString()}. No field changes recorded.
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
