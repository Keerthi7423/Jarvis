import Waveform from './Waveform.jsx';

export default function AICore() {
  return (
    <div className="relative flex h-52 w-52 items-center justify-center sm:h-64 sm:w-64 lg:h-72 lg:w-72">
      <Waveform />
      <div className="absolute inset-0 rounded-full border border-cyan-300/25" />
      <div className="absolute inset-4 rounded-full border border-cyan-300/35" />
      <div className="absolute h-full w-full animate-floatSlow rounded-full border border-cyan-200/30 shadow-neon" />
      <div className="relative flex h-40 w-40 animate-corePulse items-center justify-center rounded-full border border-cyan-200/70 bg-cyan-300/10 shadow-core sm:h-48 sm:w-48">
        <div className="h-24 w-24 rounded-full border border-cyan-100/70 bg-cyan-200/10 shadow-[inset_0_0_26px_rgba(51,240,255,0.42)] sm:h-28 sm:w-28" />
        <span className="font-hud absolute text-[10px] uppercase tracking-[0.34em] text-jarvis-cyan sm:text-xs">
          AI CORE
        </span>
      </div>
    </div>
  );
}
