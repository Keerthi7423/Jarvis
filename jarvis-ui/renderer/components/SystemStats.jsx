import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const WS_URL = import.meta.env.VITE_JARVIS_WS_URL || 'ws://127.0.0.1:8765';

const SparkGraph = ({ color = "#00F5D4" }) => {
  const points = useMemo(() => Array.from({ length: 15 }, () => Math.random() * 20 + 5), []);
  return (
    <div className="flex items-end gap-[2px] h-6">
      {points.map((h, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          animate={{ height: [`${h}%`, `${Math.random() * 60 + 20}%`, `${h}%`] }}
          transition={{ duration: 2 + Math.random(), repeat: Infinity, ease: "easeInOut" }}
          style={{ backgroundColor: color }}
          className="w-1 rounded-t-[1px] opacity-40 shadow-[0_0_5px_rgba(51,240,255,0.3)]"
        />
      ))}
    </div>
  );
};

const StatBar = ({ label, value, max = 100, unit = '%' }) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="flex flex-col gap-2 mb-6 group">
      <div className="flex justify-between items-end px-1">
        <div className="flex flex-col gap-1">
          <span className="font-hud text-[9px] uppercase tracking-[0.2em] text-cyan-500/60 group-hover:text-cyan-400 transition-colors">{label}</span>
          <SparkGraph />
        </div>
        <span className="font-mono text-xs text-cyan-200 text-glow font-bold mb-1">{value}{unit}</span>
      </div>
      <div className="h-2 w-full bg-cyan-950/30 rounded-full overflow-hidden border border-cyan-500/20 relative">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.2, ease: "circOut" }}
          className="h-full bg-gradient-to-r from-cyan-900 via-cyan-500 to-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.6)] relative overflow-hidden"
        >
          <motion.div
            animate={{ left: ['-100%', '200%'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
            className="absolute top-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
          />
        </motion.div>
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
    <section className="holographic-panel h-full p-5 flex flex-col gap-6">
      <header className="flex justify-between items-center mb-2">
        <div className="flex flex-col">
          <h2 className="font-hud text-[10px] uppercase tracking-[0.4em] text-cyan-400 text-glow font-bold">Telemetry</h2>
          <div className="h-[1px] w-12 bg-cyan-500/40 mt-1" />
        </div>
        <div className="flex items-center gap-2">
          <motion.div
            animate={status === 'connected' ? { opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
            className={`h-1.5 w-1.5 rounded-full ${status === 'connected' ? 'bg-cyan-500 shadow-[0_0_10px_rgba(51,240,255,1)]' : 'bg-red-500'}`}
          />
          <span className="font-mono text-[7px] uppercase text-slate-500 tracking-tighter">{status}</span>
        </div>
      </header>

      <div className="flex-1 space-y-8">
        <StatBar label="Neural Processor Load" value={stats.cpu} />
        <StatBar label="Synaptic Cache" value={stats.ram} />

        <div className="mt-10 space-y-3">
          <div className="p-3 border-l border-cyan-500/30 bg-cyan-950/20 backdrop-blur-sm group hover:bg-cyan-500/5 transition-all">
            <p className="font-hud text-[7px] uppercase tracking-[0.2em] text-cyan-500/60 mb-1 group-hover:text-cyan-400 transition-colors">Data Throughput</p>
            <p className="font-mono text-xl text-cyan-100 italic">{stats.network}<span className="text-[9px] not-italic ml-2 opacity-40">GB/S</span></p>
          </div>

          <div className="p-3 border-l border-cyan-500/30 bg-cyan-950/20 backdrop-blur-sm group hover:bg-cyan-500/5 transition-all">
            <p className="font-hud text-[7px] uppercase tracking-[0.2em] text-cyan-500/60 mb-1 group-hover:text-cyan-400 transition-colors">Neural Latency</p>
            <p className="font-mono text-xl text-cyan-100 italic">0.08<span className="text-[9px] not-italic ml-2 opacity-40">MS</span></p>
          </div>
        </div>
      </div>

      <footer className="mt-auto pt-4 border-t border-cyan-500/10">
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center opacity-40">
            <span className="font-mono text-[7px] uppercase tracking-widest">Protocol::X_742</span>
            <span className="font-mono text-[7px] uppercase font-bold text-cyan-400">Stable</span>
          </div>
          <div className="w-full h-[1px] bg-cyan-500/10" />
        </div>
      </footer>
    </section>
  );
}

export default memo(SystemStats);
