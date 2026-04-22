"use client";

import React from "react";
import { motion, useMotionValue } from "motion/react";

export function SpringProvider({ children }) {
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {children}
    </div>
  );
}

export function Spring({ className }) {
  return (
    <motion.div
      className={className}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 10 }}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          border: "2px solid rgba(0, 153, 204, 0.4)",
          borderRadius: "50%",
        }}
      />
    </motion.div>
  );
}

export function SpringElement({ children, className }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  return (
    <div style={{ position: "relative" }}>
      <svg
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          overflow: "visible",
          pointerEvents: "none",
          zIndex: 10,
        }}
      >
        <motion.line
          x1={0}
          y1={0}
          x2={x}
          y2={y}
          stroke="rgba(2, 132, 199, 0.8)"
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray="6 4"
        />
      </svg>
      <motion.div
        className={className}
        style={{ x, y, position: "relative", cursor: "grab", zIndex: 50 }}
        drag
        dragSnapToOrigin
        whileDrag={{ scale: 1.1, cursor: "grabbing" }}
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
