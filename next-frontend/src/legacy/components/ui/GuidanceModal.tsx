import { ReactNode } from "react";
import { Theme } from "../../types";

interface GuidanceModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  C: Theme;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}

export function GuidanceModal({ open, onClose, title, C, children, footer, width = 460 }: GuidanceModalProps) {
  if (!open) return null;

  return (
    <>
      <style>{`@keyframes guidanceFadeScaleIn { from { opacity: 0; transform: translateY(8px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }`}</style>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 300,
          background: "rgba(15, 23, 42, 0.28)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "min(100%, " + width + "px)",
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 18,
            boxShadow: "0 20px 60px rgba(15, 23, 42, 0.22)",
            padding: 22,
            animation: "guidanceFadeScaleIn 0.18s ease-out",
            maxHeight: "85vh",
            overflowY: "auto",
          }}
        >
          <h3 style={{ margin: 0, marginBottom: 12, fontSize: 20, fontWeight: 700, color: C.text }}>{title}</h3>
          <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.65 }}>{children}</div>
          {footer && <div style={{ marginTop: 18 }}>{footer}</div>}
        </div>
      </div>
    </>
  );
}
