import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, Float, Points, PointMaterial, Ring } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';

// --- Audio Analyzer Hook ---
const useAudioAnalyzer = (isActive) => {
  const [amplitude, setAmplitude] = useState(0);
  const analyzerRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!isActive) {
      setAmplitude(0);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    let audioContext;
    let source;

    const setupAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        source = audioContext.createMediaStreamSource(stream);
        const analyzer = audioContext.createAnalyser();
        analyzer.fftSize = 256;
        source.connect(analyzer);
        analyzerRef.current = analyzer;
        dataArrayRef.current = new Uint8Array(analyzer.frequencyBinCount);

        const update = () => {
          if (analyzerRef.current) {
            analyzerRef.current.getByteFrequencyData(dataArrayRef.current);
            let sum = 0;
            for (let i = 0; i < dataArrayRef.current.length; i++) {
              sum += dataArrayRef.current[i];
            }
            const avg = sum / dataArrayRef.current.length;
            setAmplitude(avg / 128);
          }
          animationRef.current = requestAnimationFrame(update);
        };
        update();
      } catch (err) {
        console.error("Audio access denied", err);
      }
    };

    setupAudio();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioContext) audioContext.close();
    };
  }, [isActive]);

  return amplitude;
};

// --- Sub-components ---

const SegmentedScanRing = ({ state }) => {
  const groupRef = useRef();

  useFrame((stateObj, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.z -= delta * 0.4;
  });

  return (
    <group ref={groupRef} rotation={[Math.PI / 2, 0, 0]}>
      {[0, 1, 2, 3].map((i) => (
        <Ring key={i} args={[2.8, 2.85, 64, 1, (i * Math.PI) / 2, Math.PI / 4]}>
          <meshBasicMaterial color="#00F5D4" transparent opacity={0.25} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
        </Ring>
      ))}
    </group>
  );
};

const EnergyPulseRing = ({ state }) => {
  const meshRef = useRef();

  useFrame((stateObj, delta) => {
    if (!meshRef.current) return;

    if (state === 'speaking' || state === 'listening') {
      meshRef.current.scale.x += delta * 2.5;
      meshRef.current.scale.y += delta * 2.5;
      meshRef.current.material.opacity -= delta * 0.9;

      if (meshRef.current.scale.x > 6) {
        meshRef.current.scale.set(1, 1, 1);
        meshRef.current.material.opacity = 0.6;
      }
    } else {
      meshRef.current.scale.set(1, 1, 1);
      meshRef.current.material.opacity = 0;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[1.15, 1.2, 80]} />
      <meshBasicMaterial color="#00F5D4" transparent opacity={0.6} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
    </mesh>
  );
};

const CinematicSphere = ({ amplitude, state }) => {
  const meshRef = useRef();
  const gridRef = useRef();

  useFrame((stateObj, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += delta * 0.18;
    gridRef.current.rotation.y -= delta * 0.22;

    let targetScale = 1;
    let glowIntensity = 1.5;

    if (state === 'listening') {
      targetScale = 1.15 + amplitude * 0.6;
      glowIntensity = 3.0 + amplitude * 6;
    } else if (state === 'speaking') {
      targetScale = 1.08 + Math.sin(stateObj.clock.elapsedTime * 14) * 0.1;
      glowIntensity = 2.5 + Math.sin(stateObj.clock.elapsedTime * 14) * 2.5;
    } else {
      targetScale = 1 + Math.sin(stateObj.clock.elapsedTime * 2) * 0.04;
    }

    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.12);
    meshRef.current.material.emissiveIntensity = glowIntensity;
    gridRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.12);
  });

  return (
    <group>
      {/* Holographic Wireframe Core */}
      <Sphere ref={meshRef} args={[1, 64, 64]}>
        <meshStandardMaterial
          color="#00F5D4"
          emissive="#00F5D4"
          emissiveIntensity={1.5}
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
        />
      </Sphere>

      <Sphere ref={gridRef} args={[1.1, 32, 32]}>
        <meshStandardMaterial
          wireframe
          color="#00E5FF"
          transparent
          opacity={0.3}
          emissive="#00E5FF"
          emissiveIntensity={1.2}
        />
      </Sphere>

      {/* Inner "Arc" Light */}
      <pointLight intensity={6} color="#00F5D4" distance={7} />
    </group>
  );
};

const RotatingHUDRings = ({ amplitude, state }) => {
  const groupRef = useRef();

  useFrame((stateObj, delta) => {
    if (!groupRef.current) return;

    let speedMult = 1;
    if (state === 'listening') speedMult = 6;
    if (state === 'speaking') speedMult = 4;

    groupRef.current.children.forEach((ring, i) => {
      ring.rotation.z += delta * (i % 2 === 0 ? 0.35 : -0.6) * speedMult;
      ring.rotation.x += delta * 0.09 * speedMult;

      const pulse = state === 'idle' ? 1 + Math.sin(stateObj.clock.elapsedTime * 2.5 + i) * 0.03 : 1;
      ring.scale.set(pulse, pulse, pulse);
    });
  });

  return (
    <group ref={groupRef}>
      {/* Inner HUD Ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.4, 1.42, 128]} />
        <meshBasicMaterial color="#00F5D4" transparent opacity={0.6} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </mesh>

      {/* Segmented Outer Rings */}
      {[1.9, 2.3, 2.7].map((radius, i) => (
        <group key={i}>
          <Ring args={[radius, radius + 0.05, 128, 1, 0, Math.PI * 0.65]} rotation={[Math.PI / 2, 0, 0]}>
            <meshBasicMaterial color="#00F5D4" transparent opacity={0.35} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
          </Ring>
          <Ring args={[radius, radius + 0.05, 128, 1, Math.PI * 1.15, Math.PI * 0.65]} rotation={[Math.PI / 2, 0, 0]}>
            <meshBasicMaterial color="#00E5FF" transparent opacity={0.35} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
          </Ring>
        </group>
      ))}
    </group>
  );
};

const VibratingOrbits = ({ amplitude, state }) => {
  const groupRef = useRef();

  useFrame((stateObj, delta) => {
    if (!groupRef.current) return;

    let orbitSpeed = 0.6;
    if (state === 'speaking') orbitSpeed = 3.0;
    if (state === 'listening') orbitSpeed = 1.2;

    groupRef.current.rotation.y += delta * orbitSpeed;
    groupRef.current.rotation.z += delta * (orbitSpeed * 0.35);

    if (state === 'listening') {
      const jitter = amplitude * 0.1;
      groupRef.current.position.set(
        (Math.random() - 0.5) * jitter,
        (Math.random() - 0.5) * jitter,
        (Math.random() - 0.5) * jitter
      );
    } else {
      groupRef.current.position.set(0, 0, 0);
    }
  });

  return (
    <group ref={groupRef}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} rotation={[i * Math.PI / 3, i * Math.PI / 4, 0]}>
          <torusGeometry args={[2.5, 0.006, 16, 128]} />
          <meshBasicMaterial color="#00F5D4" transparent opacity={0.65} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
    </group>
  );
};

const EnergyParticles = ({ amplitude, state }) => {
  const pointsRef = useRef();
  const count = 800;

  const [positions, initialY] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const iy = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 3 + Math.random() * 2;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 4;
      pos[i * 3 + 2] = Math.sin(angle) * radius;
      iy[i] = pos[i * 3 + 1];
    }
    return [pos, iy];
  }, []);

  useFrame((stateObj, delta) => {
    if (!pointsRef.current) return;
    const time = stateObj.clock.elapsedTime;
    const pos = pointsRef.current.geometry.attributes.position.array;

    for (let i = 0; i < count; i++) {
      // Ripple effect
      let ripple = Math.sin(time * 2 + i * 0.1) * 0.2;
      if (state === 'listening') ripple += amplitude * 0.5;
      if (state === 'speaking') ripple += Math.sin(time * 10) * 0.3;

      pos[i * 3 + 1] = initialY[i] + ripple;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.rotation.y += 0.005;
  });

  return (
    <Points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <PointMaterial
        transparent
        color="#00F5D4"
        size={0.03}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.6}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
};

const AICore = ({ assistantState = 'idle' }) => {
  const amplitude = useAudioAnalyzer(assistantState === 'listening');

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Cinematic Ambient Glow - Perfectly Centered */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,245,212,0.15)_0%,_transparent_70%)] pointer-events-none blur-[100px] opacity-60 z-0" />

      {/* Main 3D Scene - Occupation of center space */}
      <Canvas className="w-full h-full" camera={{ position: [0, 0, 10], fov: 45 }}>
        <ambientLight intensity={0.6} />
        {/* Float is now stabilized to 0 for perfect layout centering as per user request */}
        <Float speed={2.5} rotationIntensity={0} floatIntensity={0}>
          <CinematicSphere amplitude={amplitude} state={assistantState} />
          <RotatingHUDRings amplitude={amplitude} state={assistantState} />
          <VibratingOrbits amplitude={amplitude} state={assistantState} />
          <EnergyParticles amplitude={amplitude} state={assistantState} />
          <EnergyPulseRing state={assistantState} />
          <SegmentedScanRing state={assistantState} />
        </Float>
      </Canvas>

      {/* Header Label - Centered above core */}
      <div className="absolute top-16 flex flex-col items-center z-30 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-2"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
            <span className="font-hud text-[10px] uppercase tracking-[0.8em] text-cyan-400/80 font-bold whitespace-nowrap pl-[0.8em]">
              Neural_Interface_v4
            </span>
            <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
          </div>
          <h1 className="font-hud text-xl font-black uppercase tracking-[1.2em] pl-[1.2em] text-cyan-50 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)] opacity-90">
            JARVIS
          </h1>
        </motion.div>
      </div>

      {/* Bottom Protocol Label - Centered below core */}
      <div className="absolute bottom-16 flex flex-col items-center z-30 pointer-events-none">
        <div className="flex items-center gap-4">
          <span className="font-mono text-[9px] uppercase tracking-widest text-cyan-400/50">
            CORE_REACTOR // {assistantState.toUpperCase()}
          </span>
        </div>
        <motion.div
          animate={{ width: [60, 120, 60], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="h-[1px] mt-2 bg-cyan-500/30"
        />
      </div>
    </div>
  );
};

export default React.memo(AICore);
