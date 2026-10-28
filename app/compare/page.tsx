"use client";
import { Skeleton } from "@/components/Visuals";
import { notify } from "@/components/Toast";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ScoreRing } from "@/components/Visuals";
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
  mustHaveResults: Array<{
    requirement: string;
    met: boolean;
    evidence: string;
  }>;
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
          setCandidates(
            list.filter((c) => targetIds.includes(c.id)).slice(0, 3),
          );
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
      notify("Maksimal dapat membandingkan 3 kandidat.");
      return;
    }
    const remaining = allCandidates.find(
      (c) => !candidates.some((curr) => curr.id === c.id),
    );
    if (remaining) {
      setCandidates([...candidates, remaining]);
    }
  };

  const removeCandidateSlot = (index: number) => {
    if (candidates.length <= 2) {
      notify("Minimal 2 kandidat untuk dibandingkan.");
      return;
    }
    setCandidates(candidates.filter((_, i) => i !== index));
  };

  if (loading) {
    return <Skeleton />;
  }

  if (allCandidates.length < 2) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <GitCompare className="mx-auto h-12 w-12 text-slate-300" />
        <h3 className="mt-2 text-sm font-semibold text-foreground">
          Kandidat belum mencukupi untuk dibandingkan
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Dibutuhkan minimal 2 kandidat dalam database untuk menjalankan
          perbandingan berdampingan.
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
            className="rounded-lg border border-border bg-card p-2 text-muted-foreground hover:bg-muted shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Perbandingan Kandidat Berdampingan
            </h1>
            <p className="text-xs text-muted-foreground">
              Bandingkan 2 hingga 3 kandidat untuk mempermudah penentuan
              shortlist akhir.
            </p>
          </div>
        </div>

        {candidates.length < 3 && allCandidates.length > candidates.length && (
          <button
            onClick={addCandidateSlot}
            className="rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary"
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
              className="flex flex-col justify-between rounded-xl border border-border bg-card p-6 shadow-sm space-y-5"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
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

                <div className="sticky top-[72px] z-10 mt-2 bg-card py-2">
                  <select
                    value={c.id}
                    onChange={(e) => handleSelectCandidate(idx, e.target.value)}
                    className="w-full rounded-lg border border-border p-2 text-xs font-semibold"
                  >
                    {allCandidates.map((cand) => (
                      <option
                        key={cand.id}
                        value={cand.id}
                        disabled={
                          cand.id !== c.id &&
                          candidates.some((other) => other.id === cand.id)
                        }
                      >
                        {cand.name} ({cand.overallScore} -{" "}
                        {cand.position?.title})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Score Big Display */}
                <div className="mt-4 rounded-xl bg-muted p-4 text-center border border-border">
                  <div className="text-4xl font-extrabold text-primary">
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
                    <span className="text-muted-foreground">
                      Keahlian (Skills):
                    </span>
                    <span
                      className={`rounded px-2 font-bold ${c.scoreSkills === Math.max(...candidates.map((x) => x.scoreSkills)) ? "bg-accent text-primary" : "text-foreground"}`}
                    >
                      {c.scoreSkills}
                      {c.scoreSkills ===
                      Math.max(...candidates.map((x) => x.scoreSkills))
                        ? " · Terbaik"
                        : ""}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pengalaman:</span>
                    <span
                      className={`rounded px-2 font-bold ${c.scoreExperience === Math.max(...candidates.map((x) => x.scoreExperience)) ? "bg-accent text-primary" : "text-foreground"}`}
                    >
                      {c.scoreExperience}
                      {c.scoreExperience ===
                      Math.max(...candidates.map((x) => x.scoreExperience))
                        ? " · Terbaik"
                        : ""}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pendidikan:</span>
                    <span
                      className={`rounded px-2 font-bold ${c.scoreEducation === Math.max(...candidates.map((x) => x.scoreEducation)) ? "bg-accent text-primary" : "text-foreground"}`}
                    >
                      {c.scoreEducation}
                      {c.scoreEducation ===
                      Math.max(...candidates.map((x) => x.scoreEducation))
                        ? " · Terbaik"
                        : ""}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Portofolio:</span>
                    <span
                      className={`rounded px-2 font-bold ${c.scorePortfolio === Math.max(...candidates.map((x) => x.scorePortfolio)) ? "bg-accent text-primary" : "text-foreground"}`}
                    >
                      {c.scorePortfolio}
                      {c.scorePortfolio ===
                      Math.max(...candidates.map((x) => x.scorePortfolio))
                        ? " · Terbaik"
                        : ""}
                    </span>
                  </div>
                </div>

                <div
                  className="my-4 space-y-2"
                  aria-label="Perbandingan visual subskor"
                >
                  {(
                    [
                      "scoreSkills",
                      "scoreExperience",
                      "scoreEducation",
                      "scorePortfolio",
                    ] as const
                  ).map((key, i) => (
                    <div key={key} className="space-y-1">
                      <p className="text-[10px] text-muted-foreground">
                        {
                          [
                            "Keahlian",
                            "Pengalaman",
                            "Pendidikan",
                            "Portofolio",
                          ][i]
                        }
                      </p>
                      <div className="relative h-2 overflow-hidden rounded bg-muted">
                        <div
                          className="h-full bg-primary"
                          style={{ width: c[key] + "%" }}
                        />
                        <span
                          title="Nilai terbaik"
                          className="absolute top-0 h-full w-0.5 bg-foreground"
                          style={{
                            left: `calc(${Math.max(...candidates.map((x) => x[key]))}% - 2px)`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {/* Summary */}
                <div className="mt-4 border-t border-border pt-3 text-xs">
                  <span className="font-bold text-foreground">
                    Ringkasan AI:
                  </span>
                  <p className="mt-1 text-muted-foreground leading-relaxed">
                    {c.summary}
                  </p>
                </div>

                {/* Strengths */}
                <div className="mt-3 text-xs">
                  <span className="font-bold text-emerald-800">Kekuatan:</span>
                  <ul className="mt-1 list-disc list-inside space-y-1 text-foreground">
                    {c.strengths.slice(0, 3).map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>

                {/* Gaps */}
                <div className="mt-3 text-xs">
                  <span className="font-bold text-amber-800">
                    Celah / Gaps:
                  </span>
                  <ul className="mt-1 list-disc list-inside space-y-1 text-foreground">
                    {c.gaps.slice(0, 3).map((g, i) => (
                      <li key={i}>{g}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="border-t border-border pt-3">
                <Link
                  href={`/candidates/${c.id}`}
                  className="block text-center rounded-lg border border-border py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
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
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
          Memuat perbandingan kandidat...
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
