"use client";
import { useEffect, useState } from "react";
import { Count } from "@/components/Motion";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  Mail,
  Users,
  AlertCircle,
  Briefcase,
  UploadCloud,
  RefreshCw,
} from "lucide-react";
import { getStatusBadge, getAspectBadge } from "@/lib/utils";
import { ScoreRing, Skeleton, StatTrend } from "@/components/Visuals";
type Candidate = {
  id: string;
  name: string;
  email: string;
  overallScore: number;
  status: string;
  strongestAspect: string;
  createdAt: string;
  position?: { id: string; title: string } | null;
};
type Stats = {
  stats: {
    totalPositions: number;
    activePositions: number;
    totalCandidates: number;
    shortlistedCandidates: number;
    needsReviewCandidates: number;
    totalProcessedEmails: number;
  };
  gmailAccount: {
    email: string;
    isConnected: boolean;
    lastSyncAt: string | null;
    lastErrorMessage: string | null;
  } | null;
  recentCandidates: Candidate[];
};
export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<Stats | null>(null),
    [candidates, setCandidates] = useState<Candidate[]>([]),
    [positions, setPositions] = useState<
      { id: string; title: string; createdAt: string; isActive: boolean }[]
    >([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(""),
    [hour, setHour] = useState(12),
    [notice, setNotice] = useState("");
  const load = async () => {
    setError("");
    try {
      const rs = await Promise.all([
        fetch("/api/stats"),
        fetch("/api/candidates"),
        fetch("/api/positions"),
      ]);
      if (rs.some((r) => !r.ok)) throw new Error();
      const [s, c, p] = await Promise.all(rs.map((r) => r.json()));
      setData(s);
      setCandidates(c.candidates || []);
      setPositions(p.positions || []);
    } catch {
      setError("Ringkasan belum bisa dimuat. Coba lagi sebentar, ya.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    setHour(new Date().getHours());
    load();
    window.addEventListener("cv:synced", load);
    return () => window.removeEventListener("cv:synced", load);
  }, []);
  const resolve = async (id: string, status: string) => {
    setBusy(id);
    try {
      const r = await fetch("/api/candidates/" + id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!r.ok) throw new Error();
      setNotice("Status kandidat berhasil diperbarui.");
      await load();
    } catch {
      setNotice("Status belum tersimpan. Silakan coba lagi.");
    } finally {
      setBusy("");
    }
  };
  if (loading) return <Skeleton />;
  if (error)
    return (
      <div role="alert" className="panel">
        <AlertCircle className="mb-3" />
        <p>{error}</p>
        <button
          onClick={() => {
            setLoading(true);
            load();
          }}
          className="button-secondary mt-4"
        >
          Coba lagi
        </button>
      </div>
    );
  if (!data) return null;
  const { stats, gmailAccount: gmail } = data;
  const steps = [
    { label: "Hubungkan Gmail", done: !!gmail?.isConnected, url: "/settings" },
    {
      label: "Buat posisi pertama",
      done: stats.totalPositions > 0,
      url: "/positions/new",
    },
    {
      label: "CV pertama masuk",
      done: stats.totalCandidates > 0,
      url: "/upload",
    },
  ];
  const attention = candidates.filter((c) => c.status === "NEEDS_HR_REVIEW");
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[.18em] text-primary">
            Ruang untuk talenta terbaik
          </p>
          <h1 className="text-3xl font-semibold">
            Selamat{" "}
            {hour < 11
              ? "pagi"
              : hour < 15
                ? "siang"
                : hour < 18
                  ? "sore"
                  : "malam"}
            {session?.user?.name ? ", " + session.user.name.split(" ")[0] : ""}.
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {stats.needsReviewCandidates
              ? `${stats.needsReviewCandidates} kandidat menunggu perhatianmu. Mari temukan yang paling cocok.`
              : "Semua sudah tertangani. Siap menemukan talenta berikutnya?"}
          </p>
        </div>
        <Link href="/positions/new" className="button-secondary">
          <Briefcase size={16} />
          Buat posisi
        </Link>
      </div>
      {steps.some((s) => !s.done) && (
        <section className="panel bg-accent/40">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Mulai dari tiga langkah kecil</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Siapkan ruang rekrutmenmu, lalu biarkan CV mulai masuk.
              </p>
            </div>
            <span className="text-sm tabular-nums">
              {steps.filter((s) => s.done).length}/3 selesai
            </span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {steps.map((s, i) => (
              <Link
                href={s.url}
                key={s.label}
                className="flex items-center gap-3 rounded-xl border bg-card p-4 text-sm"
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${s.done ? "bg-primary" : "bg-muted"}`}
                >
                  {s.done ? <Check size={15} /> : i + 1}
                </span>
                {s.label}
                <ChevronRight className="ml-auto" size={16} />
              </Link>
            ))}
          </div>
        </section>
      )}
      <section
        aria-label="Ringkasan rekrutmen"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {[
          {
            label: "CV masuk",
            value: stats.totalCandidates,
            url: "/candidates",
            note: "Seluruh kandidat",
            dates: candidates.map((c) => c.createdAt),
            icon: Users,
          },
          {
            label: "Siap shortlist",
            value: stats.shortlistedCandidates,
            url: "/candidates?status=SHORTLIST",
            note: "Lanjut ke tahap berikutnya",
            dates: candidates
              .filter((c) => c.status === "SHORTLIST")
              .map((c) => c.createdAt),
            icon: Check,
          },
          {
            label: "Perlu dicek",
            value: stats.needsReviewCandidates,
            url: "/candidates?status=NEEDS_HR_REVIEW",
            note: "Menunggu tinjauan HR",
            dates: candidates
              .filter((c) => c.status === "NEEDS_HR_REVIEW")
              .map((c) => c.createdAt),
            icon: AlertCircle,
          },
          {
            label: "Posisi aktif",
            value: stats.activePositions,
            url: "/positions",
            note: "Kesempatan yang terbuka",
            dates: positions.filter((p) => p.isActive).map((p) => p.createdAt),
            icon: Briefcase,
          },
        ].map(({ label, value, url, note, dates, icon: Icon }) => (
          <Link
            href={url}
            key={label}
            className="panel group transition-transform hover:-translate-y-0.5"
          >
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{label}</span>
              <Icon size={18} />
            </div>
            <div className="my-4 text-4xl font-semibold tabular-nums">
              <Count value={value} />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              {note}
              <ArrowUpRight size={16} />
            </div>
            <StatTrend dates={dates} />
          </Link>
        ))}
      </section>
      <p className="!mt-2 text-xs text-muted-foreground">
        Tren mengikuti tanggal masuk dan status kandidat saat ini, bukan riwayat
        perubahan status.
      </p>
      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <section className="panel">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-semibold">Alur rekrutmen</h2>
            <Link href="/positions" className="text-xs text-primary">
              Semua posisi →
            </Link>
          </div>
          {positions.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">
              Buat posisi pertama untuk melihat alur kandidat.
            </p>
          ) : (
            positions.slice(0, 4).map((p) => {
              const cs = candidates.filter((c) => c.position?.id === p.id);
              const values = [
                cs.length,
                cs.filter((c) => c.status !== "PENDING").length,
                cs.filter((c) => c.status === "NEEDS_HR_REVIEW").length,
                cs.filter((c) => c.status === "SHORTLIST").length,
              ];
              return (
                <Link
                  href={"/positions/" + p.id}
                  key={p.id}
                  className="mb-5 block last:mb-0"
                >
                  <h3 className="mb-3 text-sm font-semibold">{p.title}</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {["Masuk", "Dinilai", "Perlu dicek", "Shortlist"].map(
                      (label, i) => (
                        <div key={label}>
                          <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{
                                width: `${cs.length ? (values[i] / cs.length) * 100 : 0}%`,
                                opacity: 0.4 + i * 0.2,
                              }}
                            />
                          </div>
                          <p className="text-lg font-semibold tabular-nums">
                            {values[i]}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {label}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                </Link>
              );
            })
          )}
        </section>
        <section className="panel">
          <div className="mb-4 flex items-center gap-2">
            <Mail size={18} className="text-primary" />
            <h2 className="font-semibold">Gmail & sinkronisasi</h2>
          </div>
          <p className="text-sm font-medium">
            {gmail?.isConnected
              ? "Terhubung dan siap menerima CV"
              : "Hubungkan kotak masuk timmu"}
          </p>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {gmail?.email || "Lamaran masuk, tersusun otomatis."}
          </p>
          <dl className="mt-6 space-y-4 text-xs">
            <div>
              <dt className="text-muted-foreground">Sinkronisasi terakhir</dt>
              <dd className="mt-1">
                {gmail?.lastSyncAt
                  ? new Date(gmail.lastSyncAt).toLocaleString("id-ID")
                  : "Belum ada sinkronisasi"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">
                Email yang sudah diproses
              </dt>
              <dd className="mt-1 text-lg tabular-nums">
                {stats.totalProcessedEmails}
              </dd>
            </div>
          </dl>
          {gmail?.lastErrorMessage && (
            <p role="alert" className="mt-4 text-sm text-reject">
              {gmail.lastErrorMessage}
            </p>
          )}
          <p className="mt-5 text-xs text-muted-foreground">
            Jadwal berikutnya dan log aktivitas belum tersedia dari server.
          </p>
          <Link href="/settings" className="button-secondary mt-4">
            Kelola koneksi <ChevronRight size={14} />
          </Link>
        </section>
      </div>
      <section className="panel">
        <div className="mb-4 flex justify-between">
          <h2 className="font-semibold">
            Perlu perhatian{" "}
            <span className="ml-2 text-muted-foreground">
              {attention.length}
            </span>
          </h2>
          <Link
            href="/candidates?status=NEEDS_HR_REVIEW"
            className="text-xs text-primary"
          >
            Tinjau semua →
          </Link>
        </div>
        {notice && (
          <p role="status" className="mb-3 text-sm text-primary">
            {notice}
          </p>
        )}
        {attention.length === 0 ? (
          <p className="flex items-center gap-3 py-4 text-sm text-muted-foreground">
            <Check size={20} className="text-primary" />
            Tidak ada kandidat yang menunggu tinjauan.
          </p>
        ) : (
          attention.slice(0, 4).map((c) => (
            <div
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-3 border-t py-3"
            >
              <div>
                <Link
                  href={"/candidates/" + c.id}
                  className="text-sm font-semibold"
                >
                  {c.name}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {c.position?.title || "Posisi perlu dikonfirmasi"}
                </p>
              </div>
              <div className="flex gap-2">
                <Link className="button-secondary" href={"/candidates/" + c.id}>
                  Tinjau CV
                </Link>
                <button
                  disabled={busy === c.id}
                  onClick={() => resolve(c.id, "SHORTLIST")}
                  className="button-secondary"
                >
                  Shortlist
                </button>
              </div>
            </div>
          ))
        )}
      </section>
      <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b p-5">
          <h2 className="font-semibold">Kandidat terbaru</h2>
          <Link href="/candidates" className="text-xs text-primary">
            Lihat semua →
          </Link>
        </div>
        {data.recentCandidates.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={36} className="mx-auto text-primary" />
            <h3 className="mt-4 font-semibold">
              Talenta berikutnya dimulai di sini
            </h3>
            <p className="my-3 text-sm text-muted-foreground">
              Unggah CV pertama untuk mulai mengenal kandidat.
            </p>
            <Link href="/upload" className="button-primary">
              <UploadCloud size={16} />
              Unggah CV
            </Link>
          </div>
        ) : (
          data.recentCandidates.map((c) => {
            const badge = getStatusBadge(c.status);
            return (
              <div
                key={c.id}
                className="group flex flex-wrap items-center gap-4 border-b p-4 last:border-0 hover:bg-muted/50"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-primary">
                  {c.name
                    .split(" ")
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join("")}
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    className="text-sm font-semibold"
                    href={"/candidates/" + c.id}
                  >
                    {c.name}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.position?.title || "Posisi umum"}
                  </p>
                </div>
                <span className="hidden text-xs text-muted-foreground lg:block">
                  Unggul di {getAspectBadge(c.strongestAspect).label}
                </span>
                <span
                  className={`rounded-full border px-2 py-1 text-[11px] ${badge.bg}`}
                >
                  {badge.label}
                </span>
                <ScoreRing score={c.overallScore} size={44} />
                <Link
                  aria-label={"Tinjau " + c.name}
                  href={"/candidates/" + c.id}
                  className="rounded-lg p-2 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 focus:opacity-100"
                >
                  <ArrowUpRight size={18} />
                </Link>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
