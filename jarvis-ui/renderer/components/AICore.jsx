import { memo } from 'react';
import Waveform from './Waveform.jsx';

function AICore() {
  return (
    <div className="relative flex h-52 w-52 items-center justify-center sm:h-60 sm:w-60 lg:h-[18rem] lg:w-[18rem]">
      <Waveform />
      <div className="hud-transition absolute inset-0 rounded-full border border-cyan-300/18 shadow-glowSoft" />
      <div className="hud-transition absolute inset-4 rounded-full border border-cyan-300/24" />
      <div className="hud-transition absolute inset-7 rounded-full border border-cyan-200/12" />
      <div className="hud-transition absolute h-full w-full animate-floatSlow rounded-full border border-cyan-200/20 shadow-glow" />
      <div className="hud-transition relative flex h-40 w-40 animate-corePulse items-center justify-center rounded-full border border-cyan-200/55 bg-cyan-300/8 shadow-core sm:h-44 sm:w-44 lg:h-48 lg:w-48">
        <div className="hud-transition h-24 w-24 rounded-full border border-cyan-100/45 bg-cyan-200/10 shadow-[inset_0_0_22px_rgba(51,240,255,0.24)] sm:h-[6.5rem] sm:w-[6.5rem] lg:h-28 lg:w-28" />
        <span className="font-hud absolute text-[10px] uppercase tracking-[0.3em] text-jarvis-cyan sm:text-[11px]">
          AI CORE
        </span>
      </div>
    </div>
  );
}

export default memo(AICore);
