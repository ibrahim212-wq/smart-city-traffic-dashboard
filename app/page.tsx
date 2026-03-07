"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import AISidebar from "./components/AISidebar";
import ControlPanel from "./components/ControlPanel";
import SystemLogs from "./components/SystemLogs";
import Header from "./components/Header";
import AIBrainPanel from "./components/AIBrainPanel";
import { useTrafficData } from "./hooks/useTrafficData";
import { useWebSocketTraffic } from "./hooks/useWebSocketTraffic";

// Dynamically import Map to avoid SSR issues with Leaflet
const MapView = dynamic(() => import("./components/Map"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "#0a0e1a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        color: "#00d4ff",
        fontSize: "14px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          width: "20px",
          height: "20px",
          border: "2px solid rgba(0,212,255,0.2)",
          borderTop: "2px solid #00d4ff",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      Loading map...
    </div>
  ),
});

export default function DashboardPage() {
  const [logEvent, setLogEvent] = useState<string | undefined>(undefined);

  // HTTP-polled AI model data (30s cadence — intersections, routes, predictions)
  const { gcnPrediction, prophetTrend, activeRoute, aiLogEntry, intersections, routes } =
    useTrafficData();

  // Real-time WebSocket traffic data (per-frame from SUMO simulation)
  const { data: wsData, status: wsStatus } = useWebSocketTraffic();

  const handleControlAction = useCallback((action: string) => {
    setLogEvent(undefined);
    setTimeout(() => setLogEvent(action), 10);
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#0a0e1a",
      }}
    >
      {/* ── Layer 0: Full-screen Leaflet map ── */}
      <MapView intersections={intersections} routes={routes} wsData={wsData} />

      {/* ── Layer 1: Edge vignettes (pointer-events: none) ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at center, transparent 25%, rgba(10,14,26,0.55) 100%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: "130px",
          background: "linear-gradient(to bottom, rgba(10,14,26,0.75) 0%, transparent 100%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0, left: 0, right: 0,
          height: "160px",
          background: "linear-gradient(to top, rgba(10,14,26,0.8) 0%, transparent 100%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0, bottom: 0, left: 0,
          width: "380px",
          background: "linear-gradient(to right, rgba(10,14,26,0.6) 0%, transparent 100%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0, bottom: 0, right: 0,
          width: "360px",
          background: "linear-gradient(to left, rgba(10,14,26,0.6) 0%, transparent 100%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* ── Layer 2: HUD scan line ── */}
      <div
        style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 2, overflow: "hidden" }}
      >
        <div
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0,
            height: "1px",
            background: "linear-gradient(90deg, transparent 0%, rgba(0,212,255,0.5) 50%, transparent 100%)",
            animation: "scan-line 6s linear infinite",
          }}
        />
      </div>

      {/* ── Layer 10: Floating UI panels ── */}
      <div
        style={{ position: "absolute", inset: 0, zIndex: 10, pointerEvents: "none" }}
      >
        {/* ── Header (full-width top bar) ── */}
        <div style={{ pointerEvents: "all" }}>
          <Header />
        </div>

        {/* ── LEFT COLUMN: AIBrainPanel + ControlPanel ── */}
        <div
          style={{
            position: "absolute",
            top: "80px",
            bottom: "24px",
            left: "16px",
            width: "340px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            pointerEvents: "none",
            zIndex: 20,
          }}
        >
          {/* AI Brain Panel — takes all remaining vertical space */}
          <div style={{ pointerEvents: "all", flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <AIBrainPanel wsData={wsData} wsStatus={wsStatus} />
          </div>

          {/* Control Panel — pinned to bottom-left */}
          <div style={{ pointerEvents: "all", flexShrink: 0 }}>
            <ControlPanel onAction={handleControlAction} />
          </div>
        </div>

        {/* ── RIGHT COLUMN: AISidebar ── */}
        <div
          style={{
            position: "absolute",
            top: "80px",
            bottom: "24px",
            right: "16px",
            width: "320px",
            pointerEvents: "all",
            overflowY: "auto",
            zIndex: 20,
          }}
        >
          <AISidebar
            gcnPrediction={gcnPrediction}
            prophetTrend={prophetTrend}
            activeRoute={activeRoute}
          />
        </div>

        {/* ── BOTTOM CENTER: System Logs terminal ── */}
        <div
          style={{
            position: "absolute",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "480px",
            maxWidth: "calc(100vw - 740px)", // stays clear of both sidebars
            pointerEvents: "all",
            zIndex: 20,
          }}
        >
          <SystemLogs externalEvent={logEvent} aiLogEntry={aiLogEntry} />
        </div>

        {/* ── TOP CENTER: WS connection badge ── */}
        {wsStatus !== "connected" && (
          <div
            style={{
              position: "absolute",
              top: "80px",
              left: "50%",
              transform: "translateX(-50%)",
              background:
                wsStatus === "connecting"
                  ? "rgba(255,170,0,0.12)"
                  : "rgba(239,68,68,0.12)",
              border: `1px solid ${wsStatus === "connecting" ? "rgba(255,170,0,0.35)" : "rgba(239,68,68,0.35)"}`,
              padding: "7px 16px",
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: wsStatus === "connecting" ? "#ffaa00" : "#ef4444",
              fontSize: "12px",
              fontWeight: 600,
              backdropFilter: "blur(8px)",
              pointerEvents: "none",
              zIndex: 30,
            }}
          >
            <div
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: wsStatus === "connecting" ? "#ffaa00" : "#ef4444",
                boxShadow: `0 0 8px ${wsStatus === "connecting" ? "#ffaa00" : "#ef4444"}`,
              }}
            />
            {wsStatus === "connecting" ? "Connecting to WebSocket…" : "WebSocket Disconnected — Retrying"}
          </div>
        )}
      </div>
    </div>
  );
}
