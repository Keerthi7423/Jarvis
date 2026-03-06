const statusStyles = {
  Idle: 'text-jarvis-cyan',
  Listening: 'text-jarvis-green',
  Error: 'text-jarvis-red'
};

export default function StatusIndicator({ status = 'Idle' }) {
  const tone = statusStyles[status] ?? statusStyles.Idle;

  return (
    <div className="text-center transition-all duration-300">
      <p className="font-hud text-[10px] uppercase tracking-[0.26em] text-slate-400/88 sm:text-[11px]">System Status</p>
      <p className={`font-hud mt-2 text-xl font-semibold tracking-[0.14em] transition-colors duration-300 sm:text-2xl ${tone}`}>
        {status}
      </p>
    </div>
  );
}
