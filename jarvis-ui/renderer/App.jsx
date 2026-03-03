import { useEffect, useState } from 'react';

function Panel({ title, items }) {
  return (
    <section style={styles.panel}>
      <h2 style={styles.panelTitle}>{title}</h2>
      {items.map((item) => (
        <div key={item} style={styles.panelItem}>{item}</div>
      ))}
    </section>
  );
}

export default function App() {
  const [version, setVersion] = useState('loading...');

  useEffect(() => {
    window.api.getVersion().then(setVersion).catch(() => setVersion('unavailable'));
  }, []);

  return (
    <main style={styles.page}>
      <Panel title="Command Feed" items={["Awaiting command", "Diagnostics standby"]} />

      <section style={styles.centerWrap}>
        <div style={styles.coreOuter}>
          <div style={styles.coreInner} />
          <span style={styles.coreLabel}>AI CORE</span>
        </div>
        <p style={styles.statusLabel}>STATUS</p>
        <p style={styles.statusValue}>Idle</p>
        <p style={styles.subtle}>Listening ready</p>
        <p style={styles.version}>v{version}</p>
      </section>

      <Panel title="Response Feed" items={["System online", "UI shell secured"]} />
    </main>
  );
}

const neon = '#26f2ff';
const bg = '#050913';
const panel = '#0a1222';

const styles = {
  page: {
    margin: 0,
    width: '100vw',
    height: '100vh',
    display: 'grid',
    gridTemplateColumns: 'minmax(220px, 22vw) 1fr minmax(220px, 22vw)',
    background: `radial-gradient(circle at 50% 10%, rgba(38,242,255,0.14), transparent 42%), ${bg}`,
    color: '#e2f7ff',
    fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
  },
  panel: {
    margin: 24,
    padding: 16,
    borderRadius: 16,
    border: '1px solid rgba(38,242,255,0.3)',
    background: panel,
    alignSelf: 'stretch'
  },
  panelTitle: {
    marginTop: 0,
    marginBottom: 12,
    color: '#7cf7ff',
    fontSize: 12,
    letterSpacing: '0.2em'
  },
  panelItem: {
    marginBottom: 8,
    padding: '10px 12px',
    borderRadius: 10,
    background: 'rgba(0,0,0,0.35)',
    border: '1px solid rgba(38,242,255,0.15)',
    fontSize: 14
  },
  centerWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  coreOuter: {
    width: 260,
    height: 260,
    borderRadius: '50%',
    border: '1px solid rgba(38,242,255,0.45)',
    boxShadow: '0 0 55px rgba(38,242,255,0.35)',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(38,242,255,0.06)'
  },
  coreInner: {
    width: 160,
    height: 160,
    borderRadius: '50%',
    border: '1px solid rgba(38,242,255,0.75)',
    boxShadow: '0 0 24px rgba(38,242,255,0.5)'
  },
  coreLabel: {
    position: 'absolute',
    fontSize: 11,
    letterSpacing: '0.35em',
    color: neon
  },
  statusLabel: {
    margin: '16px 0 0 0',
    color: '#a6b9c3',
    fontSize: 12,
    letterSpacing: '0.2em'
  },
  statusValue: {
    margin: 0,
    color: neon,
    fontSize: 32,
    fontWeight: 600
  },
  subtle: {
    margin: 0,
    color: '#9ab1bc',
    fontSize: 14
  },
  version: {
    marginTop: 6,
    color: '#6fdbe3',
    fontSize: 12
  }
};
