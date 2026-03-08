import { memo } from 'react';
import { motion } from 'framer-motion';
import Waveform from './Waveform.jsx';

const AICore = () => {
  return (
    <div className="relative flex h-64 w-64 items-center justify-center sm:h-72 sm:w-72 lg:h-[22rem] lg:w-[22rem]">
      {/* Outer Atmospheric Glow */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 rounded-full bg-cyan-500 blur-3xl"
      />

      {/* Primary Waveform Visualizer */}
      <div className="absolute h-[85%] w-[85%] opacity-50">
        <Waveform />
      </div>

      {/* Layered Rotating Rings (Framer Motion) */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 rounded-full border-[1.5px] border-dashed border-cyan-400/30"
      />

      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute inset-[8%] rounded-full border-[1px] border-cyan-300/20 shadow-[0_0_20px_rgba(51,240,255,0.1)]"
      />

      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="absolute inset-[15%] rounded-full border-[0.5px] border-cyan-500/10"
      >
        <div className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-cyan-400 shadow-[0_0_15px_rgba(51,240,255,1)]" />
      </motion.div>

      {/* Central Command Core */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.5, delay: 0.5 }}
        className="relative flex h-48 w-48 items-center justify-center rounded-full border-2 border-cyan-300/40 bg-slate-950/80 shadow-[0_0_60px_rgba(51,240,255,0.2),inset_0_0_40px_rgba(51,240,255,0.2)] backdrop-blur-xl sm:h-52 sm:w-52 lg:h-60 lg:w-60"
      >
        {/* Inner Scanning Arc */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute inset-[5%] rounded-full border-t border-cyan-400/30"
        />

        <div className="absolute flex flex-col items-center justify-center text-center">
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
            Neural Link Active
          </motion.span>
        </div>

        {/* Global Scanning Line */}
        <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
          <motion.div
            animate={{ top: ['-100%', '200%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 h-1/2 w-full bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent"
          />
        </div>
      </motion.div>
    </div>
  );
};

export default memo(AICore);
