"use client";

import { useState } from "react";
import { Play, Wifi, GitBranch, Loader2, CheckCircle } from "lucide-react";

type ButtonState = "idle" | "loading" | "success";

interface ControlButton {
    id: string;
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
    loadingIcon: React.ReactNode;
    successIcon: React.ReactNode;
    accentColor: string;
    glowColor: string;
}

const BUTTONS: ControlButton[] = [
    {
        id: "sumo",
        label: "Start SUMO Simulation",
        shortLabel: "SUMO Sim",
        icon: <Play size={14} />,
        loadingIcon: <Loader2 size={14} className="animate-spin" />,
        successIcon: <CheckCircle size={14} />,
        accentColor: "#00ff88",
        glowColor: "rgba(0,255,136,0.3)",
    },
    {
        id: "fetch",
        label: "Fetch Live Traffic API",
        shortLabel: "Traffic API",
        icon: <Wifi size={14} />,
        loadingIcon: <Loader2 size={14} className="animate-spin" />,
        successIcon: <CheckCircle size={14} />,
        accentColor: "#00d4ff",
        glowColor: "rgba(0,212,255,0.3)",
    },
    {
        id: "reroute",
        label: "Trigger AI Rerouting",
        shortLabel: "AI Reroute",
        icon: <GitBranch size={14} />,
        loadingIcon: <Loader2 size={14} className="animate-spin" />,
        successIcon: <CheckCircle size={14} />,
        accentColor: "#a78bfa",
        glowColor: "rgba(167,139,250,0.3)",
    },
];

interface ControlPanelProps {
    onAction?: (action: string) => void;
}

export default function ControlPanel({ onAction }: ControlPanelProps) {
    const [states, setStates] = useState<Record<string, ButtonState>>({
        sumo: "idle",
        fetch: "idle",
        reroute: "idle",
    });

    const handleClick = (id: string) => {
        if (states[id] !== "idle") return;
        setStates((s) => ({ ...s, [id]: "loading" }));
        onAction?.(id);
        setTimeout(() => {
            setStates((s) => ({ ...s, [id]: "success" }));
            setTimeout(() => {
                setStates((s) => ({ ...s, [id]: "idle" }));
            }, 2000);
        }, 1800);
    };

    return (
        <div
            className="glass-panel animate-slide-in-left"
            style={{
                position: "absolute",
                bottom: "24px",
                left: "16px",
                padding: "20px",
                zIndex: 100,
                minWidth: "280px",
            }}
        >
            {/* Panel Header */}
            <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                    Control Panel
                </div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#cbd5e1", marginTop: "2px" }}>
                    System Operations
                </div>
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {BUTTONS.map((btn) => {
                    const state = states[btn.id];
                    const isLoading = state === "loading";
                    const isSuccess = state === "success";

                    const displayIcon = isLoading
                        ? btn.loadingIcon
                        : isSuccess
                            ? btn.successIcon
                            : btn.icon;

                    return (
                        <button
                            key={btn.id}
                            onClick={() => handleClick(btn.id)}
                            disabled={isLoading || isSuccess}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                padding: "11px 14px",
                                borderRadius: "10px",
                                border: `1px solid ${isSuccess ? btn.accentColor + "80" : btn.accentColor + "30"}`,
                                background: isSuccess
                                    ? `${btn.accentColor}15`
                                    : isLoading
                                        ? `${btn.accentColor}08`
                                        : "rgba(255,255,255,0.04)",
                                color: isSuccess || isLoading ? btn.accentColor : "#94a3b8",
                                fontSize: "12px",
                                fontWeight: 500,
                                cursor: isLoading || isSuccess ? "default" : "pointer",
                                transition: "all 0.25s ease",
                                boxShadow: isSuccess ? `0 0 16px ${btn.glowColor}` : "none",
                                fontFamily: "inherit",
                                width: "100%",
                                textAlign: "left",
                            }}
                            onMouseEnter={(e) => {
                                if (state === "idle") {
                                    (e.currentTarget as HTMLButtonElement).style.background = `${btn.accentColor}12`;
                                    (e.currentTarget as HTMLButtonElement).style.borderColor = `${btn.accentColor}60`;
                                    (e.currentTarget as HTMLButtonElement).style.color = btn.accentColor;
                                    (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 12px ${btn.glowColor}`;
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (state === "idle") {
                                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)";
                                    (e.currentTarget as HTMLButtonElement).style.borderColor = `${btn.accentColor}30`;
                                    (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8";
                                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
                                }
                            }}
                        >
                            <div style={{ color: isSuccess ? btn.accentColor : "inherit" }}>{displayIcon}</div>
                            <span>{btn.label}</span>
                            {isSuccess && (
                                <span style={{ marginLeft: "auto", fontSize: "10px", color: btn.accentColor }}>✓ Done</span>
                            )}
                            {isLoading && (
                                <span style={{ marginLeft: "auto", fontSize: "10px", color: btn.accentColor }}>Running...</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Status indicator */}
            <div
                style={{
                    marginTop: "14px",
                    paddingTop: "14px",
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                }}
            >
                <div
                    style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "#00ff88",
                        boxShadow: "0 0 6px #00ff88",
                    }}
                />
                <span style={{ fontSize: "10px", color: "#475569" }}>All systems operational</span>
            </div>
        </div>
    );
}
