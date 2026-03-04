import { useEffect, useState } from 'react';
import AICore from './components/AICore.jsx';
import FeedPanel from './components/FeedPanel.jsx';
import StatusIndicator from './components/StatusIndicator.jsx';

const commandFeed = [
  'Awaiting command input',
  'Voice channel online',
  'Navigation systems standby'
];

const responseFeed = [
  'Assistant initialized',
  'Cinematic shell loaded',
  'Ready for backend bridge'
];

export default function App() {
  const [version, setVersion] = useState('...');
  const [status] = useState('Idle');

  useEffect(() => {
    window.api.getVersion().then(setVersion).catch(() => setVersion('unavailable'));
  }, []);

  return (
    <main className="relative flex h-screen w-screen flex-col bg-jarvis-bg text-slate-100 lg:flex-row">
      <div className="hud-grid-overlay pointer-events-none absolute inset-0 opacity-45" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(51,240,255,0.08),transparent_52%),radial-gradient(circle_at_bottom,rgba(51,240,255,0.07),transparent_48%)]" />

      <aside className="z-10 h-[30%] min-h-[180px] p-3 sm:p-4 lg:h-auto lg:w-[24%] lg:min-w-[280px] lg:p-6">
        <FeedPanel title="Command Feed" items={commandFeed} />
      </aside>

      <section className="z-10 flex flex-1 animate-fadeUp flex-col items-center justify-center gap-5 px-5 py-3 sm:gap-7">
        <AICore />
        <StatusIndicator status={status} />
        <p className="text-sm text-slate-400/95 transition-colors duration-500">Listening ready</p>
        <p className="font-hud text-xs uppercase tracking-[0.22em] text-cyan-200/80">Build v{version}</p>
      </section>

      <aside className="z-10 h-[30%] min-h-[180px] p-3 sm:p-4 lg:h-auto lg:w-[24%] lg:min-w-[280px] lg:p-6">
        <FeedPanel title="Response Feed" items={responseFeed} />
      </aside>
    </main>
  );
}
