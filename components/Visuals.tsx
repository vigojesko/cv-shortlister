"use client";
export function ScoreRing({
  score,
  size = 72,
}: {
  score: number;
  size?: number;
}) {
  const value = Math.max(0, Math.min(100, score || 0));
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      role="img"
      aria-label={`Skor ${score} dari 100`}
      className="shrink-0"
    >
      <circle
        cx="40"
        cy="40"
        r="33"
        fill="none"
        stroke="hsl(var(--border))"
        strokeWidth="5"
      />
      <circle
        cx="40"
        cy="40"
        r="33"
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="5"
        strokeLinecap="round"
        pathLength="100"
        strokeDasharray={`${value} 100`}
        transform="rotate(-90 40 40)"
      />
      <text
        x="40"
        y="46"
        textAnchor="middle"
        fill="currentColor"
        fontSize="21"
        fontWeight="600"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {score}
      </text>
    </svg>
  );
}
export function Skeleton() {
  return (
    <div role="status" aria-label="Sedang memuat" className="space-y-6">
      <span className="sr-only">Sedang memuat…</span>
      <div className="h-12 w-2/3 animate-pulse rounded-xl bg-muted" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="h-32 animate-pulse rounded-xl border bg-muted"
          />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-xl border bg-muted" />
    </div>
  );
}
export function Radar({
  scores,
  weights,
}: {
  scores: number[];
  weights?: number[];
}) {
  const point = (i: number, v: number) =>
    `${120 + Math.sin((i * Math.PI) / 2) * v * 0.7},${105 - Math.cos((i * Math.PI) / 2) * v * 0.7}`;
  return (
    <figure>
      <svg
        viewBox="0 0 240 225"
        className="mx-auto w-full max-w-[280px]"
        role="img"
        aria-label={`Subskor: keahlian ${scores[0]}, pengalaman ${scores[1]}, pendidikan ${scores[2]}, portofolio ${scores[3]}`}
      >
        {[25, 50, 75, 100].map((v) => (
          <polygon
            key={v}
            points={[0, 1, 2, 3].map((i) => point(i, v)).join(" ")}
            fill="none"
            stroke="hsl(var(--border))"
          />
        ))}
        <polygon
          points={scores
            .map((s, i) => point(i, Math.max(0, Math.min(100, s))))
            .join(" ")}
          fill="hsl(var(--primary)/.16)"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
        />
        {["Keahlian", "Pengalaman", "Pendidikan", "Portofolio"].map((s, i) => (
          <text
            key={s}
            x={[120, 197, 120, 43][i]}
            y={[20, 108, 205, 108][i]}
            fontSize="10"
            textAnchor="middle"
            fill="currentColor"
          >
            {s}
          </text>
        ))}
      </svg>
      <figcaption className="grid grid-cols-2 gap-2 text-xs">
        {["Keahlian", "Pengalaman", "Pendidikan", "Portofolio"].map((s, i) => (
          <span key={s}>
            {s}: <b>{scores[i]}</b>
            {weights && (
              <span className="text-muted-foreground">
                {" "}
                · bobot {weights[i]}%
              </span>
            )}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}

export function StatTrend({ dates }: { dates: string[] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daily = Array.from({ length: 14 }, (_, i) => {
    const start = new Date(today);
    start.setDate(start.getDate() - 13 + i);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return dates.filter((d) => {
      const t = new Date(d).getTime();
      return t >= start.getTime() && t < end.getTime();
    }).length;
  });
  const current = daily.slice(7).reduce((a, b) => a + b, 0),
    previous = daily.slice(0, 7).reduce((a, b) => a + b, 0),
    delta = current - previous,
    max = Math.max(1, ...daily);
  return (
    <div className="mt-4">
      <svg
        viewBox="0 0 180 30"
        className="h-8 w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label={`Distribusi masuk 14 hari: ${daily.join(", ")}`}
      >
        <polyline
          points={daily
            .map((n, i) => `${(i * 180) / 13},${28 - (n / max) * 25}`)
            .join(" ")}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <p className="mt-2 text-[11px] text-muted-foreground">
        <span className="font-semibold text-foreground">
          {delta > 0 ? "+" : ""}
          {delta}
        </span>{" "}
        masuk dibanding 7 hari sebelumnya
      </p>
    </div>
  );
}
