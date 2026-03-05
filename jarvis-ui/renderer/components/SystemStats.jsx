import { useEffect, useMemo, useRef, useState } from 'react';

const WS_URL = import.meta.env.VITE_JARVIS_WS_URL || 'ws://127.0.0.1:8765';

export default function SystemStats() {
  const [stats, setStats] = useState({ cpu: 0, ram: 0, network: 0 });
  const [status, setStatus] = useState('connecting');
  const retryRef = useRef(null);
  const socketRef = useRef(null);

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
        if (!cancelled) {
          setStatus('connected');
        }
      };

      socket.onmessage = (event) => {
        if (cancelled) {
          return;
        }
        try {
          const payload = JSON.parse(event.data);
          if (payload?.type !== 'system_stats') {
            return;
          }
          setStats((prev) => {
            const next = {
              cpu: Number(payload.cpu) || 0,
              ram: Number(payload.ram) || 0,
              network: Number(payload.network) || 0
            };
            if (prev.cpu === next.cpu && prev.ram === next.ram && prev.network === next.network) {
              return prev;
            }
            return next;
          });
        } catch {
          // Ignore malformed payloads.
        }
      };

      socket.onerror = () => {
        if (!cancelled) {
          setStatus('disconnected');
        }
      };

      socket.onclose = () => {
        if (cancelled) {
          return;
        }
        setStatus('disconnected');
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

  const statusClass = useMemo(() => {
    if (status === 'connected') return 'stats-status-connected';
    if (status === 'connecting') return 'stats-status-connecting';
    return 'stats-status-disconnected';
  }, [status]);

  return (
    <section className="system-stats-panel">
      <header className="system-stats-header">
        <h2 className="font-hud system-stats-title">System Stats</h2>
        <span className={`system-stats-status ${statusClass}`}>{status}</span>
      </header>

      <div className="system-stats-grid">
        <div className="system-stats-row">
          <span className="system-stats-label">CPU</span>
          <span className="system-stats-value">{stats.cpu}%</span>
        </div>
        <div className="system-stats-row">
          <span className="system-stats-label">RAM</span>
          <span className="system-stats-value">{stats.ram}%</span>
        </div>
        <div className="system-stats-row">
          <span className="system-stats-label">NET</span>
          <span className="system-stats-value">{stats.network} KB/s</span>
        </div>
      </div>
    </section>
  );
}
