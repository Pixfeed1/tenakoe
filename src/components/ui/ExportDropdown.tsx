"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import type { Theme } from "@/lib/theme";

interface ExportDropdownProps {
  C: Theme;
  headers: string[];
  rows: string[][];
  filename: string;
  title?: string;
  disabled?: boolean;
}

export function ExportDropdown({ C, headers, rows, filename, title, disabled }: ExportDropdownProps) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const exportCSV = () => {
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map((r) => r.map(esc).join(";")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  const exportExcel = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/export-excel", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ headers, rows, title: title || filename }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.xlsx`; a.click();
        URL.revokeObjectURL(url);
      }
    } catch { /* ignore */ }
    setExporting(false);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "8px 12px", borderRadius: 10, fontSize: 13, fontWeight: 600,
          border: `1px solid ${C.border}`, background: C.surface, color: disabled ? C.textDim : C.textMuted,
          cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => { if (!disabled) { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)"; } }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
      >
        Exporter
        <ChevronDown size={11} style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "100%", right: 0, marginTop: 4, zIndex: 50,
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)", overflow: "hidden", minWidth: 160,
        }}>
          <button onClick={exportCSV} style={{
            width: "100%", padding: "10px 14px", border: "none", background: "transparent",
            color: C.text, fontSize: 12, cursor: "pointer", textAlign: "left",
            display: "flex", alignItems: "center", gap: 8, transition: "background 0.1s",
          }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surfaceHover; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
              CSV
          </button>
          <button onClick={exportExcel} disabled={exporting} style={{
            width: "100%", padding: "10px 14px", border: "none", borderTop: `1px solid ${C.border}`,
            background: "transparent", color: C.text, fontSize: 12, cursor: "pointer", textAlign: "left",
            display: "flex", alignItems: "center", gap: 8, transition: "background 0.1s",
          }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surfaceHover; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
              {exporting ? "Génération..." : "Excel"}
          </button>
        </div>
      )}
    </div>
  );
}
