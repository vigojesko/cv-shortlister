"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Users,
  CheckCircle2,
  AlertTriangle,
  Mail,
  ArrowRight,
  TrendingUp,
  FileText,
  Clock,
  Sparkles,
} from "lucide-react";
import { getStatusBadge, getAspectBadge } from "@/lib/utils";

interface StatsData {
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
  recentCandidates: Array<{
    id: string;
    name: string;
    email: string;
    overallScore: number;
    status: string;
    strongestAspect: string;
    createdAt: string;
    position?: { title: string } | null;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center space-x-2 text-slate-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <span>Memuat ringkasan dashboard...</span>
        </div>
      </div>
    );
  }

  const stats = data?.stats;
  const gmail = data?.gmailAccount;

  return (
    <div className="space-y-8">
      {/* Top Banner Alert for Gmail Connection */}
      {(!gmail || !gmail.isConnected || gmail.lastErrorMessage) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-amber-900">
                  {!gmail
                    ? "Gmail Belum Terhubung"
                    : "Koneksi Gmail Terputus / Token Perlu Diperbarui"}
                </h3>
                <p className="mt-1 text-xs text-amber-700">
                  {!gmail
                    ? "Hubungkan akun Gmail HR agar sistem dapat otomatis menarik surat lamaran dan menyaring CV."
                    : gmail.lastErrorMessage ||
                      "Sesi otorisasi Gmail berakhir. Silakan hubungkan ulang akun Google Anda."}
                </p>
              </div>
            </div>
            <Link
              href="/settings"
              className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-700 shadow-sm"
            >
              Hubungkan Sekarang
            </Link>
          </div>
        </div>
      )}

      {/* Header Title */}
      <div className="flex flex-col justify-between space-y-3 sm:flex-row sm:items-center sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Dasbor Penyeleksian CV
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Pemantauan otomatis kandidat masuk, evaluasi AI, dan shortlisting.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/positions"
            className="flex items-center space-x-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <Briefcase className="h-4 w-4 text-slate-500" />
            <span>Kelola Posisi</span>
          </Link>
          <Link
            href="/upload"
            className="flex items-center space-x-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <Sparkles className="h-4 w-4" />
            <span>Unggah CV Manual</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Lolos Shortlist
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900">
              {stats?.shortlistedCandidates || 0}
            </span>
            <span className="text-xs text-emerald-600 font-medium">Siap Interview</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total CV Diproses
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900">
              {stats?.totalCandidates || 0}
            </span>
            <span className="text-xs text-slate-500">Berkas Masuk</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Perlu Dicek HR
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900">
              {stats?.needsReviewCandidates || 0}
            </span>
            <span className="text-xs text-purple-600 font-medium">Routing Ambigu</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Status Gmail Sync
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Mail className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center space-x-2">
              <div
                className={`h-2.5 w-2.5 rounded-full ${
                  gmail?.isConnected ? "bg-emerald-500" : "bg-rose-500"
                }`}
              />
              <span className="text-sm font-semibold text-slate-800">
                {gmail?.isConnected ? "Terhubung" : "Tidak Aktif"}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400 truncate">
              {gmail?.lastSyncAt
                ? `Sync: ${new Date(gmail.lastSyncAt).toLocaleTimeString("id-ID")}`
                : "Belum pernah sync"}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Candidates Section */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Kandidat Terbaru Dinilai AI
            </h2>
            <p className="text-xs text-slate-500">
              Kandidat yang baru saja ditarik dan dievaluasi secara otomatis.
            </p>
          </div>
          <Link
            href="/candidates"
            className="flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            <span>Lihat Semua Kandidat</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {(!data?.recentCandidates || data.recentCandidates.length === 0) ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-sm font-medium text-slate-900">
              Belum Ada Kandidat
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Jalankan sinkronisasi Gmail atau unggah berkas CV contoh untuk mulai menyaring.
            </p>
            <div className="mt-4 flex justify-center space-x-3">
              <Link
                href="/upload"
                className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-blue-700"
              >
                Unggah CV Manual
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {data.recentCandidates.map((candidate) => {
              const statusBadge = getStatusBadge(candidate.status);
              const aspectBadge = getAspectBadge(candidate.strongestAspect);

              return (
                <div
                  key={candidate.id}
                  className="flex flex-col justify-between p-4 sm:flex-row sm:items-center hover:bg-slate-50 transition"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold text-sm">
                      {candidate.overallScore}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/candidates/${candidate.id}`}
                          className="text-sm font-semibold text-slate-900 hover:text-blue-600 transition"
                        >
                          {candidate.name}
                        </Link>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border ${statusBadge.bg}`}
                        >
                          {statusBadge.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {candidate.position?.title || "Posisi Umum"} • {candidate.email}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center space-x-3 sm:mt-0">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium border ${aspectBadge.color}`}
                    >
                      Aspek: {aspectBadge.label}
                    </span>
                    <Link
                      href={`/candidates/${candidate.id}`}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Detail
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
