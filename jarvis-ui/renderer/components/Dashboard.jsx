import React from 'react';
import { motion } from 'framer-motion';
import CommandFeed from './CommandFeed.jsx';
import AICore from './AICore.jsx';
import SystemStats from './SystemStats.jsx';
import StatusIndicator from './StatusIndicator.jsx';

export default function Dashboard({ assistantState = 'idle' }) {
    return (
        <div className="flex flex-col h-screen w-full bg-[#02050b] p-6 lg:p-10 overflow-hidden font-hud">
            {/* Top Bar / Header Section */}
            <header className="flex justify-between items-center mb-6">
                <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-6 bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                        <h1 className="text-xl font-black uppercase tracking-[0.4em] text-cyan-50 drop-shadow-glow">
                            J.A.R.V.I.S. <span className="text-cyan-500/50 font-normal text-xs ml-2 tracking-widest">OS_v1.0.4</span>
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-10">
                    <div className="hidden md:flex flex-col items-end opacity-40">
                        <span className="text-[10px] uppercase tracking-widest text-cyan-500">Global Threat Level: Low</span>
                        <span className="text-[10px] uppercase tracking-widest text-cyan-500">Neural Sync: 99.8%</span>
                    </div>
                    {/* Time or other HUD info could go here */}
                </div>
            </header>

            {/* Main Content Grid */}
            <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">

                {/* Left Panel: Command Console */}
                <aside className="lg:col-span-3 flex flex-col min-h-0">
                    <div className="flex-1 holographic-panel glow-panel overflow-hidden">
                        <CommandFeed />
                    </div>
                </aside>

                <section className="lg:col-span-6 flex items-center justify-center relative bg-transparent overflow-hidden">
                    {/* Decorative Corner Brackets */}
                    <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-cyan-500/20 rounded-tl-[3rem] pointer-events-none z-10" />
                    <div className="absolute top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-cyan-500/20 rounded-tr-[3rem] pointer-events-none z-10" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 border-l-2 border-b-2 border-cyan-500/20 rounded-bl-[3rem] pointer-events-none z-10" />
                    <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-cyan-500/20 rounded-br-[3rem] pointer-events-none z-10" />

                    {/* Scanning Line Animation */}
                    <div className="scanline" />

                    <div className="w-full h-full">
                        <AICore assistantState={assistantState} />
                    </div>
                </section>

                {/* Right Panel: Telemetry */}
                <aside className="lg:col-span-3 flex flex-col min-h-0">
                    <div className="flex-1 holographic-panel glow-panel overflow-hidden">
                        <SystemStats />
                    </div>
                </aside>
            </main>

            {/* Bottom Panel: System Status */}
            <footer className="mt-8 flex justify-between items-end">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-4">
                        <div className={`h-2 w-2 rounded-full shadow-[0_0_10px_rgba(0,245,212,1)] ${assistantState === 'idle' ? 'bg-cyan-500' : 'bg-red-500 animate-pulse'}`} />
                        <span className="text-[10px] uppercase tracking-[0.3em] text-cyan-400 font-bold">
                            Link Status: <span className="text-white opacity-80">{assistantState.toUpperCase()}</span>
                        </span>
                    </div>
                    <div className="w-64 h-[2px] bg-gradient-to-r from-cyan-500/50 to-transparent" />
                </div>

                <div className="flex items-center gap-8">
                    {[
                        { label: 'Thermal', val: '42°C' },
                        { label: 'Core_Uptime', val: '142:23:08' },
                        { label: 'Neural_Load', val: '0.04%' }
                    ].map((stat, i) => (
                        <div key={i} className="flex flex-col items-end">
                            <span className="text-[8px] uppercase tracking-widest text-cyan-500/40">{stat.label}</span>
                            <span className="text-[10px] font-mono text-cyan-200">{stat.val}</span>
                        </div>
                    ))}
                </div>
            </footer>

            {/* Ambient HUD Grit/Overlay */}
            <div className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay" />
        </div>
    );
}
