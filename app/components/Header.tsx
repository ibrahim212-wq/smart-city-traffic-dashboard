"use client";

import { useEffect, useState } from "react";
import { Wifi, Server, AlertTriangle, Clock, MapPin } from "lucide-react";

interface StatItem {
    label: string;
    value: string;
    unit?: string;
    color: string;
    trend?: "up" | "down" | "stable";
}

export default function Header() {
    const [time, setTime] = useState("");
    const [stats, setStats] = useState<StatItem[]>([
        { label: "Active Vehicles", value: "2,847", color: "#00d4ff", trend: "up" },
        { label: "Avg Speed", value: "42", unit: "km/h", color: "#00ff88", trend: "stable" },
        { label: "Incidents", value: "3", color: "#ff6b35", trend: "down" },
        { label: "AI Accuracy", value: "91.2", unit: "%", color: "#a78bfa", trend: "up" },
    ]);

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setTime(
                now.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: false,
                    timeZone: "Asia/Riyadh",
                }) + " AST"
            );
        };
        updateTime();
        const t = setInterval(updateTime, 1000);
        return () => clearInterval(t);
    }, []);

    // Simulate fluctuating stats
    useEffect(() => {
        const interval = setInterval(() => {
            setStats((prev) =>
                prev.map((s) => {
                    if (s.label === "Active Vehicles") {
                        const delta = Math.floor(Math.random() * 40) - 20;
                        const base = parseInt(s.value.replace(",", ""));
                        const newVal = Math.max(2700, Math.min(3000, base + delta));
                        return { ...s, value: newVal.toLocaleString() };
                    }
                    if (s.label === "Avg Speed") {
                        const newVal = Math.max(28, Math.min(65, parseInt(s.value) + Math.floor(Math.random() * 6) - 3));
                        return { ...s, value: newVal.toString() };
                    }
                    if (s.label === "AI Accuracy") {
                        const newVal = (88 + Math.random() * 8).toFixed(1);
                        return { ...s, value: newVal };
                    }
                    return s;
                })
            );
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div
            className="glass-panel animate-fade-in"
            style={{
                position: "absolute",
                top: "16px",
                left: "16px",
                right: "16px",
                padding: "12px 20px",
                zIndex: 100,
                display: "flex",
                alignItems: "center",
                gap: "24px",
                borderRadius: "14px",
            }}
        >
            {/* Logo / Title */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                <div
                    style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        background: "linear-gradient(135deg, #00d4ff20, #7c3aed20)",
                        border: "1px solid rgba(0,212,255,0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "18px",
                    }}
                >
                    🏙️
                </div>
                <div>
                    <div
                        style={{
                            fontSize: "14px",
                            fontWeight: 700,
                            background: "linear-gradient(90deg, #00d4ff, #a78bfa)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                            letterSpacing: "0.02em",
                        }}
                    >
                        SmartCity AI
                    </div>
                    <div style={{ fontSize: "9px", color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                        Traffic Management System
                    </div>
                </div>
            </div>

            {/* Divider */}
            <div style={{ width: "1px", height: "32px", background: "rgba(255,255,255,0.06)", flexShrink: 0 }} />

            {/* Location */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                <MapPin size={12} color="#94a3b8" />
                <span style={{ fontSize: "11px", color: "#64748b" }}>Riyadh, Saudi Arabia</span>
            </div>

            {/* Stats */}
            <div style={{ display: "flex", gap: "20px", flex: 1, justifyContent: "center" }}>
                {stats.map((stat) => (
                    <div key={stat.label} style={{ textAlign: "center" }}>
                        <div
                            style={{
                                fontSize: "16px",
                                fontWeight: 700,
                                color: stat.color,
                                fontVariantNumeric: "tabular-nums",
                                transition: "color 0.3s ease",
                            }}
                        >
                            {stat.value}
                            {stat.unit && (
                                <span style={{ fontSize: "10px", fontWeight: 400, marginLeft: "1px" }}>{stat.unit}</span>
                            )}
                        </div>
                        <div style={{ fontSize: "9px", color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            {stat.label}
                        </div>
                    </div>
                ))}
            </div>

            {/* Right side: status indicators */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px", flexShrink: 0 }}>
                {/* API Status */}
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <Wifi size={11} color="#00ff88" />
                    <span style={{ fontSize: "10px", color: "#64748b" }}>API Live</span>
                </div>

                {/* Server */}
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <Server size={11} color="#00d4ff" />
                    <span style={{ fontSize: "10px", color: "#64748b" }}>AI Online</span>
                </div>

                {/* Alert */}
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <AlertTriangle size={11} color="#ff6b35" />
                    <span style={{ fontSize: "10px", color: "#64748b" }}>3 Alerts</span>
                </div>

                {/* Divider */}
                <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.06)" }} />

                {/* Clock */}
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <Clock size={11} color="#94a3b8" />
                    <span
                        style={{
                            fontSize: "11px",
                            color: "#94a3b8",
                            fontFamily: "'JetBrains Mono', monospace",
                            fontVariantNumeric: "tabular-nums",
                        }}
                    >
                        {time}
                    </span>
                </div>
            </div>
        </div>
    );
}
