import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AICore from './components/AICore.jsx';
import CommandFeed from './components/CommandFeed.jsx';
import FeedPanel from './components/FeedPanel.jsx';
import StatusIndicator from './components/StatusIndicator.jsx';
import StartupScreen from './components/StartupScreen.jsx';
import Dashboard from './components/Dashboard.jsx';
import JarvisVoiceInterface from './components/JarvisVoiceInterface.jsx';

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
    <main className="relative min-h-screen overflow-hidden bg-[#00050a] text-slate-100 font-hud">
      <AnimatePresence>
        {!isBooted && (
          <StartupScreen key="startup" onComplete={() => setIsBooted(true)} />
        )}
      </AnimatePresence>

      {/* Background HUD Layers */}
      <div className="hud-grid-overlay pointer-events-none absolute inset-0 opacity-[0.05]" />

      {/* Main Cinematic Interface */}
      <div className={`relative z-10 h-full transition-all duration-1000 ${isBooted ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-110 blur-xl pointer-events-none'}`}>
        <Dashboard assistantState={assistantState} />
      </div>

      {/* Ambient HUD Data Overlay */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 opacity-10 pointer-events-none">
        <span className="text-[8px] uppercase tracking-[1em] text-cyan-500">Secure_Connection::Stable</span>
      </div>
    </main>
  );
}
