"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WeightEditor } from "./WeightEditor";
import { Skeleton } from "./Visuals";
import Link from "next/link";
import { ArrowLeft, Save, Plus, Trash2, HelpCircle } from "lucide-react";

export default function PositionForm({ editId }: { editId?: string }) {
  const [loaded, setLoaded] = useState(!editId);
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

  useEffect(() => {
    if (!editId) return;
    let active = true;
    fetch("/api/positions/" + editId)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(({ position: p }) => {
        if (!active) return;
        setForm((prev) => ({
          ...prev,
          ...Object.fromEntries(
            Object.keys(prev)
              .filter((k) => p[k] !== undefined && p[k] !== null)
              .map((k) => [k, p[k]]),
          ),
          emailKeywordsText: p.emailKeywords.join(", "),
        }));
        setMustHaves(p.mustHaveRequirements);
        setNiceToHaves(p.niceToHaveRequirements);
        setLoaded(true);
      })
      .catch(() => {
        if (active)
          setError(
            "Posisi belum bisa dimuat. Muat ulang halaman untuk mencoba lagi.",
          );
      });
    return () => {
      active = false;
    };
  }, [editId]);

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
      setError(
        `Total bobot penilaian harus tepat 100% (saat ini ${totalWeight}%).`,
      );
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
      setError(
        "Wajib menambahkan minimal 1 kata kunci subjek email untuk routing.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(
        editId ? `/api/positions/${editId}` : "/api/positions",
        {
          method: editId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            mustHaveRequirements: cleanMustHaves,
            niceToHaveRequirements: niceToHaves
              .map((n) => n.trim())
              .filter(Boolean),
            emailKeywords: keywords,
          }),
        },
      );

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

  if (!loaded)
    return error ? (
      <div role="alert" className="panel">
        {error}
        <button
          type="button"
          className="button-secondary ml-3"
          onClick={() => window.location.reload()}
        >
          Coba lagi
        </button>
      </div>
    ) : (
      <Skeleton />
    );
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center space-x-3">
        <Link
          href="/positions"
          className="rounded-lg border border-border bg-card p-2 text-muted-foreground hover:bg-muted shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {editId ? "Sesuaikan posisi" : "Buka kesempatan baru"}
          </h1>
          <p className="text-xs text-muted-foreground">
            Kriteria penilaian ini akan digunakan AI untuk otomatis menyaring
            pelamar dari Gmail.
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
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-foreground">
            1. Informasi Dasar Pekerjaan
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-foreground">
                Judul Posisi *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Marketing Executive"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border p-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground">
                Departemen / Divisi
              </label>
              <input
                type="text"
                placeholder="Contoh: Marketing & Growth"
                value={form.department}
                onChange={(e) =>
                  setForm({ ...form, department: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-border p-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-foreground">
                Lokasi Kerja
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border p-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground">
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
                className="mt-1 w-full rounded-lg border border-border p-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground">
                Pendidikan Minimum
              </label>
              <input
                type="text"
                value={form.minEducation}
                onChange={(e) =>
                  setForm({ ...form, minEducation: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-border p-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground">
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
              className="mt-1 w-full rounded-lg border border-border p-2.5 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Requirements */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  2. Must-Have Requirements (Kualifikasi Wajib)
                </h2>
                <p className="text-xs text-muted-foreground">
                  Kandidat yang tidak memenuhi salah satu syarat ini{" "}
                  <b>tidak akan pernah</b> lolos shortlist AI.
                </p>
              </div>
              <button
                type="button"
                onClick={addMustHave}
                className="flex items-center space-x-1 rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah Syarat</span>
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {mustHaves.map((req, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-full border bg-muted px-3 py-1"
                >
                  <span className="text-xs font-bold text-muted-foreground w-4">
                    {idx + 1}.
                  </span>
                  <input
                    type="text"
                    required
                    aria-label={`Syarat wajib ${idx + 1}`}
                    value={req}
                    onChange={(e) => updateMustHave(idx, e.target.value)}
                    placeholder="Contoh: Menguasai SQL dan analisis data dengan Tableau"
                    className="flex-1 rounded-lg border border-border p-2 text-sm focus:border-primary focus:outline-none"
                  />
                  {mustHaves.length > 1 && (
                    <button
                      type="button"
                      aria-label={`Hapus syarat wajib ${idx + 1}`}
                      onClick={() => removeMustHave(idx)}
                      className="p-1.5 text-muted-foreground hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border pt-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Nice-To-Have Requirements (Nilai Tambah Opsional)
                </h2>
                <p className="text-xs text-muted-foreground">
                  Kriteria tambahan yang memberi poin ekstra namun tidak
                  menggagalkan kandidat.
                </p>
              </div>
              <button
                type="button"
                onClick={addNiceToHave}
                className="flex items-center space-x-1 rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah Syarat</span>
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {niceToHaves.map((req, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-full border bg-muted px-3 py-1"
                >
                  <span className="text-xs font-bold text-muted-foreground w-4">
                    {idx + 1}.
                  </span>
                  <input
                    type="text"
                    aria-label={`Syarat wajib ${idx + 1}`}
                    value={req}
                    onChange={(e) => updateNiceToHave(idx, e.target.value)}
                    placeholder="Contoh: Pernah bekerja di agensi periklanan global"
                    className="flex-1 rounded-lg border border-border p-2 text-sm focus:border-primary focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeNiceToHave(idx)}
                    className="p-1.5 text-muted-foreground hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scoring Weights */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                3. Bobot Penilaian AI (Total 100%)
              </h2>
              <p className="text-xs text-muted-foreground">
                Skor akhir dihitung secara matematis di server berdasarkan bobot
                yang Anda tetapkan.
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

          <WeightEditor
            values={[
              form.weightSkills,
              form.weightExperience,
              form.weightEducation,
              form.weightPortfolio,
            ]}
            onChange={(v) =>
              setForm({
                ...form,
                weightSkills: v[0],
                weightExperience: v[1],
                weightEducation: v[2],
                weightPortfolio: v[3],
              })
            }
          />
        </div>

        {/* Shortlist Rule & Email Routing */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-foreground">
            4. Aturan Lolos Shortlist & Filter Email Gmail
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-foreground">
                Metode Shortlist
              </label>
              <select
                value={form.shortlistRuleType}
                onChange={(e) =>
                  setForm({ ...form, shortlistRuleType: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-border p-2 text-sm"
              >
                <option value="THRESHOLD">
                  Ambang Batas Skor Minimal (Threshold)
                </option>
                <option value="TOP_N">Kandidat Terbaik (Top N)</option>
              </select>
            </div>

            {form.shortlistRuleType === "THRESHOLD" ? (
              <div>
                <label className="block text-xs font-semibold text-foreground">
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
                  className="mt-1 w-full rounded-lg border border-border p-2 text-sm"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-foreground">
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
                  className="mt-1 w-full rounded-lg border border-border p-2 text-sm"
                />
              </div>
            )}
          </div>

          <div className="border-t border-border pt-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-foreground">
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
                className="mt-1 w-full rounded-lg border border-border p-2 text-sm"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Jika subjek email mengandung salah satu kata kunci ini, email
                akan langsung dipasangkan ke posisi ini.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground">
                Label Gmail Opsional (opsional, pisahkan koma)
              </label>
              <input
                type="text"
                placeholder="Lamaran-Marketing, HR/Inbound"
                value={form.emailLabels}
                onChange={(e) =>
                  setForm({ ...form, emailLabels: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-border p-2 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Link
            href="/positions"
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm hover:bg-muted"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center space-x-2 rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>
              {submitting ? "Menyimpan Posisi..." : "Simpan & Aktifkan"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
