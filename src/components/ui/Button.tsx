"use client";

import { useState } from "react";
import type { Theme } from "@/lib/theme";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  loading?: boolean;
  disabled?: boolean;
  size?: "sm" | "md";
  icon?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  title?: string;
  C: Theme;
}

export function Button({ children, onClick, variant = "secondary", loading, disabled, size = "md", icon, style, className, title, C }: ButtonProps) {
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);

  const baseStyles: Record<string, React.CSSProperties> = {
    primary: { background: `linear-gradient(135deg, ${C.accent}, #15803d)`, color: "#fff", border: "none", boxShadow: "0 2px 8px rgba(22,163,74,0.25)" },
    secondary: { background: C.surface, color: C.textMuted, border: `1px solid ${C.border}` },
    danger: { background: C.dangerDim, color: C.danger, border: "none" },
    ghost: { background: "transparent", color: C.textDim, border: "none" },
  };

  const isDisabled = disabled || loading;

  return (
    <button
      onClick={isDisabled ? undefined : onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setActive(false); }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      disabled={isDisabled}
      className={className}
      title={title}
      style={{
        padding: size === "sm" ? "6px 12px" : "8px 16px",
        borderRadius: size === "sm" ? 8 : 10,
        fontSize: size === "sm" ? 12 : 13,
        fontWeight: 600,
        cursor: isDisabled ? "not-allowed" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        transition: "all 0.15s ease",
        opacity: isDisabled ? 0.5 : 1,
        transform: active ? "translateY(0px) scale(0.97)" : hover ? "translateY(-1px)" : "translateY(0)",
        boxShadow: hover && !active && !isDisabled ? "0 4px 12px rgba(0,0,0,0.08)" : undefined,
        ...baseStyles[variant],
        ...style,
      }}
    >
      {loading ? <div style={{ width: 14, height: 14, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} /> : icon}
      {children}
    </button>
  );
}
