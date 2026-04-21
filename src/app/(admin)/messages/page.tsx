"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { Search, Plus, Paperclip, Send, ExternalLink, X, ChevronLeft, ChevronRight, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge, TypeBadge } from "@/components/ui/status-badge";
import { CONVERSATIONS, CLIENTS, ADMINS, CURRENT_ADMIN, CANNED_TEMPLATES } from "@/lib/data";
import { fmtDateShort, fmtTime, relTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type ConvTab = "all" | "unread" | "mine" | "resolved";

export default function MessagesPage() {
  const [activeId, setActiveId] = useState(CONVERSATIONS[0].id);
  const [tab, setTab] = useState<ConvTab>("all");
  const [reply, setReply] = useState("");
  const [ctxOpen, setCtxOpen] = useState(true);
  const [composeOpen, setComposeOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

  const convs = useMemo(() => {
    let list = [...CONVERSATIONS];
    if (tab === "unread") list = list.filter(c => !c.readByAdmin);
    if (tab === "mine") list = list.filter(c => c.assignedTo === CURRENT_ADMIN.id);
    if (tab === "resolved") list = list.filter(c => c.status === "resolved");
    return list.sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
  }, [tab]);

  const active = CONVERSATIONS.find(c => c.id === activeId);
  const client = CLIENTS.find(c => c.id === active?.clientId);

  const grouped = useMemo(() => {
    if (!active) return [];
    const out: ({ type: "date"; label: string } | { type: "msg"; msg: typeof active.messages[0] })[] = [];
    let lastDate = "";
    active.messages.forEach(m => {
      const d = new Date(m.sentAt);
      const today = new Date();
      const isToday = d.toDateString() === today.toDateString();
      const isYest = d.toDateString() === new Date(today.getTime() - 86400000).toDateString();
      const label = isToday ? "Today" : isYest ? "Yesterday" : d.toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" });
      if (label !== lastDate) { out.push({ type: "date", label }); lastDate = label; }
      out.push({ type: "msg", msg: m });
    });
    return out;
  }, [activeId]);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [activeId]);

  const unreadCount = CONVERSATIONS.filter(c => !c.readByAdmin).length;

  const priorityColor = (p: string) => p === "urgent" ? "text-red-600 dark:text-red-400" : "";

  return (
    <div className={cn("messages-layout h-full", !ctxOpen && "no-context")}>
      {/* LEFT — Conversation list */}
      <div className="flex flex-col border-r border-border overflow-hidden" style={{ gridArea: "list" }}>
        <div className="flex items-center gap-2 px-3 py-3 border-b border-border">
          <h2 className="text-[14px] font-semibold flex-1">Messages</h2>
          <span className="px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10.5px] font-semibold font-mono">{unreadCount}</span>
          <button onClick={() => setComposeOpen(true)} className="w-7 h-7 grid place-items-center rounded hover:bg-muted text-muted-foreground transition-colors">
            <Plus size={14} />
          </button>
        </div>
        <div className="px-2.5 py-2 border-b border-border">
          <div className="flex items-center gap-1.5 h-7 px-2.5 rounded border border-border bg-background">
            <Search size={12} className="text-muted-foreground shrink-0" />
            <input placeholder="Search conversations…" className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-muted-foreground" />
          </div>
        </div>
        <div className="flex border-b border-border">
          {([["all", "All", CONVERSATIONS.length], ["unread", "Unread", CONVERSATIONS.filter(c => !c.readByAdmin).length], ["mine", "Mine", CONVERSATIONS.filter(c => c.assignedTo === CURRENT_ADMIN.id).length], ["resolved", "Resolved", CONVERSATIONS.filter(c => c.status === "resolved").length]] as [ConvTab, string, number][]).map(([k, l, n]) => (
            <button key={k} onClick={() => setTab(k)} className={cn("flex-1 py-1.5 text-[11px] font-medium transition-colors", tab === k ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground")}>
              {l} <span className="opacity-60">{n}</span>
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          {convs.map(c => {
            const last = c.messages[c.messages.length - 1];
            return (
              <div
                key={c.id}
                className={cn("flex items-start gap-2.5 px-3 py-2.5 cursor-pointer border-b border-border/50 transition-colors", c.id === activeId ? "bg-accent" : "hover:bg-muted/50", !c.readByAdmin && "bg-primary/5")}
                onClick={() => setActiveId(c.id)}
              >
                <Avatar name={c.clientName} size="sm" variant={c.clientType as "buyer" | "seller"} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className={cn("text-[12.5px] font-medium truncate", !c.readByAdmin && "font-semibold")}>{c.clientName}</span>
                    <span className="text-[10.5px] text-muted-foreground shrink-0">{relTime(c.lastMessageAt)}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate mt-0.5">{c.subject}</div>
                  <div className="text-[11.5px] text-muted-foreground truncate mt-0.5">
                    {last.role === "admin" ? "You: " : ""}{last.content.slice(0, 55)}{last.content.length > 55 ? "…" : ""}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <TypeBadge type={c.clientType as "buyer" | "seller"} />
                    {c.priority === "urgent" && <span className="text-[10px] px-1 py-px rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-medium">Urgent</span>}
                    <span className="text-[10.5px] text-muted-foreground ml-auto">{c.status.replace("_", " ")}</span>
                    {!c.readByAdmin && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CENTER — Thread */}
      <div className="flex flex-col overflow-hidden" style={{ gridArea: "thread" }}>
        {active && (
          <>
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-border shrink-0">
              <Avatar name={active.clientName} size="sm" variant={active.clientType as "buyer" | "seller"} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/clients/${active.clientId}`} className="text-[13px] font-semibold hover:text-primary transition-colors">{active.clientName}</Link>
                  <TypeBadge type={active.clientType as "buyer" | "seller"} />
                  <StatusBadge status={active.status} />
                  {active.priority === "urgent" && <span className="text-[10.5px] px-1.5 py-px rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-medium flex items-center gap-0.5"><Flag size={9} />Urgent</span>}
                </div>
                <div className="text-[11.5px] text-muted-foreground truncate">{active.subject}</div>
              </div>
              <select className="h-7 px-2 rounded border border-border bg-background text-[12px] focus:outline-none w-[140px]" defaultValue={active.assignedTo || ""}>
                <option value="">Unassigned</option>
                {ADMINS.slice(0, 5).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <Button size="sm" variant="outline" className="h-7 text-[12px]">Resolve</Button>
              <Button size="sm" variant="outline" className="h-7 text-[12px]">Escalate</Button>
              <button className="w-7 h-7 grid place-items-center rounded hover:bg-muted text-muted-foreground transition-colors" onClick={() => setCtxOpen(!ctxOpen)}>
                {ctxOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
              </button>
            </div>

            <div ref={threadRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
              {grouped.map((g, i) => {
                if (g.type === "date") {
                  return <div key={i} className="flex items-center gap-3 my-1"><div className="flex-1 h-px bg-border" /><span className="text-[11px] text-muted-foreground">{g.label}</span><div className="flex-1 h-px bg-border" /></div>;
                }
                const m = g.msg;
                if (m.role === "system") {
                  return <div key={i} className="text-center text-[11px] text-muted-foreground">— {m.content} —</div>;
                }
                const isAdmin = m.role === "admin";
                return (
                  <div key={i} className={cn("flex items-end gap-2", isAdmin && "flex-row-reverse")}>
                    <Avatar name={isAdmin ? CURRENT_ADMIN.name : active.clientName} size="sm" variant={isAdmin ? undefined : active.clientType as "buyer" | "seller"} />
                    <div className={cn("max-w-[70%]", isAdmin && "items-end flex flex-col")}>
                      <div className={cn("px-3.5 py-2.5 rounded-xl text-[12.5px] leading-relaxed whitespace-pre-wrap", isAdmin ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm")}>
                        {m.content}
                      </div>
                      {m.attachments?.length > 0 && (
                        <div className="flex flex-col gap-1 mt-1.5">
                          {m.attachments.map((a, j) => (
                            <div key={j} className="flex items-center gap-2 px-2.5 py-1.5 border border-border rounded-lg bg-card text-[12px] w-fit">
                              <Paperclip size={11} className="text-muted-foreground" />
                              <span className="font-medium">{a.name}</span>
                              <span className="font-mono text-[10.5px] text-muted-foreground">{a.size}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="text-[10.5px] text-muted-foreground mt-1 flex items-center gap-1">
                        {fmtTime(m.sentAt)}{isAdmin && <span className="text-primary">· ✓✓</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Composer */}
            <div className="border-t border-border shrink-0">
              <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border">
                <button className="w-7 h-7 grid place-items-center rounded hover:bg-muted text-muted-foreground transition-colors" title="Attach">
                  <Paperclip size={13} />
                </button>
                <div className="relative">
                  <button className="w-7 h-7 grid place-items-center rounded hover:bg-muted text-muted-foreground transition-colors" onClick={() => setTemplatesOpen(!templatesOpen)}>
                    <span className="text-[11px] font-bold">/</span>
                  </button>
                  {templatesOpen && (
                    <div className="absolute bottom-9 left-0 w-72 bg-card border border-border rounded-lg shadow-xl p-1 z-20" onMouseLeave={() => setTemplatesOpen(false)}>
                      <div className="px-2.5 py-1.5 text-[10.5px] text-muted-foreground uppercase tracking-wider">Canned Responses</div>
                      {CANNED_TEMPLATES.map(t => (
                        <button key={t.id} className="w-full flex flex-col items-start gap-0.5 px-2.5 py-2 rounded hover:bg-muted text-left" onClick={() => { setReply(t.body); setTemplatesOpen(false); }}>
                          <span className="text-[12.5px] font-medium">{t.title}</span>
                          <span className="text-[11px] text-muted-foreground">{t.preview}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button className="w-7 h-7 grid place-items-center rounded hover:bg-muted text-muted-foreground transition-colors" title="Mark urgent">
                  <Flag size={13} />
                </button>
                <span className="flex-1" />
                <span className="text-[11px] text-muted-foreground">Cmd+Enter to send</span>
              </div>
              <div className="px-3 pt-2 pb-1">
                <textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  placeholder={`Reply to ${active.clientName}...`}
                  className="w-full bg-transparent text-[13px] outline-none resize-none placeholder:text-muted-foreground"
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-between px-3 pb-2.5">
                <span className="text-[11px] text-muted-foreground">Replying as {CURRENT_ADMIN.name}</span>
                <Button size="sm" disabled={!reply} className="gap-1.5 h-7 text-[12px]">
                  <Send size={11} />Send
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* RIGHT — Client context */}
      {ctxOpen && client && (
        <div className="flex flex-col border-l border-border overflow-hidden" style={{ gridArea: "ctx" }}>
          <div className="flex items-center gap-2 px-3.5 py-3 border-b border-border shrink-0">
            <h3 className="text-[13px] font-semibold flex-1">Context</h3>
            <Link href={`/clients/${client.id}`}>
              <Button variant="outline" size="sm" className="gap-1 h-6 text-[11px]"><ExternalLink size={10} />Full profile</Button>
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto">
            {/* Client */}
            <div className="px-3.5 py-3 border-b border-border">
              <div className="text-[10.5px] uppercase tracking-widest text-muted-foreground mb-2">Client</div>
              <div className="flex items-center gap-2.5">
                <Avatar name={client.name} size="sm" variant={client.type} />
                <div>
                  <div className="text-[12.5px] font-medium">{client.name}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <TypeBadge type={client.type} />
                    <StatusBadge status={client.status} />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="px-3.5 py-3 border-b border-border">
              <div className="text-[10.5px] uppercase tracking-widest text-muted-foreground mb-2">Contact</div>
              <div className="flex flex-col gap-1.5 text-[11.5px]">
                {[["Name", client.contact.name], ["Email", client.contact.email], ["Phone", client.contact.phone], ["Last login", "2h ago"]].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">{k}</span>
                    <span className={cn("font-medium text-right truncate", k === "Phone" && "font-mono")}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Account Health */}
            <div className="px-3.5 py-3 border-b border-border">
              <div className="text-[10.5px] uppercase tracking-widest text-muted-foreground mb-2">Account Health</div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[11.5px]">
                  <span className="text-muted-foreground">KYC</span>
                  <StatusBadge status={client.kycStatus} />
                </div>
                <div className="flex items-center justify-between text-[11.5px]">
                  <span className="text-muted-foreground">Outstanding issues</span>
                  <span className="font-medium">{client.disputeCount}</span>
                </div>
                {client.type === "buyer" && client.creditLimit > 0 && (
                  <>
                    <div className="flex items-center justify-between text-[11.5px]">
                      <span className="text-muted-foreground">Credit utilization</span>
                      <span className="font-mono font-medium">{Math.round(client.currentBalance / client.creditLimit * 100)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-1">
                      <div className={cn("h-full rounded-full", client.currentBalance / client.creditLimit > 0.8 ? "bg-destructive" : "bg-primary")} style={{ width: `${Math.min(client.currentBalance / client.creditLimit * 100, 100)}%` }} />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Conversation history */}
            <div className="px-3.5 py-3 border-b border-border">
              <div className="text-[10.5px] uppercase tracking-widest text-muted-foreground mb-2">Conversation History</div>
              <div className="grid grid-cols-3 gap-1.5 mb-3">
                {[["Total", "12"], ["Open", "2"], ["Avg reply", "3h"]].map(([k, v]) => (
                  <div key={k} className="flex flex-col items-center py-2 rounded bg-muted">
                    <span className="text-[10px] text-muted-foreground">{k}</span>
                    <span className="font-mono font-medium text-[12.5px]">{v}</span>
                  </div>
                ))}
              </div>
              {CONVERSATIONS.filter(c => c.clientId === client.id && c.id !== activeId).slice(0, 3).map(c => (
                <div key={c.id} className="py-2 border-t border-border first:border-0">
                  <div className="text-[12px] font-medium">{c.subject}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-muted-foreground">{fmtDateShort(c.lastMessageAt)}</span>
                    <StatusBadge status={c.status} />
                  </div>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="px-3.5 py-3">
              <div className="text-[10.5px] uppercase tracking-widest text-muted-foreground mb-2">Quick Actions</div>
              <div className="flex flex-col gap-1.5">
                <Link href={`/clients/${client.id}`}>
                  <Button variant="outline" size="sm" className="w-full justify-start gap-1.5 text-[12px] h-7">
                    <ExternalLink size={11} />View full profile
                  </Button>
                </Link>
                <Button variant="outline" size="sm" className="w-full justify-start gap-1.5 text-[12px] h-7">
                  <Plus size={11} />Create support ticket
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start gap-1.5 text-[12px] h-7">
                  <Paperclip size={11} />Add note
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compose Sheet */}
      {composeOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={() => setComposeOpen(false)} />
          <div className="fixed right-0 top-0 h-full w-[420px] bg-card border-l border-border z-50 flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="text-[15px] font-semibold">New Message</h3>
              <button onClick={() => setComposeOpen(false)} className="w-8 h-8 grid place-items-center rounded hover:bg-muted text-muted-foreground">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
              {[["To", "Search client by name or email…", "input"], ["Subject", "", "input"], ["Priority", "", "select"], ["Message", "", "textarea"]].map(([label, placeholder, tag]) => (
                <div key={label}>
                  <label className="block text-[12px] font-medium mb-1.5">{label}</label>
                  {tag === "select" ? (
                    <select className="w-full h-8 px-2.5 rounded border border-border bg-background text-[13px] focus:outline-none">
                      <option>Normal</option><option>Urgent</option>
                    </select>
                  ) : tag === "textarea" ? (
                    <textarea className="w-full min-h-36 px-3 py-2 rounded border border-border bg-background text-[13px] focus:outline-none resize-y placeholder:text-muted-foreground" rows={8} />
                  ) : (
                    <input className="w-full h-8 px-2.5 rounded border border-border bg-background text-[13px] focus:outline-none placeholder:text-muted-foreground" placeholder={placeholder} />
                  )}
                </div>
              ))}
            </div>
            <div className="border-t border-border px-5 py-3.5 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setComposeOpen(false)}>Cancel</Button>
              <Button variant="outline" size="sm">Save Draft</Button>
              <Button size="sm" className="gap-1.5"><Send size={12} />Send</Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
