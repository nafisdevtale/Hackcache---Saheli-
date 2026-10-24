// Lightweight accessible SVG bar chart. Values are also printed as text.
export function BarChart({ data = [], title, refLines = [], summary = "" }) {
  if (!data || data.length === 0) {
    return (
      <figure className="py-4 text-center text-sm text-muted-foreground">
        <p>{title}</p>
        <figcaption className="sr-only">{title}: No data recorded yet.</figcaption>
      </figure>
    );
  }

  const cleanData = (data || []).map((d) => ({ ...d, value: Number(d?.value) || 0 }));
  const cleanRefLines = (refLines || []).map((r) => ({ ...r, value: Number(r?.value) || 0 }));
  const max = Math.max(...cleanData.map((d) => d.value), ...cleanRefLines.map((r) => r.value), 1);
  const w = 320,
    h = 160,
    pad = 24,
    bw = (w - pad) / Math.max(cleanData.length, 1);
  const textSummary =
    summary || `${title}: ${cleanData.map((d) => `${d.label} ${d.value}`).join(", ")}`;

  return (
    <figure>
      <svg viewBox={`0 0 ${w} ${h + 28}`} role="img" aria-label={textSummary} className="w-full">
        {cleanRefLines.map((r) => {
          const y = h - (r.value / max) * (h - 16);
          return (
            <g key={r.value}>
              <line
                x1={pad}
                x2={w}
                y1={y}
                y2={y}
                className="stroke-muted-foreground"
                strokeDasharray="4 4"
              />
              <text x={0} y={y + 4} className="fill-muted-foreground text-[10px]">
                {r.value}
              </text>
            </g>
          );
        })}
        {cleanData.map((d, i) => {
          const bh = (d.value / max) * (h - 16);
          const x = pad + i * bw + bw * 0.15;
          return (
            <g key={i}>
              <rect
                x={x}
                y={h - bh}
                width={bw * 0.7}
                height={bh}
                rx={6}
                className={d.highlight ? "fill-accent-strong" : "fill-primary"}
              />
              <text
                x={x + bw * 0.35}
                y={h - bh - 4}
                textAnchor="middle"
                className="fill-foreground text-[12px] font-bold"
              >
                {d.value}
              </text>
              <text
                x={x + bw * 0.35}
                y={h + 16}
                textAnchor="middle"
                className="fill-muted-foreground text-[10px]"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="sr-only">{textSummary}</figcaption>
    </figure>
  );
}
