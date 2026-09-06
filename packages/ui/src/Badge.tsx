import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "danger" | "warning" | "info" | "neutral" | "brand";
  size?: "sm" | "md";
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = "neutral",
  size = "md",
  children,
  className = "",
  style = {},
  ...props
}) => {
  const baseStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.25rem",
    fontWeight: 500,
    borderRadius: "9999px",
    letterSpacing: "0.025em",
    textTransform: "uppercase",
    fontSize: size === "sm" ? "0.6875rem" : "0.75rem",
    padding: size === "sm" ? "0.15rem 0.5rem" : "0.25rem 0.65rem",
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    success: {
      background: "rgba(16, 185, 129, 0.15)",
      color: "#34d399",
      border: "1px solid rgba(16, 185, 129, 0.25)",
    },
    danger: {
      background: "rgba(244, 63, 94, 0.15)",
      color: "#fb7185",
      border: "1px solid rgba(244, 63, 94, 0.25)",
    },
    warning: {
      background: "rgba(245, 158, 11, 0.15)",
      color: "#fbbf24",
      border: "1px solid rgba(245, 158, 11, 0.25)",
    },
    info: {
      background: "rgba(14, 165, 233, 0.15)",
      color: "#38bdf8",
      border: "1px solid rgba(14, 165, 233, 0.25)",
    },
    brand: {
      background: "rgba(99, 102, 241, 0.15)",
      color: "#818cf8",
      border: "1px solid rgba(99, 102, 241, 0.3)",
    },
    neutral: {
      background: "rgba(255, 255, 255, 0.08)",
      color: "#94a3b8",
      border: "1px solid rgba(255, 255, 255, 0.1)",
    },
  };

  return (
    <span
      style={{
        ...baseStyle,
        ...variantStyles[variant],
        ...style,
      }}
      className={`ui-badge ${variant} ${size} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
