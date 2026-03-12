import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const WS_URL = import.meta.env.VITE_JARVIS_WS_URL || 'ws://127.0.0.1:8765';
const MAX_HISTORY = 120;

function timeStamp() {
  return new Date().toLocaleTimeString([], { hour12: false });
}

const BlinkingCursor = () => (
  <motion.span
    animate={{ opacity: [0, 1, 0] }}
    transition={{ duration: 0.8, repeat: Infinity }}
    className="inline-block w-1.5 h-3 ml-1 bg-cyan-400 align-middle shadow-[0_0_5px_rgba(51,240,255,1)]"
  />
);

const TypewriterText = ({ text, delay = 0 }) => {
  const [displayed, setDisplayed] = useState('');
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        setIsDone(true);
      }
    }, 15);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <span>
      {displayed}
      {!isDone && <BlinkingCursor />}
    </span>
  );
};

function pushEvent(setter, next) {
  setter((prev) => [...prev.slice(-(MAX_HISTORY - 1)), next]);
}

function CommandFeed() {
  const [events, setEvents] = useState([
    { id: -3, type: 'system', text: '[SYS] Initializing neural bridge...', at: timeStamp() },
    { id: -2, type: 'system', text: '[NET] Establishing secure connection...', at: timeStamp() },
    { id: -1, type: 'system', text: '[AI] Reactor synchronization complete.', at: timeStamp() },
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
    <section className="holographic-panel h-full flex flex-col min-h-0">
      <header className="p-4 border-b border-cyan-500/20 flex justify-between items-center bg-cyan-950/20 backdrop-blur-md">
        <div className="flex flex-col gap-1">
          <h2 className="font-hud text-[10px] uppercase tracking-[0.3em] text-cyan-400 text-glow font-bold">Command Console</h2>
          <div className="flex items-center gap-2">
            <div className={`h-1.5 w-1.5 rounded-full ${status === 'connected' ? 'bg-cyan-400 shadow-[0_0_8px_rgba(51,240,255,1)]' : 'bg-red-500 animate-pulse'}`} />
            <span className="font-mono text-[8px] uppercase tracking-tighter text-slate-500">{status}</span>
          </div>
        </div>
        <div className="px-2 py-0.5 border border-cyan-500/30 rounded bg-cyan-500/10">
          <span className="font-hud text-[8px] text-cyan-300 uppercase tracking-widest">{currentMode}</span>
        </div>
      </header>

      <div ref={listRef} className="flex-1 overflow-y-auto p-4 font-mono text-[10px] tracking-tight custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {events.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              className="mb-4 flex flex-col gap-1.5 border-l border-cyan-500/20 pl-3 py-1 hover:bg-cyan-500/5 transition-colors group"
            >
              <div className="flex items-center justify-between opacity-30 text-[8px] group-hover:opacity-60">
                <span className="uppercase text-cyan-400 font-bold tracking-widest">[{entry.at}]</span>
                <span className="uppercase tracking-tighter">{entry.type}</span>
              </div>
              <div className={`text-xs leading-relaxed ${entry.type === 'command' ? 'text-slate-300' : entry.type === 'system' ? 'text-cyan-400 font-bold italic' : 'text-cyan-100'}`}>
                {entry.type === 'system' || (entry.id === events[events.length - 1]?.id) ? (
                  <TypewriterText text={entry.text} />
                ) : (
                  entry.text
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section >
  );
}

export default memo(CommandFeed);
