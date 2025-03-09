"use client";

import { useRef, useState, useImperativeHandle, forwardRef, useEffect } from 'react';
import { Mesh, Vector3 } from 'three';
import { useSphere, useContactMaterial } from '@react-three/cannon';
import { useFrame } from '@react-three/fiber';

// Define the props type for the GolfBall component
interface GolfBallProps {
  position: [number, number, number];
  name?: string; // Optional name for identification during collisions
  onFlagCollision?: (velocity: number) => void; // Callback for flag collisions
}

const GolfBall = forwardRef<any, GolfBallProps>(({ position, name = "golfBall", onFlagCollision }, ref) => {
  // State for tracking if the ball is in motion
  const [isMoving, setIsMoving] = useState(false);
  
  // Create a sphere physics body for the golf ball with optimized physics properties
  const [ballRef, api] = useSphere(() => ({
    mass: 1,
    position: [position[0], position[1], position[2]], // Use exact position
    args: [0.5], // radius of the ball's physics collision (increased from 0.2 to make it easier to hit with the car)
    material: {
      friction: 0.3, 
      restitution: 0.4, // Some bounciness for better feedback
    },
    onCollide: (e) => {
      console.log("Ball collision detected with:", e.body?.name || e.body?.userData?.type || 'unknown object');
      
      // Check if we collided with the car
      if (e.body?.userData?.type === 'car') {
        console.log("Ball collided with car");
      }
      
      // Check if we collided with the flagpole
      const target = e.body?.userData;
      if (target?.type === 'flagpole') {
        // Get current velocity to determine if it's a win or a bounce
        const speed = velocity.current.length();
        console.log("Flag collision at speed:", speed);
        
        // Trigger the callback if provided
        if (onFlagCollision) {
          onFlagCollision(speed);
        }
      }
    },
    linearDamping: 0.3,      // Resistance to linear motion
    angularDamping: 0.2,     // Resistance to rotation
    sleepSpeedLimit: 0.05,   // Speed below which the ball is considered stopped
    allowSleep: false,       // Keep physics active even when stopped
    fixedRotation: false,    // Allow rotation based on forces
    linearFactor: [1, 1, 1], // Allow movement in all directions
    userData: { type: 'ball', name: name },
    angularFactor: [1, 1, 1] // Allow rotation around all axes
  }));
  
  // Track the velocity for determining if the ball is still moving
  const velocity = useRef<Vector3>(new Vector3(0, 0, 0));
  
  // Subscribe to velocity changes
  useFrame(() => {
    api.velocity.subscribe((v) => {
      velocity.current.set(v[0], v[1], v[2]);
      
      // Check if the ball is considered "stopped"
      const speed = velocity.current.length();
      if (isMoving && speed < 0.1) {
        setIsMoving(false);
      } else if (!isMoving && speed >= 0.1) {
        setIsMoving(true);
      }
    });
  });
  
  // Expose the swing method to parent components through ref
  useImperativeHandle(ref, () => ({
    swing: (power: number, angle: number) => {
      // FINAL SOLUTION: Absolute control over ball direction
      
      // Step 1: Stop all movement and rotation first
      api.velocity.set(0, 0, 0);
      api.angularVelocity.set(0, 0, 0);
      
      // Step 2: Calculate direction vector using the EXACT SAME FORMULA as DirectionArrow.tsx
      const angleRad = (angle * Math.PI) / 180;
      const dirX = Math.sin(angleRad);    // Positive X = right, negative X = left
      const dirZ = -Math.cos(angleRad);   // Negative Z = forward, positive Z = backward
      
      // Create a normalized 3D vector from these components
      const dirVector = new Vector3(dirX, 0, dirZ).normalize();
      
      // Step 3: Calculate the impulse magnitude based on power (0-100)
      const impulseMagnitude = power * 0.75; // Maintaining the increased distance
      
      // Step 4: Calculate the exact impulse components - USING THREE.JS VECTOR TO ENSURE CONSISTENCY
      const impulseX = dirVector.x * impulseMagnitude;
      
      // Scale vertical component based on power to create appropriate trajectory
      // At full power (100), we want a ~45 degree angle max (tan(45°) = 1, meaning equal horizontal and vertical)
      const verticalRatio = Math.min(power / 100, 1) * 0.25; // At full power, vertical is 25% of horizontal
      const impulseY = verticalRatio * impulseMagnitude; // Adjusted for more natural trajectory
      
      const impulseZ = dirVector.z * impulseMagnitude;
      
      // Debug log the exact application for verification
      console.log("EXACT DIRECTION SHOT:", {
        angle: angle,                     // Input angle in degrees
        vector: { x: dirX, z: dirZ },     // Raw directional components
        normalized: {                     // Normalized direction vector
          x: dirVector.x, 
          z: dirVector.z
        },
        impulse: {                        // Final impulse components
          x: impulseX,
          y: impulseY,
          z: impulseZ
        }
      });
      
      // Step 5: Apply impulse with deliberate typing as Triplet to avoid TS errors
      const impulseArr: [number, number, number] = [impulseX, impulseY, impulseZ];
      const originArr: [number, number, number] = [0, 0, 0];
      
      // Apply the impulse forces directly with no delay
      api.applyImpulse(impulseArr, originArr);
      
      // Also set initial velocity in exactly the same direction to reinforce movement
      api.velocity.set(
        dirVector.x * impulseMagnitude * 0.2, // Further increased horizontal velocity
        impulseY * 0.5, // Reduced upward velocity component
        dirVector.z * impulseMagnitude * 0.2 // Further increased horizontal velocity
      );
      
      // Calculate realistic rotation based on direction of travel
      api.angularVelocity.set(
        -dirVector.z * 8,  // Roll forward/backward (reversed for correct visual)
        0,                 // No rotation around Y axis
        dirVector.x * 8    // Roll left/right
      );
      
      setIsMoving(true);
    },
    reset: () => {
      // Reset the ball to its initial position
      api.position.set(position[0], position[1], position[2]);
      api.velocity.set(0, 0, 0);
      api.angularVelocity.set(0, 0, 0);
      setIsMoving(false);
    },
    isMoving: () => {
      return isMoving;
    }
  }));
  
  return (
    <mesh ref={ballRef as any} castShadow receiveShadow>
      <sphereGeometry args={[0.5, 32, 32]} /> {/* increased from 0.2 to 0.5 to match physics size */}
      <meshStandardMaterial color="white" />
    </mesh>
  );
});

// Add display name for React DevTools
GolfBall.displayName = 'GolfBall';

export default GolfBall;
