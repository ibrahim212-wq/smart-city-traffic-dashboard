import { useState, useEffect } from "react";

export interface SystemStatus {
    intersection: string;
    gcn_prediction: number;
    prophet_trend: string;
    active_route: string;
    ai_log: string;
}

export interface IntersectionData {
    id: string | number;
    name: string;
    lat: number;
    lng: number;
    light_state: "Green" | "Red" | "Yellow";
    timer: number;
    reasoning: string;
}

export interface RouteData {
    id: string | number;
    path: [number, number][];
    congestion: "Low" | "Medium" | "High";
}

export interface TrafficData {
    system_status: SystemStatus;
    intersections: IntersectionData[];
    routes: RouteData[];
}

export interface TrafficState {
    gcnPrediction?: number;
    prophetTrend?: string;
    activeRoute?: string;
    aiLogEntry?: { text: string; time: string };
    intersections: IntersectionData[];
    routes: RouteData[];
    isSyncing: boolean;
    error?: string;
}

function getTime() {
    return new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });
}

export function useTrafficData(): TrafficState {
    const [state, setState] = useState<TrafficState>({
        intersections: [],
        routes: [],
        isSyncing: true,
    });

    useEffect(() => {
        let mounted = true;

        const fetchData = async () => {
            if (!mounted) return;
            setState((prev) => ({ ...prev, isSyncing: true, error: undefined }));

            try {
                // Fetch live data from local FastAPI backend
                const res = await fetch("http://127.0.0.1:8000/api/traffic-status");
                if (!res.ok) {
                    throw new Error(`API error: ${res.status}`);
                }
                const data: TrafficData = await res.json();

                if (!mounted) return;

                setState((prev) => ({
                    ...prev,
                    isSyncing: false,
                    gcnPrediction: data.system_status.gcn_prediction,
                    prophetTrend: data.system_status.prophet_trend,
                    activeRoute: data.system_status.active_route,
                    aiLogEntry: data.system_status.ai_log ? { text: data.system_status.ai_log, time: getTime() } : undefined,
                    intersections: data.intersections || [],
                    routes: data.routes || [],
                    error: undefined,
                }));
            } catch (err: any) {
                if (!mounted) return;
                setState((prev) => ({
                    ...prev,
                    isSyncing: false,
                    error: err.message || "Failed to sync AI",
                }));
            }
        };

        // Initial fetch
        fetchData();

        // 30-second polling interval
        const intervalId = setInterval(fetchData, 30000);

        return () => {
            mounted = false;
            clearInterval(intervalId);
        };
    }, []);

    return state;
}
