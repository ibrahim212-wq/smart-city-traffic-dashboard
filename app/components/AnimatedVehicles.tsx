import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface VehicleProps {
  index: number;
  isTrafficLightGreen: boolean;
  totalVehicles: number;
}

function Vehicle({ index, isTrafficLightGreen, totalVehicles }: VehicleProps) {
  const stopLinePosition = 75; // percentage from left where stop line is
  
  // Calculate vehicle position based on traffic light state
  const getVehiclePosition = () => {
    if (!isTrafficLightGreen) {
      // Stack vehicles at stop line when red
      const maxStacked = 8;
      const stackPosition = Math.min(index, maxStacked - 1);
      return stopLinePosition - (stackPosition * 8); // 8% spacing between stacked vehicles
    } else {
      // Vehicles move freely when green
      return (index * 15) % 100; // Spread vehicles across the road
    }
  };

  const vehicleColor = totalVehicles > 1000 ? "#ff6b6b" : "#4ecdc4";
  
  return (
    <motion.div
      animate={{
        x: `${getVehiclePosition()}%`,
        y: ["45%", "55%", "45%"], // Subtle vertical movement for realism
      }}
      transition={{
        x: {
          duration: isTrafficLightGreen ? 3 : 0.5,
          ease: isTrafficLightGreen ? "linear" : "easeOut",
          repeat: isTrafficLightGreen ? Infinity : 0,
        },
        y: {
          duration: 2 + index * 0.2,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "reverse",
        },
      }}
      style={{
        position: "absolute",
        width: "20px",
        height: "12px",
        background: `linear-gradient(90deg, ${vehicleColor} 0%, ${vehicleColor}dd 100%)`,
        borderRadius: "4px",
        border: "1px solid rgba(255, 255, 255, 0.3)",
        boxShadow: `0 2px 8px ${vehicleColor}66`,
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 5 - index, // Earlier vehicles appear behind later ones
      }}
    >
      {/* Headlights */}
      <div
        style={{
          position: "absolute",
          right: "-2px",
          top: "50%",
          transform: "translateY(-50%)",
          width: "4px",
          height: "6px",
          background: "rgba(255, 255, 200, 0.8)",
          borderRadius: "50%",
          boxShadow: "0 0 4px rgba(255, 255, 200, 0.6)",
        }}
      />
    </motion.div>
  );
}

interface AnimatedVehiclesProps {
  isTrafficLightGreen: boolean;
  totalVehicles: number;
}

export default function AnimatedVehicles({ isTrafficLightGreen, totalVehicles }: AnimatedVehiclesProps) {
  const [vehicleCount, setVehicleCount] = useState(8);

  // Adjust vehicle count based on total vehicles
  useEffect(() => {
    const count = Math.min(Math.max(3, Math.floor(totalVehicles / 200)), 12);
    setVehicleCount(count);
  }, [totalVehicles]);

  return (
    <>
      {Array.from({ length: vehicleCount }, (_, index) => (
        <Vehicle
          key={index}
          index={index}
          isTrafficLightGreen={isTrafficLightGreen}
          totalVehicles={totalVehicles}
        />
      ))}
    </>
  );
}
