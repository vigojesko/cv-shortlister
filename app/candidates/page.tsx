"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Search,
  Users,
  LayoutGrid,
  List,
  Download,
  X,
  ArrowUpRight,
} from "lucide-react";
import { getStatusBadge, getAspectBadge } from "@/lib/utils";
import { ScoreRing, Skeleton } from "@/components/Visuals";
type Candidate = {
  id: string;
  name: string;
  email: string;
  overallScore: number;
  status: string;
  strongestAspect: string;
  createdAt: string;
  summary: string;
  position?: { id: string; title: string } | null;
};
type View = {
  name: string;
  status: string;
  position: string;
  min: number;
  max: number;
  sort: string;
};
export default function CandidatesPage() {
  const { data: session } = useSession();
  const viewsKey = `cv-views:${session?.user?.email || "anonymous"}`;
  const [items, setItems] = useState<Candidate[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState("ALL"),
    [position, setPosition] = useState("ALL"),
    [min, setMin] = useState(0),
    [max, setMax] = useState(100),
    [sort, setSort] = useState("score"),
    [cards, setCards] = useState(false),
    [selected, setSelected] = useState<string[]>([]),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [views, setViews] = useState<View[]>([]),
    [viewName, setViewName] = useState("");
  const load = async () => {
    setError("");
    try {
      const r = await fetch("/api/candidates");
      if (!r.ok) throw new Error();
      const d = await r.json();
      setItems(d.candidates || []);
    } catch {
      setError("Kandidat belum bisa dimuat. Coba lagi, ya.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setStatus(q.get("status") || "ALL");
    setPosition(q.get("positionId") || "ALL");
    try {
      const saved = JSON.parse(localStorage.getItem(viewsKey) || "[]");
      if (Array.isArray(saved))
        setViews(
          saved.filter(
            (v) =>
              typeof v.name === "string" &&
              typeof v.status === "string" &&
              typeof v.position === "string" &&
              typeof v.min === "number" &&
              typeof v.max === "number",
          ),
        );
    } catch {}
    load();
    window.addEventListener("cv:candidate-updated", load);
    const poll = setInterval(load, 15000);
    return () => { clearInterval(poll); window.removeEventListener("cv:candidate-updated", load); };
  }, [viewsKey]);
  const filtered = items
    .filter(
      (c) =>
        (status === "ALL" || c.status === status) &&
        (position === "ALL" || c.position?.id === position) &&
        c.overallScore >= min &&
        c.overallScore <= max &&
        `${c.name} ${c.email} ${c.summary}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : sort === "new"
          ? Date.parse(b.createdAt) - Date.parse(a.createdAt)
          : sort === "low"
            ? a.overallScore - b.overallScore
            : b.overallScore - a.overallScore,
    );
  const positions = Array.from(
    new Map(
      items.filter((c) => c.position).map((c) => [c.position!.id, c.position!]),
    ).values(),
  );
  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  const remember = () => {
    try {
      sessionStorage.setItem(
        "cv-review-order",
        JSON.stringify(filtered.map((c) => c.id)),
      );
    } catch {}
  };
  const bulk = async (next: string) => {
    setBusy(true);
    const results = await Promise.allSettled(
      selected.map(async (id) => {
        const r = await fetch("/api/candidates/" + id, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: next }),
        });
        if (!r.ok) throw new Error(id);
        return id;
      }),
    );
    const failed = results.filter(
      (r): r is PromiseRejectedResult => r.status === "rejected",
    );
    setNotice(
      failed.length
        ? `${results.length - failed.length} tersimpan, ${failed.length} belum berhasil. Coba kembali kandidat yang masih dipilih.`
        : `${results.length} kandidat berhasil diperbarui.`,
    );
    setSelected(selected.filter((_, i) => results[i].status === "rejected"));
    await load();
    setBusy(false);
  };
  const exportSelected = () => {
    const escape = (v: unknown) =>
      '"' +
      String(v ?? "")
        .replace(/^[=+@-]/, "'$&")
        .replaceAll('"', '""') +
      '"';
    const csv = [
      ["Nama", "Email", "Posisi", "Skor", "Status"],
      ...items
        .filter((c) => selected.includes(c.id))
        .map((c) => [
          c.name,
          c.email,
          c.position?.title || "",
          c.overallScore,
          c.status,
        ]),
    ]
      .map((row) => row.map(escape).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "kandidat-terpilih.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const saveView = () => {
    if (!viewName.trim()) return;
    const next = [
      ...views.filter((v) => v.name !== viewName.trim()),
      { name: viewName.trim(), status, position, min, max, sort },
    ];
    setViews(next);
    try {
      localStorage.setItem(viewsKey, JSON.stringify(next));
      setNotice("Tampilan tersimpan di perangkat ini.");
    } catch {
      setNotice("Penyimpanan perangkat tidak tersedia.");
    }
    setViewName("");
  };
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Kenali kandidatmu</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Dari lamaran pertama sampai pilihan terbaik.
          </p>
        </div>
        <div className="flex gap-2">
          <a href="/api/export?format=xlsx" className="button-secondary">
            <Download size={15} />
            Excel
          </a>
          <a href="/api/export?format=csv" className="button-secondary">
            CSV
          </a>
          <Link href="/upload" className="button-primary">
            Unggah CV
          </Link>
        </div>
      </div>
      <div className="panel space-y-4">
        <div className="flex flex-wrap gap-3">
          <label className="relative min-w-[180px] flex-1">
            <span className="sr-only">Cari kandidat</span>
            <Search size={17} className="absolute left-3 top-3" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, email, atau keahlian…"
              className="w-full rounded-lg border py-2 pl-10 pr-3 text-sm"
            />
          </label>
          <div className="flex rounded-lg border p-1">
            <button
              aria-label="Tampilan tabel"
              aria-pressed={!cards}
              onClick={() => setCards(false)}
              className={`rounded p-2 ${!cards ? "bg-accent text-primary" : ""}`}
            >
              <List size={18} />
            </button>
            <button
              aria-label="Tampilan kartu"
              aria-pressed={cards}
              onClick={() => setCards(true)}
              className={`rounded p-2 ${cards ? "bg-accent text-primary" : ""}`}
            >
              <LayoutGrid size={18} />
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <select
            aria-label="Filter posisi"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="max-w-full rounded-lg border p-2"
          >
            <option value="ALL">Semua posisi</option>
            {positions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border p-2"
          >
            {[
              ["ALL", "Semua status"],
              ["SHORTLIST", "Shortlist"],
              ["MAYBE", "Dipertimbangkan"],
              ["NEEDS_HR_REVIEW", "Perlu dicek"],
              ["REJECT", "Tidak memenuhi"],
            ].map(([v, l]) => (
              <option value={v} key={v}>
                {l}
              </option>
            ))}
          </select>
          <label>
            Skor{" "}
            <input
              aria-label="Skor minimum"
              type="number"
              min={0}
              max={max}
              value={min}
              onChange={(e) =>
                setMin(Math.max(0, Math.min(max, Number(e.target.value))))
              }
              className="w-16 rounded border p-2"
            />{" "}
            –{" "}
            <input
              aria-label="Skor maksimum"
              type="number"
              min={min}
              max={100}
              value={max}
              onChange={(e) =>
                setMax(Math.min(100, Math.max(min, Number(e.target.value))))
              }
              className="w-16 rounded border p-2"
            />
          </label>
          <select
            aria-label="Urutkan kandidat"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-lg border p-2"
          >
            <option value="score">Skor tertinggi</option>
            <option value="low">Skor terendah</option>
            <option value="new">Terbaru</option>
            <option value="name">Nama A–Z</option>
          </select>
          {(status !== "ALL" || position !== "ALL" || min > 0 || max < 100) && (
            <button
              className="flex items-center gap-1 text-primary"
              onClick={() => {
                setStatus("ALL");
                setPosition("ALL");
                setMin(0);
                setMax(100);
              }}
            >
              <X size={13} />
              Reset filter
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2 border-t pt-3 text-xs">
          {views.map((v) => (
            <span key={v.name} className="inline-flex rounded-full border">
              <button
                onClick={() => {
                  setStatus(v.status);
                  setPosition(v.position);
                  setMin(v.min);
                  setMax(v.max);
                  setSort(v.sort);
                }}
                className="px-3 py-1.5"
              >
                {v.name}
              </button>
              <button
                aria-label={"Hapus tampilan " + v.name}
                className="pr-2"
                onClick={() => {
                  const next = views.filter((x) => x.name !== v.name);
                  setViews(next);
                  try {
                    localStorage.setItem(viewsKey, JSON.stringify(next));
                  } catch {}
                }}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <input
            aria-label="Nama tampilan tersimpan"
            value={viewName}
            onChange={(e) => setViewName(e.target.value)}
            placeholder="Nama tampilan…"
            className="rounded-lg border px-2 py-1.5"
          />
          <button
            onClick={saveView}
            disabled={!viewName.trim()}
            className="text-primary disabled:opacity-40"
          >
            Simpan tampilan
          </button>
        </div>
      </div>
      {notice && (
        <p role="status" className="panel text-sm">
          {notice}
        </p>
      )}
      {selected.length > 0 && (
        <div className="sticky top-[72px] z-20 flex flex-wrap items-center gap-2 rounded-xl border bg-accent p-3 text-sm">
          <span className="mr-auto">{selected.length} dipilih</span>
          <button
            disabled={busy}
            onClick={() => bulk("SHORTLIST")}
            className="button-secondary"
          >
            Shortlist
          </button>
          <button
            disabled={busy}
            onClick={() => bulk("REJECT")}
            className="button-secondary"
          >
            Tolak
          </button>
          <button onClick={exportSelected} className="button-secondary">
            Ekspor pilihan
          </button>
          {selected.length >= 2 && selected.length <= 3 && (
            <Link
              href={"/compare?ids=" + selected.join(",")}
              className="button-primary"
            >
              Bandingkan
            </Link>
          )}
          <button
            onClick={() => setSelected([])}
            disabled={busy}
            aria-label="Batalkan pilihan"
            className="p-2"
          >
            <X size={16} />
          </button>
        </div>
      )}
      {loading ? (
        <Skeleton />
      ) : error ? (
        <div role="alert" className="panel">
          {error}
          <button className="button-secondary ml-3" onClick={load}>
            Coba lagi
          </button>
        </div>
      ) : (
        <>
          <div className="flex justify-between text-xs text-muted-foreground">
            <label className="flex gap-2">
              <input
                type="checkbox"
                aria-label="Pilih semua kandidat yang ditampilkan"
                checked={
                  filtered.length > 0 &&
                  filtered.every((c) => selected.includes(c.id))
                }
                onChange={(e) =>
                  setSelected(e.target.checked ? filtered.map((c) => c.id) : [])
                }
              />
              {filtered.length} kandidat
            </label>
            <span>Pilih 2–3 untuk membandingkan</span>
          </div>
          {filtered.length === 0 ? (
            <div className="panel py-14 text-center">
              <Users size={40} className="mx-auto text-primary" />
              <h2 className="mt-4 font-semibold">
                Belum ada kandidat yang cocok
              </h2>
              <p className="my-3 text-sm text-muted-foreground">
                Coba longgarkan filter atau unggah CV pertama.
              </p>
              <Link href="/upload" className="button-primary">
                Unggah CV
              </Link>
            </div>
          ) : cards ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((c) => {
                const b = getStatusBadge(c.status);
                return (
                  <article key={c.id} className="panel">
                    <div className="flex items-start justify-between">
                      <ScoreRing score={c.overallScore} />
                      <input
                        type="checkbox"
                        aria-label={"Pilih " + c.name}
                        checked={selected.includes(c.id)}
                        onChange={() => toggle(c.id)}
                      />
                    </div>
                    <Link
                      onClick={remember}
                      href={"/candidates/" + c.id}
                      className="mt-4 block font-semibold"
                    >
                      {c.name}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {c.position?.title || "Posisi umum"}
                    </p>
                    <p className="my-4 line-clamp-2 text-sm text-muted-foreground">
                      {c.summary}
                    </p>
                    <span
                      className={`rounded-full border px-2 py-1 text-xs ${b.bg}`}
                    >
                      {b.label}
                    </span>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border bg-card">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted text-xs text-muted-foreground">
                  <tr>
                    <th className="p-4">
                      <span className="sr-only">Pilih</span>
                    </th>
                    {[
                      "Kandidat",
                      "Posisi",
                      "Skor",
                      "Aspek terkuat",
                      "Status",
                      "",
                    ].map((l, i) => (
                      <th className="p-4 font-medium" key={i}>
                        {l}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => {
                    const b = getStatusBadge(c.status);
                    return (
                      <tr
                        key={c.id}
                        className="group border-t hover:bg-muted/60"
                      >
                        <td className="p-4">
                          <input
                            type="checkbox"
                            aria-label={"Pilih " + c.name}
                            checked={selected.includes(c.id)}
                            onChange={() => toggle(c.id)}
                          />
                        </td>
                        <td className="p-4">
                          <Link
                            onClick={remember}
                            href={"/candidates/" + c.id}
                            className="whitespace-nowrap font-semibold"
                          >
                            {c.name}
                          </Link>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {c.email}
                          </p>
                        </td>
                        <td className="p-4 text-xs">
                          {c.position?.title || "Posisi umum"}
                        </td>
                        <td className="p-3">
                          <ScoreRing score={c.overallScore} size={44} />
                        </td>
                        <td className="p-4 text-xs text-muted-foreground">
                          {getAspectBadge(c.strongestAspect).label}
                        </td>
                        <td className="p-4">
                          <span
                            className={`whitespace-nowrap rounded-full border px-2 py-1 text-[11px] ${b.bg}`}
                          >
                            {b.label}
                          </span>
                        </td>
                        <td className="p-3">
                          <Link
                            aria-label={"Buka " + c.name}
                            href={"/candidates/" + c.id}
                            onClick={remember}
                            className="inline-flex p-2"
                          >
                            <ArrowUpRight size={18} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
