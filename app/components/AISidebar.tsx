"use client";

import { useState, useEffect } from "react";
import { Brain, TrendingUp, Navigation, ChevronRight, Activity } from "lucide-react";

interface CongestionLevel {
    label: string;
    value: number;
    color: string;
}

const CONGESTION_LEVELS: CongestionLevel[] = [
    { label: "Low", value: 22, color: "#00ff88" },
    { label: "Moderate", value: 54, color: "#ffaa00" },
    { label: "High", value: 78, color: "#ff6b35" },
    { label: "Critical", value: 91, color: "#ff4444" },
];

const ROUTE_OPTIONS = [
    "Rerouting via Olaya St → King Fahd Rd",
    "Alternative: Tahlia St → Prince Sultan Rd",
    "Fastest: Uruba Rd bypass (2.3 km saved)",
    "Optimal: Al-Amir Fawaz St corridor",
];

const PROPHET_STATES = [
    { label: "Rush Hour", sublabel: "High Demand Pattern", color: "#ff6b35", icon: "🔴" },
    { label: "Off-Peak", sublabel: "Normal Flow Detected", color: "#00ff88", icon: "🟢" },
    { label: "Weekend Peak", sublabel: "Moderate Load Pattern", color: "#ffaa00", icon: "🟡" },
];

export interface AISidebarProps {
    gcnPrediction?: number; // 0 to 100
    prophetTrend?: string;
    activeRoute?: string;
}

export default function AISidebar({ gcnPrediction, prophetTrend, activeRoute }: AISidebarProps) {
    const [animWidth, setAnimWidth] = useState(0);
    const [gcnConfidence, setGcnConfidence] = useState(87);
    const [lastUpdate, setLastUpdate] = useState("Just now");

    // Map the incoming numeric gcnPrediction to a congestion level
    const getCongestionLevel = (val: number) => {
        if (val < 40) return CONGESTION_LEVELS[0]; // Low
        if (val < 70) return CONGESTION_LEVELS[1]; // Moderate
        if (val < 85) return CONGESTION_LEVELS[2]; // High
        return CONGESTION_LEVELS[3]; // Critical
    };

    // Current values derived from props (or defaults if missing)
    const currentPrediction = gcnPrediction ?? 0;
    const cong = getCongestionLevel(currentPrediction);

    const prophet = PROPHET_STATES.find(p => p.label.toLowerCase() === prophetTrend?.toLowerCase()) || PROPHET_STATES[1];

    const currentRoute = activeRoute || ROUTE_OPTIONS[0];

    useEffect(() => {
        // Animate progress bar when prediction changes
        setAnimWidth(0);
        const t = setTimeout(() => setAnimWidth(currentPrediction), 50);
        setLastUpdate("Just now");
        return () => clearTimeout(t);
    }, [currentPrediction]);

    return (
        <div
            className="animate-slide-in-right"
            style={{
                position: "absolute",
                top: "80px",
                right: "16px",
                width: "320px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                zIndex: 100,
            }}
        >
            {/* Header */}
            <div
                className="glass-panel"
                style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: "10px" }}
            >
                <div
                    style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "#00ff88",
                        boxShadow: "0 0 8px #00ff88",
                        animation: "pulse-cyan 2s infinite",
                    }}
                />
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    AI Insights Engine
                </span>
                <div style={{ marginLeft: "auto", fontSize: "10px", color: "#475569" }}>{lastUpdate}</div>
            </div>

            {/* GCN-LSTM Prediction Card */}
            <div className="glass-panel" style={{ padding: "18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                    <div
                        style={{
                            padding: "6px",
                            borderRadius: "8px",
                            background: "rgba(124,58,237,0.2)",
                            border: "1px solid rgba(124,58,237,0.3)",
                        }}
                    >
                        <Brain size={14} color="#a78bfa" />
                    </div>
                    <div>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "#e2e8f0" }}>GCN-LSTM Prediction</div>
                        <div style={{ fontSize: "10px", color: "#64748b" }}>King Fahd Intersection · Next 15 min</div>
                    </div>
                    <div style={{ marginLeft: "auto", fontSize: "10px", color: "#a78bfa" }}>
                        {gcnConfidence}% conf.
                    </div>
                </div>

                {/* Congestion Level Label */}
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>Predicted Congestion</span>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: cong.color }}>{cong.label}</span>
                </div>

                {/* Progress Bar */}
                <div
                    style={{
                        height: "8px",
                        borderRadius: "4px",
                        background: "rgba(255,255,255,0.08)",
                        overflow: "hidden",
                        marginBottom: "10px",
                    }}
                >
                    <div
                        style={{
                            height: "100%",
                            width: `${animWidth}%`,
                            borderRadius: "4px",
                            background: `linear-gradient(90deg, ${cong.color}88, ${cong.color})`,
                            boxShadow: `0 0 10px ${cong.color}80`,
                            transition: "width 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                    />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#475569" }}>
                    <span>0%</span>
                    <span style={{ color: cong.color, fontWeight: 600 }}>{currentPrediction}%</span>
                    <span>100%</span>
                </div>

                {/* Mini bar chart */}
                <div style={{ display: "flex", gap: "4px", marginTop: "14px", alignItems: "flex-end", height: "36px" }}>
                    {[35, 55, 48, 72, 68, 82, currentPrediction, 70, 60, 50, 45, 55].map((v, i) => (
                        <div
                            key={i}
                            style={{
                                flex: 1,
                                height: `${v}%`,
                                borderRadius: "2px 2px 0 0",
                                background: i === 6
                                    ? cong.color
                                    : `rgba(${i > 6 ? "148,163,184" : "100,116,139"},0.4)`,
                                boxShadow: i === 6 ? `0 0 6px ${cong.color}60` : "none",
                                transition: "height 0.5s ease",
                            }}
                        />
                    ))}
                </div>
                <div style={{ fontSize: "9px", color: "#334155", marginTop: "4px", textAlign: "center" }}>
                    ← Past &nbsp;&nbsp; NOW &nbsp;&nbsp; Predicted →
                </div>
            </div>

            {/* Prophet Model Card */}
            <div className="glass-panel" style={{ padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                    <div
                        style={{
                            padding: "6px",
                            borderRadius: "8px",
                            background: "rgba(255,107,53,0.15)",
                            border: "1px solid rgba(255,107,53,0.25)",
                        }}
                    >
                        <TrendingUp size={14} color="#fb923c" />
                    </div>
                    <div>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "#e2e8f0" }}>Prophet Model Trend</div>
                        <div style={{ fontSize: "10px", color: "#64748b" }}>Time-series demand forecast</div>
                    </div>
                </div>

                <div
                    style={{
                        background: `rgba(${prophet.color === "#ff6b35" ? "255,107,53" : prophet.color === "#00ff88" ? "0,255,136" : "255,170,0"},0.08)`,
                        border: `1px solid ${prophet.color}40`,
                        borderRadius: "10px",
                        padding: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        transition: "all 0.5s ease",
                    }}
                >
                    <div style={{ fontSize: "24px" }}>{prophet.icon}</div>
                    <div>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: prophet.color }}>{prophet.label}</div>
                        <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>{prophet.sublabel}</div>
                    </div>
                    <Activity size={16} color={prophet.color} style={{ marginLeft: "auto", opacity: 0.7 }} />
                </div>

                {/* Traffic pattern bars */}
                <div style={{ marginTop: "12px", display: "flex", gap: "2px", alignItems: "flex-end", height: "24px" }}>
                    {[20, 30, 55, 90, 85, 70, 50, 40, 60, 80, 95, 75, 55, 40, 30, 20, 25, 35].map((v, i) => (
                        <div
                            key={i}
                            style={{
                                flex: 1,
                                height: `${v}%`,
                                borderRadius: "1px 1px 0 0",
                                background: v > 70 ? `${prophet.color}90` : `${prophet.color}30`,
                                transition: "height 0.5s ease",
                            }}
                        />
                    ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "#334155", marginTop: "4px" }}>
                    <span>6AM</span><span>12PM</span><span>6PM</span><span>12AM</span>
                </div>
            </div>

            {/* Dijkstra Route Card */}
            <div className="glass-panel" style={{ padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                    <div
                        style={{
                            padding: "6px",
                            borderRadius: "8px",
                            background: "rgba(0,212,255,0.12)",
                            border: "1px solid rgba(0,212,255,0.2)",
                        }}
                    >
                        <Navigation size={14} color="#00d4ff" />
                    </div>
                    <div>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "#e2e8f0" }}>Dijkstra&apos;s Active Route</div>
                        <div style={{ fontSize: "10px", color: "#64748b" }}>Shortest path algorithm</div>
                    </div>
                    <div
                        style={{
                            marginLeft: "auto",
                            fontSize: "9px",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: "rgba(0,212,255,0.12)",
                            color: "#00d4ff",
                            border: "1px solid rgba(0,212,255,0.3)",
                        }}
                    >
                        LIVE
                    </div>
                </div>

                <div
                    style={{
                        background: "rgba(0,212,255,0.05)",
                        border: "1px solid rgba(0,212,255,0.15)",
                        borderRadius: "10px",
                        padding: "12px",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                        <ChevronRight size={14} color="#00d4ff" style={{ marginTop: "2px", flexShrink: 0 }} />
                        <div style={{ fontSize: "12px", color: "#cbd5e1", lineHeight: 1.5, transition: "all 0.5s ease" }}>
                            {currentRoute}
                        </div>
                    </div>
                    <div style={{ marginTop: "10px", display: "flex", gap: "8px" }}>
                        {[
                            { label: "ETA", value: `12 min` },
                            { label: "Dist", value: `4.5 km` },
                            { label: "Saved", value: `2.1 min` },
                        ].map((stat) => (
                            <div
                                key={stat.label}
                                style={{
                                    flex: 1,
                                    textAlign: "center",
                                    background: "rgba(0,212,255,0.06)",
                                    borderRadius: "6px",
                                    padding: "6px 4px",
                                }}
                            >
                                <div style={{ fontSize: "11px", fontWeight: 600, color: "#00d4ff" }}>{stat.value}</div>
                                <div style={{ fontSize: "9px", color: "#475569" }}>{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
