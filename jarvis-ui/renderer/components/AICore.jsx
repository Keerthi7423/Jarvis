import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, Torus, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';

const ParticleField = ({ state }) => {
  const pointsRef = useRef(null);

  const [positions] = useMemo(() => {
    const count = 1000;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return [positions];
  }, []);

  useFrame((stateObj, delta) => {
    if (!pointsRef.current) return;

    // speed up for processing/listening
    let speed = 0.05;
    if (state === 'processing') speed = 0.3;
    if (state === 'listening') speed = 0.1;

    pointsRef.current.rotation.y += delta * speed;
    pointsRef.current.rotation.x += delta * (speed * 0.4);
  });

  return (
    <Points ref={pointsRef} positions={positions} frustumCulled={false}>
      <PointMaterial transparent color="#0ff" size={0.03} sizeAttenuation={true} depthWrite={false} opacity={0.6} blending={THREE.AdditiveBlending} />
    </Points>
  );
};

const CoreSphere = ({ state }) => {
  const meshRef = useRef(null);

  useFrame((stateObj, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += delta * 0.5;
    meshRef.current.rotation.x += delta * 0.2;

    let targetScale = 1;
    let targetPulse = 0;

    if (state === 'speaking') {
      // waveform animation reacting to "microphone input"
      targetPulse = Math.sin(stateObj.clock.elapsedTime * 15) * 0.2 + Math.cos(stateObj.clock.elapsedTime * 25) * 0.1;
      targetScale = 1 + targetPulse;
    } else if (state === 'listening') {
      targetScale = 1.05 + Math.sin(stateObj.clock.elapsedTime * 3) * 0.05;
    } else if (state === 'processing') {
      meshRef.current.rotation.y += delta * 3;
      meshRef.current.rotation.x += delta * 2;
      targetScale = 1.1;
    }

    // Smooth transition
    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
  });

  return (
    <Sphere ref={meshRef} args={[1.2, 32, 32]}>
      <meshStandardMaterial
        color="#0ff"
        wireframe={state === 'processing'}
        emissive="#0ff"
        emissiveIntensity={0.8}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </Sphere>
  );
};

const GlowRings = ({ state }) => {
  const groupRef = useRef(null);
  const ring1Ref = useRef(null);
  const ring2Ref = useRef(null);

  useFrame((stateObj, delta) => {
    if (!groupRef.current || !ring1Ref.current || !ring2Ref.current) return;

    groupRef.current.rotation.x += delta * 0.2;
    groupRef.current.rotation.y -= delta * 0.3;
    groupRef.current.rotation.z += delta * 0.1;

    if (state === 'listening') {
      const pulse = 0.5 + Math.sin(stateObj.clock.elapsedTime * 4) * 0.5; // Outer rings pulse with glow
      ring1Ref.current.emissiveIntensity = 0.5 + pulse * 2;
      ring2Ref.current.emissiveIntensity = 0.5 + pulse * 1.5;
      groupRef.current.scale.lerp(new THREE.Vector3(1.05, 1.05, 1.05), 0.1);
    } else if (state === 'processing') {
      ring1Ref.current.emissiveIntensity = 2.0;
      ring2Ref.current.emissiveIntensity = 2.0;
      groupRef.current.rotation.y -= delta * 2;
      groupRef.current.scale.lerp(new THREE.Vector3(1.1, 1.1, 1.1), 0.1);
    } else if (state === 'speaking') {
      const w = 1.0 + Math.sin(stateObj.clock.elapsedTime * 15) * 0.15;
      ring1Ref.current.emissiveIntensity = 1.0;
      groupRef.current.scale.lerp(new THREE.Vector3(w, w, w), 0.2);
    } else {
      ring1Ref.current.emissiveIntensity = 0.6;
      ring2Ref.current.emissiveIntensity = 0.4;
      groupRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
    }
  });

  return (
    <group ref={groupRef}>
      <Torus args={[1.6, 0.02, 16, 100]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial ref={ring1Ref} color="#0ff" emissive="#0ff" emissiveIntensity={0.6} transparent opacity={0.8} blending={THREE.AdditiveBlending} />
      </Torus>
      <Torus args={[1.9, 0.015, 16, 100]} rotation={[Math.PI / 3, Math.PI / 4, 0]}>
        <meshStandardMaterial ref={ring2Ref} color="#0ff" emissive="#0ff" emissiveIntensity={0.4} transparent opacity={0.6} blending={THREE.AdditiveBlending} />
      </Torus>
      <Torus args={[2.2, 0.01, 16, 100]} rotation={[-Math.PI / 4, 0, Math.PI / 6]}>
        <meshStandardMaterial color="#0ff" emissive="#0ff" emissiveIntensity={0.2} transparent opacity={0.3} blending={THREE.AdditiveBlending} />
      </Torus>
    </group>
  );
};

// Error Boundary Class
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("WebGL/ThreeJS Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return <div className="text-red-500 font-mono text-xs w-full h-full flex items-center justify-center p-4 bg-black/50 overflow-auto">{String(this.state.error)}</div>;
    }
    return this.props.children;
  }
}

// Main Component
const AICore = ({ assistantState = 'idle' }) => {
  return (
    <div className="relative flex h-64 w-64 items-center justify-center sm:h-72 sm:w-72 lg:h-[22rem] lg:w-[22rem]">
      {/* Outer HTML Glow matches color */}
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 rounded-full bg-cyan-500 blur-3xl"
      />

      {/* Three.js Canvas */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <ErrorBoundary>
          <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[0, 0, 0]} intensity={2} color="#0ff" distance={10} />

            <ParticleField state={assistantState} />
            <CoreSphere state={assistantState} />
            <GlowRings state={assistantState} />
          </Canvas>
        </ErrorBoundary>
      </div>

      {/* Central Screen Overlays / Texts if any can go here */}
      <div className="absolute flex flex-col items-center justify-center text-center z-20 pointer-events-none">
        <motion.div
          animate={{ width: [40, 60, 40] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="mb-2 h-[2px] rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(51,240,255,1)]"
        />
        <h1 className="font-hud text-base font-black uppercase tracking-[0.5em] text-cyan-50 shadow-cyan-400 drop-shadow-glow">
          JARVIS
        </h1>
        <div className="mt-1 h-[0.5px] w-20 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
        <motion.span
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mt-3 font-mono text-[9px] font-medium uppercase tracking-[0.3em] text-cyan-400"
        >
          {assistantState === 'idle' && 'Neural Link Active'}
          {assistantState === 'listening' && 'Awaiting Input...'}
          {assistantState === 'processing' && 'Processing Data...'}
          {assistantState === 'speaking' && 'Transmitting...'}
        </motion.span>
      </div>
    </div>
  );
};

export default React.memo(AICore);
