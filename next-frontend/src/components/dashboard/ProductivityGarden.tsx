import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Theme } from "../../legacy/types";
import { Card } from "../../legacy/components/ui/Card";
import { useAnalytics } from "../../legacy/hooks/useAnalytics";

interface ProductivityGardenProps {
  C: Theme;
  streak: number;
}

// 1. Level 1: Seed (Just starting)
const SeedSVG = () => (
  <motion.svg width="120" height="120" viewBox="0 0 120 120" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring" }}>
    {/* Soil */}
    <ellipse cx="60" cy="100" rx="40" ry="15" fill="#5D4037" />
    <ellipse cx="60" cy="100" rx="35" ry="12" fill="#4E342E" />
    {/* Seed */}
    <motion.ellipse cx="60" cy="95" rx="8" ry="6" fill="#8D6E63" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }} />
    <motion.ellipse cx="62" cy="94" rx="3" ry="2" fill="#A1887F" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} />
  </motion.svg>
);

// 2. Level 2: Sprout (A few tasks done)
const SproutSVG = () => (
  <motion.svg width="120" height="120" viewBox="0 0 120 120" initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
    <ellipse cx="60" cy="100" rx="40" ry="15" fill="#5D4037" />
    <motion.path d="M60 100 Q 55 85, 60 70" fill="none" stroke="#8BC34A" strokeWidth="4" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }} />
    {/* Leaves */}
    <motion.ellipse cx="50" cy="80" rx="10" ry="5" fill="#4CAF50" transform="rotate(-30 50 80)" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 }} />
    <motion.ellipse cx="70" cy="75" rx="8" ry="4" fill="#4CAF50" transform="rotate(30 70 75)" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 }} />
  </motion.svg>
);

// 3. Level 3: Sapling (Consistent)
const SaplingSVG = () => (
  <motion.svg width="120" height="120" viewBox="0 0 120 120" initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
    <ellipse cx="60" cy="100" rx="40" ry="15" fill="#5D4037" />
    <motion.rect x="56" y="50" width="8" height="50" rx="4" fill="#795548" initial={{ y: 80, height: 20 }} animate={{ y: 50, height: 50 }} />
    {/* Bushy top */}
    <motion.circle cx="60" cy="45" r="25" fill="#4CAF50" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }} />
    <motion.circle cx="45" cy="55" r="15" fill="#388E3C" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }} />
    <motion.circle cx="75" cy="55" r="15" fill="#8BC34A" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4, type: "spring" }} />
  </motion.svg>
);

// 4. Level 4: Blooming Tree (Mastery)
const BloomingTreeSVG = () => (
  <motion.svg width="120" height="120" viewBox="0 0 120 120" initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
    <ellipse cx="60" cy="100" rx="40" ry="15" fill="#5D4037" />
    <motion.rect x="54" y="40" width="12" height="60" rx="4" fill="#5D4037" initial={{ y: 80 }} animate={{ y: 40 }} />
    
    <motion.circle cx="60" cy="40" r="30" fill="#E91E63" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }} />
    <motion.circle cx="35" cy="50" r="20" fill="#F06292" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }} />
    <motion.circle cx="85" cy="50" r="20" fill="#EC407A" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4, type: "spring" }} />
    
    {/* Small flowers */}
    <motion.circle cx="60" cy="35" r="5" fill="#FFF" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6 }} />
    <motion.circle cx="45" cy="25" r="4" fill="#FFF" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.7 }} />
    <motion.circle cx="75" cy="30" r="6" fill="#FFF" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8 }} />
  </motion.svg>
);

// Dead / Wilting State
const WiltingSVG = () => (
  <motion.svg width="120" height="120" viewBox="0 0 120 120" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
    <ellipse cx="60" cy="100" rx="40" ry="15" fill="#4E342E" />
    <motion.path d="M60 100 Q 70 80, 80 90" fill="none" stroke="#8D6E63" strokeWidth="4" strokeLinecap="round" />
    <motion.ellipse cx="80" cy="90" rx="6" ry="3" fill="#A1887F" transform="rotate(20 80 90)" />
  </motion.svg>
);

function getTamagotchiState(completed: number, missed: number) {
  // Tamagotchi Logic
  const health = Math.max(0, 100 - (missed * 15) + (completed * 5)); // Base 100, missed hurts, completed heals
  const water = Math.min(100, completed * 15); // Water fills up as you do tasks
  const level = Math.min(4, Math.floor(completed / 4) + 1); // Level up every 4 tasks
  const isDead = health <= 0 || (completed === 0 && missed > 3);

  let visual = isDead ? "dead" : `level${level}`;
  if (completed === 0 && missed === 0) visual = "level1"; // Brand new

  return {
    health: Math.min(100, health),
    water,
    level,
    visual,
    isDead
  };
}

export function ProductivityGarden({ C, streak }: ProductivityGardenProps) {
  const { data, loading } = useAnalytics();

  const completed = data?.totalTasksDone ?? 0;
  const total = data?.totalTasksCreated ?? 0;
  const missed = Math.max(0, total - completed);

  const pet = useMemo(() => getTamagotchiState(completed, missed), [completed, missed]);

  return (
    <Card C={C} style={{ padding: 0, overflow: "hidden", position: "relative" }}>
      
      {/* Tamagotchi Screen Header */}
      <div style={{ background: C.card, padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: C.accentBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>
            🪴
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>Focus Pet</h3>
            <p style={{ margin: 0, fontSize: 11, color: C.muted }}>Watered by completed tasks</p>
          </div>
        </div>
        <div style={{ background: C.accent, color: "#fff", padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 800 }}>
          Lv. {pet.level}
        </div>
      </div>

      {loading ? (
        <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: 13 }}>
          Loading Pet Data...
        </div>
      ) : (
        <div style={{ padding: "24px 20px", background: `${C.accent}08` }}>
          
          {/* Main Pet Visual */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            <div style={{ 
              width: 160, height: 160, 
              background: C.bg, 
              borderRadius: "50%", 
              boxShadow: `inset 0 4px 20px ${C.border}, 0 4px 10px rgba(0,0,0,0.05)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative"
            }}>
              <AnimatePresence mode="wait">
                {pet.visual === "level1" && <SeedSVG key="1" />}
                {pet.visual === "level2" && <SproutSVG key="2" />}
                {pet.visual === "level3" && <SaplingSVG key="3" />}
                {pet.visual === "level4" && <BloomingTreeSVG key="4" />}
                {pet.visual === "dead" && <WiltingSVG key="dead" />}
              </AnimatePresence>

              {/* Water animation if recently completed tasks (Simulated visual only) */}
              {completed > 0 && pet.water > 0 && !pet.isDead && (
                <motion.div 
                  initial={{ y: -20, opacity: 0 }} 
                  animate={{ y: 20, opacity: [0, 1, 0] }} 
                  transition={{ repeat: Infinity, duration: 2, delay: 1 }}
                  style={{ position: "absolute", top: 10, right: 30, fontSize: 20 }}
                >
                  💧
                </motion.div>
              )}
            </div>
          </div>

          {/* Status Bars */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            
            {/* Health Bar */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, marginBottom: 6 }}>
                <span style={{ color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>HP (Health)</span>
                <span style={{ color: pet.health < 40 ? C.red : C.green }}>{pet.health}/100</span>
              </div>
              <div style={{ height: 10, background: C.border, borderRadius: 999, overflow: "hidden" }}>
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${pet.health}%` }} 
                  transition={{ duration: 1, type: "spring" }}
                  style={{ height: "100%", background: pet.health < 40 ? C.red : C.green, borderRadius: 999 }}
                />
              </div>
            </div>

            {/* Water / EXP Bar */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, marginBottom: 6 }}>
                <span style={{ color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Water Level</span>
                <span style={{ color: C.accent }}>{pet.water}%</span>
              </div>
              <div style={{ height: 10, background: C.border, borderRadius: 999, overflow: "hidden" }}>
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${pet.water}%` }} 
                  transition={{ duration: 1, type: "spring", delay: 0.2 }}
                  style={{ height: "100%", background: C.accent, borderRadius: 999 }}
                />
              </div>
            </div>

          </div>

          {/* Status Message */}
          <div style={{ marginTop: 20, textAlign: "center", fontSize: 13, fontWeight: 600, color: C.text, padding: "12px", background: C.bg, borderRadius: 12, border: `1px solid ${C.border}` }}>
            {pet.isDead ? "Your plant wilted from neglected tasks! Start completing tasks to revive it." 
            : pet.level === 4 ? "Beautiful! Your focus tree is fully bloomed! 🌸" 
            : pet.level === 1 ? "A new seed! Complete a task to give it some water." 
            : `Keep completing tasks! Next evolution at Level ${pet.level + 1}.`}
          </div>

        </div>
      )}
    </Card>
  );
}
