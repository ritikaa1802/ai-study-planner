import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Props: pass completed, missed, and streak for advanced logic
interface ProductivityGardenProps {
  completed: number;
  missed: number;
  streak: number;
}

// SVGs for different plant states
const PlantSVGs = {
  blooming: (
    <motion.svg width="120" height="120" viewBox="0 0 120 120" initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
      <ellipse cx="60" cy="110" rx="30" ry="10" fill="#8BC34A" />
      <motion.rect x="55" y="60" width="10" height="40" rx="5" fill="#795548" initial={{ y: 80 }} animate={{ y: 60 }} transition={{ delay: 0.2 }} />
      <motion.circle cx="60" cy="60" r="22" fill="#FFEB3B" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4, type: "spring" }} />
      <motion.circle cx="60" cy="60" r="12" fill="#FFC107" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6, type: "spring" }} />
      <motion.ellipse cx="60" cy="40" rx="8" ry="16" fill="#E91E63" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} />
    </motion.svg>
  ),
  healthy: (
    <motion.svg width="120" height="120" viewBox="0 0 120 120" initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
      <ellipse cx="60" cy="110" rx="30" ry="10" fill="#8BC34A" />
      <motion.rect x="55" y="70" width="10" height="30" rx="5" fill="#795548" initial={{ y: 90 }} animate={{ y: 70 }} transition={{ delay: 0.2 }} />
      <motion.ellipse cx="60" cy="60" rx="18" ry="28" fill="#4CAF50" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4, type: "spring" }} />
    </motion.svg>
  ),
  wilting: (
    <motion.svg width="120" height="120" viewBox="0 0 120 120" initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
      <ellipse cx="60" cy="110" rx="30" ry="10" fill="#BDBDBD" />
      <motion.rect x="55" y="80" width="10" height="20" rx="5" fill="#A1887F" initial={{ y: 100 }} animate={{ y: 80 }} transition={{ delay: 0.2 }} />
      <motion.ellipse cx="60" cy="90" rx="14" ry="8" fill="#8D6E63" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4, type: "spring" }} />
      <motion.ellipse cx="60" cy="70" rx="10" ry="4" fill="#A5D6A7" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} />
    </motion.svg>
  ),
};

export const ProductivityGarden: React.FC<ProductivityGardenProps> = ({ completed, missed, streak }) => {
  // Advanced logic for plant state
  const state = useMemo(() => {
    if (completed + missed === 0) return "healthy";
    const ratio = completed / (completed + missed);
    if (ratio >= 0.8 && streak >= 5) return "blooming";
    if (ratio >= 0.5) return "healthy";
    return "wilting";
  }, [completed, missed, streak]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "32px 0" }}>
      <AnimatePresence mode="wait">
        {PlantSVGs[state as keyof typeof PlantSVGs]}
      </AnimatePresence>
      <div style={{ marginTop: 12, fontWeight: 600, color: state === "blooming" ? "#E91E63" : state === "wilting" ? "#A1887F" : "#388E3C" }}>
        {state === "blooming" && "Your garden is thriving! 🌸"}
        {state === "healthy" && "Your plant is healthy! 🌱"}
        {state === "wilting" && "Your plant needs care! 💧"}
      </div>
    </div>
  );
};
