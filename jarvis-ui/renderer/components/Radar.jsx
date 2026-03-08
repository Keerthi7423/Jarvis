import { memo } from 'react';

const Radar = () => {
    return (
        <div className="relative h-48 w-48 overflow-hidden rounded-full border border-cyan-500/30 bg-slate-900/40 backdrop-blur-sm">
            {/* Grid Lines */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-full w-[1px] bg-cyan-500/10" />
                <div className="h-[1px] w-full bg-cyan-500/10" />
            </div>

            {/* Circles */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-3/4 w-3/4 rounded-full border border-cyan-500/10" />
                <div className="h-1/2 w-1/2 rounded-full border border-cyan-500/10" />
                <div className="h-1/4 w-1/4 rounded-full border border-cyan-500/10" />
            </div>

            {/* Scanning Sweep */}
            <div className="absolute inset-0 origin-center animate-spin-slow bg-[conic-gradient(from_0deg,transparent_0deg,rgba(51,240,255,0.2)_10deg,transparent_90deg)]" />

            {/* Blips */}
            <div className="absolute left-[30%] top-[40%] h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(51,240,255,1)]" />
            <div className="absolute left-[70%] top-[60%] h-1 w-1 animate-pulse rounded-full bg-cyan-400/80 shadow-[0_0_6px_rgba(51,240,255,0.8)]" style={{ animationDelay: '1s' }} />
            <div className="absolute left-[50%] top-[20%] h-1 w-1 animate-pulse rounded-full bg-rose-500/80 shadow-[0_0_6px_rgba(244,63,94,0.8)]" style={{ animationDelay: '1.5s' }} />

            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 font-hud text-[8px] uppercase tracking-widest text-cyan-300/60">
                Radar Scan
            </span>
        </div>
    );
};

export default memo(Radar);
