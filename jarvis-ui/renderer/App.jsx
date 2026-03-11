import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AICore from './components/AICore.jsx';
import CommandFeed from './components/CommandFeed.jsx';
import FeedPanel from './components/FeedPanel.jsx';
import StatusIndicator from './components/StatusIndicator.jsx';
import StartupScreen from './components/StartupScreen.jsx';
import Dashboard from './components/Dashboard.jsx';

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
  const [assistantState, setAssistantState] = useState('idle');

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
        <Dashboard assistantState={assistantState} />
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
