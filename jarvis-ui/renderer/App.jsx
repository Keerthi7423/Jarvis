import { useEffect, useState } from 'react';
import AICore from './components/AICore.jsx';
import CommandFeed from './components/CommandFeed.jsx';
import FeedPanel from './components/FeedPanel.jsx';
import StatusIndicator from './components/StatusIndicator.jsx';
import SystemStats from './components/SystemStats.jsx';

const RESPONSE_FEED = [
  'Assistant initialized',
  'Cinematic shell loaded',
  'Bridge events routed to live feed'
];

export default function App() {
  const [version, setVersion] = useState('...');
  const [status] = useState('Idle');

  useEffect(() => {
    window.api.getVersion().then(setVersion).catch(() => setVersion('unavailable'));
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-jarvis-bg text-slate-100">
      <div className="hud-grid-overlay pointer-events-none absolute inset-0 opacity-35" />
      <div className="hud-radial-overlay pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(51,240,255,0.16),transparent_62%)]" />

      <div className="relative z-10 grid min-h-screen grid-cols-1 gap-4 px-4 py-4 sm:gap-5 sm:px-5 sm:py-5 lg:grid-cols-[minmax(18rem,1fr)_minmax(28rem,1.1fr)_minmax(18rem,1fr)] lg:gap-6 lg:px-6 lg:py-6">
        <aside className="min-h-[18rem] lg:min-h-0">
          <CommandFeed />
        </aside>

        <section className="hud-panel hud-transition flex min-h-[28rem] flex-col items-center justify-center gap-5 px-5 py-6 text-center sm:gap-6 sm:px-7 lg:min-h-0 lg:px-8 lg:py-8">
          <div className="flex w-full max-w-[32rem] flex-col items-center justify-center gap-5 sm:gap-6">
            <AICore />
            <StatusIndicator status={status} />
            <p className="text-sm tracking-[0.18em] text-slate-300/78 uppercase">Listening ready</p>
            <p className="font-hud text-[10px] uppercase tracking-[0.28em] text-cyan-100/70">Build v{version}</p>
          </div>
        </section>

        <aside className="min-h-[18rem] lg:min-h-0">
          <div className="grid h-full grid-rows-[minmax(10rem,0.85fr)_minmax(14rem,1fr)] gap-4 sm:gap-5">
            <SystemStats />
            <FeedPanel title="Response Feed" items={RESPONSE_FEED} />
          </div>
        </aside>
      </div>
    </main>
  );
}
