import { memo, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const WS_URL = import.meta.env.VITE_JARVIS_WS_URL || 'ws://127.0.0.1:8765';

const StatBar = ({ label, value, max = 100, unit = '%' }) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="flex flex-col gap-2 mb-4">
      <div className="flex justify-between items-end px-1">
        <span className="font-hud text-[10px] uppercase tracking-widest text-cyan-500/80">{label}</span>
        <span className="font-mono text-xs text-cyan-200">{value}{unit}</span>
      </div>
      <div className="h-1.5 w-full bg-slate-800/50 rounded-full overflow-hidden border border-cyan-500/10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_10px_rgba(51,240,255,0.5)]`}
        />
      </div>
    </div>
  );
};

function SystemStats() {
  const [stats, setStats] = useState({ cpu: 0, ram: 0, network: 0 });
  const [status, setStatus] = useState('connecting');
  const retryRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const connect = () => {
      if (cancelled) return;
      setStatus('connecting');
      const socket = new WebSocket(WS_URL);
      socketRef.current = socket;

      socket.onopen = () => { if (!cancelled) setStatus('connected'); };
      socket.onmessage = (event) => {
        if (cancelled) return;
        try {
          const payload = JSON.parse(event.data);
          if (payload?.type !== 'system_stats') return;
          setStats({
            cpu: Number(payload.cpu) || 0,
            ram: Number(payload.ram) || 0,
            network: Number(payload.network) || 0
          });
        } catch { }
      };
      socket.onclose = () => {
        if (cancelled) return;
        setStatus('disconnected');
        retryRef.current = setTimeout(connect, 2000);
      };
    };

    connect();
    return () => {
      cancelled = true;
      clearTimeout(retryRef.current);
      if (socketRef.current) socketRef.current.close();
    };
  }, []);

  return (
    <section className="h-full p-5 glass-morphism border border-cyan-500/20 flex flex-col gap-6">
      <header className="flex justify-between items-center mb-2">
        <h2 className="font-hud text-sm uppercase tracking-[0.3em] text-cyan-400">Telemetry</h2>
        <div className="flex items-center gap-2">
          <motion.div
            animate={status === 'connected' ? { opacity: [0.3, 1, 0.3] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
            className={`h-2 w-2 rounded-full ${status === 'connected' ? 'bg-cyan-500 shadow-[0_0_10px_rgba(51,240,255,1)]' : 'bg-red-500'}`}
          />
          <span className="font-mono text-[8px] uppercase text-slate-500">{status}</span>
        </div>
      </header>

      <div className="flex-1">
        <StatBar label="CPU Core Load" value={stats.cpu} />
        <StatBar label="Memory Allocation" value={stats.ram} />

        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="p-3 border border-cyan-500/10 rounded-lg bg-cyan-900/5">
            <p className="font-hud text-[8px] uppercase tracking-tighter text-cyan-500/60 mb-1">Network Throughput</p>
            <p className="font-mono text-lg text-cyan-100">{stats.network}<span className="text-[10px] ml-1 opacity-50">KB/S</span></p>
          </div>
          <div className="p-3 border border-cyan-500/10 rounded-lg bg-cyan-900/5">
            <p className="font-hud text-[8px] uppercase tracking-tighter text-cyan-500/60 mb-1">System Latency</p>
            <p className="font-mono text-lg text-cyan-100">12<span className="text-[10px] ml-1 opacity-50">MS</span></p>
          </div>
        </div>
      </div>

      <footer className="mt-auto pt-4 border-t border-cyan-500/10">
        <div className="flex justify-between items-center opacity-30">
          <span className="font-mono text-[8px] uppercase">Neural Link: SYNC</span>
          <span className="font-mono text-[8px] uppercase tracking-[0.2em]">JARVIS_PROTOCOL::04</span>
        </div>
      </footer>
    </section>
  );
}

export default memo(SystemStats);
