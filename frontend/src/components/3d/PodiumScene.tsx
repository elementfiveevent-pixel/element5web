"use client";

import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function PodiumBlock({ position, size, color, label, hoverOffset }: { position: [number, number, number]; size: [number, number, number]; color: string; label: string; hoverOffset: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const textRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(t * 1.5 + hoverOffset) * 0.05;
    }
  });

  return (
    <group>
      {/* Brutalist Podium Box */}
      <mesh ref={meshRef} position={position} castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={color}
          roughness={0.2}
          metalness={0.7}
        />
      </mesh>

      {/* Spotlight for each podium */}
      <spotLight
        position={[position[0], 5, position[2]]}
        target-position={[position[0], position[1], position[2]]}
        angle={0.3}
        penumbra={0.9}
        intensity={35}
        color={color}
      />
    </group>
  );
}

// Floating geometric shapes above the podiums (simulating artist avatars)
function FloatingAvatarShape({ position, color, shapeType, speed }: { position: [number, number, number]; color: string; shapeType: "torus" | "octahedron" | "sphere"; speed: number }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(t * speed) * 0.2;
      groupRef.current.rotation.y = t * 0.5;
      groupRef.current.rotation.x = t * 0.3;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh castShadow>
        {shapeType === "torus" && <torusGeometry args={[0.5, 0.15, 8, 24]} />}
        {shapeType === "octahedron" && <octahedronGeometry args={[0.6, 0]} />}
        {shapeType === "sphere" && <sphereGeometry args={[0.5, 16, 16]} />}
        <meshStandardMaterial
          color={color}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>
    </group>
  );
}

export default function PodiumScene() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full bg-[#121212]/80 flex items-center justify-center">
        <div className="text-yellow-festival font-bold tracking-widest animate-pulse">
          LOADING PODIUM...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 1.5, 5], fov: 45 }}
        shadows
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.2} />
        
        {/* Main Overhead light */}
        <directionalLight
          position={[5, 10, 5]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />

        {/* 1st Place - Gold */}
        <PodiumBlock
          position={[0, -0.5, 0]}
          size={[1.2, 1.8, 1.2]}
          color="#FFD700" // Gold Glow
          label="1"
          hoverOffset={0}
        />
        <FloatingAvatarShape
          position={[0, 0.8, 0]}
          color="#FFD700"
          shapeType="octahedron"
          speed={1.5}
        />

        {/* 2nd Place - Silver */}
        <PodiumBlock
          position={[-1.6, -0.9, -0.2]}
          size={[1.1, 1.3, 1.1]}
          color="#FAF8F5" // Silver/Warm White
          label="2"
          hoverOffset={2.5}
        />
        <FloatingAvatarShape
          position={[-1.6, 0.2, -0.2]}
          color="#FAF8F5"
          shapeType="torus"
          speed={1.2}
        />

        {/* 3rd Place - Bronze */}
        <PodiumBlock
          position={[1.6, -1.2, -0.2]}
          size={[1.1, 0.9, 1.1]}
          color="#E36414" // Burnt Orange / Bronze
          label="3"
          hoverOffset={5}
        />
        <FloatingAvatarShape
          position={[1.6, -0.4, -0.2]}
          color="#E36414"
          shapeType="sphere"
          speed={1.8}
        />

        {/* Dynamic floor grid */}
        <gridHelper
          args={[10, 10, "rgba(250,248,245,0.08)", "rgba(250,248,245,0.02)"]}
          position={[0, -1.8, 0]}
        />
      </Canvas>
    </div>
  );
}
