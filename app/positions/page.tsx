"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Plus,
  Copy,
  Trash2,
  Edit3,
  Users,
  Search,
  CheckCircle,
  XCircle,
  Sparkles,
} from "lucide-react";

interface Position {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  description: string;
  mustHaveRequirements: string[];
  niceToHaveRequirements: string[];
  minExperienceYears: number;
  minEducation: string;
  emailKeywords: string[];
  shortlistRuleType: string;
  shortlistThreshold: number;
  shortlistTopN: number;
  isActive: boolean;
  _count?: { candidates: number };
}

export default function PositionsPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const loadPositions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/positions");
      const data = await res.json();
      setPositions(data.positions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPositions();
  }, []);

  const handleDuplicate = async (id: string) => {
    if (!confirm("Duplikasi profil posisi ini?")) return;
    try {
      const res = await fetch(`/api/positions/${id}/duplicate`, {
        method: "POST",
      });
      if (res.ok) {
        loadPositions();
      } else {
        alert("Gagal menduplikasi posisi.");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (
      !confirm(
        `PERINGATAN: Menghapus posisi "${title}" juga akan menghapus seluruh data kandidat di posisi ini. Lanjutkan?`
      )
    )
      return;

    try {
      const res = await fetch(`/api/positions/${id}`, { method: "DELETE" });
      if (res.ok) {
        loadPositions();
      } else {
        alert("Gagal menghapus posisi.");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const filteredPositions = positions.filter((p) =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.department && p.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between space-y-3 sm:flex-row sm:items-center sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Posisi Pekerjaan (Job Profile)
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Tentukan kriteria seleksi, must-have requirement, bobot nilai, dan filter email.
          </p>
        </div>

        <Link
          href="/positions/new"
          className="inline-flex items-center space-x-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>Buat Posisi Baru</span>
        </Link>
      </div>

      <div className="flex items-center space-x-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama posisi atau divisi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center text-sm text-slate-500">
          Memuat daftar posisi...
        </div>
      ) : filteredPositions.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <Briefcase className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-2 text-sm font-semibold text-slate-900">
            Belum ada posisi pekerjaan
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Mulai dengan membuat posisi baru untuk mengotomasi penyaringan CV dari pelamar.
          </p>
          <div className="mt-4">
            <Link
              href="/positions/new"
              className="inline-flex items-center space-x-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Posisi</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPositions.map((pos) => (
            <div
              key={pos.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        pos.isActive ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                    />
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {pos.department || "Umum"}
                    </span>
                  </div>
                  <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 border border-blue-200">
                    {pos.shortlistRuleType === "THRESHOLD"
                      ? `Skor ≥ ${pos.shortlistThreshold}`
                      : `Top ${pos.shortlistTopN}`}
                  </span>
                </div>

                <h3 className="mt-2 text-base font-bold text-slate-900">
                  <Link
                    href={`/positions/${pos.id}`}
                    className="hover:text-blue-600 transition"
                  >
                    {pos.title}
                  </Link>
                </h3>

                <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                  {pos.description}
                </p>

                <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Must-Have:</span>
                    <span className="font-semibold text-slate-800">
                      {pos.mustHaveRequirements.length} syarat
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Pengalaman Min:</span>
                    <span className="font-semibold text-slate-800">
                      {pos.minExperienceYears} tahun
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Filter Subjek:</span>
                    <span className="truncate max-w-[150px] font-mono text-[11px] bg-slate-100 px-1 rounded">
                      {pos.emailKeywords.join(", ") || "-"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-4 flex items-center justify-between">
                <Link
                  href={`/positions/${pos.id}`}
                  className="flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  <Users className="h-4 w-4" />
                  <span>
                    {pos._count?.candidates || 0} Pelamar (Lihat Shortlist)
                  </span>
                </Link>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleDuplicate(pos.id)}
                    title="Duplikasi Posisi"
                    className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <Link
                    href={`/positions/${pos.id}/edit`}
                    title="Edit Posisi"
                    className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </Link>
                  <button
                    onClick={() => handleDelete(pos.id, pos.title)}
                    title="Hapus Posisi"
                    className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
