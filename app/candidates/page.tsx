"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Filter,
  Download,
  CheckCircle,
  FileText,
  Briefcase,
  GitCompare,
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
  status: string;
  strongestAspect: string;
  summary: string;
  source: string;
  createdAt: string;
  position?: { id: string; title: string; department: string | null } | null;
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const loadCandidates = async () => {
    try {
      setLoading(true);
      const url = new URL("/api/candidates", window.location.origin);
      if (statusFilter !== "ALL") url.searchParams.set("status", statusFilter);
      if (search) url.searchParams.set("search", search);

      const res = await fetch(url.toString());
      const data = await res.json();
      setCandidates(data.candidates || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadCandidates();
  };

  const toggleSelectCandidate = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      if (selectedIds.length >= 3) {
        alert("Maksimal dapat membandingkan 3 kandidat sekaligus.");
        return;
      }
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between space-y-3 sm:flex-row sm:items-center sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Daftar Seluruh Kandidat Pelamar
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Semua CV yang telah ditarik otomatis dari Gmail maupun diunggah secara manual.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {selectedIds.length >= 2 && (
            <Link
              href={`/compare?ids=${selectedIds.join(",")}`}
              className="flex items-center space-x-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              <GitCompare className="h-4 w-4" />
              <span>Bandingkan ({selectedIds.length}) Kandidat</span>
            </Link>
          )}

          <a
            href="/api/export?format=xlsx"
            className="flex items-center space-x-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Excel</span>
          </a>

          <a
            href="/api/export?format=csv"
            className="flex items-center space-x-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5" />
            <span>CSV</span>
          </a>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, email, atau keahlian..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
        </form>

        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-300 py-2 px-3 text-xs focus:border-blue-500 focus:outline-none"
          >
            <option value="ALL">Semua Status</option>
            <option value="SHORTLIST">Lolos Shortlist</option>
            <option value="MAYBE">Dipertimbangkan</option>
            <option value="REJECT">Tidak Memenuhi Syarat</option>
            <option value="NEEDS_HR_REVIEW">Perlu Dicek HR</option>
          </select>
        </div>
      </div>

      {/* Candidate List Table */}
      {loading ? (
        <div className="flex h-48 items-center justify-center text-sm text-slate-500">
          Memuat data kandidat...
        </div>
      ) : candidates.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-2 text-sm font-semibold text-slate-900">
            Tidak ada kandidat ditemukan
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Belum ada lamaran yang cocok dengan kriteria filter saat ini.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 font-semibold text-slate-600">
              <tr>
                <th className="py-3 px-4 w-8">
                  <span className="sr-only">Pilih</span>
                </th>
                <th className="py-3 px-4">Nama Pelamar</th>
                <th className="py-3 px-4">Posisi</th>
                <th className="py-3 px-4 text-center">Skor Akhir</th>
                <th className="py-3 px-4">Aspek Terkuat</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Sumber</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {candidates.map((c) => {
                const statusBadge = getStatusBadge(c.status);
                const aspectBadge = getAspectBadge(c.strongestAspect);
                const isSelected = selectedIds.includes(c.id);

                return (
                  <tr
                    key={c.id}
                    className={`hover:bg-slate-50 ${isSelected ? "bg-blue-50/50" : ""}`}
                  >
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectCandidate(c.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        title="Pilih untuk membandingkan"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/candidates/${c.id}`}
                        className="font-bold text-slate-900 hover:text-blue-600"
                      >
                        {c.name}
                      </Link>
                      <p className="text-[11px] text-slate-400">{c.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-700">
                        {c.position?.title || "Umum"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 font-extrabold text-slate-900 text-sm">
                        {c.overallScore}
                      </span>
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
                    <td className="py-3 px-4 text-slate-500">
                      <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">
                        {c.source}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/candidates/${c.id}`}
                        className="rounded border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Lihat Profil
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
