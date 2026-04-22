"use client";

import * as React from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  type HTMLMotionProps,
  type MotionValue,
  type SpringOptions,
} from "motion/react";

import { getStrictContext } from "@/lib/get-strict-context";

type TiltContextType = {
  sRX: MotionValue<number>;
  sRY: MotionValue<number>;
  transition: SpringOptions;
};

const [TiltProvider, useTilt] = getStrictContext<TiltContextType>("TiltContext");

export type TiltProps = HTMLMotionProps<"div"> & {
  maxTilt?: number;
  perspective?: number;
  transition?: SpringOptions;
};

export function Tilt({
  maxTilt = 10,
  perspective = 800,
  style,
  transition = {
    stiffness: 300,
    damping: 25,
    mass: 0.5,
  },
  onMouseMove,
  onMouseLeave,
  ...props
}: TiltProps) {
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);

  const springRotateX = useSpring(rotateX, transition);
  const springRotateY = useSpring(rotateY, transition);

  const handleMouseMove = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      onMouseMove?.(event);

      const rect = event.currentTarget.getBoundingClientRect();
      const positionX = (event.clientX - rect.left) / rect.width;
      const positionY = (event.clientY - rect.top) / rect.height;
      const normalizedX = positionX * 2 - 1;
      const normalizedY = positionY * 2 - 1;

      rotateY.set(normalizedX * maxTilt);
      rotateX.set(-normalizedY * maxTilt);
    },
    [maxTilt, onMouseMove, rotateX, rotateY],
  );

  const handleMouseLeave = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      onMouseLeave?.(event);
      rotateX.set(0);
      rotateY.set(0);
    },
    [onMouseLeave, rotateX, rotateY],
  );

  return (
    <TiltProvider
      value={{
        sRX: springRotateX,
        sRY: springRotateY,
        transition,
      }}
    >
      <motion.div
        style={{
          perspective,
          transformStyle: "preserve-3d",
          willChange: "transform",
          ...style,
        }}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        {...props}
      />
    </TiltProvider>
  );
}

export type TiltContentProps = HTMLMotionProps<"div">;

export function TiltContent({
  children,
  style,
  transition,
  ...props
}: TiltContentProps) {
  const { sRX, sRY, transition: tiltTransition } = useTilt();

  return (
    <motion.div
      style={{
        rotateX: sRX,
        rotateY: sRY,
        willChange: "transform",
        ...style,
      }}
      transition={transition ?? tiltTransition}
      {...props}
    >
      {children}
    </motion.div>
  );
}
