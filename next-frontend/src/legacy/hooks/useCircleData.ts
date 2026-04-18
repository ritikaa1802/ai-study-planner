import { useState, useCallback } from "react";
import { apiFetch } from "../utils/api";

export function useCircleData(circleId: number | null) {
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [goals, setGoals] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [schedules, setSchedules] = useState<any[]>([]);

    const fetchLeaderboard = useCallback(async () => {
        if (!circleId) return;
        const res = await apiFetch(`/api/study-circles/${circleId}/leaderboard`);
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
    }, [circleId]);

    const fetchGoals = useCallback(async () => {
        if (!circleId) return;
        const res = await apiFetch(`/api/study-circles/${circleId}/goals`);
        const data = await res.json();
        setGoals(data.goals || []);
    }, [circleId]);

    const fetchMessages = useCallback(async () => {
        if (!circleId) return;
        const res = await apiFetch(`/api/study-circles/${circleId}/messages`);
        const data = await res.json();
        setMessages(data.messages || []);
    }, [circleId]);

    const sendMessage = async (content: string) => {
        if (!circleId) return;
        await apiFetch(`/api/study-circles/${circleId}/messages`, { method: "POST", body: JSON.stringify({ content }) });
        await fetchMessages();
    };

    const fetchSchedule = useCallback(async () => {
        if (!circleId) return;
        const res = await apiFetch(`/api/study-circles/${circleId}/schedule`);
        const data = await res.json();
        setSchedules(data.schedules || []);
    }, [circleId]);

    const addSchedule = async (title: string, startTime: string, endTime: string) => {
        if (!circleId) return;
        await apiFetch(`/api/study-circles/${circleId}/schedule`, { method: "POST", body: JSON.stringify({ title, startTime, endTime }) });
        await fetchSchedule();
    };

    const startSchedule = async (scheduleId: number) => {
        if (!circleId) return;
        await apiFetch(`/api/study-circles/${circleId}/schedule/${scheduleId}`, { method: "PATCH" });
        await fetchSchedule();
    };

    const deleteSchedule = async (scheduleId: number) => {
        if (!circleId) return;
        await apiFetch(`/api/study-circles/${circleId}/schedule/${scheduleId}`, { method: "DELETE" });
        await fetchSchedule();
    };

    const deleteMessage = async (msgId: number) => {
        if (!circleId) return;
        await apiFetch(`/api/study-circles/${circleId}/messages/${msgId}`, { method: "DELETE" });
        await fetchMessages();
    };

    const refreshAll = useCallback(() => {
        fetchLeaderboard();
        fetchGoals();
        fetchMessages();
        fetchSchedule();
    }, [fetchLeaderboard, fetchGoals, fetchMessages, fetchSchedule]);

    return {
        leaderboard, goals, messages, schedules,
        sendMessage, deleteMessage, addSchedule, startSchedule, deleteSchedule, refreshAll,
        fetchMessages, fetchGoals, fetchSchedule
    };
}
