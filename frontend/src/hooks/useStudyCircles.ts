import { useState, useCallback, useEffect } from "react";
import { apiFetch } from "../utils/api";

export interface StudyCircleMember {
    id: number;
    userId: number;
    user: {
        id: number;
        name: string;
    };
}

export interface StudyCircle {
    id: number;
    name: string;
    description: string;
    inviteCode: string;
    members: StudyCircleMember[];
}

export function useStudyCircles() {
    const [circles, setCircles] = useState<StudyCircle[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchCircles = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiFetch("/api/study-circles");
            const data = await response.json();
            setCircles(data.circles || []);
        } catch (error) {
            console.error("Failed to fetch study circles:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCircles();
    }, [fetchCircles]);

    const createCircle = async (name: string, description: string) => {
        try {
            await apiFetch("/api/study-circles", {
                method: "POST",
                body: JSON.stringify({ name, description }),
            });
            await fetchCircles();
        } catch (error) {
            console.error("Failed to create study circle:", error);
        }
    };

    const joinCircle = async (inviteCode: string) => {
        try {
            await apiFetch("/api/study-circles/join", {
                method: "POST",
                body: JSON.stringify({ inviteCode }),
            });
            await fetchCircles();
        } catch (error) {
            console.error("Failed to join study circle:", error);
        }
    };

    return { circles, loading, createCircle, joinCircle, refreshCircles: fetchCircles };
}
