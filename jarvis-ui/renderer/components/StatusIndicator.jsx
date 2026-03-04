const statusStyles = {
  Idle: 'text-jarvis-cyan',
  Listening: 'text-jarvis-green',
  Error: 'text-jarvis-red'
};

export default function StatusIndicator({ status = 'Idle' }) {
  const tone = statusStyles[status] ?? statusStyles.Idle;

  return (
    <div className="text-center transition-all duration-500">
      <p className="font-hud text-[11px] uppercase tracking-[0.28em] text-slate-400">System Status</p>
      <p className={`font-hud mt-2 text-2xl font-semibold transition-colors duration-500 sm:text-3xl ${tone}`}>
        {status}
      </p>
    </div>
  );
}
