"use client";

import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// Mouse tracker within Three.js Canvas
function MouseLight() {
  const lightRef = useRef<THREE.PointLight>(null);
  const { viewport } = useThree();

  useFrame((state) => {
    const x = (state.pointer.x * viewport.width) / 2;
    const y = (state.pointer.y * viewport.height) / 2;
    if (lightRef.current) {
      lightRef.current.position.set(x, y, 3);
    }
  });

  return (
    <pointLight
      ref={lightRef}
      intensity={30}
      distance={15}
      color="#FFEAA7" // Warm Spotlight color
      decay={1.8}
    />
  );
}

// Stage Logo Geometry (A rotating, glowing double brutalist ring)
function StageLogo() {
  const meshRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.4;
      meshRef.current.rotation.x = Math.sin(t * 0.2) * 0.1;
    }
    if (innerRef.current) {
      innerRef.current.rotation.y = -t * 0.8;
      innerRef.current.rotation.z = Math.cos(t * 0.4) * 0.2;
    }
  });

  return (
    <group ref={meshRef} position={[0, 0, 0]}>
      {/* Central Brutalist Cube core */}
      <mesh ref={innerRef}>
        <octahedronGeometry args={[1.2, 0]} />
        <meshStandardMaterial
          color="#D80032" // Deep Stage Red
          roughness={0.1}
          metalness={0.9}
          wireframe={false}
        />
      </mesh>

      {/* Floating Orbital Rings */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.2, 0.15, 8, 32]} />
        <meshStandardMaterial
          color="#FFDE4D" // Festival Yellow
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      <mesh position={[0, 0, 0]} rotation={[0, Math.PI / 4, Math.PI / 2]}>
        <torusGeometry args={[2.8, 0.08, 6, 24]} />
        <meshStandardMaterial
          color="#FAF8F5"
          roughness={0.4}
          metalness={0.6}
          wireframe
        />
      </mesh>
    </group>
  );
}

// Moving Stage Spotlights (Red/Yellow beams)
function StageSpotlights() {
  const spotRed = useRef<THREE.SpotLight>(null);
  const spotYellow = useRef<THREE.SpotLight>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (spotRed.current) {
      spotRed.current.position.x = Math.sin(t) * 4;
      spotRed.current.position.z = Math.cos(t * 0.7) * 3 + 4;
    }
    if (spotYellow.current) {
      spotYellow.current.position.x = Math.cos(t * 0.8) * -4;
      spotYellow.current.position.z = Math.sin(t * 1.1) * 3 + 4;
    }
  });

  return (
    <>
      <spotLight
        ref={spotRed}
        position={[4, 5, 4]}
        angle={0.4}
        penumbra={0.8}
        intensity={80}
        color="#D80032" // Stage Red
        castShadow
      />
      <spotLight
        ref={spotYellow}
        position={[-4, 5, 4]}
        angle={0.4}
        penumbra={0.8}
        intensity={60}
        color="#FFDE4D" // Festival Yellow
        castShadow
      />
    </>
  );
}

// Spark/Dust Particle fields
function ParticleDust() {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 400;

  const positions = React.useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 15;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 15;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 15;
    }
    return pos;
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (pointsRef.current) {
      pointsRef.current.rotation.y = t * 0.02;
      pointsRef.current.rotation.x = Math.sin(t * 0.05) * 0.02;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#FFEAA7"
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
}

export default function HeroScene() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full bg-[#121212] flex items-center justify-center">
        <div className="font-display font-extrabold text-[#FAF8F5]/30 text-lg uppercase tracking-widest animate-pulse">
          Initializing Stage 3D...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 6.5], fov: 50 }}
        shadows
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.15} />
        
        {/* Cinematic Spotlight environment */}
        <StageSpotlights />
        <MouseLight />

        {/* Core Stage Logo */}
        <StageLogo />

        {/* Particle Ambience */}
        <ParticleDust />

        {/* Stage Grid Background */}
        <gridHelper
          args={[20, 20, "rgba(250,248,245,0.1)", "rgba(250,248,245,0.03)"]}
          position={[0, -2.5, 0]}
        />
      </Canvas>
    </div>
  );
}
