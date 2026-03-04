"use client";

import { useEffect, useRef, useState } from "react";
import { Terminal, X, Minus, Square } from "lucide-react";

interface LogEntry {
    id: number;
    time: string;
    type: "info" | "success" | "warning" | "error" | "system";
    message: string;
}

const BASE_LOGS: Omit<LogEntry, "id" | "time">[] = [
    { type: "system", message: "SmartCity Traffic AI v3.2.1 initialized" },
    { type: "info", message: "Loading GCN-LSTM model weights..." },
    { type: "success", message: "Model loaded: 98.3MB, 4 layers, 256 hidden units" },
    { type: "info", message: "Connecting to SUMO traffic simulator..." },
    { type: "success", message: "SUMO connected on localhost:8813" },
    { type: "info", message: "Prophet forecasting model warming up..." },
    { type: "success", message: "Prophet model ready. Forecast horizon: 60 min" },
    { type: "info", message: "Fetching live traffic data from Riyadh API..." },
    { type: "success", message: "Traffic data updated: 247 intersections monitored" },
    { type: "warning", message: "High congestion detected: King Fahd / Olaya junction" },
    { type: "info", message: "GCN-LSTM predicting congestion levels..." },
    { type: "success", message: "Prediction complete: 78% congestion in 15 min" },
    { type: "info", message: "AI rerouting algorithm activated" },
    { type: "info", message: "Running Dijkstra shortest path on road graph..." },
    { type: "success", message: "Optimal route found: via Olaya St (2.3km saved)" },
    { type: "info", message: "Broadcasting rerouting instructions to 142 vehicles" },
    { type: "success", message: "Rerouting confirmed for 89 vehicles" },
    { type: "warning", message: "Exit 7 - Makkah Rd: accident detected, rerouting..." },
    { type: "info", message: "SUMO simulation step 1240/5000" },
    { type: "success", message: "Traffic flow improved by 23% on main corridor" },
];

const LIVE_LOGS: Omit<LogEntry, "id" | "time">[] = [
    { type: "info", message: "AI calculating next optimal route..." },
    { type: "success", message: "Traffic data updated successfully" },
    { type: "info", message: "Prophet model: Rush hour pattern confirmed" },
    { type: "warning", message: "Congestion spike at Tahlia St junction" },
    { type: "info", message: "SUMO step: vehicles spawned in zone 4" },
    { type: "success", message: "GCN-LSTM prediction accuracy: 91.2%" },
    { type: "info", message: "Rerouting 47 vehicles via Prince Sultan Rd" },
    { type: "success", message: "Average travel time reduced by 4.2 min" },
    { type: "info", message: "Querying OpenStreetMap graph for updates..." },
    { type: "warning", message: "API rate limit: 85% used, throttling..." },
    { type: "success", message: "Graph updated: 3 new road segments" },
    { type: "info", message: "AI model checkpoint saved" },
    { type: "system", message: "System health check: all services nominal" },
    { type: "info", message: "Traffic signal optimization: 12 intersections adjusted" },
    { type: "success", message: "Throughput increased: +18% at Airport Rd North" },
];

const LOG_COLORS: Record<string, string> = {
    info: "#00d4ff",
    success: "#00ff88",
    warning: "#ffaa00",
    error: "#ff4444",
    system: "#a78bfa",
};

const LOG_PREFIXES: Record<string, string> = {
    info: "[INFO]",
    success: "[OK]  ",
    warning: "[WARN]",
    error: "[ERR] ",
    system: "[SYS] ",
};

function getTime() {
    return new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });
}

interface SystemLogsProps {
    externalEvent?: string;
    aiLogEntry?: { text: string; time: string };
}

export default function SystemLogs({ externalEvent, aiLogEntry }: SystemLogsProps) {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isMinimized, setIsMinimized] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const idRef = useRef(0);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const addLog = (entry: Omit<LogEntry, "id" | "time">) => {
        setLogs((prev) => {
            const newLog: LogEntry = { ...entry, id: ++idRef.current, time: getTime() };
            return [...prev.slice(-40), newLog];
        });
    };

    // Initial logs
    useEffect(() => {
        let i = 0;
        const populate = () => {
            if (i < BASE_LOGS.length) {
                addLog(BASE_LOGS[i]);
                i++;
                setTimeout(populate, 120);
            }
        };
        populate();
    }, []);

    // Live log interval
    useEffect(() => {
        const interval = setInterval(() => {
            const entry = LIVE_LOGS[Math.floor(Math.random() * LIVE_LOGS.length)];
            addLog(entry);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    // External events from ControlPanel
    useEffect(() => {
        if (!externalEvent) return;
        const eventLogs: Record<string, Omit<LogEntry, "id" | "time">[]> = {
            sumo: [
                { type: "system", message: "Initializing SUMO simulation environment..." },
                { type: "info", message: "Loading Riyadh road network (OSM data)..." },
                { type: "success", message: "SUMO simulation started: 5000 vehicles spawned" },
            ],
            fetch: [
                { type: "info", message: "Fetching live traffic from Riyadh Smart City API..." },
                { type: "info", message: "Processing 247 intersection data points..." },
                { type: "success", message: "Live traffic data fetched and normalized" },
            ],
            reroute: [
                { type: "system", message: "AI rerouting engine triggered manually" },
                { type: "info", message: "Running Dijkstra on 12,450 road graph nodes..." },
                { type: "success", message: "Rerouting complete: 3 alternative routes generated" },
            ],
        };
        eventLogs[externalEvent]?.forEach((log, i) => {
            setTimeout(() => addLog(log), i * 600);
        });
    }, [externalEvent]);

    // Handle incoming AI log from the backend
    useEffect(() => {
        if (!aiLogEntry) return;

        // Prevent adding the exact same log multiple times if the API returns the same data
        setLogs((prev) => {
            const lastLog = prev[prev.length - 1];
            if (lastLog && lastLog.message === aiLogEntry.text) {
                return prev; // skip duplicate
            }

            const newLog: LogEntry = {
                id: ++idRef.current,
                time: aiLogEntry.time,
                type: "success",
                message: aiLogEntry.text
            };
            return [...prev.slice(-40), newLog];
        });
    }, [aiLogEntry]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div
            className="glass-panel animate-slide-in-up"
            style={{
                position: "absolute",
                bottom: "24px",
                right: "348px",
                width: "380px",
                zIndex: 100,
                overflow: "hidden",
                transition: "height 0.3s ease",
            }}
        >
            {/* Terminal title bar */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 14px",
                    background: "rgba(0,0,0,0.3)",
                    borderBottom: "1px solid rgba(0,212,255,0.1)",
                    cursor: "pointer",
                }}
                onClick={() => setIsMinimized((v) => !v)}
            >
                <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ff5f57" }} />
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#febc2e" }} />
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#28c840" }} />
                </div>
                <Terminal size={12} color="#00d4ff" style={{ marginLeft: "6px" }} />
                <span style={{ fontSize: "11px", color: "#64748b", fontFamily: "'JetBrains Mono', monospace" }}>
                    smartcity@ai-control ~ system-logs
                </span>
                <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
                    <Minus size={11} color="#475569" />
                    <Square size={10} color="#475569" />
                    <X size={11} color="#475569" />
                </div>
            </div>

            {/* Log area */}
            {!isMinimized && (
                <div
                    ref={scrollRef}
                    style={{
                        height: "200px",
                        overflowY: "auto",
                        padding: "10px 14px",
                        fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                        fontSize: "10.5px",
                        lineHeight: "1.7",
                    }}
                >
                    {logs.map((log) => (
                        <div key={log.id} style={{ display: "flex", gap: "8px", alignItems: "baseline" }}>
                            <span style={{ color: "#334155", flexShrink: 0, fontSize: "9.5px" }}>{log.time}</span>
                            <span style={{ color: LOG_COLORS[log.type], flexShrink: 0, fontWeight: 600, fontSize: "9.5px" }}>
                                {LOG_PREFIXES[log.type]}
                            </span>
                            <span style={{ color: log.type === "warning" ? "#fcd34d" : log.type === "error" ? "#fca5a5" : log.type === "success" ? "#86efac" : log.type === "system" ? "#c4b5fd" : "#93c5fd" }}>
                                {log.message}
                            </span>
                        </div>
                    ))}
                    <div style={{ display: "flex", gap: "8px", alignItems: "baseline", opacity: 0.6 }}>
                        <span style={{ color: "#334155", fontSize: "9.5px" }}>{isMounted ? getTime() : "--:--:--"}</span>
                        <span style={{ color: "#00d4ff", fontSize: "9.5px" }}>{">"}</span>
                        <span className="terminal-cursor" style={{ color: "#00d4ff" }}>█</span>
                    </div>
                </div>
            )}
        </div>
    );
}
