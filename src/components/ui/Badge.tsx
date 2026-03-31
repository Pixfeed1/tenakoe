"use client";

import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  color: string;
  bg: string;
  style?: React.CSSProperties;
}

export function Badge({ children, color, bg, style }: BadgeProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 10px",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 600,
        color,
        backgroundColor: bg,
        letterSpacing: "0.02em",
        ...style,
      }}
    >
      {children}
    </span>
  );
}
