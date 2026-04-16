"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import type { AchievementsApiResponse } from "../../types/achievements";
import { AchievementTimeline } from "./AchievementTimeline";
import { CategoryProgress } from "./CategoryProgress";
import { LevelBadge } from "./LevelBadge";
import { NextTargets } from "./NextTargets";
import { StatsRow } from "./StatsRow";
import { UnlockedGrid } from "./UnlockedGrid";

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

  const hasUnlocked = useMemo(() => (data?.totalUnlockedCount ?? 0) > 0, [data]);

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8 dark:bg-slate-950">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Achievements</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">Milestone-based progress, unlocks, and next targets.</p>
          </div>
          <button
            onClick={() => void fetchAchievements(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
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

        <LevelBadge loading={loading} totalPoints={data?.totalPoints ?? 0} userLevel={data?.userLevel ?? 1} totalUnlockedCount={data?.totalUnlockedCount ?? 0} />

        <StatsRow loading={loading} stats={data?.stats} />

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <CategoryProgress loading={loading} categoryProgress={data?.categoryProgress ?? []} />
          <NextTargets loading={loading} targets={data?.nextClosestAchievements ?? []} />
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <UnlockedGrid loading={loading} unlockedAchievements={data?.unlockedAchievements ?? []} />
          </div>
          <div>
            <AchievementTimeline loading={loading} timeline={data?.achievementTimeline ?? []} />
          </div>
        </section>

        {!loading && !error && !hasUnlocked && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            No achievements unlocked yet. Complete your first task or focus session to start earning badges.
          </div>
        )}
      </div>
    </main>
  );
}
