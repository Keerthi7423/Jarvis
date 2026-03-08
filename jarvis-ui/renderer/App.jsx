import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AICore from './components/AICore.jsx';
import CommandFeed from './components/CommandFeed.jsx';
import FeedPanel from './components/FeedPanel.jsx';
import StatusIndicator from './components/StatusIndicator.jsx';
import SystemStats from './components/SystemStats.jsx';
import StartupScreen from './components/StartupScreen.jsx';
import Radar from './components/Radar.jsx';

const RESPONSE_FEED = [
  'Assistant initialized',
  'Cinematic shell loaded',
  'Bridge events routed to live feed',
  'Holographic HUD stabilized',
  'Neural link secure'
];

export default function App() {
  const [version, setVersion] = useState('...');
  const [isBooted, setIsBooted] = useState(false);

  useEffect(() => {
    window.api.getVersion().then(setVersion).catch(() => setVersion('unavailable'));
  }, []);

  useEffect(() => {
    if (isBooted) {
      try {
        const audio = new Audio('./assets/jarvis.mp3');
        audio.volume = 0.5;
        audio.play().catch(e => console.warn("Audio play blocked by browser:", e));
      } catch (err) {
        console.error("Failed to play jarvis.mp3:", err);
      }
    }
  }, [isBooted]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#040916] text-slate-100 font-hud">
      <AnimatePresence>
        {!isBooted && (
          <StartupScreen key="startup" onComplete={() => setIsBooted(true)} />
        )}
      </AnimatePresence>

      {/* Background HUD Layers */}
      <div className="hud-grid-overlay pointer-events-none absolute inset-0 opacity-10" />
      <div className="hud-radial-overlay pointer-events-none absolute inset-0 opacity-40" />

      {/* Dashboard - Mounted immediately for early bridge connection */}
      <div className={`relative z-10 transition-all duration-1000 ${isBooted ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-110 blur-xl pointer-events-none'}`}>
        <div className="grid min-h-screen grid-cols-1 p-8 lg:grid-cols-[22rem_1fr_22rem] gap-10">
          {/* Left Column: Intelligence Console */}
          <aside className="flex flex-col gap-8">
            <div className="flex-1 min-h-0">
              <CommandFeed />
            </div>
            <div className="glass-morphism p-6 rounded-[2rem] flex justify-center">
              <Radar />
            </div>
          </aside>

          {/* Center Column: Core Processor */}
          <section className="flex flex-col items-center justify-center gap-10">
            <div className="relative group">
              <div className="absolute -left-16 -top-16 h-32 w-32 border-l-2 border-t-2 border-cyan-500/30 rounded-tl-[3rem] transition-all duration-700 group-hover:border-cyan-400 group-hover:-left-20 group-hover:-top-20" />
              <div className="absolute -right-16 -top-16 h-32 w-32 border-r-2 border-t-2 border-cyan-500/30 rounded-tr-[3rem] transition-all duration-700 group-hover:border-cyan-400 group-hover:-right-20 group-hover:-top-20" />
              <div className="absolute -left-16 -bottom-16 h-32 w-32 border-l-2 border-b-2 border-cyan-500/30 rounded-bl-[3rem] transition-all duration-700 group-hover:border-cyan-400 group-hover:-left-20 group-hover:-bottom-20" />
              <div className="absolute -right-16 -bottom-16 h-32 w-32 border-r-2 border-b-2 border-cyan-500/30 rounded-br-[3rem] transition-all duration-700 group-hover:border-cyan-400 group-hover:-right-20 group-hover:-bottom-20" />
              <AICore />
            </div>

            <div className="flex flex-col items-center gap-6">
              <StatusIndicator status="Online" />
              <div className="flex flex-col items-center gap-3">
                <div className="h-[1px] w-64 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
                <p className="font-hud text-[10px] uppercase tracking-[0.5em] text-cyan-400/80 drop-shadow-glow">
                  Neural Presence Active
                </p>
                <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-slate-500">
                  JARVIS OS v{version} • GLOBAL_SYNC: STABLE
                </p>
              </div>
            </div>
          </section>

          {/* Right Column: Systems Telemetry */}
          <aside className="flex flex-col gap-8">
            <div className="flex-1">
              <SystemStats />
            </div>
            <div className="flex-1">
              <FeedPanel title="Network Vectors" items={RESPONSE_FEED} />
            </div>
          </aside>
        </div>
      </div>

      {/* Ambient HUD Data */}
      <div className="absolute bottom-6 left-8 font-mono text-[10px] uppercase tracking-widest text-cyan-500/20">
        POS: 40.7128N 74.0060W :: SCAN_ALT: 420M
      </div>
      <div className="absolute bottom-6 right-8 font-mono text-[10px] uppercase tracking-widest text-cyan-500/20">
        CORE_LOAD: OPTIMAL :: THREAD_04: SYNC
      </div>
    </main>
  );
}
