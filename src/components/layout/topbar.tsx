"use client";
import { useState } from "react";
import { Search, Moon, Sun, Bell, ChevronDown, User, Settings, LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { CURRENT_ADMIN } from "@/lib/data";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface TopbarProps { onOpenSearch: () => void; }

export function Topbar({ onOpenSearch }: TopbarProps) {
  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleTheme = () => {
    setDark(v => {
      document.documentElement.classList.toggle("dark", !v);
      return !v;
    });
  };

  return (
    <header
      className="flex items-center gap-3 px-4 border-b border-border bg-card"
      style={{ gridArea: "topbar" }}
    >
      {/* Search trigger */}
      <button
        onClick={onOpenSearch}
        className="flex-1 max-w-[520px] flex items-center gap-2.5 h-[30px] px-2.5 bg-muted border border-border rounded-md text-muted-foreground text-[12.5px] hover:bg-accent transition-colors"
      >
        <Search size={13} />
        <span className="flex-1 text-left">Search clients, orders, messages…</span>
        <span className="flex gap-0.5 ml-auto">
          <kbd className="font-mono text-[10px] px-1 py-px rounded bg-card border border-border text-muted-foreground shadow-[0_1px_0] shadow-border min-w-4 text-center">⌘</kbd>
          <kbd className="font-mono text-[10px] px-1 py-px rounded bg-card border border-border text-muted-foreground shadow-[0_1px_0] shadow-border min-w-4 text-center">K</kbd>
        </span>
      </button>

      <div className="flex-1" />

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="w-[30px] h-[30px] grid place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        title={dark ? "Light mode" : "Dark mode"}
      >
        {dark ? <Sun size={15} /> : <Moon size={15} />}
      </button>

      {/* Notifications */}
      <button className="w-[30px] h-[30px] grid place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors relative">
        <Bell size={15} />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-destructive border-2 border-card" />
      </button>

      {/* User menu */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen(v => !v)}
          className={cn("flex items-center gap-2 pl-0.5 pr-2 py-0.5 rounded hover:bg-muted transition-colors", menuOpen && "bg-muted")}
        >
          <Avatar name={CURRENT_ADMIN.name} size="sm" />
          <span className="text-[12.5px] font-medium">{CURRENT_ADMIN.name.split(" ")[0]}</span>
          <ChevronDown size={12} className="text-muted-foreground" />
        </button>

        {menuOpen && (
          <div
            className="absolute right-0 top-10 w-48 bg-card border border-border rounded-lg shadow-lg p-1 z-60"
            onMouseLeave={() => setMenuOpen(false)}
          >
            <p className="px-2.5 py-2 text-[10.5px] text-muted-foreground uppercase tracking-wider">{CURRENT_ADMIN.email}</p>
            <button className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-[12.5px] hover:bg-muted text-left">
              <User size={14} className="text-muted-foreground" />Profile
            </button>
            <Link href="/settings" className="flex items-center gap-2 px-2.5 py-1.5 rounded text-[12.5px] hover:bg-muted" onClick={() => setMenuOpen(false)}>
              <Settings size={14} className="text-muted-foreground" />Settings
            </Link>
            <div className="h-px bg-border my-1" />
            <button className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-[12.5px] hover:bg-muted text-left">
              <LogOut size={14} className="text-muted-foreground" />Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
