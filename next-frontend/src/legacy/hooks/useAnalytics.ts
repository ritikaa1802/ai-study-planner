import { useState, useCallback, useEffect } from "react";
import { apiFetch } from "../utils/api";

export interface SubjectHour {
    n: string;
    h: number;
}

export interface AnalyticsData {
    tk: number[];
    wk: number[];
    subj: SubjectHour[];
    totalTasksDone: number;
    totalTasksCreated: number;
    completionRate: number;
    activeDaysThisWeek: number;
    productivity: number;
    totalStudyHours: number;
    weeklyStudyHours: number;
}

const EMPTY_ANALYTICS: AnalyticsData = {
    tk: [0, 0, 0, 0, 0, 0, 0],
    wk: [0, 0, 0, 0, 0, 0, 0],
    subj: [{ n: "General", h: 0 }],
    totalTasksDone: 0,
    totalTasksCreated: 0,
    completionRate: 0,
    activeDaysThisWeek: 0,
    productivity: 0,
    totalStudyHours: 0,
    weeklyStudyHours: 0,
};

function normalizeWeekArray(value: unknown): number[] {
    if (!Array.isArray(value)) {
        return [...EMPTY_ANALYTICS.wk];
    }

    const sliced = value.slice(0, 7).map((v) => Number(v));
    while (sliced.length < 7) sliced.push(0);
    return sliced.map((v) => (Number.isFinite(v) ? v : 0));
}

function normalizeSubjects(value: unknown): SubjectHour[] {
    if (!Array.isArray(value) || value.length === 0) {
        return [...EMPTY_ANALYTICS.subj];
    }

    return value
        .map((item: any) => ({
            n: typeof item?.n === "string" && item.n.trim() ? item.n : "General",
            h: Number.isFinite(Number(item?.h)) ? Number(item.h) : 0,
        }))
        .slice(0, 8);
}

function normalizeAnalyticsData(raw: any): AnalyticsData {
    return {
        tk: normalizeWeekArray(raw?.tk),
        wk: normalizeWeekArray(raw?.wk),
        subj: normalizeSubjects(raw?.subj),
        totalTasksDone: Number.isFinite(Number(raw?.totalTasksDone)) ? Number(raw.totalTasksDone) : 0,
        totalTasksCreated: Number.isFinite(Number(raw?.totalTasksCreated)) ? Number(raw.totalTasksCreated) : 0,
        completionRate: Number.isFinite(Number(raw?.completionRate)) ? Number(raw.completionRate) : 0,
        activeDaysThisWeek: Number.isFinite(Number(raw?.activeDaysThisWeek)) ? Number(raw.activeDaysThisWeek) : 0,
        productivity: Number.isFinite(Number(raw?.productivity)) ? Number(raw.productivity) : 0,
        totalStudyHours: Number.isFinite(Number(raw?.totalStudyHours)) ? Number(raw.totalStudyHours) : 0,
        weeklyStudyHours: Number.isFinite(Number(raw?.weeklyStudyHours)) ? Number(raw.weeklyStudyHours) : 0,
    };
}

export function useAnalytics() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAnalytics = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiFetch("/api/analytics");
            const d = await response.json();

            if (!response.ok) {
                const message = typeof d?.error === "string" ? d.error : "Failed to fetch analytics";
                throw new Error(message);
            }

            setData(normalizeAnalyticsData(d));
        } catch (error) {
            console.error("Failed to fetch analytics:", error);
            setError(error instanceof Error ? error.message : "Failed to fetch analytics");
            setData(EMPTY_ANALYTICS);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    return { data, loading, error, refreshAnalytics: fetchAnalytics };
}
