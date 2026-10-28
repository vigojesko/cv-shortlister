"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";

interface Position {
  id: string;
  title: string;
  department: string | null;
}

export default function ManualUploadPage() {
  const router = useRouter();
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedPositionId, setSelectedPositionId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/positions")
      .then((res) => res.json())
      .then((data) => {
        const list: Position[] = data.positions || [];
        setPositions(list);
        if (list.length > 0) setSelectedPositionId(list[0].id);
      })
      .catch(console.error);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      const lower = selected.name.toLowerCase();
      if (!lower.endsWith(".pdf") && !lower.endsWith(".docx")) {
        setError("Format file tidak didukung. Harap pilih file PDF atau DOCX.");
        setFile(null);
        return;
      }
      if (selected.size > 10 * 1024 * 1024) {
        setError("Ukuran file melebihi 10 MB.");
        setFile(null);
        return;
      }
      setError(null);
      setFile(selected);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Silakan pilih berkas CV terlebih dahulu.");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("file", file);
    if (selectedPositionId) {
      formData.append("positionId", selectedPositionId);
    }

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memproses berkas CV.");
      }

      setSuccess("CV berhasil dievaluasi oleh Gemini AI! Mengalihkan ke halaman detail...");
      setTimeout(() => {
        router.push(`/candidates/${data.candidate.id}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Unggah Berkas CV Manual
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Opsi cadangan: Masukkan berkas CV (PDF atau DOCX) langsung ke dalam pipeline screening AI yang sama tanpa melalui Gmail.
        </p>
      </div>

      {error && (
        <div className="flex items-center space-x-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center space-x-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleUpload} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-700">
            Pilih Posisi Target Pelamar
          </label>
          <select
            value={selectedPositionId}
            onChange={(e) => setSelectedPositionId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs font-medium"
          >
            {positions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} {p.department ? `(${p.department})` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* File Dropzone Area */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Berkas CV (PDF atau DOCX, Maks. 10 MB)
          </label>
          <div className="flex justify-center rounded-xl border-2 border-dashed border-slate-300 px-6 pt-6 pb-6 hover:border-blue-500 transition">
            <div className="space-y-2 text-center">
              <UploadCloud className="mx-auto h-12 w-12 text-slate-400" />
              <div className="flex text-xs text-slate-600 justify-center">
                <label className="relative cursor-pointer rounded-md font-semibold text-blue-600 hover:text-blue-500">
                  <span>Pilih file dari komputer</span>
                  <input
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </label>
              </div>
              <p className="text-[11px] text-slate-400">
                PDF atau Word DOCX (Maksimal 10 MB)
              </p>
              {file && (
                <div className="mt-2 inline-flex items-center space-x-1.5 rounded-lg bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  <FileText className="h-3.5 w-3.5" />
                  <span>{file.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={uploading || !file}
          className="flex w-full items-center justify-center space-x-2 rounded-lg bg-blue-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition"
        >
          <Sparkles className={`h-4 w-4 ${uploading ? "animate-spin" : ""}`} />
          <span>
            {uploading ? "Gemini AI Sedang Mengevaluasi CV..." : "Mulai Screening AI"}
          </span>
        </button>
      </form>
    </div>
  );
}
