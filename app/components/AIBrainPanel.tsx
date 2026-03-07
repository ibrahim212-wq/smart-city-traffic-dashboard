"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Zap } from "lucide-react";
import { WsTrafficData, WsConnectionStatus } from "../hooks/useWebSocketTraffic";

interface AILogEntry {
  id: number;
  icon: string;
  model: string;
  modelColor: string;
  message: string;
  timestamp: string;
}

interface AIBrainPanelProps {
  wsData: WsTrafficData | null;
  wsStatus: WsConnectionStatus;
}

function getTime(): string {
  return new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

const SEED_ENTRIES: Omit<AILogEntry, "id" | "timestamp">[] = [
  {
    icon: "🧠",
    model: "GCN + LSTM",
    modelColor: "#a78bfa",
    message: "Loaded spatial graph: 247 nodes, 418 edges across Riyadh network.",
  },
  {
    icon: "📡",
    model: "System",
    modelColor: "#00d4ff",
    message: "WebSocket stream established — awaiting live simulation frames.",
  },
  {
    icon: "📈",
    model: "Prophet",
    modelColor: "#fb923c",
    message: "Time-series model warmed up. Rush-hour pattern detected for 14:00–16:00.",
  },
  {
    icon: "🗺️",
    model: "Dijkstra",
    modelColor: "#00ff88",
    message: "Initial shortest-path graph computed. Baseline route: King Fahd Rd → Olaya St.",
  },
];

const PERIODIC_ENTRIES: Omit<AILogEntry, "id" | "timestamp">[] = [
  {
    icon: "📈",
    model: "Prophet",
    modelColor: "#fb923c",
    message: "Seasonality component update: afternoon demand peak in 8 min.",
  },
  {
    icon: "🗺️",
    model: "Dijkstra",
    modelColor: "#00ff88",
    message: "Rerouting 47 vehicles via Olaya St bypass — saves 2.1 min avg.",
  },
  {
    icon: "🧠",
    model: "GCN + LSTM",
    modelColor: "#a78bfa",
    message: "Spatial attention weights updated. High-pressure nodes: #12, #31, #58.",
  },
  {
    icon: "🗺️",
    model: "Dijkstra",
    modelColor: "#00ff88",
    message: "Alternative path via Prince Sultan Rd added to active route table.",
  },
  {
    icon: "📈",
    model: "Prophet",
    modelColor: "#fb923c",
    message: "Forecast horizon extended to 30 min. Confidence interval: ±6%.",
  },
  {
    icon: "🧠",
    model: "GCN + LSTM",
    modelColor: "#a78bfa",
    message: "Recurrent hidden state updated — 3-hop neighborhood re-encoded.",
  },
  {
    icon: "🗺️",
    model: "Dijkstra",
    modelColor: "#00ff88",
    message: "Rerouting 62 vehicles to Tahlia St corridor — 1.8 min saved.",
  },
];

export default function AIBrainPanel({ wsData, wsStatus }: AIBrainPanelProps) {
  const [entries, setEntries] = useState<AILogEntry[]>([]);
  const idRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevPhaseRef = useRef<number | null>(null);
  const prevVehicleBandRef = useRef<string | null>(null);
  const periodicIdxRef = useRef(0);

  const addEntry = (e: Omit<AILogEntry, "id" | "timestamp">) => {
    setEntries(prev => [
      { ...e, id: ++idRef.current, timestamp: getTime() },
      ...prev.slice(0, 49),
    ]);
  };

  // Seed entries on mount
  useEffect(() => {
    let i = 0;
    const seed = () => {
      if (i < SEED_ENTRIES.length) {
        addEntry(SEED_ENTRIES[i]);
        i++;
        setTimeout(seed, 500);
      }
    };
    setTimeout(seed, 300);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React to live WebSocket data changes
  useEffect(() => {
    if (!wsData) return;

    const { current_phase, total_vehicles } = wsData;

    // Phase change → Decision log
    if (prevPhaseRef.current !== null && prevPhaseRef.current !== current_phase) {
      if (current_phase === 1) {
        addEntry({
          icon: "🚦",
          model: "Decision Engine",
          modelColor: "#00ff88",
          message: `Switching to GREEN phase on intersection #${wsData.traffic_light_id.slice(-5)}. Estimated queue clearance: 18s.`,
        });
      } else {
        addEntry({
          icon: "🚦",
          model: "Decision Engine",
          modelColor: "#ef4444",
          message: `Switching to RED phase. Holding cross-traffic flow for 22s to balance throughput.`,
        });
      }
    }
    prevPhaseRef.current = current_phase;

    // Congestion band change → LSTM + GCN alert
    const band = total_vehicles > 1000 ? "critical" : total_vehicles > 500 ? "moderate" : "low";
    if (prevVehicleBandRef.current !== null && prevVehicleBandRef.current !== band) {
      if (band === "critical") {
        addEntry({
          icon: "🔴",
          model: "LSTM + GCN",
          modelColor: "#a78bfa",
          message: `Predicted 85% congestion spike — ${total_vehicles} vehicles in monitored zone. Extending green phase by +15s.`,
        });
      } else if (band === "moderate") {
        addEntry({
          icon: "🟡",
          model: "LSTM + GCN",
          modelColor: "#a78bfa",
          message: `Congestion easing to moderate. ${total_vehicles} vehicles — standard phase timing restored.`,
        });
      } else {
        addEntry({
          icon: "🟢",
          model: "LSTM + GCN",
          modelColor: "#a78bfa",
          message: `Traffic flow normalized. ${total_vehicles} vehicles — switching to energy-save cycle.`,
        });
      }
    }
    prevVehicleBandRef.current = band;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsData]);

  // Periodic autonomous AI log entries
  useEffect(() => {
    const interval = setInterval(() => {
      const entry = PERIODIC_ENTRIES[periodicIdxRef.current % PERIODIC_ENTRIES.length];
      addEntry(entry);
      periodicIdxRef.current++;
    }, 7000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll to top (newest entry is on top)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [entries]);

  const statusColor =
    wsStatus === "connected" ? "#00ff88" : wsStatus === "connecting" ? "#ffaa00" : "#ef4444";
  const statusLabel =
    wsStatus === "connected" ? "WS Live" : wsStatus === "connecting" ? "Connecting…" : "Disconnected";

  return (
    <div
      className="glass-panel animate-slide-in-left"
      style={{
        width: "340px",
        display: "flex",
        flexDirection: "column",
        gap: 0,
        overflow: "hidden",
        maxHeight: "100%",
      }}
    >
      {/* Panel Header */}
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid rgba(0,212,255,0.1)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(0,212,255,0.2))",
            border: "1px solid rgba(124,58,237,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Brain size={15} color="#a78bfa" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "#e2e8f0",
              letterSpacing: "0.02em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Live AI Decision Engine
          </div>
          <div style={{ fontSize: "10px", color: "#475569", marginTop: "1px" }}>
            King Fahd Rd · Riyadh
          </div>
        </div>
        {/* WS Status badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            background: `rgba(${wsStatus === "connected" ? "0,255,136" : wsStatus === "connecting" ? "255,170,0" : "239,68,68"},0.1)`,
            border: `1px solid ${statusColor}40`,
            borderRadius: "20px",
            padding: "3px 8px",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: statusColor,
              boxShadow: `0 0 6px ${statusColor}`,
              animation: wsStatus === "connected" ? "pulse-cyan 2s infinite" : "none",
            }}
          />
          <span style={{ fontSize: "9px", fontWeight: 600, color: statusColor }}>
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Live data KPIs */}
      {wsData && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "1px",
            background: "rgba(0,212,255,0.06)",
            borderBottom: "1px solid rgba(0,212,255,0.1)",
            flexShrink: 0,
          }}
        >
          {[
            { label: "Step", value: wsData.step, color: "#00d4ff" },
            {
              label: "Vehicles",
              value: wsData.total_vehicles.toLocaleString(),
              color:
                wsData.total_vehicles > 1000
                  ? "#ef4444"
                  : wsData.total_vehicles > 500
                  ? "#f59e0b"
                  : "#00ff88",
            },
            {
              label: "Phase",
              value: wsData.current_phase === 1 ? "GREEN" : "RED",
              color: wsData.current_phase === 1 ? "#00ff88" : "#ef4444",
            },
          ].map((kpi) => (
            <div
              key={kpi.label}
              style={{
                padding: "8px 10px",
                textAlign: "center",
                background: "rgba(10,20,40,0.4)",
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: kpi.color,
                  fontVariantNumeric: "tabular-nums",
                  textShadow: `0 0 10px ${kpi.color}60`,
                  transition: "color 0.4s ease",
                }}
              >
                {kpi.value}
              </div>
              <div style={{ fontSize: "9px", color: "#475569", marginTop: "1px" }}>
                {kpi.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Log section header */}
      <div
        style={{
          padding: "8px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          flexShrink: 0,
        }}
      >
        <Zap size={10} color="#ffaa00" />
        <span
          style={{
            fontSize: "9px",
            fontWeight: 600,
            color: "#475569",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          Decision Log
        </span>
        <div
          style={{
            marginLeft: "auto",
            background: "rgba(0,212,255,0.1)",
            border: "1px solid rgba(0,212,255,0.2)",
            borderRadius: "10px",
            padding: "1px 6px",
            fontSize: "9px",
            color: "#00d4ff",
          }}
        >
          {entries.length} entries
        </div>
      </div>

      {/* Scrollable log */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "10px 12px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          minHeight: 0,
        }}
      >
        <AnimatePresence initial={false}>
          {entries.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: -12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${entry.modelColor}18`,
                borderLeft: `3px solid ${entry.modelColor}`,
                borderRadius: "8px",
                padding: "9px 10px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginBottom: "5px",
                }}
              >
                <span style={{ fontSize: "13px" }}>{entry.icon}</span>
                <span
                  style={{
                    fontSize: "9px",
                    fontWeight: 700,
                    color: entry.modelColor,
                    background: `${entry.modelColor}18`,
                    border: `1px solid ${entry.modelColor}30`,
                    borderRadius: "4px",
                    padding: "1px 5px",
                    letterSpacing: "0.04em",
                  }}
                >
                  {entry.model}
                </span>
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: "9px",
                    color: "#334155",
                    fontFamily: "monospace",
                  }}
                >
                  {entry.timestamp}
                </span>
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "#94a3b8",
                  lineHeight: 1.5,
                }}
              >
                {entry.message}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {entries.length === 0 && (
          <div
            style={{
              textAlign: "center",
              color: "#334155",
              fontSize: "12px",
              padding: "20px",
            }}
          >
            Initializing AI engine…
          </div>
        )}
      </div>
    </div>
  );
}
