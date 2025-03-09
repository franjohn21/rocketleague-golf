"use client";

import {
  useRef,
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import { useBox } from "@react-three/cannon";
import { useFrame } from "@react-three/fiber";
import { Mesh, Vector3, Quaternion, Euler, MathUtils } from "three";

interface CarProps {
  onCollideWithBall: (velocity: Vector3) => void;
  ballPosition: [number, number, number];
  onPositionUpdate?: (position: [number, number, number]) => void;
  onRotationUpdate?: (
    rotation: [number, number, number],
    continuousRotation?: number
  ) => void;
  onVelocityUpdate?: (velocity: number) => void; // Add callback for velocity updates
  initialPosition?: [number, number, number]; // Add prop for initial position
  initialRotation?: [number, number, number]; // Add prop for initial rotation
}

const Car = forwardRef<any, CarProps>(
  (
    {
      onCollideWithBall,
      ballPosition,
      onPositionUpdate,
      onRotationUpdate,
      onVelocityUpdate,
      initialPosition = [5, 0.5, 5], // Default if not provided
      initialRotation = [0, 0, 0], // Default if not provided
    },
    ref
  ) => {
    // Physics body for the car
    const [carRef, api] = useBox(() => ({
      mass: 1500, // Further increased mass for stability
      position: initialPosition, // Use position from props
      args: [1.5, 0.5, 3], // Width, height, length
      linearDamping: 0.99, // Very high damping to eliminate oscillations
      angularDamping: 0.99, // Very high damping for rotation
      allowSleep: true, // Allow physics to sleep when stationary
      sleepSpeedLimit: 0.1, // Low speed threshold for sleeping
      sleepTimeLimit: 0.1, // Quick sleep transition
      fixedRotation: true, // Prevent unintended rotation for stability
      onCollide: (e) => {
        // Check if we collided with the ball
        if (e.body?.name === "golfBall" || e.body?.userData?.type === 'ball') {
          // Get current velocity to determine impact force
          const velocity = new Vector3();
          currentVelocity.current.forEach((v, i) => {
            velocity.setComponent(i, v);
          });
          
          // Only report collisions if the car is moving with sufficient speed
          if (velocity.length() > 0.5) {
            console.log("Car collision with ball detected, velocity:", velocity.length());
            onCollideWithBall(velocity);
          }
        }
      },
      userData: { type: "car" },
    }));

    // Car state
    const currentPosition = useRef<[number, number, number]>(initialPosition);
    const currentRotation = useRef<[number, number, number]>(initialRotation);
    const currentVelocity = useRef<[number, number, number]>([0, 0, 0]);
    const [speed, setSpeed] = useState(0);
    const [steering, setSteering] = useState(0);
    const [throttle, setThrottle] = useState(0);

    // Acceleration state
    const targetThrottle = useRef(0);
    const currentThrottle = useRef(0);
    const accelerationTime = useRef(0);
    
    // Collision detection and unstuck state
    const lastCollisionTime = useRef(0);
    const stuckDetectionTime = useRef(0);
    const isStuck = useRef(false);
    const stuckLocation = useRef<[number, number, number] | null>(null);
    const lastTravelDistance = useRef(0);

    // Smoothed position and rotation for reporting to parent (prevents camera jitter)
    const smoothedPosition = useRef<[number, number, number]>(initialPosition);
    const smoothedRotation = useRef<[number, number, number]>(initialRotation);
    const isMoving = useRef(false);

    // Subscribe to physics updates
    useEffect(() => {
      const unsubscribePosition = api.position.subscribe((p) => {
        const newPosition = p as [number, number, number];
        currentPosition.current = newPosition;

        // We don't immediately report position changes to prevent jitter
        // This will be handled in the smoothing frame loop instead
      });

      const unsubscribeRotation = api.rotation.subscribe((r) => {
        const newRotation = r as [number, number, number];
        currentRotation.current = newRotation;

        // Rotation updates will be smoothed and reported in the frame loop
      });

      const unsubscribeVelocity = api.velocity.subscribe((v) => {
        currentVelocity.current = v as [number, number, number];

        // Calculate speed based on velocity
        const speed = Math.sqrt(v[0] * v[0] + v[2] * v[2]);
        setSpeed(speed);

        // Send velocity updates to parent component
        if (onVelocityUpdate) {
          onVelocityUpdate(speed);
        }

        // Track if car is moving significantly
        isMoving.current = speed > 0.1;
      });

      return () => {
        unsubscribePosition();
        unsubscribeRotation();
        unsubscribeVelocity();
      };
    }, [api]);

    // Handle keyboard input with improved key tracking
    useEffect(() => {
      // Track which keys are currently pressed
      const keysPressed = new Set<string>();

      const handleKeyDown = (e: KeyboardEvent) => {
        // Car controls
        switch (e.key) {
          case "ArrowUp":
            keysPressed.add("ArrowUp");
            targetThrottle.current = 1.0;
            break;
          case "ArrowDown":
            keysPressed.add("ArrowDown");
            targetThrottle.current = -0.5;
            break;
          case "ArrowLeft":
            keysPressed.add("ArrowLeft");
            setSteering(1); // Positive value turns left
            break;
          case "ArrowRight":
            keysPressed.add("ArrowRight");
            setSteering(-1); // Negative value turns right
            break;
        }
      };

      const handleKeyUp = (e: KeyboardEvent) => {
        switch (e.key) {
          case "ArrowUp":
            keysPressed.delete("ArrowUp");
            // Only set to 0 if Down is not pressed
            if (!keysPressed.has("ArrowDown")) {
              targetThrottle.current = 0;
            }
            break;
          case "ArrowDown":
            keysPressed.delete("ArrowDown");
            // Only set to 0 if Up is not pressed
            if (!keysPressed.has("ArrowUp")) {
              targetThrottle.current = 0;
            } else {
              targetThrottle.current = 1.0; // Revert to forward if up is still pressed
            }
            break;
          case "ArrowLeft":
            keysPressed.delete("ArrowLeft");
            // Only reset steering if Right is not pressed
            if (keysPressed.has("ArrowRight")) {
              setSteering(-1); // Switch to right turn
            } else {
              setSteering(0);
            }
            break;
          case "ArrowRight":
            keysPressed.delete("ArrowRight");
            // Only reset steering if Left is not pressed
            if (keysPressed.has("ArrowLeft")) {
              setSteering(1); // Switch to left turn
            } else {
              setSteering(0);
            }
            break;
        }
      };

      // Handle window blur event (e.g., when the window loses focus)
      const handleBlur = () => {
        keysPressed.clear();
        targetThrottle.current = 0;
        setSteering(0);
      };

      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);
      window.addEventListener("blur", handleBlur);

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
        window.removeEventListener("blur", handleBlur);
      };
    }, []);

    // Track continuous rotation without being limited to -PI to PI
    const continuousYRotation = useRef(0);

    // Initialize the continuous rotation from the physics rotation
    useEffect(() => {
      // Set initial value from current rotation
      continuousYRotation.current = initialRotation[1];
      
      // Also ensure the physics rotation is initialized correctly
      api.rotation.set(0, initialRotation[1], 0);
      
      // Force a full synchronization of all physics properties
      api.position.set(...initialPosition);
      api.velocity.set(0, 0, 0);
      api.angularVelocity.set(0, 0, 0);
    }, []);
    
    // Make sure steering state is cleared when component unmounts
    useEffect(() => {
      return () => {
        setSteering(0);
      };
    }, []);

    // Directly control car movement with a kinematic approach
    useFrame((state, delta) => {
      if (!carRef.current) return;

      // Use our continuous rotation tracker instead of the physics rotation
      // This avoids any angle normalization that might limit rotation
      const yRotation = continuousYRotation.current;

      // Forward direction vector based on car's current rotation
      // Using sin/cos with any angle value will work correctly for the full 360 degrees
      const forward = new Vector3(Math.sin(yRotation), 0, Math.cos(yRotation));

      // Right direction for steering
      const right = new Vector3(
        Math.sin(yRotation + Math.PI / 2),
        0,
        Math.cos(yRotation + Math.PI / 2)
      );
      
      // Calculate distance moved since last frame for stuck detection
      const currentPos = new Vector3(
        currentPosition.current[0],
        currentPosition.current[1],
        currentPosition.current[2]
      );
      
      // Check if car is stuck (applying throttle but barely moving)
      if (Math.abs(currentThrottle.current) > 0.1) {
        const now = Date.now();
        
        // Measure travel distance to detect if stuck
        if (stuckLocation.current) {
          const stuckPos = new Vector3(
            stuckLocation.current[0],
            stuckLocation.current[1],
            stuckLocation.current[2]
          );
          lastTravelDistance.current = currentPos.distanceTo(stuckPos);
          
          // If barely moving for over 0.5 seconds while throttle is applied, consider stuck
          if (lastTravelDistance.current < 0.1 && now - stuckDetectionTime.current > 500 && Math.abs(currentThrottle.current) > 0.5) {
            if (!isStuck.current) {
              console.log("Car appears to be stuck, applying unstuck force");
              isStuck.current = true;
            }
          } else if (lastTravelDistance.current > 0.3) {
            // Car has moved enough, no longer stuck
            isStuck.current = false;
          }
        }
        
        // Update stuck reference position and time
        if (now - stuckDetectionTime.current > 200) {
          stuckLocation.current = [...currentPosition.current];
          stuckDetectionTime.current = now;
        }
      } else {
        // Not applying throttle, can't be stuck
        isStuck.current = false;
      }

      // Controls and parameters
      const maxSpeed = 1000; // Increased by 100x from original 10 for ultra-extreme top speed
      const turnRate = 1.2 * delta; // Reduced turn rate for easier control

      // Current position and planned new position
      const position = new Vector3(
        currentPosition.current[0],
        currentPosition.current[1],
        currentPosition.current[2]
      );

      // Calculate current speed
      const currentSpeed = Math.sqrt(
        currentVelocity.current[0] * currentVelocity.current[0] +
          currentVelocity.current[2] * currentVelocity.current[2]
      );

      // Process steering input - directly modify rotation instead of using physics torque
      if (steering !== 0) {
        // Calculate new rotation with improved responsiveness
        // Base steering with lower responsiveness for easier control
        const baseSteeringRate = turnRate * 0.6; // Further reduced base rate for more precise control

        // Speed-sensitive component adds some turning at higher speeds, but less than before
        const speedComponent = Math.max(currentSpeed, 0.3) * turnRate * 0.2;

        // Combined steering rate - slower and more controllable at all speeds
        const rotationDelta = steering * (baseSteeringRate + speedComponent);

        // Update our continuous rotation tracker - this can go beyond 2PI with no limits
        // Flip the sign for more intuitive steering: negative rotates right, positive rotates left
        continuousYRotation.current += rotationDelta;

        // Apply the rotation to the physics body
        // Even though the physics engine might normalize to [-PI,PI],
        // our continuous tracker keeps the true unlimited rotation value
        api.rotation.set(0, continuousYRotation.current, 0);
      }

      // Handle balanced acceleration/deceleration
      // Move throttle toward target at a reasonable but still responsive rate
      const throttleChangeRate = delta * 5.0; // Throttle change per second (middle ground between smooth and instant)
      const throttleDiff = targetThrottle.current - currentThrottle.current;

      if (Math.abs(throttleDiff) > 0.01) {
        // Approach target throttle gradually
        if (throttleDiff > 0) {
          // Accelerating
          currentThrottle.current += Math.min(throttleDiff, throttleChangeRate);
        } else {
          // Decelerating
          currentThrottle.current += Math.max(
            throttleDiff,
            -throttleChangeRate * 1.5
          ); // Faster deceleration
        }

        // Update the throttle state for other components
        setThrottle(currentThrottle.current);

        // Track acceleration time for additional visual effects
        accelerationTime.current += delta;
      }

      // Calculate acceleration with balanced handling
      let acceleration = delta * 80; // Base acceleration value (4x faster than original, but not extreme)

      if (currentThrottle.current !== 0) {
        // Apply acceleration based on throttle
        const targetSpeed = currentThrottle.current * maxSpeed;
        const speedDiff = targetSpeed - currentSpeed;

        // Rapidly approach target speed with aggressive acceleration
        // Maintain strong acceleration even at high speeds
        const accelerationFactor = Math.max(
          0.8,
          1.0 - (currentSpeed / maxSpeed) * 0.2
        );
        acceleration *=
          accelerationFactor *
          Math.sign(speedDiff) *
          Math.min(Math.abs(speedDiff), 1.0);
      } else {
        // Apply braking when no throttle
        acceleration = -currentSpeed * delta * 2;
      }

      // Calculate new velocity directly
      let newVx = currentVelocity.current[0];
      let newVz = currentVelocity.current[2];

      // Add acceleration in the forward direction
      if (Math.abs(acceleration) > 0.01) {
        newVx += forward.x * acceleration;
        newVz += forward.z * acceleration;
      } else {
        // Apply strong damping when acceleration is minimal
        newVx *= 0.95;
        newVz *= 0.95;
      }

      // Apply velocity deadzone
      if (Math.abs(newVx) < 0.1) newVx = 0;
      if (Math.abs(newVz) < 0.1) newVz = 0;

      // Apply unstuck logic if needed
      if (isStuck.current) {
        // Apply a small "nudge" perpendicular to the current direction to unstick
        // This creates a sliding motion away from obstacles
        const unstuckDirection = right.clone().multiplyScalar(Math.sin(Date.now() * 0.01) * 0.5);
        
        // Add the perpendicular force component
        newVx += unstuckDirection.x * 5; // Stronger unstuck force
        newVz += unstuckDirection.z * 5;
        
        // Also add a small backward component if really stuck
        if (lastTravelDistance.current < 0.05) {
          newVx -= forward.x * 2;
          newVz -= forward.z * 2;
        }
      }
      
      // Set the velocity directly with zero vertical velocity
      api.velocity.set(newVx, 0, newVz);

      // Always keep the car exactly at ground level (0.5 height)
      // This ensures it never floats or sinks
      api.position.set(
        currentPosition.current[0],
        0.5, // Fixed height - always maintain this exact height
        currentPosition.current[2]
      );

      // Also force zero angular velocity around X and Z axes to prevent any tilting
      // Set angular velocity directly without reading the current value
      api.angularVelocity.set(0, 0, 0);

      // Smooth position and rotation updates for camera following
      // Use different smoothing factors based on whether the car is moving or not
      const positionSmoothingFactor = isMoving.current ? 3 * delta : 1 * delta;
      const rotationSmoothingFactor = isMoving.current ? 3 * delta : 1 * delta;

      // Apply smoothing to position using lerp
      for (let i = 0; i < 3; i++) {
        smoothedPosition.current[i] = MathUtils.lerp(
          smoothedPosition.current[i],
          currentPosition.current[i],
          Math.min(positionSmoothingFactor, 1)
        );

        smoothedRotation.current[i] = MathUtils.lerp(
          smoothedRotation.current[i],
          currentRotation.current[i],
          Math.min(rotationSmoothingFactor, 1)
        );
      }

      // Now report the smoothed position and rotation to parent
      if (onPositionUpdate) {
        onPositionUpdate([...smoothedPosition.current] as [
          number,
          number,
          number
        ]);
      }

      if (onRotationUpdate) {
        // Pass both the physics rotation and our continuous rotation tracker
        // This gives the camera system access to the true car orientation
        onRotationUpdate(
          [...smoothedRotation.current] as [number, number, number],
          continuousYRotation.current
        );
      }
    });

    // Expose methods and properties to the parent component
    useImperativeHandle(ref, () => ({
      position: carRef.current?.position,
      getSpeed: () => speed,
      getThrottle: () => throttle,
      rotation: carRef.current?.rotation,
      resetPosition: (position: [number, number, number]) => {
        api.position.set(...position);
        api.velocity.set(0, 0, 0);
        // Reset stuck detection when position is reset
        isStuck.current = false;
        stuckLocation.current = null;
        stuckDetectionTime.current = 0;
      },
      isStuck: () => {
        return isStuck.current;
      }
    }));

    return (
      <mesh ref={carRef as React.RefObject<Mesh>} name="car" castShadow>
        {/* Car body */}
        <boxGeometry args={[1.5, 0.5, 3]} />
        <meshStandardMaterial color="#3a86ff" />

        {/* Car roof */}
        <mesh position={[0, 0.4, -0.2]} castShadow>
          <boxGeometry args={[1.2, 0.4, 1.5]} />
          <meshStandardMaterial color="#3a86ff" />
        </mesh>

        {/* Wheels */}
        <mesh position={[0.8, -0.2, 1]} castShadow>
          <boxGeometry args={[0.2, 0.4, 0.4]} />
          <meshStandardMaterial color="#333" />
        </mesh>
        <mesh position={[-0.8, -0.2, 1]} castShadow>
          <boxGeometry args={[0.2, 0.4, 0.4]} />
          <meshStandardMaterial color="#333" />
        </mesh>
        <mesh position={[0.8, -0.2, -1]} castShadow>
          <boxGeometry args={[0.2, 0.4, 0.4]} />
          <meshStandardMaterial color="#333" />
        </mesh>
        <mesh position={[-0.8, -0.2, -1]} castShadow>
          <boxGeometry args={[0.2, 0.4, 0.4]} />
          <meshStandardMaterial color="#333" />
        </mesh>

        {/* Headlights */}
        <mesh position={[0.5, 0, 1.5]} castShadow>
          <boxGeometry args={[0.3, 0.2, 0.1]} />
          <meshStandardMaterial
            color="#fffbbd"
            emissive="#fffbbd"
            emissiveIntensity={1}
          />
        </mesh>
        <mesh position={[-0.5, 0, 1.5]} castShadow>
          <boxGeometry args={[0.3, 0.2, 0.1]} />
          <meshStandardMaterial
            color="#fffbbd"
            emissive="#fffbbd"
            emissiveIntensity={1}
          />
        </mesh>
      </mesh>
    );
  }
);

export default Car;
