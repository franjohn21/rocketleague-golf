"use client";

import React, { useState, useRef, Suspense, useEffect } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Sky,
  Environment,
  PerspectiveCamera,
} from "@react-three/drei";
import { Physics } from "@react-three/cannon";
import Link from "next/link";
import { Vector3, Vector2, Mesh, Euler } from "three";

import GolfBall from "./GolfBall";
import GolfCourse from "./GolfCourse";
import DirectionArrow from "./DirectionArrow";
import Car from "./Car";

const GolfGame = () => {
  // Game state
  const [power, setPower] = useState(50);
  // Start with angle 0 (pointing toward the hole, same as camera direction)
  // Angle in degrees, 0 = straight ahead, -90 = left, 90 = right
  const [angle, setAngle] = useState(0);
  // Track number of times car has hit the ball
  const [hitCount, setHitCount] = useState(0);

  const [gameStatus, setGameStatus] = useState<
    "ready" | "swinging" | "moving" | "celebration"
  >("ready"); // ready, swinging, moving, celebration
  const [showCelebration, setShowCelebration] = useState(false);
  const [ballPosition, setBallPosition] = useState<[number, number, number]>([
    5,
    0.2,
    60, // Starting at the beginning of the hole, opposite to the flag
  ]);

  // Car-related state
  const [drivingMode, setDrivingMode] = useState(true); // Always start in driving mode
  const [carPosition, setCarPosition] = useState<[number, number, number]>([
    5,
    0.2,
    80, // Positioned right behind the ball (ball is at z=60)
  ]);
  const [carRotation, setCarRotation] = useState<[number, number, number]>([
    0,
    Math.PI,
    0, // Facing toward the flag (along negative Z axis)
  ]);
  const [carVelocity, setCarVelocity] = useState<number>(0);
  const [displayVelocity, setDisplayVelocity] = useState<number>(0);
  const [displayThrottle, setDisplayThrottle] = useState<number>(0);
  const lastUpdateTime = useRef<number>(0);
  const [carThrottle, setCarThrottle] = useState<number>(0);

  // Refs for control
  const ballRef = useRef(null);
  const carRef = useRef(null);
  const cameraRef = useRef(null);

  // Refs for hit detection
  const hitRegistered = useRef<boolean>(false);

  // Flag/hole position - matches the position in GolfCourse.tsx
  const flagPosition: [number, number, number] = [0, 0, -10]; // Position of the hole/flag

  // Speed threshold for flag collision (in units/second)
  const flagCollisionWinThreshold = 10; // If below this speed, it's a win

  // Handle keyboard controls for golf mode (angle and power)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only respond to keys in golf mode and when ready
      if (drivingMode || gameStatus !== "ready") return;

      switch (e.key) {
        case "ArrowLeft":
          setAngle((prev) => {
            const newAngle = Math.max(prev - 5, -180);
            console.log("Angle changed to:", newAngle);
            return newAngle;
          });
          break;
        case "ArrowRight":
          setAngle((prev) => {
            const newAngle = Math.min(prev + 5, 180);
            console.log("Angle changed to:", newAngle);
            return newAngle;
          });
          break;
        case "ArrowUp":
          setPower((prev) => Math.min(prev + 5, 100));
          break;
        case "ArrowDown":
          setPower((prev) => Math.max(prev - 5, 0));
          break;
        case " ": // Space bar for swing
          handleSwing();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameStatus, drivingMode]);

  // Handle flag collision
  const handleFlagCollision = (speed: number) => {
    console.log(`Ball hit flag at speed: ${speed}`);

    if (speed <= flagCollisionWinThreshold) {
      // Slow enough for a win
      console.log(
        `Flag collision slow enough for a win! Score: ${getGolfScore(
          hitCount
        )} (${hitCount} hits)`
      );
      setGameStatus("celebration");
      setShowCelebration(true);

      // Reset after celebration
      setTimeout(() => {
        setShowCelebration(false);
        setGameStatus("ready");

        // Reset ball position for the next player
        const newPosition: [number, number, number] = [25, 0.2, 60]; // Reset to beginning of the hole
        setBallPosition(newPosition);

        // Reset hit counter for the next hole
        setHitCount(0);

        if (ballRef.current) {
          // @ts-ignore - we know the ref has this method
          ballRef.current.reset();
        }
      }, 5000); // 5 seconds of celebration
    } else {
      // Too fast, just a ricochet (the physics engine handles the bounce)
      console.log("Flag collision too fast for a win, ball ricochets.");
    }
  };

  // Handle swing action
  const handleSwing = () => {
    if (gameStatus !== "ready") return;

    setGameStatus("swinging");

    // Send the swing command to the ball component
    if (ballRef.current) {
      // Log the angle before swinging
      console.log("Swinging with angle:", angle, "power:", power);

      // @ts-ignore - we know the ref has this method
      ballRef.current.swing(power, angle);

      // Wait until the ball stops moving before resetting
      const checkIfStopped = () => {
        if (ballRef.current) {
          // @ts-ignore - we know the ref has this method
          const isStillMoving = ballRef.current.isMoving();

          if (!isStillMoving) {
            // Check if the ball stopped near the hole
            const distanceToHole = Math.sqrt(
              Math.pow(ballPosition[0] - flagPosition[0], 2) +
                Math.pow(ballPosition[2] - flagPosition[2], 2)
            );

            const holeRadius = 10; // 10 foot radius around the hole (increased from 5)

            if (distanceToHole <= holeRadius) {
              // Ball is in the hole! Start celebration
              setGameStatus("celebration");
              setShowCelebration(true);

              // Reset after celebration
              setTimeout(() => {
                setShowCelebration(false);
                setGameStatus("ready");

                // Reset ball position for the next player
                const newPosition: [number, number, number] = [0, 0.2, 0];
                setBallPosition(newPosition);

                if (ballRef.current) {
                  // @ts-ignore - we know the ref has this method
                  ballRef.current.reset();
                }
              }, 5000); // 5 seconds of celebration
            } else {
              // Ball stopped but not in hole, just reset
              setGameStatus("ready");

              // Reset ball position for the next player
              const newPosition: [number, number, number] = [0, 0.2, 0];
              setBallPosition(newPosition);

              if (ballRef.current) {
                // @ts-ignore - we know the ref has this method
                ballRef.current.reset();
              }
            }
          } else {
            // Check again in 500ms
            setTimeout(checkIfStopped, 500);
          }
        }
      };

      // Start checking after 1 second
      setTimeout(checkIfStopped, 1000);
    }
  };

  // Function to determine golf score based on hit count (Par 3)
  const getGolfScore = (hits: number): string => {
    switch (hits) {
      case 1:
        return "Hole in One!";
      case 2:
        return "Birdie";
      case 3:
        return "Par";
      case 4:
        return "Bogey";
      case 5:
        return "Double Bogey";
      case 6:
        return "Triple Bogey";
      default:
        return hits > 6 ? `+${hits - 3}` : hits === 0 ? "" : "Error";
    }
  };

  // Handle hits from car to ball
  const handleHit = () => {
    if (hitRegistered.current || gameStatus !== "ready") return;

    // Mark as registered to prevent multiple counts
    hitRegistered.current = true;

    // Increment the hit counter
    setHitCount((prev) => prev + 1);
    console.log(`Hit registered! Count: ${hitCount + 1}`);

    // Reset after a delay
    setTimeout(() => {
      hitRegistered.current = false;
    }, 2000);
  };

  // Handle ball collision from car
  const handleCarCollision = (carVelocity: Vector3) => {
    if (ballRef.current && gameStatus === "ready") {
      console.log("Car collision handler triggered");

      // Calculate power based on car speed
      const speed = carVelocity.length();

      // Only register hits with sufficient speed
      if (speed < 0.5) {
        console.log("Car hit ball but too slow to count as a shot");
        return;
      }

      // Register the hit
      handleHit();

      // Calculate swing power and angle with increased power multiplier
      const impactPower = Math.min(Math.floor(speed * 25), 100); // Increased from 10x to 25x for more powerful hits

      // Use the car's direction as the angle
      const direction = carVelocity.clone().normalize();
      const impactAngle =
        Math.atan2(direction.x, -direction.z) * (180 / Math.PI);

      console.log(
        `Car hit ball with speed: ${speed}, power: ${impactPower}, angle: ${impactAngle}, hit #${
          hitCount + 1
        }`
      );

      // Trigger the ball swing with calculated power and angle
      // @ts-ignore - we know the ref has this method
      ballRef.current.swing(impactPower, impactAngle);
      setGameStatus("swinging");

      // Wait until the ball stops moving before resetting
      const checkIfStopped = () => {
        if (ballRef.current) {
          // @ts-ignore - we know the ref has this method
          const isStillMoving = ballRef.current.isMoving();

          if (!isStillMoving) {
            // Check if the ball stopped near the hole
            const distanceToHole = Math.sqrt(
              Math.pow(ballPosition[0] - flagPosition[0], 2) +
                Math.pow(ballPosition[2] - flagPosition[2], 2)
            );

            const holeRadius = 10; // 10 foot radius around the hole (increased from 5)

            if (distanceToHole <= holeRadius) {
              // Ball is in the hole! Start celebration
              setGameStatus("celebration");
              setShowCelebration(true);

              // Reset after celebration
              setTimeout(() => {
                setShowCelebration(false);
                setGameStatus("ready");

                // Reset ball position for the next player
                const newPosition: [number, number, number] = [0, 0.2, 0];
                setBallPosition(newPosition);

                if (ballRef.current) {
                  // @ts-ignore - we know the ref has this method
                  ballRef.current.reset();
                }
              }, 5000); // 5 seconds of celebration
            } else {
              // Ball stopped but not in hole, just reset
              setGameStatus("ready");
            }
          } else {
            // Check again in 500ms
            setTimeout(checkIfStopped, 500);
          }
        }
      };

      // Start checking after 1 second
      setTimeout(checkIfStopped, 1000);
    }
  };

  // Track the car's continuous rotation (not limited to -PI to PI)
  const continuousCarRotation = useRef(0);

  // Smoothed camera rotation value for natural following
  const smoothedCameraRotation = useRef(0);

  // Camera control states
  const [cameraZoomLevel, setCameraZoomLevel] = useState(2.0);
  const [cameraOffset, setCameraOffset] = useState<[number, number]>([0, 0]); // [x, z] offset for panning

  // Handle car position and rotation updates for camera following
  const handleCarPositionUpdate = (position: [number, number, number]) => {
    setCarPosition(position);
  };

  // Updated to receive the continuous rotation directly from the car
  const handleCarRotationUpdate = (
    rotation: [number, number, number],
    continuousYRotation?: number
  ) => {
    // Update the state for physics rotation (for legacy compatibility)
    setCarRotation(rotation);

    // If we got the car's internal continuous rotation tracker, use it directly
    if (continuousYRotation !== undefined) {
      continuousCarRotation.current = continuousYRotation;
    }
  };

  // Fixed third-person camera that properly follows the car
  const CameraSystem = () => {
    // References for camera
    const { camera } = useThree();

    // Store state for camera
    const cameraRef = useRef({
      // Track the car's forward direction vector (not just rotation angle)
      carForward: new Vector3(0, 0, 1), // Car's forward direction vector
      smoothedForward: new Vector3(0, 0, 1), // Smoothed forward direction

      // Camera positioning
      baseDistanceBehind: 6, // Base distance behind car (will be modified by zoom)
      baseHeightOffset: 3, // Base height above car (will be modified by zoom)
      baseLookAheadDistance: 10, // Base look ahead distance (will be modified by zoom)

      // Current actual camera distances (after applying zoom)
      distanceBehind: 6, // Current distance behind car
      heightOffset: 3, // Current height above car
      lookAheadDistance: 10, // Current look ahead distance

      // Panning
      panOffset: new Vector3(0, 0, 0), // Offset from following position

      // Interaction states
      isDragging: false, // Whether the user is currently dragging to pan
      dragStartPosition: new Vector2(), // Mouse position when drag started

      // Timing for smooth interpolation
      lastUpdateTime: 0,

      // Rotation smoothing configuration - drastically reduced for high-speed driving
      rotationSmoothness: 0.15, // Ultra-low value for extremely smooth camera rotation (reduced by ~60%)
      positionSmoothness: 2.0, // Slightly reduced for a more relaxed position following

      // Rotation smoothing factors - set to extremely low values for maximum decoupling
      minRotationSmoothing: 0.0005, // Ultra-low value for very smooth camera rotation during high-speed turns
      maxRotationSmoothing: 0.001, // Drastically reduced for extremely gradual catch-up
    });

    // Setup wheel event handler for zooming and panning
    useEffect(() => {
      // Force driving mode to be true
      if (!drivingMode) {
        setDrivingMode(true);
      }

      // Get the canvas element
      const canvas = document.querySelector("canvas");
      if (!canvas) {
        // Initialize camera and return if canvas isn't ready
        updateCamera(true);
        return;
      }

      // Handle mouse wheel for zoom
      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();

        // Calculate zoom delta - normalize across browsers
        const delta = e.deltaY > 0 ? 1.1 : 0.9;

        // Apply zoom within limits (0.5x to 3x)
        setCameraZoomLevel((prev) => {
          const newZoom = Math.max(0.5, Math.min(3.0, prev * delta));
          return newZoom;
        });
      };

      // Handle mouse down for pan start
      const handleMouseDown = (e: MouseEvent) => {
        // Enable panning with left mouse button (button 0)
        if (e.button === 0) {
          e.preventDefault();
          cameraRef.current.isDragging = true;
          cameraRef.current.dragStartPosition.set(e.clientX, e.clientY);
        }
      };

      // Handle mouse move for panning
      const handleMouseMove = (e: MouseEvent) => {
        if (cameraRef.current.isDragging) {
          // Use more sensitive panning multipliers for better control
          const dx = (e.clientX - cameraRef.current.dragStartPosition.x) * 0.08;
          const dy = (e.clientY - cameraRef.current.dragStartPosition.y) * 0.08;

          // Invert Y direction for more natural feel (up = forward, down = backward)
          setCameraOffset((prev) => [prev[0] + dx, prev[1] - dy]);

          // Update drag start position
          cameraRef.current.dragStartPosition.set(e.clientX, e.clientY);
        }
      };

      // Handle mouse up to end panning
      const handleMouseUp = () => {
        cameraRef.current.isDragging = false;
      };

      // Handle right-click to prevent context menu
      const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        return false;
      };

      // Handle key press for camera controls
      const handleKeyDown = (e: KeyboardEvent) => {
        // 'R' key to reset camera position and zoom
        if (e.key.toLowerCase() === "r") {
          setCameraZoomLevel(1.0);
          setCameraOffset([0, 0]);
        }
      };

      // Modify canvas style to show proper cursor for panning
      canvas.style.cursor = "grab";

      // Add event listeners
      canvas.addEventListener("wheel", handleWheel, { passive: false });
      canvas.addEventListener("mousedown", handleMouseDown);
      canvas.addEventListener("mousemove", handleMouseMove);
      canvas.addEventListener("mouseup", handleMouseUp);
      canvas.addEventListener("contextmenu", handleContextMenu);
      window.addEventListener("mouseup", handleMouseUp); // Catch mouse up outside canvas
      window.addEventListener("keydown", handleKeyDown);

      // Update cursor style during dragging
      const updateCursorStyle = () => {
        if (cameraRef.current.isDragging) {
          canvas.style.cursor = "grabbing";
        } else {
          canvas.style.cursor = "grab";
        }
      };

      // Add cursor style listeners
      canvas.addEventListener("mousedown", updateCursorStyle);
      canvas.addEventListener("mouseup", updateCursorStyle);

      // Set initial camera position and orientation
      updateCamera(true);

      // Remove event listeners on cleanup
      return () => {
        canvas.removeEventListener("wheel", handleWheel);
        canvas.removeEventListener("mousedown", handleMouseDown);
        canvas.removeEventListener("mousemove", handleMouseMove);
        canvas.removeEventListener("mouseup", handleMouseUp);
        canvas.removeEventListener("contextmenu", handleContextMenu);
        window.removeEventListener("mouseup", handleMouseUp);
        window.removeEventListener("keydown", handleKeyDown);
        canvas.removeEventListener("mousedown", updateCursorStyle);
        canvas.removeEventListener("mouseup", updateCursorStyle);
      };
    }, []);

    // Initialize the camera
    const updateCamera = (instant = false) => {
      // Get the car's true continuous rotation
      const trueCarYaw = continuousCarRotation.current;

      if (instant) {
        // Initialize all rotation trackers to match the car's current rotation
        smoothedCameraRotation.current = trueCarYaw;

        // Calculate initial forward and backward vectors
        const forward = new Vector3(
          Math.sin(trueCarYaw),
          0,
          Math.cos(trueCarYaw)
        ).normalize();

        const backward = forward.clone().multiplyScalar(-1);

        // Store the base distances
        cameraRef.current.baseDistanceBehind = 6;
        cameraRef.current.baseHeightOffset = 3;
        cameraRef.current.baseLookAheadDistance = 10;

        // Initialize the actual distances
        cameraRef.current.distanceBehind =
          cameraRef.current.baseDistanceBehind * cameraZoomLevel;
        cameraRef.current.heightOffset =
          cameraRef.current.baseHeightOffset * Math.sqrt(cameraZoomLevel);
        cameraRef.current.lookAheadDistance =
          cameraRef.current.baseLookAheadDistance * Math.sqrt(cameraZoomLevel);

        // Set initial camera position
        const initialPosition = new Vector3(
          carPosition[0] + backward.x * cameraRef.current.distanceBehind,
          carPosition[1] + cameraRef.current.heightOffset,
          carPosition[2] + backward.z * cameraRef.current.distanceBehind
        );

        // Set initial look-at position
        const initialLookAt = new Vector3(
          carPosition[0] + forward.x * cameraRef.current.lookAheadDistance,
          carPosition[1],
          carPosition[2] + forward.z * cameraRef.current.lookAheadDistance
        );

        // Apply initial positions
        camera.position.copy(initialPosition);
        camera.lookAt(initialLookAt);

        // Initialize direction vectors for reference
        cameraRef.current.carForward = forward.clone();
        cameraRef.current.smoothedForward = forward.clone();
      }
      // We're not doing anything in the non-instant case anymore,
      // as all the smoothing is handled in the useFrame callback
    };

    // Update on each frame
    useFrame((state) => {
      // Calculate delta time for smooth interpolation
      const now = state.clock.getElapsedTime();
      const frameDelta = Math.min(now - cameraRef.current.lastUpdateTime, 0.1);
      cameraRef.current.lastUpdateTime = now;

      // Get the car's actual rotation
      const actualCarRotation = continuousCarRotation.current;

      // Smooth interpolation of camera rotation
      // First, calculate the shortest direction to rotate (for proper 360-degree handling)
      const rotationDelta =
        ((actualCarRotation - smoothedCameraRotation.current + Math.PI * 3) %
          (Math.PI * 2)) -
        Math.PI;

      // Detect how fast the car is turning
      const turningSpeed = Math.abs(rotationDelta);

      // Extremely gradual smoothing with cinematic-style camera behavior
      // The camera will now follow the car's rotation very lazily with significant delay
      let rotationSmoothFactor;

      // Expanded thresholds with more nuanced behavior and even slower following
      if (turningSpeed > 0.15) {
        // Extremely slow following during very sharp turns
        rotationSmoothFactor = cameraRef.current.minRotationSmoothing * 0.3;
      } else if (turningSpeed > 0.1) {
        // Very slow following during sharp turns
        rotationSmoothFactor = cameraRef.current.minRotationSmoothing * 0.5;
      } else if (turningSpeed > 0.05) {
        // Slow following during medium turns
        rotationSmoothFactor = cameraRef.current.minRotationSmoothing * 0.8;
      } else if (turningSpeed > 0.02) {
        // Gradual following during gentle turns
        rotationSmoothFactor = lerp(
          cameraRef.current.minRotationSmoothing,
          cameraRef.current.maxRotationSmoothing,
          0.3 // 30% between min and max
        );
      } else if (turningSpeed > 0.01) {
        // Slightly faster following during very gentle turns
        rotationSmoothFactor = lerp(
          cameraRef.current.minRotationSmoothing,
          cameraRef.current.maxRotationSmoothing,
          0.6 // 60% between min and max
        );
      } else {
        // Maximum following speed during straight driving
        // Still extremely relaxed compared to original implementation
        rotationSmoothFactor = cameraRef.current.maxRotationSmoothing;
      }

      // Helper function for linear interpolation
      function lerp(a: number, b: number, t: number) {
        return a + (b - a) * t;
      }

      // Add a delay factor to further decouple rotation
      const maxRotationPerFrame = 0.001; // Extremely limit maximum rotation per frame for ultra-smooth camera even at very high speeds

      // Apply the rotation smoothing with an additional smoothing factor and maximum rotation limit
      const calculatedDelta =
        rotationDelta *
        Math.min(
          rotationSmoothFactor *
            frameDelta *
            cameraRef.current.rotationSmoothness,
          1.0
        );

      // Apply a maximum rotation speed cap per frame for extreme smoothness
      const clampedDelta =
        Math.sign(calculatedDelta) *
        Math.min(Math.abs(calculatedDelta), maxRotationPerFrame);

      // Apply final smoothed rotation
      smoothedCameraRotation.current += clampedDelta;

      // Calculate smooth forward direction based on interpolated rotation
      const smoothForward = new Vector3(
        Math.sin(smoothedCameraRotation.current),
        0,
        Math.cos(smoothedCameraRotation.current)
      ).normalize();

      // Calculate backward direction from smooth forward
      const smoothBackward = smoothForward.clone().multiplyScalar(-1);

      // Apply zoom factor to camera distances
      cameraRef.current.distanceBehind =
        cameraRef.current.baseDistanceBehind * cameraZoomLevel;
      cameraRef.current.heightOffset =
        cameraRef.current.baseHeightOffset * Math.sqrt(cameraZoomLevel);
      cameraRef.current.lookAheadDistance =
        cameraRef.current.baseLookAheadDistance * Math.sqrt(cameraZoomLevel);

      // Create pan offset vector using the current camera orientation
      // This ensures the pan direction is relative to the camera view
      const rightVector = new Vector3(1, 0, 0).applyAxisAngle(
        new Vector3(0, 1, 0),
        smoothedCameraRotation.current
      );
      const forwardVector = new Vector3(0, 0, 1).applyAxisAngle(
        new Vector3(0, 1, 0),
        smoothedCameraRotation.current
      );

      // Calculate pan offset in world space
      const panOffsetX =
        cameraOffset[0] * rightVector.x + cameraOffset[1] * forwardVector.x;
      const panOffsetZ =
        cameraOffset[0] * rightVector.z + cameraOffset[1] * forwardVector.z;

      // Calculate camera position using the smoothed direction and adding the pan offset
      const desiredPosition = new Vector3(
        carPosition[0] +
          smoothBackward.x * cameraRef.current.distanceBehind +
          panOffsetX,
        carPosition[1] + cameraRef.current.heightOffset,
        carPosition[2] +
          smoothBackward.z * cameraRef.current.distanceBehind +
          panOffsetZ
      );

      // Calculate look-at position slightly ahead of the car
      // Using car's actual direction for where to look, but smoothed position for camera location
      const actualForward = new Vector3(
        Math.sin(actualCarRotation),
        0,
        Math.cos(actualCarRotation)
      ).normalize();

      // Calculate look-at position including pan offset to maintain proper perspective
      const lookAtPosition = new Vector3(
        carPosition[0] +
          actualForward.x * cameraRef.current.lookAheadDistance +
          panOffsetX,
        carPosition[1], // Same height as car
        carPosition[2] +
          actualForward.z * cameraRef.current.lookAheadDistance +
          panOffsetZ
      );

      // Apply smooth position changes
      const positionSmoothness =
        frameDelta * cameraRef.current.positionSmoothness;
      camera.position.lerp(desiredPosition, Math.min(positionSmoothness, 1.0));

      // Look ahead with the car, creating a natural driving view
      camera.lookAt(lookAtPosition);
    });

    return null; // No controls - direct camera manipulation
  };

  return (
    <div className="w-full h-screen relative">
      {/* 3D Canvas - full screen */}
      <Canvas shadows className="w-full h-full" gl={{ antialias: true }}>
        {/* No OrbitControls to prevent interference with our custom camera system */}
        <PerspectiveCamera
          makeDefault
          position={[0, 5, 10]}
          fov={65}
          ref={cameraRef}
        />
        <Suspense fallback={null}>
          <Sky sunPosition={[100, 20, 100]} />
          <ambientLight intensity={0.3} />
          <directionalLight
            position={[10, 10, 10]}
            intensity={1.5}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />

          <Physics
            gravity={[0, -9.8, 0]}
            defaultContactMaterial={{
              friction: 0.5,
              restitution: 0.3,
              contactEquationStiffness: 1e6,
              contactEquationRelaxation: 3,
            }}
            allowSleep={true}
            size={10}
            iterations={8}
          >
            <GolfCourse />
            <GolfBall
              ref={ballRef}
              position={ballPosition}
              name="golfBall"
              onFlagCollision={handleFlagCollision}
            />
            <Car
              ref={carRef}
              onCollideWithBall={handleCarCollision}
              ballPosition={ballPosition}
              initialPosition={carPosition}
              initialRotation={carRotation}
              onPositionUpdate={handleCarPositionUpdate}
              onRotationUpdate={handleCarRotationUpdate}
              onVelocityUpdate={(velocity) => {
                setCarVelocity(velocity);
                // Update throttle state if car ref is available
                if (carRef.current) {
                  // @ts-ignore - we know the ref has these methods
                  const throttle = carRef.current.getThrottle
                    ? carRef.current.getThrottle()
                    : 0;
                  setCarThrottle(throttle);

                  // Update display values at a lower frequency (every 150ms) to prevent flickering
                  const currentTime = Date.now();
                  if (currentTime - lastUpdateTime.current > 150) {
                    setDisplayVelocity(Math.round(velocity * 10) / 10);
                    setDisplayThrottle(throttle);
                    lastUpdateTime.current = currentTime;
                  }
                }
              }}
            />

            {/* Direction arrow shown only in golf mode when ready */}
            <DirectionArrow
              power={power}
              angle={angle}
              position={ballPosition}
              visible={!drivingMode && gameStatus === "ready"}
            />
          </Physics>

          {/* Integrated camera system with proper stabilization */}
          <CameraSystem />

          {/* No UI elements inside the Canvas now - moved to overlay */}

          <Environment preset="sunset" />
        </Suspense>
      </Canvas>

      {/* Game UI */}
      <div className="absolute top-0 left-0 right-0 p-4 text-center text-white bg-black bg-opacity-50">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {/* Shot counter and score */}
            <div className="bg-black bg-opacity-70 rounded-lg px-3 py-1 flex items-center space-x-2">
              <div className="flex flex-col items-center">
                <span
                  className={`font-bold text-lg ${
                    hitCount === 1
                      ? "text-green-400"
                      : hitCount === 2
                      ? "text-blue-400"
                      : hitCount === 3
                      ? "text-yellow-400"
                      : "text-neutral-400"
                  }`}
                >
                  {hitCount}
                </span>
                <span className="text-xs text-gray-300">Shots</span>
              </div>
              <div className="flex flex-col items-center ml-2">
                <span className="text-xs text-gray-300">Par 3</span>
              </div>
            </div>
            {/* Velocity Display for Driving Mode */}
            {drivingMode && (
              <div className="bg-black bg-opacity-70 rounded-lg px-3 py-1 flex items-center space-x-3 ml-4">
                <div className="flex flex-col items-center">
                  {/* Speedometer */}
                  <div className="flex items-center">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-5 h-5 mr-1 text-yellow-400"
                      fill="currentColor"
                    >
                      <path d="M12 16c1.66 0 3-1.34 3-3 0-1.66-1.34-3-3-3s-3 1.34-3 3c0 1.66 1.34 3 3 3zm0-9c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm8 9c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8 8 3.58 8 8zM7 9h2v5H7zm8 0h2v5h-2z" />
                    </svg>
                    <span className="font-bold text-lg text-yellow-400 w-10 text-right">
                      {displayVelocity.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-300">Speed</span>
                </div>

                {/* Throttle Indicator */}
                <div className="flex flex-col items-center">
                  <div className="w-24 h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        displayThrottle > 0
                          ? "bg-green-500"
                          : displayThrottle < 0
                          ? "bg-red-500"
                          : "bg-gray-500"
                      }`}
                      style={{ width: `${Math.abs(displayThrottle) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-300 mt-1">
                    {carThrottle > 0
                      ? "Accelerating"
                      : carThrottle < 0
                      ? "Reversing"
                      : "Idle"}
                  </span>
                </div>

                {/* Controls Hint */}
                <div className="text-xs text-gray-300 ml-2">
                  <p>Hold ↑/↓: Accelerate/Brake</p>
                  <p>Press R: Reset Camera</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="absolute top-4 right-4 pointer-events-auto z-10 flex flex-col gap-2">
        <button
          onClick={() => {
            // Reset game logic
            const newPosition: [number, number, number] = [25, 0.2, 60];
            setBallPosition(newPosition);
            if (ballRef.current) {
              // @ts-ignore - we know the ref has this method
              ballRef.current.reset();
            }
            setPower(50);
            setAngle(0);
            setHitCount(0); // Reset hit counter
            setGameStatus("ready");
          }}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Reset Ball
        </button>
      </div>

      {/* Controls help */}
      <div className="bg-black bg-opacity-70 text-white p-2 absolute bottom-0 right-0 text-xs rounded-tl-md">
        <p>Camera: Scroll to Zoom</p>
        <p>Game: Arrow Keys ↑↓←→ to adjust velocity/angle</p>
      </div>

      {/* Celebration overlay when ball goes in the hole */}
      {showCelebration && (
        <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-black bg-opacity-70 p-8 rounded-xl text-center">
            <span
              className={`font-bold text-lg ${
                hitCount === 1
                  ? "text-yellow-400"
                  : hitCount === 2
                  ? "text-green-400"
                  : hitCount === 3
                  ? "text-blue-400"
                  : "text-red-400"
              }`}
            >
              {getGolfScore(hitCount)}
            </span>
            <div className="text-white text-xl">
              <p className="mb-3">Great shot! 🏆</p>
              <p>
                Distance to hole:{" "}
                {Math.round(
                  Math.sqrt(
                    Math.pow(ballPosition[0] - flagPosition[0], 2) +
                      Math.pow(ballPosition[2] - flagPosition[2], 2)
                  ) * 10
                ) / 10}{" "}
                feet
              </p>
            </div>
            <div className="mt-6 flex justify-center space-x-4">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="w-4 h-4 rounded-full bg-yellow-400 animate-ping"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GolfGame;
