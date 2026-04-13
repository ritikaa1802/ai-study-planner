import { CSSProperties, ReactNode } from "react";
import { Theme } from "../../types";

interface CardProps {
  children: ReactNode;
  style?: CSSProperties;
  C: Theme;
}

export function Card({ children, style = {}, C }: CardProps) {
  return (
    <div
      style={{
        background: C.card,
        borderRadius: 18,
        padding: 24,
        boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
