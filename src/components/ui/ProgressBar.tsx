"use client";

import type { Theme } from "@/lib/theme";

interface ProgressBarProps {
  value: number;
  C: Theme;
}

export function ProgressBar({ value, C }: ProgressBarProps) {
  return (
    <div
      style={{
        width: 80,
        height: 5,
        borderRadius: 3,
        backgroundColor: C.surfaceHover,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          borderRadius: 3,
          width: `${value}%`,
          backgroundColor:
            value === 100 ? C.accent : value > 60 ? C.blue : C.warning,
          transition: "width 0.5s ease",
        }}
      />
    </div>
  );
}
