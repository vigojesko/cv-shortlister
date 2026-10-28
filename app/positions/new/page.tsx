"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Plus, Trash2, HelpCircle } from "lucide-react";

export default function NewPositionPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    department: "",
    location: "Jakarta (Hybrid)",
    description: "",
    minExperienceYears: 2,
    minEducation: "S1 / Sarjana",
    emailKeywordsText: "",
    emailLabels: "",
    weightSkills: 35,
    weightExperience: 30,
    weightEducation: 15,
    weightPortfolio: 20,
    shortlistRuleType: "THRESHOLD",
    shortlistThreshold: 70,
    shortlistTopN: 5,
    isActive: true,
  });

  const [mustHaves, setMustHaves] = useState<string[]>([
    "Pengalaman minimal 2 tahun dalam bidang pemasaran digital atau brand marketing.",
    "Kemampuan mengelola kampanye iklan (Meta Ads atau Google Ads).",
  ]);

  const [niceToHaves, setNiceToHaves] = useState<string[]>([
    "Sertifikasi Google Analytics atau Hubspot Marketing.",
    "Pengalaman di industri B2B SaaS.",
  ]);

  const addMustHave = () => setMustHaves([...mustHaves, ""]);
  const removeMustHave = (idx: number) =>
    setMustHaves(mustHaves.filter((_, i) => i !== idx));
  const updateMustHave = (idx: number, val: string) => {
    const updated = [...mustHaves];
    updated[idx] = val;
    setMustHaves(updated);
  };

  const addNiceToHave = () => setNiceToHaves([...niceToHaves, ""]);
  const removeNiceToHave = (idx: number) =>
    setNiceToHaves(niceToHaves.filter((_, i) => i !== idx));
  const updateNiceToHave = (idx: number, val: string) => {
    const updated = [...niceToHaves];
    updated[idx] = val;
    setNiceToHaves(updated);
  };

  const totalWeight =
    form.weightSkills +
    form.weightExperience +
    form.weightEducation +
    form.weightPortfolio;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (totalWeight !== 100) {
      setError(`Total bobot penilaian harus tepat 100% (saat ini ${totalWeight}%).`);
      return;
    }

    const cleanMustHaves = mustHaves.map((m) => m.trim()).filter(Boolean);
    if (cleanMustHaves.length === 0) {
      setError("Wajib menambahkan minimal 1 Must-Have requirement.");
      return;
    }

    const keywords = form.emailKeywordsText
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    if (keywords.length === 0) {
      setError("Wajib menambahkan minimal 1 kata kunci subjek email untuk routing.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/positions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          mustHaveRequirements: cleanMustHaves,
          niceToHaveRequirements: niceToHaves
            .map((n) => n.trim())
            .filter(Boolean),
          emailKeywords: keywords,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan posisi.");
      }

      router.push(`/positions/${data.position.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center space-x-3">
        <Link
          href="/positions"
          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Buat Posisi Pekerjaan Baru
          </h1>
          <p className="text-xs text-slate-500">
            Kriteria penilaian ini akan digunakan AI untuk otomatis menyaring pelamar dari Gmail.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-slate-900">
            1. Informasi Dasar Pekerjaan
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Judul Posisi *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Marketing Executive"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Departemen / Divisi
              </label>
              <input
                type="text"
                placeholder="Contoh: Marketing & Growth"
                value={form.department}
                onChange={(e) =>
                  setForm({ ...form, department: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Lokasi Kerja
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Pengalaman Minimum (Tahun)
              </label>
              <input
                type="number"
                min="0"
                value={form.minExperienceYears}
                onChange={(e) =>
                  setForm({
                    ...form,
                    minExperienceYears: parseInt(e.target.value) || 0,
                  })
                }
                className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Pendidikan Minimum
              </label>
              <input
                type="text"
                value={form.minEducation}
                onChange={(e) =>
                  setForm({ ...form, minEducation: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Deskripsi Pekerjaan & Tanggung Jawab *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Jelaskan peran kerja, sasaran objektif, dan tanggung jawab utama posisi ini..."
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Requirements */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  2. Must-Have Requirements (Kualifikasi Wajib)
                </h2>
                <p className="text-xs text-slate-500">
                  Kandidat yang tidak memenuhi salah satu syarat ini <b>tidak akan pernah</b> lolos shortlist AI.
                </p>
              </div>
              <button
                type="button"
                onClick={addMustHave}
                className="flex items-center space-x-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah Syarat</span>
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {mustHaves.map((req, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-400 w-4">
                    {idx + 1}.
                  </span>
                  <input
                    type="text"
                    required
                    value={req}
                    onChange={(e) => updateMustHave(idx, e.target.value)}
                    placeholder="Contoh: Menguasai SQL dan analisis data dengan Tableau"
                    className="flex-1 rounded-lg border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  {mustHaves.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMustHave(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Nice-To-Have Requirements (Nilai Tambah Opsional)
                </h2>
                <p className="text-xs text-slate-500">
                  Kriteria tambahan yang memberi poin ekstra namun tidak menggagalkan kandidat.
                </p>
              </div>
              <button
                type="button"
                onClick={addNiceToHave}
                className="flex items-center space-x-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah Syarat</span>
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {niceToHaves.map((req, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-400 w-4">
                    {idx + 1}.
                  </span>
                  <input
                    type="text"
                    value={req}
                    onChange={(e) => updateNiceToHave(idx, e.target.value)}
                    placeholder="Contoh: Pernah bekerja di agensi periklanan global"
                    className="flex-1 rounded-lg border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeNiceToHave(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scoring Weights */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                3. Bobot Penilaian AI (Total 100%)
              </h2>
              <p className="text-xs text-slate-500">
                Skor akhir dihitung secara matematis di server berdasarkan bobot yang Anda tetapkan.
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                totalWeight === 100
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-rose-100 text-rose-800"
              }`}
            >
              Total: {totalWeight}%
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Keahlian / Skill (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.weightSkills}
                onChange={(e) =>
                  setForm({
                    ...form,
                    weightSkills: parseInt(e.target.value) || 0,
                  })
                }
                className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Pengalaman Kerja (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.weightExperience}
                onChange={(e) =>
                  setForm({
                    ...form,
                    weightExperience: parseInt(e.target.value) || 0,
                  })
                }
                className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Pendidikan (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.weightEducation}
                onChange={(e) =>
                  setForm({
                    ...form,
                    weightEducation: parseInt(e.target.value) || 0,
                  })
                }
                className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Portofolio / Karya (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.weightPortfolio}
                onChange={(e) =>
                  setForm({
                    ...form,
                    weightPortfolio: parseInt(e.target.value) || 0,
                  })
                }
                className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Shortlist Rule & Email Routing */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-slate-900">
            4. Aturan Lolos Shortlist & Filter Email Gmail
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Metode Shortlist
              </label>
              <select
                value={form.shortlistRuleType}
                onChange={(e) =>
                  setForm({ ...form, shortlistRuleType: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm"
              >
                <option value="THRESHOLD">Ambang Batas Skor Minimal (Threshold)</option>
                <option value="TOP_N">Kandidat Terbaik (Top N)</option>
              </select>
            </div>

            {form.shortlistRuleType === "THRESHOLD" ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Skor Minimal Lolos (0 - 100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.shortlistThreshold}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      shortlistThreshold: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Jumlah Kandidat Top N
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.shortlistTopN}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      shortlistTopN: parseInt(e.target.value) || 5,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm"
                />
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Kata Kunci Filter Subjek Email * (pisahkan dengan koma)
              </label>
              <input
                type="text"
                required
                placeholder="Marketing Executive, Marketing, Digital Marketing"
                value={form.emailKeywordsText}
                onChange={(e) =>
                  setForm({ ...form, emailKeywordsText: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Jika subjek email mengandung salah satu kata kunci ini, email akan langsung dipasangkan ke posisi ini.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Label Gmail Opsional (opsional, pisahkan koma)
              </label>
              <input
                type="text"
                placeholder="Lamaran-Marketing, HR/Inbound"
                value={form.emailLabels}
                onChange={(e) =>
                  setForm({ ...form, emailLabels: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Link
            href="/positions"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center space-x-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{submitting ? "Menyimpan Posisi..." : "Simpan & Aktifkan"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
