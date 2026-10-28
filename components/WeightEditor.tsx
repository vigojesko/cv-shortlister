"use client";
import { ScoreRing } from "./Visuals";
const labels = ["Keahlian", "Pengalaman", "Pendidikan", "Portofolio"];
export function WeightEditor({
  values,
  onChange,
}: {
  values: number[];
  onChange: (values: number[]) => void;
}) {
  const change = (index: number, value: number) => {
    const next = [...values];
    next[index] = value;
    const other = values.reduce((sum, n, i) => sum + (i === index ? 0 : n), 0);
    let left = 100 - value;
    const indices = values.map((_, i) => i).filter((i) => i !== index);
    indices.forEach((i, n) => {
      const share =
        n === indices.length - 1
          ? left
          : Math.min(
              left,
              Math.floor((100 - value) * (other ? values[i] / other : 1 / 3)),
            );
      next[i] = share;
      left -= share;
    });
    onChange(next);
  };
  const sample = [85, 70, 90, 60];
  const score =
    Math.round(values.reduce((n, v, i) => n + v * sample[i], 0) / 10) / 10;
  return (
    <div className="grid gap-6 md:grid-cols-[1fr_220px]">
      <div className="space-y-5">
        {labels.map((label, i) => (
          <label className="block text-sm" key={label}>
            <span className="mb-2 flex justify-between">
              <span>{label}</span>
              <b className="tabular-nums">{values[i]}%</b>
            </span>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              aria-label={"Bobot " + label}
              value={values[i]}
              onChange={(e) => change(i, Number(e.target.value))}
              className="w-full accent-primary"
            />
          </label>
        ))}
        <p className="text-xs text-muted-foreground">
          Bobot lain menyesuaikan secara proporsional. Total selalu 100%.
        </p>
      </div>
      <div className="rounded-xl bg-muted p-5">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider">
          Simulasi kandidat
        </p>
        <ScoreRing score={score} size={85} />
        <p className="mt-4 text-xs text-muted-foreground">
          Contoh subskor: keahlian 85, pengalaman 70, pendidikan 90, portofolio
          60. Ini simulasi, bukan skor kandidat asli.
        </p>
      </div>
    </div>
  );
}
