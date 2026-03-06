import { memo, useEffect, useMemo, useRef, useState } from 'react';

const WS_URL = import.meta.env.VITE_JARVIS_WS_URL || 'ws://127.0.0.1:8765';
const MAX_HISTORY = 120;

function timeStamp() {
  return new Date().toLocaleTimeString([], { hour12: false });
}

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
      if (cancelled) {
        return;
      }

      setStatus('connecting');
      const socket = new WebSocket(WS_URL);
      socketRef.current = socket;

      socket.onopen = () => {
        if (cancelled) {
          return;
        }
        setStatus('connected');
        pushEvent(setEvents, {
          id: nextIdRef.current++,
          type: 'system',
          text: 'Bridge connected',
          at: timeStamp()
        });
      };

      socket.onmessage = (event) => {
        if (cancelled) {
          return;
        }
        try {
          const payload = JSON.parse(event.data);
          if (!payload || typeof payload.type !== 'string') {
            return;
          }
          if (payload.type === 'mode' && typeof payload.mode === 'string') {
            setCurrentMode((prev) => {
              const nextMode = payload.mode.trim().toLowerCase();
              if (!nextMode || prev === nextMode) {
                return prev;
              }
              pushEvent(setEvents, {
                id: nextIdRef.current++,
                type: 'system',
                text: `${nextMode.toUpperCase()} mode active`,
                at: timeStamp()
              });
              return nextMode;
            });
            return;
          }
          if (typeof payload.text !== 'string') {
            return;
          }
          if (payload.type !== 'command' && payload.type !== 'response') {
            return;
          }
          pushEvent(setEvents, {
            id: nextIdRef.current++,
            type: payload.type,
            text: payload.text,
            at: timeStamp()
          });
        } catch {
          // Ignore malformed payloads to keep UI resilient.
        }
      };

      socket.onerror = () => {
        if (cancelled) {
          return;
        }
        setStatus('disconnected');
      };

      socket.onclose = () => {
        if (cancelled) {
          return;
        }
        setStatus('disconnected');
        pushEvent(setEvents, {
          id: nextIdRef.current++,
          type: 'system',
          text: 'Bridge disconnected. Retrying...',
          at: timeStamp()
        });
        retryRef.current = setTimeout(connect, 2000);
      };
    };

    connect();
    return () => {
      cancelled = true;
      clearTimeout(retryRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    const node = listRef.current;
    if (!node) {
      return;
    }
    node.scrollTop = node.scrollHeight;
  }, [events]);

  const statusClass = useMemo(() => {
    if (status === 'connected') return 'feed-status-connected';
    if (status === 'connecting') return 'feed-status-connecting';
    return 'feed-status-disconnected';
  }, [status]);

  return (
    <section className="command-feed-panel">
      <header className="command-feed-header">
        <div className="flex min-w-0 flex-col gap-2">
          <h2 className="font-hud command-feed-title">Command Feed</h2>
          <span className="command-feed-mode">Mode: {currentMode}</span>
        </div>
        <span className={`command-feed-status ${statusClass}`}>{status}</span>
      </header>

      <div ref={listRef} className="command-feed-list">
        {events.map((entry) => (
          <div key={entry.id} className={`command-feed-item command-feed-${entry.type}`}>
            <span className="command-feed-time">{entry.at}</span>
            <span className="command-feed-type">{entry.type}</span>
            <span className="command-feed-text">{entry.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default memo(CommandFeed);
