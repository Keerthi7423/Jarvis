import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Float, Sphere, MeshDistortMaterial, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';

// --- Audio Hook ---
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
                        setAmplitude(avg / 128); // Normalized 0-1ish (can go higher)
                    }
                    animationRef.current = requestAnimationFrame(update);
                };
                update();
            } catch (err) {
                console.error("Error accessing microphone:", err);
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

const FlowerOfLifeSphere = ({ amplitude, assistantState }) => {
    const meshRef = useRef();

    const folTexture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, 1024, 1024);
        ctx.strokeStyle = '#00F5D4';
        ctx.lineWidth = 3;

        const r = 80;
        const centerX = 512;
        const centerY = 512;

        const drawCircle = (x, y) => {
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.stroke();
            // Add inner glow to lines
            ctx.globalAlpha = 0.3;
            ctx.lineWidth = 6;
            ctx.stroke();
            ctx.globalAlpha = 1.0;
            ctx.lineWidth = 3;
        };

        // Flower of Life Pattern
        drawCircle(centerX, centerY);

        // 1st layer
        for (let i = 0; i < 6; i++) {
            const a = (i * Math.PI) / 3;
            drawCircle(centerX + r * Math.cos(a), centerY + r * Math.sin(a));
        }

        // 2nd layer
        for (let i = 0; i < 6; i++) {
            const a = (i * Math.PI) / 3;
            // Corner circles
            drawCircle(centerX + 2 * r * Math.cos(a), centerY + 2 * r * Math.sin(a));
            // Mid circles
            const ma = a + Math.PI / 6;
            const md = r * Math.sqrt(3);
            drawCircle(centerX + md * Math.cos(ma), centerY + md * Math.sin(ma));
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 2);
        return texture;
    }, []);

    useFrame((state, delta) => {
        if (!meshRef.current) return;
        meshRef.current.rotation.y += delta * 0.15;
        meshRef.current.rotation.x += delta * 0.08;

        let targetScale = 1;
        if (assistantState === 'speaking') {
            targetScale = 1.1 + Math.sin(state.clock.elapsedTime * 8) * 0.05;
        } else if (assistantState === 'listening') {
            targetScale = 1.05 + amplitude * 0.3;
        } else {
            targetScale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.02;
        }

        meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    });

    return (
        <group>
            <mesh ref={meshRef}>
                <sphereGeometry args={[1, 64, 64]} />
                <meshStandardMaterial
                    map={folTexture}
                    transparent
                    opacity={0.7}
                    color="#00F5D4"
                    emissive="#00F5D4"
                    emissiveIntensity={assistantState === 'listening' ? 3 : 1.5}
                    blending={THREE.AdditiveBlending}
                    side={THREE.DoubleSide}
                />
            </mesh>
            {/* Inner Glow Sphere */}
            <Sphere args={[0.95, 32, 32]}>
                <meshBasicMaterial color="#00F5D4" transparent opacity={0.15} blending={THREE.AdditiveBlending} />
            </Sphere>
        </group>
    );
};

const HUDRings = ({ amplitude, assistantState }) => {
    const groupRef = useRef();

    useFrame((state, delta) => {
        if (!groupRef.current) return;

        let speedMult = 1;
        if (assistantState === 'listening') speedMult = 4;
        if (assistantState === 'speaking') speedMult = 2.5;

        groupRef.current.children.forEach((ring, i) => {
            ring.rotation.z += delta * (i % 2 === 0 ? 0.4 : -0.6) * speedMult;
            ring.rotation.x += delta * 0.15 * speedMult;

            if (assistantState === 'listening') {
                const s = 1 + amplitude * 0.2;
                ring.scale.lerp(new THREE.Vector3(s, s, s), 0.1);
            } else {
                ring.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
            }
        });
    });

    return (
        <group ref={groupRef}>
            {[1.4, 1.45, 1.8, 2.1, 2.4].map((radius, i) => (
                <mesh key={i} rotation={[Math.random() * Math.PI, Math.random() * Math.PI, 0]}>
                    <ringGeometry args={[radius, radius + 0.015, 128]} />
                    <meshBasicMaterial
                        color={i % 2 === 0 ? "#00F5D4" : "#00E5FF"}
                        transparent
                        opacity={0.3 - (i * 0.05)}
                        side={THREE.DoubleSide}
                        blending={THREE.AdditiveBlending}
                    />
                </mesh>
            ))}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[1.7, 0.003, 16, 100]} />
                <meshBasicMaterial color="#00F5D4" transparent opacity={0.4} wireframe />
            </mesh>
        </group>
    );
};

const ParticleWaves = ({ amplitude, assistantState }) => {
    const pointsRef = useRef();
    const count = 2000;

    const [positions, initialY] = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const iY = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 2.5 + Math.random() * 0.5;
            pos[i * 3] = Math.cos(angle) * radius;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
            pos[i * 3 + 2] = Math.sin(angle) * radius;
            iY[i] = pos[i * 3 + 1];
        }
        return [pos, iY];
    }, []);

    useFrame((state) => {
        if (!pointsRef.current) return;
        const time = state.clock.elapsedTime;
        const pos = pointsRef.current.geometry.attributes.position.array;

        for (let i = 0; i < count; i++) {
            const x = pos[i * 3];
            const z = pos[i * 3 + 2];
            const dist = Math.sqrt(x * x + z * z);

            // Wave effect
            let wave = Math.sin(dist * 2 - time * 3) * 0.1;

            if (assistantState === 'listening') {
                wave += Math.sin(time * 10 + i) * amplitude * 0.5;
            }

            pos[i * 3 + 1] = initialY[i] + wave;
        }
        pointsRef.current.geometry.attributes.position.needsUpdate = true;
        pointsRef.current.rotation.y += 0.005;
    });

    return (
        <Points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={count}
                    array={positions}
                    itemSize={3}
                />
            </bufferGeometry>
            <PointMaterial
                transparent
                color="#00F5D4"
                size={0.02}
                sizeAttenuation={true}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </Points>
    );
};

const JarvisOrb = ({ amplitude, assistantState }) => {
    return (
        <>
            <ambientLight intensity={0.5} />
            <pointLight position={[0, 0, 0]} intensity={2} color="#00F5D4" />
            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                <FlowerOfLifeSphere amplitude={amplitude} assistantState={assistantState} />
                <HUDRings amplitude={amplitude} assistantState={assistantState} />
                <ParticleWaves amplitude={amplitude} assistantState={assistantState} />
            </Float>

            {/* Background Glow */}
            <Sphere args={[10, 32, 32]}>
                <meshBasicMaterial color="#000810" side={THREE.BackSide} />
            </Sphere>
        </>
    );
};

// --- Main Interface Component ---

const JarvisVoiceInterface = () => {
    const [assistantState, setAssistantState] = useState('idle'); // 'idle', 'listening', 'speaking'
    const amplitude = useAudioAnalyzer(assistantState === 'listening');

    const toggleListening = () => {
        if (assistantState === 'idle') {
            setAssistantState('listening');
        } else if (assistantState === 'listening') {
            setAssistantState('speaking');
            // Simulate speaking for 3 seconds then go idle
            setTimeout(() => setAssistantState('idle'), 3000);
        }
    };

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden flex items-center justify-center">
            {/* Subtle Teal Gradient Glow Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,245,212,0.05)_0%,_transparent_70%)]" />

            {/* Top Left Status */}
            <div className="absolute top-10 left-10 z-20">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-4"
                >
                    <div className={`w-2 h-2 rounded-full ${assistantState === 'listening' ? 'bg-red-500 animate-pulse' : 'bg-cyan-500'}`} />
                    <span className="text-cyan-400 font-hud tracking-[0.3em] uppercase text-sm font-bold">
                        {assistantState === 'idle' && 'System Ready'}
                        {assistantState === 'listening' && 'Listening...'}
                        {assistantState === 'speaking' && 'Processing...'}
                    </span>
                </motion.div>
                <div className="mt-2 h-[1px] w-48 bg-gradient-to-r from-cyan-500/50 to-transparent" />
            </div>

            {/* 3D Scene */}
            <div className="w-full h-full z-10">
                <Canvas>
                    <PerspectiveCamera makeDefault position={[0, 0, 6]} />
                    <JarvisOrb amplitude={amplitude} assistantState={assistantState} />
                </Canvas>
            </div>

            {/* Bottom Center Mic Button */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-6">
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleListening}
                    className={`relative w-20 h-20 rounded-full flex items-center justify-center border-2 border-cyan-500/30 bg-cyan-500/5 shadow-[0_0_30px_rgba(0,245,212,0.2)] group transition-all duration-500 ${assistantState === 'listening' ? 'border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.3)]' : ''}`}
                >
                    <div className={`absolute inset-0 rounded-full border border-cyan-400/20 animate-ping ${assistantState === 'listening' ? 'border-red-400/20' : ''}`} />
                    <svg
                        viewBox="0 0 24 24"
                        className={`w-8 h-8 ${assistantState === 'listening' ? 'text-red-500' : 'text-cyan-400'} transition-colors duration-500`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        {assistantState === 'listening' ? (
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v4 M8 23h8" />
                        ) : (
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v4 M8 23h8" />
                        )}
                    </svg>
                </motion.button>

                {/* Bottom Icons */}
                <div className="flex gap-8 items-center">
                    {[
                        <svg key="1" viewBox="0 0 24 24" className="w-5 h-5 text-cyan-500/40" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 12h18M3 6h18M3 18h18" /></svg>,
                        <svg key="2" viewBox="0 0 24 24" className="w-5 h-5 text-cyan-500/40" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>,
                        <svg key="3" viewBox="0 0 24 24" className="w-5 h-5 text-cyan-500/40" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
                    ].map((icon, idx) => (
                        <motion.div
                            key={idx}
                            whileHover={{ color: '#00F5D4', scale: 1.2 }}
                            className="cursor-pointer border border-cyan-500/20 p-2 rounded-lg"
                        >
                            {icon}
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Decorative Lines and HUD elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-10 right-10 flex flex-col items-end gap-1">
                    <span className="text-[10px] text-cyan-500/30 font-mono">ENCRYPTED_LINK: ACTIVE</span>
                    <span className="text-[10px] text-cyan-500/30 font-mono">LATENCY: 12ms</span>
                </div>

                <div className="absolute bottom-10 left-10">
                    <div className="w-40 h-[1px] bg-cyan-500/20" />
                    <div className="mt-1 w-20 h-[1px] bg-cyan-500/20" />
                </div>

                <div className="absolute bottom-10 right-10 text-right">
                    <div className="w-40 h-[1px] bg-cyan-500/20 ml-auto" />
                    <div className="mt-1 w-20 h-[1px] bg-cyan-500/20 ml-auto" />
                </div>
            </div>
        </div>
    );
};

export default JarvisVoiceInterface;
