import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "glass" | "bordered";
  padding?: "none" | "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = "glass",
  padding = "md",
  children,
  className = "",
  style = {},
  ...props
}) => {
  const baseStyle: React.CSSProperties = {
    borderRadius: "0.75rem",
    position: "relative",
    overflow: "hidden",
    transition: "all 0.2s ease-in-out",
  };

  const paddingStyles: Record<string, React.CSSProperties> = {
    none: { padding: 0 },
    sm: { padding: "0.75rem" },
    md: { padding: "1.25rem" },
    lg: { padding: "1.75rem" },
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    glass: {
      background: "rgba(15, 23, 42, 0.65)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)",
    },
    elevated: {
      background: "rgba(30, 41, 59, 0.9)",
      border: "1px solid rgba(255, 255, 255, 0.12)",
      boxShadow: "0 12px 32px rgba(0, 0, 0, 0.4)",
    },
    bordered: {
      background: "transparent",
      border: "1px solid rgba(255, 255, 255, 0.12)",
    },
    default: {
      background: "#0f172a",
      border: "1px solid rgba(255, 255, 255, 0.06)",
    },
  };

  return (
    <div
      style={{
        ...baseStyle,
        ...variantStyles[variant],
        ...paddingStyles[padding],
        ...style,
      }}
      className={`ui-card ${variant} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
