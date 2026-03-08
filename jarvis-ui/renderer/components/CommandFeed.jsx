import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const WS_URL = import.meta.env.VITE_JARVIS_WS_URL || 'ws://127.0.0.1:8765';
const MAX_HISTORY = 120;

function timeStamp() {
  return new Date().toLocaleTimeString([], { hour12: false });
}

const TypewriterText = ({ text, delay = 0 }) => {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, 15);
    return () => clearInterval(interval);
  }, [text]);

  return <span>{displayed}</span>;
};

function pushEvent(setter, next) {
  setter((prev) => [...prev.slice(-(MAX_HISTORY - 1)), next]);
}

function CommandFeed() {
  const [events, setEvents] = useState([
    { id: 1, type: 'system', text: 'Waiting for backend bridge...', at: timeStamp() }
  ]);
  const [status, setStatus] = useState('connecting');
  const [currentMode, setCurrentMode] = useState('normal');
  const listRef = useRef(null);
  const retryRef = useRef(null);
  const socketRef = useRef(null);
  const nextIdRef = useRef(2);

  useEffect(() => {
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;
      setStatus('connecting');
      const socket = new WebSocket(WS_URL);
      socketRef.current = socket;

      socket.onopen = () => {
        if (cancelled) return;
        setStatus('connected');
        pushEvent(setEvents, {
          id: nextIdRef.current++,
          type: 'system',
          text: 'System Bridge Established',
          at: timeStamp()
        });
      };

      socket.onmessage = (event) => {
        if (cancelled) return;
        try {
          const payload = JSON.parse(event.data);
          console.debug("[JARVIS-WS]", payload);
          if (!payload || typeof payload.type !== 'string') return;

          if (payload.type === 'mode' && typeof payload.mode === 'string') {
            setCurrentMode((prev) => {
              const nextMode = payload.mode.trim().toLowerCase();
              if (!nextMode || prev === nextMode) return prev;
              pushEvent(setEvents, {
                id: nextIdRef.current++,
                type: 'system',
                text: `MODE_SWITCH: ${nextMode.toUpperCase()}`,
                at: timeStamp()
              });
              return nextMode;
            });
            return;
          }

          if (typeof payload.text !== 'string') return;
          if (payload.type !== 'command' && payload.type !== 'response' && payload.type !== 'system') return;

          pushEvent(setEvents, {
            id: nextIdRef.current++,
            type: payload.type,
            text: payload.text,
            at: timeStamp()
          });
        } catch (err) {
          console.warn("[JARVIS-WS] Message Parse Error:", err, event.data);
        }
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

  useEffect(() => {
    console.debug("[JARVIS-DEBUG] Current Events:", events);
    const node = listRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [events]);

  return (
    <section className="command-feed-panel h-full flex flex-col glass-morphism overflow-hidden">
      <header className="command-feed-header p-4 border-b border-cyan-500/20 flex justify-between items-center bg-slate-900/40">
        <div className="flex flex-col gap-1">
          <h2 className="font-hud text-sm uppercase tracking-widest text-cyan-400">Command Console</h2>
          <div className="flex items-center gap-2">
            <div className={`h-1.5 w-1.5 rounded-full ${status === 'connected' ? 'bg-cyan-400 shadow-[0_0_8px_rgba(51,240,255,1)]' : 'bg-red-500 animate-pulse'}`} />
            <span className="font-mono text-[9px] uppercase tracking-tighter text-slate-400">{status}</span>
          </div>
        </div>
        <span className="font-hud text-[10px] text-cyan-500/60 uppercase">Mode: {currentMode}</span>
      </header>

      <div ref={listRef} className="command-feed-list flex-1 overflow-y-auto p-4 font-mono text-[10px] tracking-tight">
        <AnimatePresence mode="popLayout">
          {events.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              className={`mb-3 flex flex-col gap-1 p-2 rounded border border-transparent hover:border-cyan-500/10 hover:bg-cyan-500/5 transition-colors`}
            >
              <div className="flex items-center justify-between opacity-40 text-[8px]">
                <span className="uppercase text-cyan-300">[{entry.type}]</span>
                <span>{entry.at}</span>
              </div>
              <div className={`text-sm ${entry.type === 'command' ? 'text-slate-200' : entry.type === 'system' ? 'text-cyan-400 font-bold' : 'text-cyan-200'}`}>
                {entry.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section >
  );
}

export default memo(CommandFeed);
