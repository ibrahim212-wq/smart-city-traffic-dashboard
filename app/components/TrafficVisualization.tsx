import { motion } from "framer-motion";
import { useLiveTrafficData } from "../hooks/useLiveTrafficData";
import TrafficLight from "./TrafficLight";
import RoadVisual from "./RoadVisual";
import AnimatedVehicles from "./AnimatedVehicles";

export default function TrafficVisualization() {
  const { data, isLoading, error } = useLiveTrafficData();

  if (isLoading) {
    return (
      <div
        style={{
          width: "100%",
          height: "400px",
          background: "rgba(10, 14, 26, 0.9)",
          border: "1px solid rgba(0, 212, 255, 0.3)",
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            border: "3px solid rgba(0, 212, 255, 0.2)",
            borderTop: "3px solid #00d4ff",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div
          style={{
            color: "#00d4ff",
            fontSize: "14px",
            fontWeight: 500,
            fontFamily: "Inter, sans-serif",
          }}
        >
          Loading Traffic Data...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        style={{
          width: "100%",
          height: "400px",
          background: "rgba(10, 14, 26, 0.9)",
          border: "1px solid rgba(255, 68, 68, 0.3)",
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: "rgba(255, 68, 68, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ff4444",
            fontSize: "24px",
          }}
        >
          !
        </div>
        <div
          style={{
            color: "#ff4444",
            fontSize: "14px",
            fontWeight: 500,
            fontFamily: "Inter, sans-serif",
            textAlign: "center",
            padding: "0 20px",
          }}
        >
          {error || "Failed to load traffic data"}
        </div>
      </div>
    );
  }

  const isTrafficLightGreen = data.current_phase === 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "800px",
        maxWidth: "90vw",
        zIndex: 50,
        background: "rgba(10, 14, 26, 0.95)",
        border: "1px solid rgba(0, 212, 255, 0.3)",
        borderRadius: "12px",
        padding: "20px",
        backdropFilter: "blur(10px)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          paddingBottom: "15px",
          borderBottom: "1px solid rgba(0, 212, 255, 0.2)",
        }}
      >
        <div>
          <h2
            style={{
              color: "#00d4ff",
              fontSize: "18px",
              fontWeight: 600,
              fontFamily: "Inter, sans-serif",
              margin: 0,
              marginBottom: "4px",
            }}
          >
            Live Traffic Visualization
          </h2>
          <p
            style={{
              color: "rgba(255, 255, 255, 0.6)",
              fontSize: "12px",
              fontFamily: "Inter, sans-serif",
              margin: 0,
            }}
          >
            Real-time traffic flow simulation • Step {data.step}
          </p>
        </div>

        {/* KPI Cards */}
        <div
          style={{
            display: "flex",
            gap: "12px",
          }}
        >
          <div
            style={{
              background: "rgba(0, 212, 255, 0.1)",
              border: "1px solid rgba(0, 212, 255, 0.3)",
              padding: "8px 12px",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                color: "#00d4ff",
                fontSize: "16px",
                fontWeight: 600,
                fontFamily: "Inter, sans-serif",
              }}
            >
              {data.total_vehicles}
            </div>
            <div
              style={{
                color: "rgba(255, 255, 255, 0.6)",
                fontSize: "10px",
                fontFamily: "Inter, sans-serif",
              }}
            >
              Total Vehicles
            </div>
          </div>

          <div
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              padding: "8px 12px",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: 500,
                fontFamily: "monospace",
              }}
            >
              {data.traffic_light_id.slice(-6)}
            </div>
            <div
              style={{
                color: "rgba(255, 255, 255, 0.6)",
                fontSize: "10px",
                fontFamily: "Inter, sans-serif",
              }}
            >
              Light ID
            </div>
          </div>
        </div>
      </div>

      {/* Main Visualization Area */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: "20px",
          alignItems: "center",
        }}
      >
        {/* Road Visualization */}
        <RoadVisual
          totalVehicles={data.total_vehicles}
          isTrafficLightGreen={isTrafficLightGreen}
        >
          <AnimatedVehicles
            isTrafficLightGreen={isTrafficLightGreen}
            totalVehicles={data.total_vehicles}
          />
        </RoadVisual>

        {/* Traffic Light */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <TrafficLight currentPhase={data.current_phase} />
          <div
            style={{
              textAlign: "center",
              padding: "8px 12px",
              background: "rgba(0, 212, 255, 0.1)",
              border: "1px solid rgba(0, 212, 255, 0.3)",
              borderRadius: "6px",
            }}
          >
            <div
              style={{
                color: isTrafficLightGreen ? "#44ff44" : "#ff4444",
                fontSize: "12px",
                fontWeight: 600,
                fontFamily: "Inter, sans-serif",
                textShadow: "0 0 10px currentColor",
              }}
            >
              {isTrafficLightGreen ? "GREEN LIGHT" : "RED LIGHT"}
            </div>
            <div
              style={{
                color: "rgba(255, 255, 255, 0.6)",
                fontSize: "10px",
                fontFamily: "Inter, sans-serif",
                marginTop: "2px",
              }}
            >
              Phase {data.current_phase}
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div
        style={{
          marginTop: "20px",
          paddingTop: "15px",
          borderTop: "1px solid rgba(0, 212, 255, 0.2)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "16px",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#44ff44",
                boxShadow: "0 0 8px #44ff44",
                animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
              }}
            />
            <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
            <span
              style={{
                color: "rgba(255, 255, 255, 0.6)",
                fontSize: "11px",
                fontFamily: "Inter, sans-serif",
              }}
            >
              Live Feed Active
            </span>
          </div>

          <div
            style={{
              color: "rgba(255, 255, 255, 0.4)",
              fontSize: "11px",
              fontFamily: "Inter, sans-serif",
            }}
          >
            Updates every 1 second
          </div>
        </div>

        <div
          style={{
            color: "rgba(255, 255, 255, 0.4)",
            fontSize: "10px",
            fontFamily: "Inter, sans-serif",
          }}
        >
          SUMO Simulation Backend
        </div>
      </div>
    </motion.div>
  );
}
