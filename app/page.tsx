"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import AISidebar from "./components/AISidebar";
import ControlPanel from "./components/ControlPanel";
import SystemLogs from "./components/SystemLogs";
import Header from "./components/Header";
import LiveAIPanel from "./components/LiveAIPanel";
import TrafficVisualization from "./components/TrafficVisualization";
import { useTrafficData } from "./hooks/useTrafficData";

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
  const { gcnPrediction, prophetTrend, activeRoute, aiLogEntry, intersections, routes, isSyncing, error } = useTrafficData();

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
      {/* ── Full-screen Leaflet Map (background layer) ── */}
      <MapView intersections={intersections} routes={routes} />

      {/* ── Dark gradient vignette overlay ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(10,14,26,0.6) 100%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* ── Corner gradient overlays ── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "120px",
          background:
            "linear-gradient(to bottom, rgba(10,14,26,0.7) 0%, transparent 100%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "140px",
          background:
            "linear-gradient(to top, rgba(10,14,26,0.8) 0%, transparent 100%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* ── UI Overlay Layer ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        {/* All panels get their own pointer-events */}
        <div style={{ pointerEvents: "all" }}>
          {/* Header top bar */}
          <Header />

          {/* Syncing AI Indicator */}
          {isSyncing && (
            <div
              style={{
                position: "absolute",
                top: "80px",
                left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(0, 212, 255, 0.15)",
                border: "1px solid rgba(0, 212, 255, 0.3)",
                padding: "8px 16px",
                borderRadius: "20px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#00d4ff",
                fontSize: "12px",
                fontWeight: 600,
                backdropFilter: "blur(4px)",
                animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                zIndex: 100,
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#00d4ff",
                  boxShadow: "0 0 8px #00d4ff",
                }}
              />
              Syncing AI...
            </div>
          )}

          {/* Error Indicator */}
          {error && (
            <div
              style={{
                position: "absolute",
                top: "80px",
                left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(255, 68, 68, 0.15)",
                border: "1px solid rgba(255, 68, 68, 0.3)",
                padding: "8px 16px",
                borderRadius: "20px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#ff4444",
                fontSize: "12px",
                fontWeight: 600,
                backdropFilter: "blur(4px)",
                zIndex: 100,
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#ff4444",
                  boxShadow: "0 0 8px #ff4444",
                }}
              />
              Connection Lost - Retrying
            </div>
          )}

          {/* Central Traffic Visualization - Main Focal Point */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "800px",
              maxWidth: "90vw",
              zIndex: 50,
            }}
          >
            <TrafficVisualization />
          </div>

          {/* Right sidebar: AI Insights - moved higher to avoid overlap */}
          <div
            style={{
              position: "absolute",
              top: "80px",
              right: "16px",
              width: "320px",
              maxHeight: "40vh",
              zIndex: 40,
            }}
          >
            <AISidebar
              gcnPrediction={gcnPrediction}
              prophetTrend={prophetTrend}
              activeRoute={activeRoute}
            />
          </div>

          {/* Bottom Left: Control Panel */}
          <div
            style={{
              position: "absolute",
              bottom: "24px",
              left: "24px",
              zIndex: 40,
            }}
          >
            <ControlPanel onAction={handleControlAction} />
          </div>

          {/* Bottom Right: System Logs - smaller and positioned to avoid overlap */}
          <div
            style={{
              position: "absolute",
              bottom: "24px",
              right: "24px",
              width: "400px",
              maxWidth: "40vw",
              zIndex: 40,
            }}
          >
            <SystemLogs externalEvent={logEvent} aiLogEntry={aiLogEntry} />
          </div>
        </div>
      </div>

      {/* ── HUD scan line decoration ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "1px",
            background:
              "linear-gradient(90deg, transparent 0%, rgba(0,212,255,0.5) 50%, transparent 100%)",
            animation: "scan-line 6s linear infinite",
          }}
        />
      </div>
    </div>
  );
}
