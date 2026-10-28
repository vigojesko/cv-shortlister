"use client";

import { useEffect, useState } from "react";
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
  mustHaveResults: Array<{ requirement: string; met: boolean; evidence: string }>;
  niceToHaveResults: Array<{ requirement: string; met: boolean; evidence: string }>;
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
  } | null;
}

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [candidate, setCandidate] = useState<CandidateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [hrNotes, setHrNotes] = useState<string>("");

  const loadCandidate = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/candidates/${id}`);
      const data = await res.json();
      if (res.ok) {
        setCandidate(data.candidate);
        setStatus(data.candidate.status);
        setHrNotes(data.candidate.hrNotes || "");
      } else {
        alert("Kandidat tidak ditemukan.");
        router.push("/candidates");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadCandidate();
  }, [id]);

  const handleUpdateStatus = async () => {
    try {
      setUpdating(true);
      const res = await fetch(`/api/candidates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, hrNotes }),
      });
      if (res.ok) {
        alert("Status dan catatan HR berhasil disimpan.");
        loadCandidate();
      } else {
        alert("Gagal memperbarui status.");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Hapus berkas dan seluruh catatan kandidat ini secara permanen dari database?"
      )
    )
      return;

    try {
      const res = await fetch(`/api/candidates/${id}`, { method: "DELETE" });
      if (res.ok) {
        alert("Kandidat berhasil dihapus.");
        router.push("/candidates");
      } else {
        alert("Gagal menghapus kandidat.");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-500">
        Memuat berkas profil kandidat...
      </div>
    );
  }

  if (!candidate) return null;

  const statusBadge = getStatusBadge(candidate.status);
  const aspectBadge = getAspectBadge(candidate.strongestAspect);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.back()}
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {candidate.name}
              </h1>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${statusBadge.bg}`}
              >
                {statusBadge.label}
              </span>
              {candidate.isManualOverride && (
                <span className="text-[11px] font-medium text-slate-400">
                  (Disesuaikan Manual oleh HR)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Melamar untuk:{" "}
              <b>{candidate.position?.title || "Posisi Umum"}</b> • Diterima:{" "}
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
            className="flex items-center space-x-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
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

      {/* Main Grid: Left details, Right scoring */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column (2 spans) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Executive Summary */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="flex items-center space-x-2 text-base font-bold text-slate-900">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span>Ringkasan AI & Rekomendasi</span>
            </h2>

            <p className="text-sm leading-relaxed text-slate-700">
              {candidate.summary}
            </p>

            <div className="rounded-lg bg-slate-50 p-3.5 text-xs text-slate-600 border border-slate-200">
              <p className="font-semibold text-slate-800">
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
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
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
                      <span className="font-bold text-slate-900">
                        {check.requirement}
                      </span>
                      <p className="mt-1 text-slate-600">
                        <span className="font-semibold text-slate-700">
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
          {candidate.niceToHaveResults && candidate.niceToHaveResults.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900">
                Pemeriksaan Persyaratan Tambahan (Nice-To-Have)
              </h2>

              <div className="space-y-3">
                {candidate.niceToHaveResults.map((check, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-slate-200 p-3 text-xs bg-slate-50"
                  >
                    <div className="flex items-start space-x-2">
                      {check.met ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600 shrink-0" />
                      ) : (
                        <span className="mt-0.5 h-4 w-4 text-slate-400 shrink-0 text-center font-bold">
                          -
                        </span>
                      )}
                      <div>
                        <span className="font-semibold text-slate-800">
                          {check.requirement}
                        </span>
                        <p className="mt-0.5 text-slate-500">
                          Bukti: {check.evidence}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Portfolio & Work Evidence */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-slate-900">
              Portofolio, Hasil Karya & Tautan
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
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
                  className="inline-flex items-center space-x-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
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
                  className="inline-flex items-center space-x-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
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
                    className="inline-flex items-center space-x-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
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
          {/* Overall Score Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div className="text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Skor Keseluruhan
              </span>
              <div className="mt-1 flex items-baseline justify-center space-x-1">
                <span className="text-5xl font-extrabold text-blue-600">
                  {candidate.overallScore}
                </span>
                <span className="text-sm font-semibold text-slate-400">/ 100</span>
              </div>
              <div className="mt-2">
                <span
                  className={`inline-block rounded-md px-2.5 py-1 text-xs font-semibold border ${aspectBadge.color}`}
                >
                  Aspek Terkuat: {aspectBadge.label}
                </span>
              </div>
            </div>

            {/* Score Breakdown Bars */}
            <div className="space-y-3 border-t border-slate-100 pt-4">
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>Keahlian (Skills)</span>
                  <span className="font-bold">{candidate.scoreSkills}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${candidate.scoreSkills}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>Pengalaman Kerja</span>
                  <span className="font-bold">{candidate.scoreExperience}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full"
                    style={{ width: `${candidate.scoreExperience}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>Pendidikan</span>
                  <span className="font-bold">{candidate.scoreEducation}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full"
                    style={{ width: `${candidate.scoreEducation}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>Portofolio & Karya</span>
                  <span className="font-bold">{candidate.scorePortfolio}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${candidate.scorePortfolio}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* HR Decision & Status Override */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Keputusan & Penyesuaian HR
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Ubah Status Kandidat
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs font-medium"
              >
                <option value="SHORTLIST">Lolos Shortlist (Interview)</option>
                <option value="MAYBE">Dipertimbangkan (Cadangan)</option>
                <option value="REJECT">Tidak Memenuhi / Ditolak</option>
                <option value="NEEDS_HR_REVIEW">Perlu Dicek Manual</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Catatan Internal HR
              </label>
              <textarea
                rows={3}
                placeholder="Tambahkan catatan hasil verifikasi, jadwal interview, dll..."
                value={hrNotes}
                onChange={(e) => setHrNotes(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs"
              />
            </div>

            <button
              onClick={handleUpdateStatus}
              disabled={updating}
              className="flex w-full items-center justify-center space-x-1.5 rounded-lg bg-blue-600 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{updating ? "Menyimpan..." : "Simpan Keputusan HR"}</span>
            </button>
          </div>

          {/* Email Source Information */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-3 text-xs text-slate-600">
            <h3 className="text-sm font-bold text-slate-900">
              Metadata Lamaran Masuk
            </h3>
            <div>
              <span className="font-semibold text-slate-700">Sumber: </span>
              <span>{candidate.source}</span>
            </div>
            {candidate.emailSubject && (
              <div>
                <span className="font-semibold text-slate-700">Subjek: </span>
                <span className="font-mono text-[11px]">{candidate.emailSubject}</span>
              </div>
            )}
            {candidate.emailSender && (
              <div>
                <span className="font-semibold text-slate-700">Pengirim: </span>
                <span>{candidate.emailSender}</span>
              </div>
            )}
            <div>
              <span className="font-semibold text-slate-700">Nama File: </span>
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
