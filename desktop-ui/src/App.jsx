const commandFeed = [
  "Show mission status.",
  "Initialize diagnostics.",
  "Open tactical display."
];

const responseFeed = [
  "Awaiting command.",
  "Systems nominal.",
  "UI core active."
];

function FeedPanel({ title, items }) {
  return (
    <section className="rounded-2xl border border-cyan-400/30 bg-jarvis-panel/75 p-4 backdrop-blur-sm">
      <h2 className="mb-3 text-xs uppercase tracking-[0.22em] text-jarvis-cyanSoft">{title}</h2>
      <ul className="space-y-2 text-sm text-slate-200/90">
        {items.map((item) => (
          <li key={item} className="rounded-lg border border-cyan-300/15 bg-slate-950/40 px-3 py-2">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function App() {
  return (
    <main className="relative flex h-screen w-screen items-stretch overflow-hidden bg-jarvis-bg text-slate-100 animate-fadeIn">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(38,242,255,0.12),transparent_46%),radial-gradient(circle_at_bottom,rgba(38,242,255,0.06),transparent_50%)]" />

      <aside className="z-10 w-[22%] min-w-[280px] p-6">
        <FeedPanel title="Command Feed" items={commandFeed} />
      </aside>

      <section className="z-10 flex flex-1 flex-col items-center justify-center gap-8 p-6">
        <div className="relative flex h-72 w-72 items-center justify-center rounded-full border border-cyan-300/40 bg-cyan-400/5 shadow-neonStrong animate-pulseCore">
          <div className="absolute h-[18rem] w-[18rem] rounded-full border border-cyan-300/25" />
          <div className="h-44 w-44 rounded-full border border-cyan-200/60 bg-cyan-300/10 shadow-neon" />
          <span className="absolute text-xs uppercase tracking-[0.35em] text-jarvis-cyan">AI Core</span>
        </div>

        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.28em] text-slate-400">System Status</p>
          <p className="mt-2 text-2xl font-semibold text-jarvis-cyan">Idle</p>
          <p className="text-sm text-slate-400">Listening</p>
        </div>

        <div className="w-full max-w-xl rounded-2xl border border-cyan-400/30 bg-jarvis-panel/70 p-4">
          <p className="mb-3 text-xs uppercase tracking-[0.22em] text-jarvis-cyanSoft">Mic Waveform (Placeholder)</p>
          <div className="grid grid-cols-12 gap-1 rounded-lg bg-slate-950/40 p-3">
            {Array.from({ length: 48 }).map((_, index) => (
              <span
                key={index}
                className="h-8 rounded bg-cyan-300/35"
                style={{
                  height: `${20 + Math.abs((index % 12) - 6) * 4}px`,
                  opacity: 0.35 + ((index % 6) * 0.1)
                }}
              />
            ))}
          </div>
        </div>
      </section>

      <aside className="z-10 w-[22%] min-w-[280px] p-6">
        <FeedPanel title="Response Feed" items={responseFeed} />
      </aside>
    </main>
  );
}
