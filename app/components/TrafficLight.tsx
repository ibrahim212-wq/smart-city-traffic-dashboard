import { motion } from "framer-motion";

interface TrafficLightProps {
  currentPhase: number;
}

export default function TrafficLight({ currentPhase }: TrafficLightProps) {
  const getLightState = (light: "red" | "yellow" | "green") => {
    if (light === "red" && currentPhase === 0) return "active";
    if (light === "green" && currentPhase === 1) return "active";
    return "inactive";
  };

  const lightVariants = {
    active: {
      scale: 1.1,
      boxShadow: "0 0 20px currentColor, 0 0 40px currentColor",
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    },
    inactive: {
      scale: 1,
      boxShadow: "0 0 5px rgba(255,255,255,0.1)",
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div
      style={{
        width: "80px",
        height: "200px",
        background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)",
        borderRadius: "15px",
        padding: "15px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        border: "2px solid rgba(0, 212, 255, 0.3)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
      }}
    >
      {/* Red Light */}
      <motion.div
        variants={lightVariants}
        animate={getLightState("red")}
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          background: getLightState("red") === "active" 
            ? "radial-gradient(circle, #ff4444 0%, #cc0000 100%)"
            : "radial-gradient(circle, #4a0000 0%, #2a0000 100%)",
          border: "2px solid rgba(255, 68, 68, 0.5)",
          position: "relative",
        }}
      >
        {getLightState("red") === "active" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              position: "absolute",
              inset: "-10px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,68,68,0.3) 0%, transparent 70%)",
            }}
          />
        )}
      </motion.div>

      {/* Yellow Light */}
      <motion.div
        variants={lightVariants}
        animate="inactive"
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          background: "radial-gradient(circle, #4a4a00 0%, #2a2a00 100%)",
          border: "2px solid rgba(255, 255, 0, 0.3)",
          position: "relative",
        }}
      />

      {/* Green Light */}
      <motion.div
        variants={lightVariants}
        animate={getLightState("green")}
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          background: getLightState("green") === "active"
            ? "radial-gradient(circle, #44ff44 0%, #00cc00 100%)"
            : "radial-gradient(circle, #004a00 0%, #002a00 100%)",
          border: "2px solid rgba(68, 255, 68, 0.5)",
          position: "relative",
        }}
      >
        {getLightState("green") === "active" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              position: "absolute",
              inset: "-10px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(68,255,68,0.3) 0%, transparent 70%)",
            }}
          />
        )}
      </motion.div>
    </div>
  );
}
