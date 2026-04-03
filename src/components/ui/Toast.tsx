"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import type { Theme } from "@/lib/theme";

interface ToastData {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastContextType {
  toast: (message: string, type?: "success" | "error" | "info") => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let toastId = 0;

export function ToastProvider({ children, C }: { children: React.ReactNode; C: Theme }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const toast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const remove = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const icons = {
    success: CheckCircle2,
    error: AlertTriangle,
    info: Info,
  };
  const colors = {
    success: { bg: C.accentDim, color: C.accentText },
    error: { bg: C.dangerDim, color: C.danger },
    info: { bg: C.blueDim, color: C.blue },
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
        {toasts.map((t) => {
          const Icon = icons[t.type];
          const c = colors[t.type];
          return (
            <div key={t.id} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "12px 18px", borderRadius: 12,
              background: c.bg, color: c.color,
              boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
              animation: "slideUp 0.3s ease",
              fontSize: 13, fontWeight: 600, minWidth: 240,
            }}>
              <Icon size={16} />
              <span style={{ flex: 1 }}>{t.message}</span>
              <button onClick={() => remove(t.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                <X size={12} color={c.color} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
