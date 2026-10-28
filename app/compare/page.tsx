"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { GitCompare, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
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
  status: string;
  strongestAspect: string;
  summary: string;
  portfolioSummary: string;
  strengths: string[];
  gaps: string[];
  mustHaveResults: Array<{ requirement: string; met: boolean; evidence: string }>;
  position?: { title: string } | null;
}

function CompareContent() {
  const searchParams = useSearchParams();
  const idsQuery = searchParams.get("ids") || "";

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/candidates")
      .then((res) => res.json())
      .then((data) => {
        const list: Candidate[] = data.candidates || [];
        setAllCandidates(list);

        const targetIds = idsQuery.split(",").filter(Boolean);
        if (targetIds.length > 0) {
          setCandidates(list.filter((c) => targetIds.includes(c.id)));
        } else {
          // Default pick top 2
          setCandidates(list.slice(0, 2));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [idsQuery]);

  const handleSelectCandidate = (index: number, newId: string) => {
    const selected = allCandidates.find((c) => c.id === newId);
    if (!selected) return;

    const updated = [...candidates];
    updated[index] = selected;
    setCandidates(updated);
  };

  const addCandidateSlot = () => {
    if (candidates.length >= 3) {
      alert("Maksimal dapat membandingkan 3 kandidat.");
      return;
    }
    const remaining = allCandidates.find(
      (c) => !candidates.some((curr) => curr.id === c.id)
    );
    if (remaining) {
      setCandidates([...candidates, remaining]);
    }
  };

  const removeCandidateSlot = (index: number) => {
    if (candidates.length <= 2) {
      alert("Minimal 2 kandidat untuk dibandingkan.");
      return;
    }
    setCandidates(candidates.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-500">
        Memuat perbandingan kandidat...
      </div>
    );
  }

  if (allCandidates.length < 2) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
        <GitCompare className="mx-auto h-12 w-12 text-slate-300" />
        <h3 className="mt-2 text-sm font-semibold text-slate-900">
          Kandidat belum mencukupi untuk dibandingkan
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Dibutuhkan minimal 2 kandidat dalam database untuk menjalankan perbandingan berdampingan.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link
            href="/candidates"
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Perbandingan Kandidat Berdampingan
            </h1>
            <p className="text-xs text-slate-500">
              Bandingkan 2 hingga 3 kandidat untuk mempermudah penentuan shortlist akhir.
            </p>
          </div>
        </div>

        {candidates.length < 3 && allCandidates.length > candidates.length && (
          <button
            onClick={addCandidateSlot}
            className="rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            + Tambah Kandidat ke-3
          </button>
        )}
      </div>

      {/* Comparison Grid */}
      <div
        className={`grid grid-cols-1 gap-6 ${
          candidates.length === 3 ? "lg:grid-cols-3" : "md:grid-cols-2"
        }`}
      >
        {candidates.map((c, idx) => {
          const statusBadge = getStatusBadge(c.status);
          const aspectBadge = getAspectBadge(c.strongestAspect);

          return (
            <div
              key={c.id || idx}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-5"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Kandidat #{idx + 1}
                  </span>
                  {candidates.length > 2 && (
                    <button
                      onClick={() => removeCandidateSlot(idx)}
                      className="text-xs text-rose-600 hover:underline"
                    >
                      Hapus Slot
                    </button>
                  )}
                </div>

                <div className="mt-2">
                  <select
                    value={c.id}
                    onChange={(e) => handleSelectCandidate(idx, e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs font-semibold"
                  >
                    {allCandidates.map((cand) => (
                      <option key={cand.id} value={cand.id}>
                        {cand.name} ({cand.overallScore} - {cand.position?.title})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Score Big Display */}
                <div className="mt-4 rounded-xl bg-slate-50 p-4 text-center border border-slate-100">
                  <div className="text-4xl font-extrabold text-blue-600">
                    {c.overallScore}
                  </div>
                  <div className="mt-1 flex items-center justify-center space-x-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold border ${statusBadge.bg}`}
                    >
                      {statusBadge.label}
                    </span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[11px] font-medium border ${aspectBadge.color}`}
                    >
                      {aspectBadge.label}
                    </span>
                  </div>
                </div>

                {/* Breakdown Bars */}
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Keahlian (Skills):</span>
                    <span className="font-bold text-slate-900">{c.scoreSkills}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pengalaman:</span>
                    <span className="font-bold text-slate-900">{c.scoreExperience}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pendidikan:</span>
                    <span className="font-bold text-slate-900">{c.scoreEducation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Portofolio:</span>
                    <span className="font-bold text-slate-900">{c.scorePortfolio}</span>
                  </div>
                </div>

                {/* Summary */}
                <div className="mt-4 border-t border-slate-100 pt-3 text-xs">
                  <span className="font-bold text-slate-800">Ringkasan AI:</span>
                  <p className="mt-1 text-slate-600 leading-relaxed">
                    {c.summary}
                  </p>
                </div>

                {/* Strengths */}
                <div className="mt-3 text-xs">
                  <span className="font-bold text-emerald-800">Kekuatan:</span>
                  <ul className="mt-1 list-disc list-inside space-y-1 text-slate-700">
                    {c.strengths.slice(0, 3).map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>

                {/* Gaps */}
                <div className="mt-3 text-xs">
                  <span className="font-bold text-amber-800">Celah / Gaps:</span>
                  <ul className="mt-1 list-disc list-inside space-y-1 text-slate-700">
                    {c.gaps.slice(0, 3).map((g, i) => (
                      <li key={i}>{g}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <Link
                  href={`/candidates/${c.id}`}
                  className="block text-center rounded-lg border border-slate-300 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Buka Profil Lengkap
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center text-sm text-slate-500">
          Memuat perbandingan kandidat...
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
