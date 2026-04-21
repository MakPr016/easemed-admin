"use client";
import { useState } from "react";
import { Plus, MoreHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { ADMINS, COUNTRIES } from "@/lib/data";
import { relTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type Tab = "users" | "notify" | "thresh" | "platform";

function Switch({ on: initOn = false }: { on?: boolean }) {
  const [on, setOn] = useState(initOn);
  return (
    <button
      onClick={() => setOn(!on)}
      className={cn("relative w-8 h-5 rounded-full transition-colors shrink-0", on ? "bg-primary" : "bg-muted-foreground/30")}
    >
      <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all", on ? "left-3.5" : "left-0.5")} />
    </button>
  );
}

const ROLE_BADGE: Record<string, string> = {
  "Super Admin": "bg-primary/10 text-primary",
  "Compliance Admin": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  "Operations Admin": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "Read-Only": "bg-muted text-muted-foreground",
};

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("users");

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-card">
        <h1 className="text-[18px] font-semibold tracking-tight">Settings</h1>
        <p className="text-[12.5px] text-muted-foreground mt-0.5">Manage admins, notifications, and platform configuration.</p>

        <div className="flex gap-1 mt-4 border-b border-border -mb-px">
          {([["users", "Admin Users"], ["notify", "Notification Rules"], ["thresh", "Compliance Thresholds"], ["platform", "Platform Config"]] as [Tab, string][]).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={cn("px-4 py-2 text-[12.5px] font-medium border-b-2 -mb-px transition-colors", tab === k ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-4">

        {tab === "users" && (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div>
                <h3 className="text-[13px] font-semibold">Admin Users</h3>
                <p className="text-[11.5px] text-muted-foreground">{ADMINS.length} admin accounts</p>
              </div>
              <Button size="sm" className="gap-1.5"><Plus size={13} />Invite Admin</Button>
            </div>
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Name</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Email</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Role</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Last Login</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Status</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ADMINS.map(a => (
                  <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <Avatar name={a.name} size="sm" />
                        <span className="font-medium">{a.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">{a.email}</td>
                    <td className="px-3 py-2.5">
                      <span className={cn("px-1.5 py-0.5 rounded text-[11px] font-medium", ROLE_BADGE[a.role] || "bg-muted text-muted-foreground")}>{a.role}</span>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-muted-foreground">{relTime(a.lastLogin)}</td>
                    <td className="px-3 py-2.5"><StatusBadge status={a.status} /></td>
                    <td className="px-2 py-2.5">
                      <button className="w-7 h-7 grid place-items-center rounded text-muted-foreground hover:bg-muted transition-colors">
                        <MoreHorizontal size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "notify" && (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-[13px] font-semibold">Notification Rules</h3>
              <p className="text-[11.5px] text-muted-foreground">Control which events trigger alerts per role.</p>
            </div>
            <div className="divide-y divide-border">
              {[
                ["New Registration", "A new client completes registration", true, ["Email", "In-App"]],
                ["KYC Failed", "A client's KYC verification fails", true, ["Email", "In-App"]],
                ["Document Expiring", "Certificate or cert within 14 days of expiry", true, ["In-App"]],
                ["Large Transaction", "Transaction exceeds $100,000", false, ["Email"]],
                ["Approval Overdue", "Pending application awaiting >3 days", true, ["Email", "In-App"]],
                ["New Message Received", "Client sends a new message", true, ["In-App"]],
              ].map(([title, desc, on, channels]) => (
                <div key={String(title)} className="flex items-center gap-4 px-4 py-3.5">
                  <div className="flex-1">
                    <div className="text-[12.5px] font-medium">{title as string}</div>
                    <div className="text-[11.5px] text-muted-foreground mt-0.5">{desc as string}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {(channels as string[]).map(c => (
                      <span key={c} className="px-1.5 py-0.5 rounded bg-muted text-[11px]">{c}</span>
                    ))}
                  </div>
                  <Switch on={on as boolean} />
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "thresh" && (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div>
                <h3 className="text-[13px] font-semibold">Compliance Thresholds</h3>
                <p className="text-[11.5px] text-muted-foreground">Global escalation and approval rules.</p>
              </div>
              <Button size="sm">Save Changes</Button>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-4 max-w-[720px]">
                {[
                  ["Max days before escalation", "3", "Days until pending applications are flagged overdue"],
                  ["Min compliance score for activation", "60", "Sellers below this score cannot be activated"],
                  ["Credit limit ceiling (USD)", "5000000", "Maximum credit line allowed for any buyer"],
                  ["Document expiry warning (days before)", "14", "Days before expiry to trigger document renewal alerts"],
                ].map(([label, defaultVal, hint]) => (
                  <div key={String(label)}>
                    <label className="block text-[12px] font-medium mb-1">{label}</label>
                    <input
                      className="w-full h-8 px-2.5 rounded border border-border bg-background text-[13px] font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                      defaultValue={defaultVal as string}
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">{hint as string}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "platform" && (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-[13px] font-semibold">Platform Configuration</h3>
            </div>
            <div className="p-5 flex flex-col gap-5">
              {/* Supported Countries */}
              <div>
                <label className="block text-[12px] font-medium mb-2">Supported Countries ({COUNTRIES.length})</label>
                <div className="flex flex-wrap gap-1.5">
                  {COUNTRIES.slice(0, 10).map(c => (
                    <span key={c} className="flex items-center gap-1 px-2 py-1 rounded bg-muted text-[11.5px]">
                      {c}
                      <button className="text-muted-foreground hover:text-foreground transition-colors"><X size={10} /></button>
                    </span>
                  ))}
                  <button className="flex items-center gap-1 px-2 py-1 rounded border border-dashed border-border text-[11.5px] text-muted-foreground hover:text-foreground hover:border-border transition-colors">
                    <Plus size={11} />Add
                  </button>
                </div>
              </div>

              {/* Supported Currencies */}
              <div>
                <label className="block text-[12px] font-medium mb-2">Supported Currencies</label>
                <div className="flex flex-wrap gap-1.5">
                  {["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "SGD"].map(c => (
                    <span key={c} className="px-2 py-1 rounded bg-muted font-mono text-[11.5px]">{c}</span>
                  ))}
                </div>
              </div>

              {/* Grid settings */}
              <div className="grid grid-cols-2 gap-4 max-w-[500px]">
                <div>
                  <label className="block text-[12px] font-medium mb-1">Default pagination size</label>
                  <select className="w-full h-8 px-2.5 rounded border border-border bg-background text-[13px] focus:outline-none focus:ring-1 focus:ring-primary">
                    <option>10</option>
                    <option>25</option>
                    <option>50</option>
                    <option>100</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-medium mb-1">Session timeout (minutes)</label>
                  <select className="w-full h-8 px-2.5 rounded border border-border bg-background text-[13px] focus:outline-none focus:ring-1 focus:ring-primary">
                    <option>15</option>
                    <option>30</option>
                    <option>60</option>
                    <option>120</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button size="sm">Save Changes</Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
