"use client";

import { useBox, useCylinder } from "@react-three/cannon";
import { useLoader, useFrame } from "@react-three/fiber";
import {
  TextureLoader,
  RepeatWrapping,
  Mesh,
  BufferGeometry,
  BufferAttribute,
  Vector3,
  MeshStandardMaterial,
} from "three";
import { useRef, useMemo, useState, useEffect } from "react";

// No longer need the heightfield generation function as we're using a simple flat surface

// Function to generate a flat mesh for the golf course
const createFlatMesh = (width: number, depth: number) => {
  // Simple flat plane geometry
  const geometry = new BufferGeometry();

  // Four corners of a flat plane
  const vertices = [
    -width / 2,
    0,
    -depth / 2, // bottom left
    width / 2,
    0,
    -depth / 2, // bottom right
    width / 2,
    0,
    depth / 2, // top right
    -width / 2,
    0,
    depth / 2, // top left
  ];

  // Simple UV coordinates
  const uvs = [0, 0, 1, 0, 1, 1, 0, 1];

  // All normals point up for flat surface
  const normals = [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0];

  // Two triangles to form the square
  const indices = [
    0,
    2,
    1, // bottom right triangle
    0,
    3,
    2, // top left triangle
  ];

  // Create the BufferGeometry
  geometry.setAttribute(
    "position",
    new BufferAttribute(new Float32Array(vertices), 3)
  );
  geometry.setAttribute(
    "normal",
    new BufferAttribute(new Float32Array(normals), 3)
  );
  geometry.setAttribute("uv", new BufferAttribute(new Float32Array(uvs), 2));
  geometry.setIndex(indices);

  return geometry;
};

const GolfCourse = () => {
  const greenRef = useRef<Mesh>(null);

  // Add ref for the flagpole physics body - using box physics for the rectangular flagpole
  const [flagpoleRef] = useBox(() => ({
    args: [0.1, 5, 0.1], // Box dimensions to match the visual flagpole
    position: [0, 2.5, -10], // Same position as the visual flagpole
    type: "Static",
    mass: 0,
    material: {
      friction: 0.3,
      restitution: 0.8, // High restitution for good bounce
    },
    collisionFilterGroup: 1,
    collisionFilterMask: 1,
    userData: { type: "flagpole" },
  }));

  // Width and depth of the golf course
  const width = 50;
  const depth = 150;

  // Define rough dimensions (larger than fairway)
  const roughWidth = width + 50;
  const roughDepth = depth + 50;

  // Define barrier dimensions (larger than rough)
  const barrierWidth = roughWidth + 20;
  const barrierDepth = roughDepth + 20;

  // Create a simple flat mesh for the visible golf course
  const greenGeometry = useMemo(() => {
    return createFlatMesh(width, depth);
  }, [width, depth]);

  // Create a flat box ground for the fairway (green)
  const [fairwayRef] = useBox(() => ({
    args: [width, 0.5, depth], // Match the fairway dimensions
    position: [0, -0.25, 0], // Position just below the visual mesh
    material: {
      friction: 0.3,
      restitution: 0.1, // Very little bounce
    },
    type: "Static",
    userData: { type: "fairway" }, // Tag for collision detection
  }));

  // Create a flat box ground for the rough - slightly higher friction to slow vehicles
  const [roughRef] = useBox(() => ({
    args: [roughWidth, 0.5, roughDepth], // Match the rough dimensions
    position: [0, -0.3, 0], // Slightly lower than fairway to avoid collision issues
    material: {
      friction: 0.7, // Higher friction to slow down the car
      restitution: 0.05, // Less bounce in the rough
    },
    type: "Static",
    userData: { type: "rough" }, // Tag for collision detection
  }));

  // Add a barrier ring around the course to catch balls - positioned outside the rough
  const [barrier1Ref] = useBox(() => ({
    args: [barrierWidth, 2, 1], // North wall - wider than rough
    position: [0, 0, -barrierDepth / 2], // Position outside rough
    type: "Static",
    userData: { type: "barrier" },
  }));

  const [barrier2Ref] = useBox(() => ({
    args: [barrierWidth, 2, 1], // South wall - wider than rough
    position: [0, 0, barrierDepth / 2], // Position outside rough
    type: "Static",
    userData: { type: "barrier" },
  }));

  const [barrier3Ref] = useBox(() => ({
    args: [1, 2, barrierDepth], // East wall - longer than rough
    position: [barrierWidth / 2, 0, 0], // Position outside rough
    type: "Static",
    userData: { type: "barrier" },
  }));

  const [barrier4Ref] = useBox(() => ({
    args: [1, 2, barrierDepth], // West wall - longer than rough
    position: [-barrierWidth / 2, 0, 0], // Position outside rough
    type: "Static",
    userData: { type: "barrier" },
  }));

  // Load textures for the golf course
  const grassTexture = useLoader(TextureLoader, "/textures/grass.jpg");
  const roughTexture = useLoader(TextureLoader, "/textures/grass.jpg"); // Could be a different texture

  // Configure texture repeating
  grassTexture.wrapS = grassTexture.wrapT = RepeatWrapping;
  grassTexture.repeat.set(40, 40);
  roughTexture.wrapS = roughTexture.wrapT = RepeatWrapping;
  roughTexture.repeat.set(5, 5);

  return (
    <>
      {/* Invisible physics ground for fairway and rough */}
      <mesh ref={fairwayRef as any} visible={false}>
        <boxGeometry args={[width, 0.5, depth]} />
        <meshStandardMaterial transparent opacity={0} />
      </mesh>

      <mesh ref={roughRef as any} visible={false}>
        <boxGeometry args={[roughWidth, 0.5, roughDepth]} />
        <meshStandardMaterial transparent opacity={0} />
      </mesh>

      {/* Barrier walls to prevent the ball from falling off the edge (outside rough) */}
      <mesh ref={barrier1Ref as any} visible={true} receiveShadow castShadow>
        <boxGeometry args={[barrierWidth, 2, 1]} />
        <meshStandardMaterial 
          color="#88ccff" 
          transparent 
          opacity={0.3} 
          roughness={0.1} 
          metalness={0.8} 
        />
      </mesh>

      <mesh ref={barrier2Ref as any} visible={true} receiveShadow castShadow>
        <boxGeometry args={[barrierWidth, 2, 1]} />
        <meshStandardMaterial 
          color="#88ccff" 
          transparent 
          opacity={0.3} 
          roughness={0.1} 
          metalness={0.8} 
        />
      </mesh>

      <mesh ref={barrier3Ref as any} visible={true} receiveShadow castShadow>
        <boxGeometry args={[1, 2, barrierDepth]} />
        <meshStandardMaterial 
          color="#88ccff" 
          transparent 
          opacity={0.3} 
          roughness={0.1} 
          metalness={0.8} 
        />
      </mesh>

      <mesh ref={barrier4Ref as any} visible={true} receiveShadow castShadow>
        <boxGeometry args={[1, 2, barrierDepth]} />
        <meshStandardMaterial 
          color="#88ccff" 
          transparent 
          opacity={0.3} 
          roughness={0.1} 
          metalness={0.8} 
        />
      </mesh>

      {/* Detailed undulating putting green - visible mesh */}
      <mesh receiveShadow castShadow ref={greenRef} rotation={[0, 0, 0]}>
        <primitive object={greenGeometry} attach="geometry" />
        <meshStandardMaterial
          map={grassTexture}
          color="#3a9e3a"
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>

      {/* Add surrounding rough - visual representation */}
      <mesh
        position={[0, -0.1, 0]}
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[roughWidth, roughDepth]} />
        <meshStandardMaterial
          map={roughTexture}
          color="#227022" // Darker green for the rough
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>

      {/* Add hole */}
      <mesh
        position={[0, -0.05, -10]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <cylinderGeometry args={[0.5, 0.5, 0.2, 32]} />
        <meshStandardMaterial color="black" />
      </mesh>

      {/* Flagpole with physics */}
      <mesh position={[0, 2.5, -10]} castShadow ref={flagpoleRef as any}>
        <boxGeometry args={[0.05, 5, 0.05]} />
        <meshStandardMaterial color="white" />
      </mesh>

      {/* Flag */}
      <mesh position={[0.4, 4.5, -10]} castShadow>
        <boxGeometry args={[1.2, 0.7, 0.05]} />
        <meshStandardMaterial color="red" />
      </mesh>
    </>
  );
};

export default GolfCourse;
