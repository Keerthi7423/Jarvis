import React from 'react';
import CommandFeed from './CommandFeed.jsx';
import AICore from './AICore.jsx';
import SystemStats from './SystemStats.jsx';
import StatusIndicator from './StatusIndicator.jsx';

export default function Dashboard({ assistantState = 'idle' }) {
    return (
        <div className="grid min-h-screen grid-cols-1 p-8 lg:grid-cols-[22rem_1fr_22rem] gap-10">
            {/* Left Column: Command Feed Panel */}
            <aside className="flex flex-col gap-8 h-[calc(100vh-4rem)]">
                <div className="flex-1 min-h-0 bg-[#061022] rounded-[2rem] border-2 border-cyan-500/20 shadow-[0_0_20px_rgba(34,211,238,0.05)] overflow-hidden">
                    <CommandFeed />
                </div>
            </aside>

            {/* Center Column: AI Core Visualization */}
            <section className="flex flex-col items-center justify-center gap-10">
                <div className="relative group p-10 flex items-center justify-center">
                    {/* Neon framing */}
                    <div className="absolute -left-10 -top-10 h-32 w-32 border-l-4 border-t-4 border-cyan-500/40 rounded-tl-[3rem] transition-all duration-700 shadow-[inset_10px_10px_20px_rgba(2,132,199,0.2)] group-hover:border-cyan-400 group-hover:-left-12 group-hover:-top-12 group-hover:shadow-[inset_15px_15px_30px_rgba(34,211,238,0.4)]" />
                    <div className="absolute -right-10 -top-10 h-32 w-32 border-r-4 border-t-4 border-cyan-500/40 rounded-tr-[3rem] transition-all duration-700 shadow-[inset_-10px_10px_20px_rgba(2,132,199,0.2)] group-hover:border-cyan-400 group-hover:-right-12 group-hover:-top-12 group-hover:shadow-[inset_-15px_15px_30px_rgba(34,211,238,0.4)]" />
                    <div className="absolute -left-10 -bottom-10 h-32 w-32 border-l-4 border-b-4 border-cyan-500/40 rounded-bl-[3rem] transition-all duration-700 shadow-[inset_10px_-10px_20px_rgba(2,132,199,0.2)] group-hover:border-cyan-400 group-hover:-left-12 group-hover:-bottom-12 group-hover:shadow-[inset_15px_-15px_30px_rgba(34,211,238,0.4)]" />
                    <div className="absolute -right-10 -bottom-10 h-32 w-32 border-r-4 border-b-4 border-cyan-500/40 rounded-br-[3rem] transition-all duration-700 shadow-[inset_-10px_-10px_20px_rgba(2,132,199,0.2)] group-hover:border-cyan-400 group-hover:-right-12 group-hover:-bottom-12 group-hover:shadow-[inset_-15px_-15px_30px_rgba(34,211,238,0.4)]" />

                    <AICore assistantState={assistantState} />
                </div>

                <div className="flex flex-col items-center gap-6 mt-8">
                    <StatusIndicator status={assistantState} />
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-[2px] w-64 bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                        <p className="font-hud text-xs uppercase tracking-[0.5em] text-cyan-400 drop-shadow-glow font-bold">
                            {assistantState === 'idle' && 'Neural Presence Active'}
                            {assistantState === 'listening' && 'Awaiting Input'}
                            {assistantState === 'processing' && 'Processing Data'}
                            {assistantState === 'speaking' && 'Transmitting Response'}
                        </p>
                    </div>
                </div>
            </section>

            {/* Right Column: System Telemetry */}
            <aside className="flex flex-col gap-8 h-[calc(100vh-4rem)]">
                <div className="flex-1 bg-[#061022] rounded-[2rem] border-2 border-cyan-500/20 shadow-[0_0_20px_rgba(34,211,238,0.05)] overflow-hidden">
                    <SystemStats />
                </div>
            </aside>
        </div>
    );
}
