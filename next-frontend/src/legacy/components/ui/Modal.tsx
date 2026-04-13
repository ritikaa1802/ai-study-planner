import { ReactNode } from "react";
import { Theme } from "../../types";

interface ModalProps {
  onClose: () => void;
  children: ReactNode;
  C: Theme;
  width?: number;
}

export function Modal({ onClose, children, C, width = 420 }: ModalProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: C.card,
          borderRadius: 20,
          padding: 28,
          width,
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
