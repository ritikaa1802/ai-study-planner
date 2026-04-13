import { useState, useCallback, useEffect } from "react";
import { apiFetch } from "../utils/api";

export interface ResourceItem {
    id: number;
    title: string;
    url?: string;
    fileUrl?: string;
    fileType?: string;
    description?: string;
    uploadedAt: string;
    uploader?: { id: number; name: string };
    studyCircle?: { id: number; name: string };
}

export function useResources() {
    const [resources, setResources] = useState<ResourceItem[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchResources = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiFetch("/api/resources");
            const data = await response.json();
            setResources(data.resources || []);
        } catch (error) {
            console.error("Failed to fetch resources:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchResources();
    }, [fetchResources]);

    const addResource = async (resourceData: { title: string; url?: string; description?: string; studyCircleId?: number; file?: File | null }) => {
        try {
            let body;
            if (resourceData.file) {
                const formData = new FormData();
                formData.append("title", resourceData.title);
                if (resourceData.url) formData.append("url", resourceData.url);
                if (resourceData.description) formData.append("description", resourceData.description);
                if (resourceData.studyCircleId) formData.append("studyCircleId", resourceData.studyCircleId.toString());
                formData.append("file", resourceData.file);
                body = formData;
            } else {
                body = JSON.stringify(resourceData);
            }

            await apiFetch("/api/resources", {
                method: "POST",
                body,
            });
            await fetchResources();
        } catch (error) {
            console.error("Failed to add resource:", error);
        }
    };

    const deleteResource = async (id: number) => {
        try {
            await apiFetch(`/api/resources/${id}`, {
                method: "DELETE",
            });
            await fetchResources();
        } catch (error) {
            console.error("Failed to delete resource:", error);
        }
    };

    return { resources, loading, addResource, deleteResource, refreshResources: fetchResources };
}
