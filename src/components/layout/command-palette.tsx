"use client";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { loadHospitals, loadVendors, type AdminEntity } from "@/lib/admin-data";
import { Avatar } from "@/components/ui/avatar";
import { TypeBadge } from "@/components/ui/status-badge";
import Link from "next/link";

const PAGES = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/clients", label: "All Clients" },
  { href: "/approvals", label: "Pending Approvals" },
  { href: "/messages", label: "Messages" },
  { href: "/audit-log", label: "Audit Log" },
  { href: "/settings", label: "Settings" },
];

interface CommandPaletteProps { open: boolean; onClose: () => void; }

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [q, setQ] = useState("");
  const [entities, setEntities] = useState<AdminEntity[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 20); }, [open]);
  useEffect(() => {
    let alive = true;

    Promise.all([loadHospitals(), loadVendors()])
      .then(([hospitals, vendors]) => {
        if (!alive) return;

        setEntities([...hospitals.hospitals, ...vendors.vendors].slice(0, 24));
      })
      .catch(() => {
        if (!alive) return;
        setEntities([]);
      });

    return () => {
      alive = false;
    };
  }, [open]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  if (!open) return null;

  const pages = PAGES.filter(p => !q || p.label.toLowerCase().includes(q.toLowerCase()));
  const clients = entities.filter(c => !q || c.name.toLowerCase().includes(q.toLowerCase()) || c.id.toLowerCase().includes(q.toLowerCase())).slice(0, 6);

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 animate-in fade-in" onClick={onClose} />
      <div className="fixed top-[22%] left-1/2 -translate-x-1/2 w-135 max-w-[calc(100vw-32px)] bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-98">
        <div className="flex items-center gap-2.5 px-3.5 py-3 border-b border-border">
          <Search size={16} className="text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search clients, pages, messages..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="font-mono text-[10px] px-1 py-px rounded bg-muted border border-border text-muted-foreground">ESC</kbd>
        </div>
        <div className="max-h-96 overflow-y-auto p-1.5">
          {pages.length > 0 && (
            <>
              <p className="px-2.5 py-1.5 text-[10.5px] text-muted-foreground uppercase tracking-wider">Navigation</p>
              {pages.map(p => (
                <Link key={p.href} href={p.href} className="flex items-center gap-2 px-2.5 py-1.5 rounded text-[12.5px] hover:bg-muted" onClick={onClose}>
                  {p.label}
                </Link>
              ))}
            </>
          )}
          {clients.length > 0 && (
            <>
              <p className="px-2.5 py-1.5 text-[10.5px] text-muted-foreground uppercase tracking-wider mt-1">Clients</p>
              {clients.map(c => (
                <Link key={c.id} href={`/clients/${c.id}`} className="flex items-center gap-2 px-2.5 py-1.5 rounded text-[12.5px] hover:bg-muted" onClick={onClose}>
                  <Avatar name={c.name} size="sm" variant={c.type} />
                  <span className="flex-1">{c.name}</span>
                  <span className="font-mono text-[10.5px] text-muted-foreground">{c.id}</span>
                  <TypeBadge type={c.type} />
                </Link>
              ))}
            </>
          )}
          {pages.length === 0 && clients.length === 0 && (
            <div className="py-12 text-center text-muted-foreground text-sm">No results for &ldquo;{q}&rdquo;</div>
          )}
        </div>
      </div>
    </>
  );
}
