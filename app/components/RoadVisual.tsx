import { motion } from "framer-motion";

interface RoadVisualProps {
  totalVehicles: number;
  isTrafficLightGreen: boolean;
  children: React.ReactNode;
}

export default function RoadVisual({ totalVehicles, isTrafficLightGreen, children }: RoadVisualProps) {
  const isCongested = totalVehicles > 1000;
  const roadColor = isCongested 
    ? "rgba(255, 68, 68, 0.3)" 
    : "rgba(68, 255, 68, 0.2)";

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "160px", // Increased from 120px for better visibility
        background: roadColor,
        border: "1px solid rgba(0, 212, 255, 0.3)",
        borderRadius: "8px",
        overflow: "hidden",
        transition: "background-color 0.5s ease-in-out",
      }}
    >
      {/* Road markings - dashed center line */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: 0,
          right: 0,
          height: "4px", // Increased from 2px
          transform: "translateY(-50%)",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            background: `repeating-linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.8) 0px,
              rgba(255, 255, 255, 0.8) 25px,
              transparent 25px,
              transparent 50px
            )`,
          }}
        />
      </div>

      {/* Stop line at intersection */}
      <div
        style={{
          position: "absolute",
          right: "100px",
          top: 0,
          bottom: 0,
          width: "6px", // Increased from 4px
          background: "rgba(255, 255, 255, 0.9)",
          boxShadow: "0 0 15px rgba(255, 255, 255, 0.6)",
        }}
      />

      {/* Status overlay */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          position: "absolute",
          top: "10px",
          left: "15px",
          background: "rgba(10, 14, 26, 0.9)",
          padding: "8px 12px",
          borderRadius: "6px",
          border: "1px solid rgba(0, 212, 255, 0.3)",
          backdropFilter: "blur(4px)",
          zIndex: 10,
        }}
      >
        <div
          style={{
            color: isCongested ? "#ff4444" : "#44ff44",
            fontSize: "12px",
            fontWeight: 600,
            fontFamily: "Inter, sans-serif",
            textShadow: "0 0 10px currentColor",
          }}
        >
          Status: {isCongested ? "Highly Congested" : "Normal"}
        </div>
      </motion.div>

      {/* Vehicle counter */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        style={{
          position: "absolute",
          bottom: "10px",
          left: "15px",
          background: "rgba(10, 14, 26, 0.9)",
          padding: "8px 12px",
          borderRadius: "6px",
          border: "1px solid rgba(0, 212, 255, 0.3)",
          backdropFilter: "blur(4px)",
          zIndex: 10,
        }}
      >
        <div
          style={{
            color: "#00d4ff",
            fontSize: "11px",
            fontWeight: 500,
            fontFamily: "Inter, sans-serif",
          }}
        >
          Vehicles in Area: ~{totalVehicles}
        </div>
      </motion.div>

      {/* Vehicles container */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
        }}
      >
        {children}
      </div>

      {/* Intersection indicator */}
      <div
        style={{
          position: "absolute",
          right: "20px",
          top: "50%",
          transform: "translateY(-50%)",
          width: "60px",
          height: "60px",
          background: "rgba(0, 212, 255, 0.1)",
          border: "2px solid rgba(0, 212, 255, 0.5)",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "10px",
          color: "#00d4ff",
          fontWeight: 600,
          fontFamily: "Inter, sans-serif",
        }}
      >
        INTERSECTION
      </div>
    </div>
  );
}
