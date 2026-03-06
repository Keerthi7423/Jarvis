export default function FeedPanel({ title, items }) {
  return (
    <section className="hud-panel flex h-full flex-col p-4 sm:p-5">
      <h2 className="font-hud mb-3 text-[10px] uppercase tracking-[0.26em] text-cyan-100/82 sm:text-[11px]">
        {title}
      </h2>
      <ul className="space-y-2.5 text-sm text-slate-100/82">
        {items.map((item) => (
          <li
            key={item}
            className="hud-transition rounded-xl border border-cyan-300/18 bg-slate-950/40 px-3 py-2.5 hover:border-cyan-300/28 hover:bg-slate-900/52"
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
