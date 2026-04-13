import { useState, useCallback, useEffect } from "react";
import { CalendarEvent } from "../types";
import { apiFetch } from "../utils/api";

export function useCalendar() {
    const [events, setEvents] = useState<Record<number, CalendarEvent[]>>({});
    const [loading, setLoading] = useState(false);

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiFetch("/api/calendar");
            const data = await response.json();
            const fetchedEvents: CalendarEvent[] = data.events;

            const grouped: Record<number, CalendarEvent[]> = {};
            fetchedEvents.forEach(ev => {
                if (!grouped[ev.day]) grouped[ev.day] = [];
                grouped[ev.day].push(ev);
            });

            setEvents(grouped);
        } catch (error) {
            console.error("Failed to fetch calendar events:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const addEvent = async (eventData: Omit<CalendarEvent, "id">) => {
        try {
            await apiFetch("/api/calendar", {
                method: "POST",
                body: JSON.stringify(eventData),
            });
            await fetchEvents();
        } catch (error) {
            console.error("Failed to create calendar event:", error);
        }
    };

    const deleteEvent = async (id: number) => {
        try {
            await apiFetch(`/api/calendar/${id}`, {
                method: "DELETE",
            });
            await fetchEvents();
        } catch (error) {
            console.error("Failed to delete calendar event:", error);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    return { events, loading, addEvent, deleteEvent, refreshEvents: fetchEvents };
}
