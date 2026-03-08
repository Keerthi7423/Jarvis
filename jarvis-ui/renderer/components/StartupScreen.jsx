import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const StartupScreen = ({ onComplete }) => {
    const [bootLog, setBootLog] = useState([]);
    const [isFinishing, setIsFinishing] = useState(false);

    const playPowerUpSound = useCallback(() => {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.setValueAtTime(40, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 1.5);
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2.0);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 2.2);
        } catch (e) { }
    }, []);

    const logs = [
        "Initializing JARVIS Core",
        "Loading Neural Modules",
        "Activating Holographic HUD",
        "Establishing Neural Link",
        "System Bridge Online",
        "Authentication Verified"
    ];

    useEffect(() => {
        playPowerUpSound();
        let logIndex = 0;
        const interval = setInterval(() => {
            if (logIndex < logs.length) {
                setBootLog(prev => [...prev, logs[logIndex]]);
                logIndex++;
            } else {
                clearInterval(interval);
                setTimeout(() => {
                    setIsFinishing(true);
                    setTimeout(onComplete, 1200);
                }, 2000);
            }
        }, 450);
        return () => clearInterval(interval);
    }, [onComplete, playPowerUpSound]);

    return (
        <AnimatePresence>
            {!isFinishing && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, filter: 'blur(20px)', scale: 1.1 }}
                    transition={{ duration: 1 }}
                    className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#040916]"
                >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(51,240,255,0.05)_0%,transparent:70%)]" />
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(51,240,255,0.02)_1px,transparent:1px),linear-gradient(90deg,rgba(51,240,255,0.02)_1px,transparent:1px)] bg-[length:40px_40px]" />

                    <div className="relative mb-12">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 1 }}
                            className="relative h-40 w-40"
                        >
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 rounded-full border border-dashed border-cyan-500/40"
                            />
                            <motion.div
                                animate={{ rotate: -360 }}
                                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-4 rounded-full border border-cyan-400/20"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="h-4 w-4 rounded-full bg-cyan-400 shadow-[0_0_20px_rgba(51,240,255,1)]"
                                />
                            </div>
                        </motion.div>
                    </div>

                    <div className="w-full max-w-sm px-8 overflow-hidden">
                        <div className="space-y-3">
                            {bootLog.map((log, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-3"
                                >
                                    <span className="h-[1px] w-4 bg-cyan-500/40" />
                                    <span className="font-hud text-[10px] uppercase tracking-[0.3em] text-cyan-400/90">
                                        {log}
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className="absolute bottom-12 h-4">
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="block font-hud text-[9px] uppercase tracking-[0.6em] text-cyan-500/40"
                        >
                            Neural Presence Identified
                        </motion.span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default StartupScreen;
