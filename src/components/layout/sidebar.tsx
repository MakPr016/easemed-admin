"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Users, ShoppingBag, Store, CheckSquare,
  MessageSquare, ScrollText, Settings, LogOut, ChevronDown, ChevronRight,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { CLIENTS, CONVERSATIONS, CURRENT_ADMIN } from "@/lib/data";
import { cn } from "@/lib/utils";

interface NavItemProps {
  href: string;
  icon?: React.ReactNode;
  label: string;
  badge?: number;
  active?: boolean;
  sub?: boolean;
}

function NavItem({ href, icon, label, badge, active, sub }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 px-2.5 py-1.5 rounded text-[13px] font-medium relative transition-colors",
        sub && "pl-8 text-[12.5px] font-normal",
        active
          ? "bg-accent text-accent-foreground before:absolute before:left-[-8px] before:top-1.5 before:bottom-1.5 before:w-0.5 before:bg-primary before:rounded-r"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {icon && <span className="w-[15px] h-[15px] shrink-0">{icon}</span>}
      <span className="flex-1">{label}</span>
      {badge != null && badge > 0 && (
        <span className="ml-auto text-[10.5px] font-mono px-1.5 py-px rounded-full bg-primary text-primary-foreground font-semibold">
          {badge}
        </span>
      )}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [clientsOpen, setClientsOpen] = useState(true);

  const unread = CONVERSATIONS.filter(c => !c.readByAdmin).length;
  const pending = CLIENTS.filter(c => c.status === "pending").length;

  const isClients = pathname.startsWith("/clients");

  return (
    <aside
      className="flex flex-col border-r border-border bg-card"
      style={{ gridArea: "sidebar" }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 border-b border-border font-semibold tracking-tight" style={{ height: "var(--topbar-h)" }}>
        <div className="w-[22px] h-[22px] rounded-[5px] bg-primary grid place-items-center text-primary-foreground text-[11px] font-bold shadow-sm shrink-0">
          E
        </div>
        <span className="text-sm">Easemed <small className="text-muted-foreground font-normal text-[11px] ml-1">Admin</small></span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2.5 px-2 flex flex-col gap-px">
        <p className="px-2.5 pt-3 pb-1.5 text-[10.5px] uppercase tracking-widest text-muted-foreground font-medium">Overview</p>
        <NavItem href="/dashboard" icon={<LayoutDashboard size={15} />} label="Dashboard" active={pathname === "/dashboard" || pathname === "/"} />

        <p className="px-2.5 pt-3 pb-1.5 text-[10.5px] uppercase tracking-widest text-muted-foreground font-medium">Clients</p>
        <button
          className={cn(
            "flex items-center gap-2.5 px-2.5 py-1.5 rounded text-[13px] font-medium w-full transition-colors",
            isClients ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
          onClick={() => setClientsOpen(v => !v)}
        >
          <Users size={15} className="shrink-0" />
          <span className="flex-1 text-left">All Clients</span>
          {clientsOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>
        {clientsOpen && (
          <>
            <NavItem href="/clients/buyers" icon={<ShoppingBag size={14} />} label="Buyers" sub active={pathname === "/clients/buyers"} />
            <NavItem href="/clients/sellers" icon={<Store size={14} />} label="Sellers" sub active={pathname === "/clients/sellers"} />
          </>
        )}
        <NavItem href="/approvals" icon={<CheckSquare size={15} />} label="Approvals" badge={pending} active={pathname === "/approvals"} />

        <p className="px-2.5 pt-3 pb-1.5 text-[10.5px] uppercase tracking-widest text-muted-foreground font-medium">Operations</p>
        <NavItem href="/messages" icon={<MessageSquare size={15} />} label="Messages" badge={unread} active={pathname === "/messages"} />
        <NavItem href="/audit-log" icon={<ScrollText size={15} />} label="Audit Log" active={pathname === "/audit-log"} />
        <NavItem href="/settings" icon={<Settings size={15} />} label="Settings" active={pathname === "/settings"} />
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-2.5 flex items-center gap-2.5">
        <Avatar name={CURRENT_ADMIN.name} size="md" />
        <div className="flex-1 min-w-0">
          <p className="text-[12.5px] font-medium truncate">{CURRENT_ADMIN.name}</p>
          <p className="text-[11px] text-muted-foreground">{CURRENT_ADMIN.role}</p>
        </div>
        <button className="w-[30px] h-[30px] grid place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title="Log out">
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  );
}
