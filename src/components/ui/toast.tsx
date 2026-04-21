"use client";
import { createContext, useCallback, useContext, useState } from "react";
import { Check } from "lucide-react";

const ToastCtx = createContext<((msg: string) => void) | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<{ id: string; msg: string }[]>([]);
  const push = useCallback((msg: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-70">
        {toasts.map(t => (
          <div key={t.id} className="bg-card border border-border rounded-lg px-3.5 py-2.5 shadow-lg text-[12.5px] min-w-60 flex items-center gap-2.5 animate-in slide-in-from-bottom-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() { return useContext(ToastCtx)!; }
