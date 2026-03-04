export default function FeedPanel({ title, items }) {
  return (
    <section className="hud-panel flex h-full flex-col p-4 sm:p-5">
      <h2 className="font-hud mb-3 text-[11px] uppercase tracking-[0.28em] text-jarvis-cyanSoft sm:text-xs">
        {title}
      </h2>
      <ul className="space-y-2 text-sm text-slate-100/85">
        {items.map((item) => (
          <li
            key={item}
            className="rounded-xl border border-cyan-200/20 bg-slate-950/35 px-3 py-2 transition-colors duration-300 hover:border-cyan-200/45 hover:bg-slate-900/55"
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
