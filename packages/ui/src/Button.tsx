import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "glass";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  icon,
  children,
  className = "",
  disabled,
  ...props
}) => {
  const baseStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    fontFamily: "inherit",
    fontWeight: 500,
    borderRadius: "0.5rem",
    border: "1px solid transparent",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    transition: "all 0.15s ease-in-out",
    textDecoration: "none",
    whiteSpace: "nowrap",
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: "0.35rem 0.75rem", fontSize: "0.8125rem" },
    md: { padding: "0.5rem 1rem", fontSize: "0.875rem" },
    lg: { padding: "0.75rem 1.5rem", fontSize: "1rem" },
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
      color: "#ffffff",
      boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)",
    },
    secondary: {
      background: "rgba(30, 41, 59, 0.8)",
      color: "#f8fafc",
      border: "1px solid rgba(255, 255, 255, 0.1)",
    },
    glass: {
      background: "rgba(255, 255, 255, 0.05)",
      backdropFilter: "blur(8px)",
      color: "#f8fafc",
      border: "1px solid rgba(255, 255, 255, 0.12)",
    },
    danger: {
      background: "rgba(244, 63, 94, 0.15)",
      color: "#f43f5e",
      border: "1px solid rgba(244, 63, 94, 0.3)",
    },
    ghost: {
      background: "transparent",
      color: "#94a3b8",
    },
  };

  return (
    <button
      style={{
        ...baseStyle,
        ...sizeStyles[size],
        ...variantStyles[variant],
      }}
      className={`ui-button ${variant} ${size} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="btn-icon">{icon}</span>}
      {children && <span>{children}</span>}
    </button>
  );
};
