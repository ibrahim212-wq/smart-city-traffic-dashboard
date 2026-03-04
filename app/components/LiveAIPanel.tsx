"use client";

import { Activity, Server } from "lucide-react";
import { IntersectionData } from "../hooks/useTrafficData";

interface LiveAIPanelProps {
    intersections: IntersectionData[];
}

export default function LiveAIPanel({ intersections }: LiveAIPanelProps) {
    return (
        <div
            className="animate-slide-in-left"
            style={{
                width: "350px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                height: "100%",
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
                        background: "#ffaa00",
                        boxShadow: "0 0 8px #ffaa00",
                        animation: "pulse-yellow 2s infinite",
                    }}
                />
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    Live AI Traffic Controls
                </span>
                <Server size={14} color="#64748b" style={{ marginLeft: "auto" }} />
            </div>

            {/* Scrollable List */}
            <div
                className="scrollable-container hide-scrollbar"
                style={{
                    flex: 1,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    paddingBottom: "20px"
                }}
            >
                {intersections.map((intersection) => {
                    const isGreen = intersection.light_state.toLowerCase() === "green";
                    const isRed = intersection.light_state.toLowerCase() === "red";

                    const lightColor = isGreen ? "#00ff88" : isRed ? "#ff4444" : "#ffaa00";

                    return (
                        <div key={intersection.id} className="glass-panel" style={{ padding: "16px", transition: "all 0.3s ease" }}>
                            {/* Intersection Header */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                <div style={{ fontSize: "13px", fontWeight: 600, color: "#e2e8f0" }}>
                                    {intersection.name}
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        background: `rgba(${isGreen ? "0,255,136" : isRed ? "255,68,68" : "255,170,0"},0.1)`,
                                        padding: "4px 8px",
                                        borderRadius: "6px",
                                        border: `1px solid ${lightColor}40`,
                                    }}
                                >
                                    <div
                                        style={{
                                            width: "10px",
                                            height: "10px",
                                            borderRadius: "50%",
                                            background: lightColor,
                                            boxShadow: `0 0 8px ${lightColor}`,
                                        }}
                                    />
                                    <span style={{ fontSize: "12px", fontWeight: 700, color: lightColor }}>
                                        {intersection.timer}s
                                    </span>
                                </div>
                            </div>

                            {/* Reasoning Section */}
                            <div
                                style={{
                                    background: "rgba(0,0,0,0.2)",
                                    border: "1px solid rgba(255,255,255,0.05)",
                                    borderRadius: "8px",
                                    padding: "10px",
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "8px"
                                }}
                            >
                                <Activity size={12} color="#94a3b8" style={{ marginTop: "3px", flexShrink: 0 }} />
                                <div style={{ fontSize: "11px", color: "#cbd5e1", lineHeight: 1.5 }}>
                                    <span style={{ color: "#94a3b8", fontWeight: 600, marginRight: "4px" }}>Decision:</span>
                                    {intersection.reasoning}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {intersections.length === 0 && (
                    <div style={{ textAlign: "center", color: "#64748b", fontSize: "12px", padding: "20px" }}>
                        Awaiting live intersection data...
                    </div>
                )}
            </div>

            <style>{`
                .hide-scrollbar::-webkit-scrollbar {
                    width: 0px;
                    background: transparent;
                }
            `}</style>
        </div>
    );
}
