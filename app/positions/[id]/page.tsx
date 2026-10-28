"use client";
import { Skeleton } from "@/components/Visuals";
import { notify } from "@/components/Toast";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Users,
  CheckCircle2,
  AlertCircle,
  Download,
  RotateCw,
  Edit,
  Trash2,
  ExternalLink,
  ChevronRight,
  Filter,
} from "lucide-react";
import { getStatusBadge, getAspectBadge } from "@/lib/utils";

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  overallScore: number;
  scoreSkills: number;
  scoreExperience: number;
  scoreEducation: number;
  scorePortfolio: number;
  allMustHaveMet: boolean;
  status: string;
  strongestAspect: string;
  summary: string;
  portfolioSummary: string;
  links: any;
  createdAt: string;
}

interface PositionDetail {
  id: string;
  title: string;
  department: string | null;
  description: string;
  mustHaveRequirements: string[];
  niceToHaveRequirements: string[];
  minExperienceYears: number;
  minEducation: string;
  shortlistRuleType: string;
  shortlistThreshold: number;
  shortlistTopN: number;
  candidates: Candidate[];
}

export default function PositionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [position, setPosition] = useState<PositionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"shortlist" | "all" | "review">(
    "shortlist",
  );
  const [rescreening, setRescreening] = useState(false);

  // Filters for "all" tab
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("score_desc");

  const loadPosition = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/positions/${id}`);
      const data = await res.json();
      if (res.ok) {
        setPosition(data.position);
      } else {
        notify("Posisi tidak ditemukan.");
        router.push("/positions");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (id) loadPosition();
  }, [id, loadPosition]);

  const handleRescreen = async () => {
    if (
      !confirm(
        "Apakah Anda yakin ingin melakukan re-screen pada seluruh CV di posisi ini dengan kriteria terbaru?",
      )
    )
      return;

    try {
      setRescreening(true);
      const res = await fetch(`/api/positions/${id}/rescreen`, {
        method: "POST",
      });
      const data = await res.json();
      notify(data.message || "Re-screening selesai.");
      loadPosition();
    } catch (err: any) {
      notify("Error: " + err.message);
    } finally {
      setRescreening(false);
    }
  };

  if (loading) {
    return <Skeleton />;
  }

  if (!position)
    return (
      <div role="alert" className="panel">
        Detail posisi belum bisa dimuat.
        <button onClick={loadPosition} className="button-secondary ml-3">
          Coba lagi
        </button>
      </div>
    );

  const candidates = position.candidates || [];
  const shortlistCandidates = candidates.filter(
    (c) => c.status === "SHORTLIST",
  );
  const reviewCandidates = candidates.filter(
    (c) => c.status === "NEEDS_HR_REVIEW",
  );

  let filteredAll = [...candidates];
  if (statusFilter !== "ALL") {
    filteredAll = filteredAll.filter((c) => c.status === statusFilter);
  }

  if (sortBy === "score_desc") {
    filteredAll.sort((a, b) => b.overallScore - a.overallScore);
  } else if (sortBy === "score_asc") {
    filteredAll.sort((a, b) => a.overallScore - b.overallScore);
  } else if (sortBy === "name_asc") {
    filteredAll.sort((a, b) => a.name.localeCompare(b.name));
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col justify-between space-y-4 sm:flex-row sm:items-start sm:space-y-0">
        <div className="flex items-start space-x-3">
          <Link
            href="/positions"
            className="mt-1 rounded-lg border border-border bg-card p-2 text-muted-foreground hover:bg-muted shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {position.title}
              </h1>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {position.department || "Umum"}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Aturan Shortlist:{" "}
              <b>
                {position.shortlistRuleType === "THRESHOLD"
                  ? `Skor Minimal ≥ ${position.shortlistThreshold}`
                  : `Top ${position.shortlistTopN} Nilai Tertinggi`}
              </b>{" "}
              & seluruh Must-Have wajib terpenuhi.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRescreen}
            disabled={rescreening || candidates.length === 0}
            className="flex items-center space-x-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-sm hover:bg-muted disabled:opacity-50"
            title="Nilai ulang semua CV dengan Gemini AI"
          >
            <RotateCw
              className={`h-3.5 w-3.5 ${rescreening ? "animate-spin text-primary" : ""}`}
            />
            <span>{rescreening ? "Menilai Ulang..." : "Re-Screen Semua"}</span>
          </button>

          <a
            href={`/api/export?positionId=${position.id}&format=xlsx&shortlistOnly=true`}
            className="flex items-center space-x-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-sm hover:bg-muted"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Excel</span>
          </a>

          <a
            href={`/api/export?positionId=${position.id}&format=csv&shortlistOnly=true`}
            className="flex items-center space-x-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-sm hover:bg-muted"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab("shortlist")}
            className={`border-b-2 py-3 text-sm font-semibold transition ${
              activeTab === "shortlist"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
            }`}
          >
            Shortlist Lolos ({shortlistCandidates.length})
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`border-b-2 py-3 text-sm font-semibold transition ${
              activeTab === "all"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
            }`}
          >
            Semua Kandidat ({candidates.length})
          </button>
          <button
            onClick={() => setActiveTab("review")}
            className={`flex items-center space-x-1.5 border-b-2 py-3 text-sm font-semibold transition ${
              activeTab === "review"
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
            }`}
          >
            <span>Perlu Dicek HR</span>
            {reviewCandidates.length > 0 && (
              <span className="rounded-full bg-purple-100 px-2 py-0.2 text-xs font-bold text-purple-700">
                {reviewCandidates.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Tab 1: Shortlist View */}
      {activeTab === "shortlist" && (
        <div className="space-y-4">
          {shortlistCandidates.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-2 text-sm font-semibold text-foreground">
                Belum ada kandidat lolos shortlist
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Kandidat yang memiliki nilai di atas ambang batas dan memenuhi
                semua syarat wajib akan otomatis muncul di sini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {shortlistCandidates.map((c, idx) => {
                const aspectBadge = getAspectBadge(c.strongestAspect);
                let portfolioLinks = Array.isArray(c.links?.portfolio)
                  ? c.links.portfolio
                  : [];

                return (
                  <div
                    key={c.id}
                    className="flex flex-col justify-between rounded-xl border border-emerald-200 bg-card p-5 shadow-sm hover:shadow-md transition"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">
                            #{idx + 1}
                          </span>
                          <span
                            className={`rounded-md px-2 py-0.5 text-xs font-medium border ${aspectBadge.color}`}
                          >
                            Aspek: {aspectBadge.label}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-extrabold text-emerald-700">
                            {c.overallScore}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            /100
                          </span>
                        </div>
                      </div>

                      <h3 className="mt-3 text-base font-bold text-foreground">
                        <Link
                          href={`/candidates/${c.id}`}
                          className="hover:text-primary transition"
                        >
                          {c.name}
                        </Link>
                      </h3>
                      <p className="text-xs text-muted-foreground">{c.email}</p>

                      <div className="mt-3 rounded-lg bg-muted p-2.5 text-xs text-foreground border border-border">
                        <p className="font-semibold text-foreground">
                          Ringkasan Profil:
                        </p>
                        <p className="mt-1 line-clamp-3 text-muted-foreground">
                          {c.summary}
                        </p>
                      </div>

                      {c.portfolioSummary &&
                        c.portfolioSummary !== "Tidak ditemukan" && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground">
                              Portofolio:{" "}
                            </span>
                            <span className="line-clamp-2">
                              {c.portfolioSummary}
                            </span>
                          </div>
                        )}

                      {portfolioLinks.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {portfolioLinks.map((link: string, i: number) => (
                            <a
                              key={i}
                              href={
                                link.startsWith("http")
                                  ? link
                                  : `https://${link}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center space-x-1 rounded bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary hover:underline"
                            >
                              <span>Portofolio {i + 1}</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-5 border-t border-border pt-3 flex items-center justify-between">
                      <Link
                        href={`/candidates/${c.id}`}
                        className="flex items-center space-x-1 text-xs font-semibold text-primary hover:text-primary"
                      >
                        <span>Lihat Breakdown & Rekomendasi</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: All Candidates View */}
      {activeTab === "all" && (
        <div className="space-y-4">
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-border py-1.5 px-3 text-xs"
              >
                <option value="ALL">Semua Status</option>
                <option value="SHORTLIST">Lolos Shortlist</option>
                <option value="MAYBE">Dipertimbangkan</option>
                <option value="REJECT">Ditolak / Gagal Must-Have</option>
                <option value="NEEDS_HR_REVIEW">Perlu Dicek HR</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground">Urutkan:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg border border-border py-1.5 px-3 text-xs"
              >
                <option value="score_desc">Skor Tertinggi</option>
                <option value="score_asc">Skor Terendah</option>
                <option value="name_asc">Nama (A-Z)</option>
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-muted font-semibold text-muted-foreground">
                <tr>
                  <th className="py-3 px-4">Kandidat</th>
                  <th className="py-3 px-4 text-center">Skor Keseluruhan</th>
                  <th className="py-3 px-4">Must-Have</th>
                  <th className="py-3 px-4">Aspek Terkuat</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAll.map((c) => {
                  const statusBadge = getStatusBadge(c.status);
                  const aspectBadge = getAspectBadge(c.strongestAspect);

                  return (
                    <tr key={c.id} className="hover:bg-muted">
                      <td className="py-3 px-4">
                        <Link
                          href={`/candidates/${c.id}`}
                          className="font-semibold text-foreground hover:text-primary"
                        >
                          {c.name}
                        </Link>
                        <p className="text-[11px] text-muted-foreground">
                          {c.email}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-foreground text-sm">
                          {c.overallScore}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {c.allMustHaveMet ? (
                          <span className="text-emerald-600 font-semibold">
                            ✓ Terpenuhi Semua
                          </span>
                        ) : (
                          <span className="text-rose-600 font-semibold">
                            ✕ Tidak Lengkap
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`rounded px-2 py-0.5 font-medium border ${aspectBadge.color}`}
                        >
                          {aspectBadge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium border ${statusBadge.bg}`}
                        >
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/candidates/${c.id}`}
                          className="rounded border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
                        >
                          Detail
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Needs Review View */}
      {activeTab === "review" && (
        <div className="space-y-4">
          {reviewCandidates.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-2 text-sm font-semibold text-foreground">
                Tidak ada kandidat yang perlu dicek
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Seluruh pelamar berhasil dipasangkan ke posisi pekerjaan dengan
                tingkat keyakinan AI tinggi.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviewCandidates.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-col justify-between rounded-xl border border-purple-200 bg-card p-4 sm:flex-row sm:items-center shadow-sm"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-foreground">
                        {c.name}
                      </span>
                      <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                        Perlu Konfirmasi HR
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {c.email} • Skor: {c.overallScore}
                    </p>
                    <p className="mt-1 text-xs text-purple-900 bg-purple-50 p-2 rounded border border-purple-100">
                      <b>Catatan AI:</b> {c.summary}
                    </p>
                  </div>

                  <div className="mt-3 sm:mt-0 sm:ml-4">
                    <Link
                      href={`/candidates/${c.id}`}
                      className="rounded-lg bg-purple-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-purple-700 shadow-sm"
                    >
                      Tinjau & Tentukan Status
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
