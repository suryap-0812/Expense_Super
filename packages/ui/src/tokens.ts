/**
 * Design Tokens & Visual Theme System
 * Curated dark luxury glassmorphism palette, spacing, typography, and elevation.
 */

export const colors = {
  bg: {
    primary: "#090d16",
    secondary: "#0f172a",
    tertiary: "#1e293b",
    elevated: "rgba(30, 41, 59, 0.7)",
    glass: "rgba(15, 23, 42, 0.65)",
    glassHover: "rgba(30, 41, 59, 0.85)",
  },
  text: {
    primary: "#f8fafc",
    secondary: "#94a3b8",
    muted: "#64748b",
    inverse: "#0f172a",
  },
  brand: {
    primary: "#6366f1", // Indigo
    primaryHover: "#4f46e5",
    accent: "#8b5cf6", // Violet
    glow: "rgba(99, 102, 241, 0.25)",
  },
  status: {
    success: "#10b981", // Emerald (Income / Savings)
    successBg: "rgba(16, 185, 129, 0.12)",
    danger: "#f43f5e", // Rose / Red (Expenses / High Anomaly)
    dangerBg: "rgba(244, 63, 94, 0.12)",
    warning: "#f59e0b", // Amber (Warnings / Volatility)
    warningBg: "rgba(245, 158, 11, 0.12)",
    info: "#0ea5e9", // Sky Blue (Info / Metrics)
    infoBg: "rgba(14, 165, 233, 0.12)",
  },
  border: {
    subtle: "rgba(255, 255, 255, 0.08)",
    medium: "rgba(255, 255, 255, 0.15)",
    focus: "#6366f1",
  },
} as const;

export const typography = {
  fontFamily: "'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  fontMono: "'JetBrains Mono', 'Fira Code', monospace",
} as const;
