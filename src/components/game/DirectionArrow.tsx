"use client";

import { useRef, useEffect } from "react";
import { ArrowHelper, Vector3, Object3D } from "three";
import { useFrame } from "@react-three/fiber";

interface DirectionArrowProps {
  power: number;
  angle: number;
  position: [number, number, number];
  visible: boolean;
}

const DirectionArrow = ({
  power,
  angle,
  position,
  visible,
}: DirectionArrowProps) => {
  const arrowRef = useRef<Object3D>(null);

  // Update the arrow on every frame
  useFrame(() => {
    if (!arrowRef.current || !visible) return;

    // Convert angle from degrees to radians
    const angleRad = (angle * Math.PI) / 180;

    // Calculate direction vector based on angle
    // Match the updated coordinate system in GolfBall.tsx
    // For angle 0, we want to point toward the hole (negative Z)
    const dirX = Math.sin(angleRad);
    const dirZ = -Math.cos(angleRad);

    // Update arrow direction
    (arrowRef.current as ArrowHelper).setDirection(new Vector3(dirX, 0, dirZ));

    // Scale length by power (normalizing power to a reasonable range)
    const length = (power / 100) * 5; // Max length of 5 units when power is 100
    (arrowRef.current as ArrowHelper).setLength(
      length,
      length * 0.1,
      length * 0.1
    );
  });

  return visible ? (
    <arrowHelper
      ref={arrowRef}
      args={[
        // Initial direction toward the hole (same as camera view direction)
        new Vector3(0, 0, -1),
        // Position slightly above the ground
        new Vector3(position[0], position[1], position[2]),
        // Initial length based on power
        (power / 100) * 5,
        // Color
        0xff0000,
        // Head length (20% of total length)
        (power / 100) * 1,
        // Head width (10% of total length)
        (power / 100) * 0.5,
      ]}
    />
  ) : null;
};

export default DirectionArrow;
