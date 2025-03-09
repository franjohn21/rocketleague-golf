"use client";

import dynamic from "next/dynamic";

// Use dynamic import for client-side rendering and code splitting
const GolfGame = dynamic(() => import("@/components/game/GolfGame"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-green-100">
      <p className="text-xl text-green-800">Loading 3D Golf Game...</p>
    </div>
  ),
});

export default function GamePage() {
  return (
    <div className="w-full h-screen overflow-hidden">
      <GolfGame />
    </div>
  );
}
