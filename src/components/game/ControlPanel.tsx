"use client";

import React, { useState, useEffect } from "react";

interface ControlPanelProps {
  power: number;
  setPower: React.Dispatch<React.SetStateAction<number>>;
  angle: number;
  setAngle: React.Dispatch<React.SetStateAction<number>>;
  onSwing: () => void;
  disabled: boolean;
}

const ControlPanel = ({
  power,
  setPower,
  angle,
  setAngle,
  onSwing,
  disabled,
}: ControlPanelProps) => {
  // Optional animation state for power meter
  const [animating, setAnimating] = useState(false);
  const [displayPower, setDisplayPower] = useState(power);

  // Effect for power meter animation when user clicks "Animate Power"
  useEffect(() => {
    let animationFrame: number;
    let direction = 1;
    let currentPower = 0;

    const animatePower = () => {
      if (animating) {
        // Bounce between 0 and 100
        if (currentPower >= 100) direction = -1;
        if (currentPower <= 0) direction = 1;

        currentPower += direction * 2;
        setDisplayPower(currentPower);

        animationFrame = requestAnimationFrame(animatePower);
      } else {
        // When animation stops, set the actual power
        setPower(displayPower);
      }
    };

    if (animating) {
      animationFrame = requestAnimationFrame(animatePower);
    }

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [animating, displayPower, setPower]);

  // Update display power when power changes externally
  useEffect(() => {
    if (!animating) {
      setDisplayPower(power);
    }
  }, [power, animating]);

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;

      switch (e.key) {
        case "ArrowLeft":
          setAngle((prev) => Math.max(-90, prev - 5));
          break;
        case "ArrowRight":
          setAngle((prev) => Math.min(90, prev + 5));
          break;
        case "ArrowUp":
          if (!animating) setPower((prev) => Math.min(100, prev + 5));
          break;
        case "ArrowDown":
          if (!animating) setPower((prev) => Math.max(0, prev - 5));
          break;
        case " ": // Spacebar
          onSwing();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [setAngle, setPower, onSwing, animating, disabled]);

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-green-700 mb-4">Shot Controls</h2>

      {/* Power Meter */}
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <label className="font-medium text-gray-700">
            Power: {animating ? displayPower : power}%
          </label>
          <button
            className={`text-sm px-2 py-1 rounded ${
              animating
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
            onClick={() => setAnimating(!animating)}
            disabled={disabled}
          >
            {animating ? "Stop" : "Animate Power"}
          </button>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-green-600 h-4 rounded-full transition-all"
            style={{ width: `${animating ? displayPower : power}%` }}
          ></div>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={animating ? displayPower : power}
          onChange={(e) => {
            if (!animating) {
              setPower(parseInt(e.target.value));
            }
          }}
          className="w-full mt-2"
          disabled={animating || disabled}
        />
      </div>

      {/* Angle Control */}
      <div className="mb-6">
        <label className="font-medium text-gray-700 block mb-1">
          Angle: {angle}°{" "}
          {angle < 0 ? "(Left)" : angle > 0 ? "(Right)" : "(Center)"}
        </label>
        <div className="flex items-center">
          <button
            className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
            onClick={() => setAngle((prev) => Math.max(-90, prev - 5))}
            disabled={disabled}
          >
            ◀
          </button>
          <div className="flex-1 mx-2 bg-gray-200 h-2 rounded-full relative">
            <div
              className="absolute w-3 h-3 bg-blue-500 rounded-full top-1/2 transform -translate-y-1/2"
              style={{ left: `${((angle + 90) / 180) * 100}%` }}
            ></div>
          </div>
          <button
            className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
            onClick={() => setAngle((prev) => Math.min(90, prev + 5))}
            disabled={disabled}
          >
            ▶
          </button>
        </div>
      </div>

      {/* Swing Button */}
      <button
        className={`w-full py-3 px-4 rounded-full font-bold text-white transition ${
          disabled
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-green-600 hover:bg-green-700 transform hover:-translate-y-1 hover:shadow-lg"
        }`}
        onClick={onSwing}
        disabled={disabled}
      >
        {disabled ? "Ball in motion..." : "Swing! 🏌️"}
      </button>

      <div className="mt-3 text-sm text-gray-500 text-center">
        Use arrow keys to adjust aim and power. Press space to swing.
      </div>
    </div>
  );
};

export default ControlPanel;
