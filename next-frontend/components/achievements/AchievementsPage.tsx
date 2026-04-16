"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

type MilestoneState = "completed" | "current" | "locked";

type MilestoneItem = {
  id: string;
  name: string;
  category: string;
  state: MilestoneState;
  points: number;
};

const X_POSITIONS = [20, 50, 80];

const iconForCategory = (category: string) => {
  const c = normalizeCategory(category);
  if (c === "productivity") return BookOpen;
  if (c === "consistency") return Flame;
  if (c === "focus") return Brain;
  if (c === "goals") return Target;
  return Clock3;
};

const stoneClassesByState: Record<MilestoneState, string> = {
  completed:
    "border-emerald-300 bg-gradient-to-br from-emerald-400 to-emerald-500 text-white shadow-[0_8px_18px_rgba(16,185,129,0.35)]",
  current:
    "border-orange-200 bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-[0_0_0_8px_rgba(251,146,60,0.18),0_12px_25px_rgba(249,115,22,0.45)] animate-pulse",
  locked:
    "border-slate-400 bg-gradient-to-br from-slate-300 to-slate-400 text-slate-100 dark:border-slate-600 dark:from-slate-600 dark:to-slate-700",
};

export function AchievementsPage() {
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
    <main className="h-full overflow-y-auto bg-gradient-to-b from-[#d8cbff] via-[#c8d7ff] to-[#d6c5ff] p-4 pb-10 md:p-8 dark:from-[#1b1540] dark:via-[#1a2551] dark:to-[#1f1843]">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-violet-950 dark:text-violet-100">Achievement Journey</h1>
            <p className="text-sm text-violet-800 dark:text-violet-300">Complete milestones on your learning path, one stone at a time.</p>
          </div>
          <button
            onClick={() => void fetchAchievements(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-violet-300 bg-white/70 px-3 py-2 text-sm font-semibold text-violet-900 backdrop-blur hover:bg-white dark:border-violet-700 dark:bg-violet-900/50 dark:text-violet-100 dark:hover:bg-violet-800/70"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </section>

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
            {error}
          </div>
        )}

        {loading ? (
          <section className="rounded-3xl border border-violet-200/70 bg-white/60 p-5 backdrop-blur dark:border-violet-900/50 dark:bg-violet-950/35">
            <div className="space-y-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="mx-auto h-20 w-20 animate-pulse rounded-full bg-violet-200 dark:bg-violet-800/60" />
              ))}
            </div>
          </section>
        ) : (
          <section className="rounded-3xl border border-violet-200/70 bg-white/55 p-5 backdrop-blur-sm dark:border-violet-900/50 dark:bg-violet-950/35">
            <div className="relative">
              <div className="space-y-8">
                {milestones.map((milestone, index) => {
                  const pos = index % 3;
                  const x1 = X_POSITIONS[pos];
                  const x2 = X_POSITIONS[(index + 1) % 3];
                  const bend = index % 2 === 0 ? 18 : 26;
                  const controlX = x1 < x2 ? (x1 + x2) / 2 + bend : (x1 + x2) / 2 - bend;
                  const Icon = iconForCategory(milestone.category);

                  return (
                    <div key={milestone.id} className="relative h-28">
                      {index < milestones.length - 1 && (
                        <>
                          <svg className="absolute left-0 top-14 hidden h-24 w-full md:block" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
                            <path
                              d={`M ${x1} 10 Q ${controlX} 54 ${x2} 98`}
                              fill="none"
                              stroke="#7c3aed"
                              strokeWidth="2.2"
                              strokeDasharray="5 7"
                              opacity="0.55"
                            />
                          </svg>
                          <svg className="absolute left-1/2 top-14 h-24 w-8 -translate-x-1/2 md:hidden" viewBox="0 0 32 100" preserveAspectRatio="none" aria-hidden>
                            <path d="M 16 8 Q 16 52 16 96" fill="none" stroke="#7c3aed" strokeWidth="2.2" strokeDasharray="5 7" opacity="0.55" />
                          </svg>
                        </>
                      )}

                      <div className={`relative z-10 flex h-full items-center ${pos === 0 ? "justify-start md:pl-8" : pos === 1 ? "justify-center" : "justify-end md:pr-8"}`}>
                        <div className="group flex flex-col items-center">
                          <button
                            type="button"
                            className={`h-20 w-20 rounded-full border-[3px] transition-transform duration-200 group-hover:scale-105 ${stoneClassesByState[milestone.state]}`}
                            title={`${milestone.name} (${milestone.state})`}
                          >
                            <span className="sr-only">{milestone.name}</span>
                            <span className="flex h-full w-full items-center justify-center">
                              {milestone.state === "completed" ? (
                                <CheckCircle2 className="h-8 w-8" />
                              ) : milestone.state === "locked" ? (
                                <Lock className="h-8 w-8" />
                              ) : (
                                <Icon className="h-8 w-8" />
                              )}
                            </span>
                          </button>
                          <div className="mt-2 max-w-[10rem] text-center">
                            <p className="truncate text-xs font-semibold text-violet-950 dark:text-violet-100">{milestone.name}</p>
                            <p className="text-[11px] text-violet-800 dark:text-violet-300">{milestone.points} pts</p>
                          </div>
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
          <section className="rounded-2xl border border-violet-200/80 bg-white/70 p-5 backdrop-blur-sm dark:border-violet-900/60 dark:bg-violet-950/45">
            <div className="mb-4 flex items-center gap-2 text-violet-950 dark:text-violet-100">
              <Trophy className="h-5 w-5" />
              <h2 className="text-lg font-bold">Progress Summary</h2>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/30">
                <p className="text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-300">Completed</p>
                <p className="mt-1 text-2xl font-black text-emerald-800 dark:text-emerald-200">{summary.completed}</p>
              </div>
              <div className="rounded-xl border border-orange-300 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-950/30">
                <p className="text-xs font-semibold uppercase text-orange-700 dark:text-orange-300">In Progress</p>
                <p className="mt-1 text-2xl font-black text-orange-800 dark:text-orange-200">{summary.inProgress}</p>
              </div>
              <div className="rounded-xl border border-slate-300 bg-slate-100 p-3 dark:border-slate-700 dark:bg-slate-900/70">
                <p className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">Locked</p>
                <p className="mt-1 text-2xl font-black text-slate-700 dark:text-slate-100">{summary.locked}</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-violet-100/80 p-3 text-sm text-violet-900 dark:bg-violet-900/40 dark:text-violet-100">
              <p className="inline-flex items-center gap-2 font-medium">
                <Zap className="h-4 w-4" />
                Level {data?.userLevel ?? 1} · {data?.totalPoints ?? 0} total points
              </p>
            </div>

            <div className="mt-5 border-t border-violet-200/70 pt-4 dark:border-violet-800/60">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">Milestone Tasks</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {milestones.map((milestone) => {
                  const Icon = iconForCategory(milestone.category);
                  const stateCardClass =
                    milestone.state === "completed"
                      ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"
                      : milestone.state === "current"
                      ? "border-orange-300 bg-orange-50 text-orange-900 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-200"
                      : "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200";

                  return (
                    <div
                      key={`task-${milestone.id}`}
                      className={`flex items-center gap-2 rounded-2xl border px-3 py-2 shadow-sm ${stateCardClass}`}
                    >
                      <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/70 dark:bg-black/20">
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
          <div className="rounded-xl border border-dashed border-violet-300 bg-white/70 p-6 text-sm text-violet-800 dark:border-violet-700 dark:bg-violet-950/35 dark:text-violet-200">
            No milestones available yet. Complete your first task or focus session to start your journey.
          </div>
        )}
      </div>
    </main>
  );
}
