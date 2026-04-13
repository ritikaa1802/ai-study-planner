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

export function useAnalytics() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchAnalytics = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiFetch("/api/analytics");
            const d = await response.json();
            setData(d);
        } catch (error) {
            console.error("Failed to fetch analytics:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    return { data, loading, refreshAnalytics: fetchAnalytics };
}
