"use client";

import { CSSProperties, useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Brain,
  CheckCircle2,
  Clock3,
  Flame,
  Lock,
  RefreshCw,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import type { AchievementsApiResponse } from "../../types/achievements";
import { normalizeCategory } from "../../types/achievements";
import { useThemeShell } from "@/next/ThemeShellContext";
import type { Theme } from "@/legacy/types";

type MilestoneState = "completed" | "current" | "locked";

type MilestoneItem = {
  id: string;
  name: string;
  category: string;
  state: MilestoneState;
  points: number;
};

const X_POSITIONS = [14, 50, 86];

const iconForCategory = (category: string) => {
  const c = normalizeCategory(category);
  if (c === "productivity") return BookOpen;
  if (c === "consistency") return Flame;
  if (c === "focus") return Brain;
  if (c === "goals") return Target;
  return Clock3;
};

const stoneStyleByState = (state: MilestoneState, C: Theme): CSSProperties => {
  if (state === "completed") {
    return {
      borderColor: C.accentBar,
      background: `linear-gradient(145deg, ${C.accentLight}, ${C.accentBar})`,
      color: "#ffffff",
      boxShadow: `0 8px 18px ${C.accentBar}55`,
    };
  }

  if (state === "current") {
    return {
      borderColor: C.accent,
      background: `linear-gradient(145deg, ${C.accent}, ${C.accentBar})`,
      color: "#ffffff",
      boxShadow: `0 0 0 8px ${C.accentBg}, 0 12px 24px ${C.accent}88`,
    };
  }

  return {
    borderColor: C.dot3,
    background: `linear-gradient(145deg, ${C.dot1}, ${C.dot2})`,
    color: C.subtext,
    boxShadow: "none",
  };
};

const taskStoneStyleByState = (state: MilestoneState, C: Theme): CSSProperties => {
  if (state === "completed") {
    return {
      borderColor: `${C.green}66`,
      background: `${C.green}1A`,
      color: C.text,
    };
  }

  if (state === "current") {
    return {
      borderColor: `${C.orange}66`,
      background: `${C.orange}1A`,
      color: C.text,
    };
  }

  return {
    borderColor: C.border,
    background: C.inputBg,
    color: C.subtext,
  };
};

export function AchievementsPage() {
  const { C } = useThemeShell();
  const [data, setData] = useState<AchievementsApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAchievements = useCallback(async (background = false) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!token) {
      setError("You are not logged in. Please sign in to view achievements.");
      setLoading(false);
      return;
    }

    if (background) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await fetch("/api/achievements", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const payload = (await res.json()) as AchievementsApiResponse | { error?: string };

      if (!res.ok) {
        setError(payload && "error" in payload && typeof payload.error === "string" ? payload.error : "Failed to fetch achievements");
        return;
      }

      setData(payload as AchievementsApiResponse);
      setError(null);
    } catch (fetchError) {
      setError("Unable to load achievements right now.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchAchievements(false);
  }, [fetchAchievements]);

  useEffect(() => {
    const revalidate = () => {
      void fetchAchievements(true);
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        revalidate();
      }
    };

    window.addEventListener("focus", revalidate);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("focus", revalidate);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [fetchAchievements]);

  const milestones = useMemo<MilestoneItem[]>(() => {
    if (!data) return [];

    const completed = [...data.unlockedAchievements]
      .sort((a, b) => new Date(a.unlockedAt).getTime() - new Date(b.unlockedAt).getTime())
      .map((item) => ({
        id: `done-${item.key}-${item.id}`,
        name: item.name,
        category: item.category,
        state: "completed" as const,
        points: item.points,
      }));

    const current = data.nextClosestAchievements[0]
      ? [
          {
            id: `current-${data.nextClosestAchievements[0].key}`,
            name: data.nextClosestAchievements[0].name,
            category: data.nextClosestAchievements[0].category,
            state: "current" as const,
            points: data.nextClosestAchievements[0].points,
          },
        ]
      : [];

    const locked = data.nextClosestAchievements.slice(1).map((item) => ({
      id: `locked-${item.key}`,
      name: item.name,
      category: item.category,
      state: "locked" as const,
      points: item.points,
    }));

    return [...completed, ...current, ...locked].slice(0, 14);
  }, [data]);

  const summary = useMemo(() => {
    const completed = milestones.filter((m) => m.state === "completed").length;
    const inProgress = milestones.filter((m) => m.state === "current").length;
    const locked = milestones.filter((m) => m.state === "locked").length;
    return { completed, inProgress, locked };
  }, [milestones]);

  const hasMilestones = milestones.length > 0;

  return (
    <main
      className="h-full overflow-y-auto p-4 pb-10 md:p-8"
      style={{
        background: `linear-gradient(180deg, ${C.bg} 0%, ${C.accentBg} 55%, ${C.bg} 100%)`,
      }}
    >
      <div className="mx-auto w-full max-w-5xl space-y-8 md:space-y-10">
        <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight" style={{ color: C.text }}>Achievement Path</h1>
            <p className="text-sm" style={{ color: C.subtext }}>Complete each milestone to unlock the next.</p>
          </div>
          <button
            onClick={() => void fetchAchievements(true)}
            className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold backdrop-blur"
            style={{
              borderColor: C.border,
              background: C.card,
              color: C.text,
            }}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </section>

        {error && (
          <div
            className="rounded-lg border px-4 py-3 text-sm"
            style={{ borderColor: C.red, background: `${C.red}22`, color: C.red }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <section
            className="rounded-3xl border p-5 backdrop-blur"
            style={{ borderColor: C.border, background: C.card }}
          >
            <div className="space-y-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="mx-auto h-20 w-20 animate-pulse rounded-full" style={{ background: C.dot2 }} />
              ))}
            </div>
          </section>
        ) : (
          <section
            className="rounded-3xl border px-5 py-7 backdrop-blur-sm md:px-8 md:py-9"
            style={{ borderColor: C.border, background: C.card }}
          >
            <div className="relative">
              <div className="space-y-14 md:space-y-16">
                {milestones.map((milestone, index) => {
                  const pos = index % 3;
                  const x1 = X_POSITIONS[pos];
                  const x2 = X_POSITIONS[(index + 1) % 3];
                  const bend = index % 2 === 0 ? 30 : 38;
                  const controlX = x1 < x2 ? (x1 + x2) / 2 + bend : (x1 + x2) / 2 - bend;
                  const controlY = index % 2 === 0 ? 38 : 66;
                  const Icon = iconForCategory(milestone.category);

                  return (
                    <div key={milestone.id} className="relative h-40 md:h-44">
                      {index < milestones.length - 1 && (
                        <>
                          <svg className="absolute left-0 top-[5.25rem] hidden h-36 w-full md:block" viewBox="0 0 100 120" preserveAspectRatio="none" aria-hidden>
                            <path
                              d={`M ${x1} 8 Q ${controlX} ${Math.min(100, controlY + 10)} ${x2} 112`}
                              fill="none"
                              stroke={C.accentBar}
                              strokeWidth="1.3"
                              strokeDasharray="2.5 6"
                              strokeLinecap="round"
                              opacity="0.8"
                            />
                          </svg>
                          <svg className="absolute left-1/2 top-[5.25rem] h-36 w-10 -translate-x-1/2 md:hidden" viewBox="0 0 32 120" preserveAspectRatio="none" aria-hidden>
                            <path d="M 16 8 Q 16 58 16 112" fill="none" stroke={C.accentBar} strokeWidth="1.3" strokeDasharray="2.5 6" strokeLinecap="round" opacity="0.8" />
                          </svg>
                        </>
                      )}

                      <div className={`relative z-10 flex h-full items-center ${pos === 0 ? "justify-start md:pl-8" : pos === 1 ? "justify-center" : "justify-end md:pr-8"}`}>
                        <div className="group flex flex-col items-center">
                          <button
                            type="button"
                            className={`relative h-24 w-24 rounded-full border-[3px] p-2 transition-transform duration-200 group-hover:scale-105 md:h-28 md:w-28 ${milestone.state === "current" ? "animate-pulse" : ""}`}
                            style={stoneStyleByState(milestone.state, C)}
                            title={`${milestone.name} (${milestone.state})`}
                          >
                            <span className="sr-only">{milestone.name}</span>
                            <span className="flex h-full w-full flex-col items-center justify-center gap-0.5 text-center">
                              {milestone.state === "completed" ? (
                                <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5" />
                              ) : milestone.state === "locked" ? (
                                <Lock className="h-4 w-4 md:h-5 md:w-5" />
                              ) : (
                                <Icon className="h-4 w-4 md:h-5 md:w-5" />
                              )}
                              <span className="line-clamp-2 px-1 text-[10px] font-semibold leading-tight md:text-[11px]">{milestone.name}</span>
                              <span className="text-[9px] leading-none opacity-90 md:text-[10px]">{milestone.points} pts</span>
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {!loading && hasMilestones && (
          <section
            className="rounded-2xl border p-5 backdrop-blur-sm"
            style={{ borderColor: C.border, background: C.card }}
          >
            <div className="mb-4 flex items-center gap-2" style={{ color: C.text }}>
              <Trophy className="h-5 w-5" />
              <h2 className="text-lg font-bold">Progress Summary</h2>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border p-3" style={{ borderColor: `${C.green}66`, background: `${C.green}1A` }}>
                <p className="text-xs font-semibold uppercase" style={{ color: C.green }}>Completed</p>
                <p className="mt-1 text-2xl font-black" style={{ color: C.green }}>{summary.completed}</p>
              </div>
              <div className="rounded-xl border p-3" style={{ borderColor: `${C.orange}66`, background: `${C.orange}1A` }}>
                <p className="text-xs font-semibold uppercase" style={{ color: C.orange }}>In Progress</p>
                <p className="mt-1 text-2xl font-black" style={{ color: C.orange }}>{summary.inProgress}</p>
              </div>
              <div className="rounded-xl border p-3" style={{ borderColor: C.border, background: C.inputBg }}>
                <p className="text-xs font-semibold uppercase" style={{ color: C.muted }}>Locked</p>
                <p className="mt-1 text-2xl font-black" style={{ color: C.subtext }}>{summary.locked}</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl p-3 text-sm" style={{ background: C.accentBg, color: C.text }}>
              <p className="inline-flex items-center gap-2 font-medium">
                <Zap className="h-4 w-4" />
                Level {data?.userLevel ?? 1} · {data?.totalPoints ?? 0} total points
              </p>
            </div>

            <div className="mt-5 border-t pt-4" style={{ borderColor: C.border }}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide" style={{ color: C.subtext }}>Milestone Tasks</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {milestones.map((milestone) => {
                  const Icon = iconForCategory(milestone.category);

                  return (
                    <div
                      key={`task-${milestone.id}`}
                      className="flex items-center gap-2 rounded-2xl border px-3 py-2 shadow-sm"
                      style={taskStoneStyleByState(milestone.state, C)}
                    >
                      <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full" style={{ background: C.card }}>
                        {milestone.state === "locked" ? <Lock className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{milestone.name}</p>
                        <p className="text-[11px] font-medium uppercase tracking-wide opacity-80">{milestone.state}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {!loading && !error && !hasMilestones && (
          <div
            className="rounded-xl border border-dashed p-6 text-sm"
            style={{ borderColor: C.border, background: C.card, color: C.subtext }}
          >
            No milestones available yet. Complete your first task or focus session to start your journey.
          </div>
        )}
      </div>
    </main>
  );
}
