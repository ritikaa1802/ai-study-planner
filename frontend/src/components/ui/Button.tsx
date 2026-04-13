import { CSSProperties, ReactNode } from "react";
import { Theme } from "../../types";

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost";
  style?: CSSProperties;
  C: Theme;
}

export function Button({ children, onClick, disabled, variant = "primary", style = {}, C }: ButtonProps) {
  const base: CSSProperties = {
    border: "none",
    borderRadius: 12,
    padding: "10px 20px",
    fontWeight: 600,
    fontSize: 14,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    gap: 8,
  };

  const variants: Record<string, CSSProperties> = {
    primary: {
      background: disabled ? C.border : C.accent,
      color: disabled ? C.muted : "#fff",
    },
    secondary: {
      background: C.accentBg,
      color: C.accent,
    },
    ghost: {
      background: "transparent",
      color: C.text,
      border: `1px solid ${C.border}`,
    },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...variants[variant], ...style }}
    >
      {children}
    </button>
  );
}
