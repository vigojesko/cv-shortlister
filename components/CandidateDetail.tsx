"use client";
import { Skeleton } from "@/components/Visuals";

import { useCallback, useEffect, useState } from "react";
import { ScoreRing, Radar } from "./Visuals";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Download,
  FileText,
  Mail,
  Calendar,
  ExternalLink,
  Save,
  Trash2,
  Sparkles,
  Award,
  AlertTriangle,
} from "lucide-react";
import { getStatusBadge, getAspectBadge } from "@/lib/utils";

interface CandidateDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  totalExperienceYears: number;
  educationList: Array<{ degree: string; institution: string; year: string }>;
  links: {
    linkedin?: string;
    portfolio?: string[];
    github?: string;
    other?: string[];
  };
  scoreSkills: number;
  scoreExperience: number;
  scoreEducation: number;
  scorePortfolio: number;
  overallScore: number;
  mustHaveResults: Array<{
    requirement: string;
    met: boolean;
    evidence: string;
  }>;
  niceToHaveResults: Array<{
    requirement: string;
    met: boolean;
    evidence: string;
  }>;
  allMustHaveMet: boolean;
  summary: string;
  portfolioSummary: string;
  strengths: string[];
  gaps: string[];
  strongestAspect: string;
  aiRecommendation: string;
  aiReasoning: string;
  status: string;
  isManualOverride: boolean;
  hrNotes: string | null;
  source: string;
  emailSubject: string | null;
  emailSender: string | null;
  emailDate: string | null;
  fileName: string;
  createdAt: string;
  position?: {
    id: string;
    title: string;
    department: string | null;
    shortlistThreshold: number;
    weightSkills: number;
    weightExperience: number;
    weightEducation: number;
    weightPortfolio: number;
  } | null;
}

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [notice, setNotice] = useState("");
  const [preview, setPreview] = useState(false);
  const [candidate, setCandidate] = useState<CandidateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [hrNotes, setHrNotes] = useState<string>("");

  const loadCandidate = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/candidates/${id}`);
      const data = await res.json();
      if (res.ok) {
        setCandidate(data.candidate);
        setStatus(data.candidate.status);
        setHrNotes(data.candidate.hrNotes || "");
      } else {
        setNotice("Kandidat tidak ditemukan.");
        router.push("/candidates");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (id) loadCandidate();
  }, [id, loadCandidate]);

  const handleUpdateStatus = async () => {
    try {
      setUpdating(true);
      const res = await fetch(`/api/candidates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, hrNotes }),
      });
      if (res.ok) {
        setNotice("Status dan catatan HR berhasil disimpan.");
        window.dispatchEvent(new Event("cv:candidate-updated"));
        loadCandidate();
      } else {
        setNotice("Gagal memperbarui status.");
      }
    } catch (err: any) {
      setNotice("Error: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        e.repeat ||
        /INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement).tagName) ||
        (e.target as HTMLElement).isContentEditable
      )
        return;
      const key = e.key.toLowerCase();
      if (key === "j" || key === "k") {
        try {
          const order: string[] = JSON.parse(
            sessionStorage.getItem("cv-review-order") || "[]",
          );
          const i = order.indexOf(id);
          const next = order[i + (key === "j" ? 1 : -1)];
          if (i >= 0 && next) {
            e.preventDefault();
            router.replace("/candidates/" + next);
          }
        } catch {}
      }
      if ((key === "s" || key === "r") && !updating && candidate) {
        e.preventDefault();
        const next = key === "s" ? "SHORTLIST" : "REJECT";
        setUpdating(true);
        fetch("/api/candidates/" + id, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: next }),
        })
          .then((r) => {
            if (!r.ok) throw new Error();
            setStatus(next);
            setCandidate((prev) =>
              prev ? { ...prev, status: next, isManualOverride: true } : prev,
            );
            setNotice("Status kandidat tersimpan.");
            window.dispatchEvent(new Event("cv:candidate-updated"));
          })
          .catch(() => setNotice("Status belum tersimpan. Coba lagi."))
          .finally(() => setUpdating(false));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [id, router, updating, candidate]);

  const handleDelete = async () => {
    if (
      !confirm(
        "Hapus berkas dan seluruh catatan kandidat ini secara permanen dari database?",
      )
    )
      return;

    try {
      const res = await fetch(`/api/candidates/${id}`, { method: "DELETE" });
      if (res.ok) {
        setNotice("Kandidat berhasil dihapus.");
        router.push("/candidates");
      } else {
        setNotice("Gagal menghapus kandidat.");
      }
    } catch (err: any) {
      setNotice("Error: " + err.message);
    }
  };

  if (loading) {
    return <Skeleton />;
  }

  if (!candidate)
    return (
      <div role="alert" className="panel">
        Profil kandidat belum bisa dimuat.
        <button onClick={loadCandidate} className="button-secondary ml-3">
          Coba lagi
        </button>
      </div>
    );

  const statusBadge = getStatusBadge(candidate.status);
  const aspectBadge = getAspectBadge(candidate.strongestAspect);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.back()}
            className="rounded-lg border border-border bg-card p-2 text-muted-foreground hover:bg-muted shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {candidate.name}
              </h1>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${statusBadge.bg}`}
              >
                {statusBadge.label}
              </span>
              {candidate.isManualOverride && (
                <span className="text-[11px] font-medium text-muted-foreground">
                  (Disesuaikan Manual oleh HR)
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Melamar untuk: <b>{candidate.position?.title || "Posisi Umum"}</b>{" "}
              • Diterima:{" "}
              {new Date(candidate.createdAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <a
            href={`/api/candidates/${candidate.id}/file`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-sm hover:bg-muted"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Lihat / Unduh CV Asli</span>
          </a>

          <button
            onClick={handleDelete}
            className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-600 hover:bg-rose-100"
            title="Hapus Data Kandidat"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3 text-xs text-muted-foreground">
        <span>
          Alur tinjauan: <kbd>J</kbd> berikutnya · <kbd>K</kbd> sebelumnya ·{" "}
          <kbd>S</kbd> shortlist · <kbd>R</kbd> tolak
        </span>
        <button className="text-primary" onClick={() => setPreview(!preview)}>
          {preview ? "Tutup pratinjau" : "Pratinjau CV"}
        </button>
      </div>
      {notice && (
        <div role="status" className="panel text-sm">
          {notice}
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <section className="panel flex items-center gap-6">
          <ScoreRing score={candidate.overallScore} size={96} />
          <div>
            <p className="text-xs text-muted-foreground">SKOR AKHIR</p>
            <h2 className="mt-2 font-semibold">Kecocokan dengan posisi</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Berdasarkan bobot penilaian posisi.
            </p>
          </div>
        </section>
        <section className="panel">
          <Radar
            scores={[
              candidate.scoreSkills,
              candidate.scoreExperience,
              candidate.scoreEducation,
              candidate.scorePortfolio,
            ]}
            weights={
              candidate.position
                ? [
                    candidate.position.weightSkills,
                    candidate.position.weightExperience,
                    candidate.position.weightEducation,
                    candidate.position.weightPortfolio,
                  ]
                : undefined
            }
          />
        </section>
      </div>
      {preview && (
        <section className="panel">
          <h2 className="mb-3 font-semibold">Dokumen asli</h2>
          {candidate.fileName?.toLowerCase().endsWith(".pdf") ? (
            <iframe
              title={"CV " + candidate.name}
              src={"/api/candidates/" + id + "/file"}
              className="h-[65vh] w-full rounded-lg border"
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Pratinjau DOCX tidak tersedia di browser.{" "}
              <a
                className="text-primary underline"
                href={"/api/candidates/" + id + "/file"}
              >
                Unduh dokumen
              </a>
            </p>
          )}
        </section>
      )}
      {/* Main Grid: Left details, Right scoring */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column (2 spans) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Executive Summary */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
            <h2 className="flex items-center space-x-2 text-base font-bold text-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Ringkasan AI & Rekomendasi</span>
            </h2>

            <p className="text-sm leading-relaxed text-foreground">
              {candidate.summary}
            </p>

            <div className="rounded-lg bg-muted p-3.5 text-xs text-muted-foreground border border-border">
              <p className="font-semibold text-foreground">
                Alasan Rekomendasi AI:
              </p>
              <p className="mt-1">{candidate.aiReasoning}</p>
            </div>

            {/* Strengths and Gaps */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
              <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-3.5">
                <h4 className="text-xs font-bold text-emerald-800 flex items-center space-x-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Kekuatan Utama:</span>
                </h4>
                <ul className="mt-2 list-disc list-inside space-y-1 text-xs text-emerald-900">
                  {candidate.strengths.map((str, i) => (
                    <li key={i}>{str}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-3.5">
                <h4 className="text-xs font-bold text-amber-800 flex items-center space-x-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                  <span>Celah Kualifikasi (Gaps):</span>
                </h4>
                <ul className="mt-2 list-disc list-inside space-y-1 text-xs text-amber-900">
                  {candidate.gaps.map((gap, i) => (
                    <li key={i}>{gap}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Must-Have Requirements Checklist */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">
                Pemeriksaan Persyaratan Wajib (Must-Have)
              </h2>
              <span
                className={`rounded px-2 py-0.5 text-xs font-bold ${
                  candidate.allMustHaveMet
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-rose-100 text-rose-800"
                }`}
              >
                {candidate.allMustHaveMet
                  ? "Semua Syarat Terpenuhi"
                  : "Ada Syarat Tidak Terpenuhi"}
              </span>
            </div>

            <div className="space-y-3">
              {candidate.mustHaveResults.map((check, i) => (
                <div
                  key={i}
                  className={`rounded-lg border p-3.5 text-xs ${
                    check.met
                      ? "border-emerald-200 bg-emerald-50/30"
                      : "border-rose-200 bg-rose-50/30"
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {check.met ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="mt-0.5 h-4 w-4 text-rose-600 shrink-0" />
                    )}
                    <div>
                      <span className="font-bold text-foreground">
                        {check.requirement}
                      </span>
                      <p className="mt-1 text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          Bukti di CV:{" "}
                        </span>
                        {check.evidence}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Nice-To-Have Requirements Checklist */}
          {candidate.niceToHaveResults &&
            candidate.niceToHaveResults.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-foreground">
                  Pemeriksaan Persyaratan Tambahan (Nice-To-Have)
                </h2>

                <div className="space-y-3">
                  {candidate.niceToHaveResults.map((check, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-border p-3 text-xs bg-muted"
                    >
                      <div className="flex items-start space-x-2">
                        {check.met ? (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600 shrink-0" />
                        ) : (
                          <span className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0 text-center font-bold">
                            -
                          </span>
                        )}
                        <div>
                          <span className="font-semibold text-foreground">
                            {check.requirement}
                          </span>
                          <details className="mt-2">
                            <summary className="cursor-pointer text-primary">
                              Lihat bukti dari CV
                            </summary>
                            <blockquote className="mt-2 border-l-2 border-primary bg-accent/40 p-3 text-foreground">
                              {check.evidence}
                            </blockquote>
                          </details>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Portfolio & Work Evidence */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-foreground">
              Portofolio, Hasil Karya & Tautan
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {candidate.portfolioSummary}
            </p>

            <div className="pt-2 flex flex-wrap gap-2">
              {candidate.links?.linkedin && (
                <a
                  href={
                    candidate.links.linkedin.startsWith("http")
                      ? candidate.links.linkedin
                      : `https://${candidate.links.linkedin}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                >
                  <span>LinkedIn Profile</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {candidate.links?.github && (
                <a
                  href={
                    candidate.links.github.startsWith("http")
                      ? candidate.links.github
                      : `https://${candidate.links.github}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                >
                  <span>GitHub Repository</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {Array.isArray(candidate.links?.portfolio) &&
                candidate.links.portfolio.map((p, idx) => (
                  <a
                    key={idx}
                    href={p.startsWith("http") ? p : `https://${p}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1.5 rounded-lg border border-primary bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
                  >
                    <span>Portofolio Link {idx + 1}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ))}
            </div>
          </div>
        </div>

        {/* Right Column (1 span): Score Card & HR Actions */}
        <div className="space-y-6">
          <div className="panel">
            <p className="text-xs text-muted-foreground">Aspek terkuat</p>
            <p className="mt-2 font-semibold text-primary">
              {aspectBadge.label}
            </p>
          </div>

          {/* HR Decision & Status Override */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-foreground">
              Keputusan & Penyesuaian HR
            </h3>

            <div>
              <label className="block text-xs font-semibold text-foreground">
                Ubah Status Kandidat
              </label>
              <select
                aria-label="Ubah status kandidat"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border p-2 text-xs font-medium"
              >
                <option value="SHORTLIST">Lolos Shortlist (Interview)</option>
                <option value="MAYBE">Dipertimbangkan (Cadangan)</option>
                <option value="REJECT">Tidak Memenuhi / Ditolak</option>
                <option value="NEEDS_HR_REVIEW">Perlu Dicek Manual</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground">
                Catatan Internal HR
              </label>
              <textarea
                aria-label="Catatan internal HR"
                rows={3}
                placeholder="Tambahkan catatan hasil verifikasi, jadwal interview, dll..."
                value={hrNotes}
                onChange={(e) => setHrNotes(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border p-2 text-xs"
              />
            </div>

            <button
              onClick={handleUpdateStatus}
              disabled={updating}
              className="flex w-full items-center justify-center space-x-1.5 rounded-lg bg-primary py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{updating ? "Menyimpan..." : "Simpan Keputusan HR"}</span>
            </button>
          </div>

          {/* Email Source Information */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-3 text-xs text-muted-foreground">
            <h3 className="text-sm font-bold text-foreground">
              Metadata Lamaran Masuk
            </h3>
            <div>
              <span className="font-semibold text-foreground">Sumber: </span>
              <span>{candidate.source}</span>
            </div>
            {candidate.emailSubject && (
              <div>
                <span className="font-semibold text-foreground">Subjek: </span>
                <span className="font-mono text-[11px]">
                  {candidate.emailSubject}
                </span>
              </div>
            )}
            {candidate.emailSender && (
              <div>
                <span className="font-semibold text-foreground">
                  Pengirim:{" "}
                </span>
                <span>{candidate.emailSender}</span>
              </div>
            )}
            <div>
              <span className="font-semibold text-foreground">Nama File: </span>
              <span className="truncate block font-mono text-[11px] mt-0.5">
                {candidate.fileName}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
