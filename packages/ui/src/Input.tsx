import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  id,
  className = "",
  style = {},
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", width: "100%" }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: "0.8125rem",
            fontWeight: 500,
            color: "#94a3b8",
          }}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        style={{
          background: "rgba(15, 23, 42, 0.8)",
          border: error ? "1px solid #f43f5e" : "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "0.5rem",
          padding: "0.5rem 0.75rem",
          fontSize: "0.875rem",
          color: "#f8fafc",
          outline: "none",
          transition: "border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out",
          width: "100%",
          boxSizing: "border-box",
          ...style,
        }}
        className={`ui-input ${error ? "has-error" : ""} ${className}`}
        {...props}
      />
      {error ? (
        <span style={{ fontSize: "0.75rem", color: "#fb7185" }}>{error}</span>
      ) : helperText ? (
        <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{helperText}</span>
      ) : null}
    </div>
  );
};
