import React, { useMemo, useEffect } from "react";

interface ProductivityGardenProps {
  completed: number;
  missed: number;
  streak: number;
}

// Inject CSS animations once
function useGardenStyles() {
  useEffect(() => {
    const id = "productivity-garden-styles";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      @keyframes garden-scale-in {
        from { transform: scale(0.8); }
        to   { transform: scale(1); }
      }
      @keyframes garden-stem-up {
        from { transform: translateY(20px); opacity: 0; }
        to   { transform: translateY(0);    opacity: 1; }
      }
      @keyframes garden-pop {
        0%   { transform: scale(0);   opacity: 0; }
        70%  { transform: scale(1.1); opacity: 1; }
        100% { transform: scale(1);   opacity: 1; }
      }
      @keyframes garden-fade-in {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      .garden-svg       { animation: garden-scale-in 0.4s cubic-bezier(.34,1.56,.64,1) both; }
      .garden-stem      { animation: garden-stem-up  0.35s 0.15s ease both; }
      .garden-center    { animation: garden-pop      0.4s  0.35s cubic-bezier(.34,1.56,.64,1) both; }
      .garden-inner     { animation: garden-pop      0.4s  0.55s cubic-bezier(.34,1.56,.64,1) both; }
      .garden-petal     { animation: garden-fade-in  0.4s  0.75s ease both; }
    `;
    document.head.appendChild(style);
  }, []);
}

const BloomingSVG = () => (
  <svg className="garden-svg" width="120" height="120" viewBox="0 0 120 120" fill="none">
    <ellipse cx="60" cy="110" rx="30" ry="10" fill="#8BC34A" />
    <rect className="garden-stem" x="55" y="60" width="10" height="40" rx="5" fill="#795548" />
    <circle className="garden-center" cx="60" cy="60" r="22" fill="#FFEB3B" />
    <circle className="garden-inner" cx="60" cy="60" r="12" fill="#FFC107" />
    <ellipse className="garden-petal" cx="60" cy="40" rx="8" ry="16" fill="#E91E63" />
  </svg>
);

const HealthySVG = () => (
  <svg className="garden-svg" width="120" height="120" viewBox="0 0 120 120" fill="none">
    <ellipse cx="60" cy="110" rx="30" ry="10" fill="#8BC34A" />
    <rect className="garden-stem" x="55" y="70" width="10" height="30" rx="5" fill="#795548" />
    <ellipse className="garden-center" cx="60" cy="60" rx="18" ry="28" fill="#4CAF50" />
  </svg>
);

const WiltingSVG = () => (
  <svg className="garden-svg" width="120" height="120" viewBox="0 0 120 120" fill="none">
    <ellipse cx="60" cy="110" rx="30" ry="10" fill="#BDBDBD" />
    <rect className="garden-stem" x="55" y="80" width="10" height="20" rx="5" fill="#A1887F" />
    <ellipse className="garden-center" cx="60" cy="90" rx="14" ry="8" fill="#8D6E63" />
    <ellipse className="garden-petal" cx="60" cy="70" rx="10" ry="4" fill="#A5D6A7" />
  </svg>
);

export const ProductivityGarden: React.FC<ProductivityGardenProps> = ({
  completed,
  missed,
  streak,
}) => {
  useGardenStyles();

  const state = useMemo(() => {
    if (completed + missed === 0) return "healthy";
    const ratio = completed / (completed + missed);
    if (ratio >= 0.8 && streak >= 5) return "blooming";
    if (ratio >= 0.5) return "healthy";
    return "wilting";
  }, [completed, missed, streak]);

  const labelColor =
    state === "blooming" ? "#E91E63" : state === "wilting" ? "#A1887F" : "#388E3C";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "32px 0" }}>
      {state === "blooming" && <BloomingSVG key="blooming" />}
      {state === "healthy" && <HealthySVG key="healthy" />}
      {state === "wilting" && <WiltingSVG key="wilting" />}
      <div style={{ marginTop: 12, fontWeight: 600, color: labelColor }}>
        {state === "blooming" && "Your garden is thriving! 🌸"}
        {state === "healthy" && "Your plant is healthy! 🌱"}
        {state === "wilting" && "Your plant needs care! 💧"}
      </div>
    </div>
  );
};
