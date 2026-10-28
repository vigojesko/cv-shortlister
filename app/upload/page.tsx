"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
} from "lucide-react";
type Item = {
  key: string;
  file: File;
  progress: number;
  state: "ready" | "uploading" | "processing" | "done" | "error";
  error?: string;
  id?: string;
};
export default function ManualUploadPage() {
  const [positions, setPositions] = useState<{ id: string; title: string }[]>(
      [],
    ),
    [position, setPosition] = useState(""),
    [items, setItems] = useState<Item[]>([]),
    [busy, setBusy] = useState(false),
    [drag, setDrag] = useState(false),
    [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null),
    requests = useRef<XMLHttpRequest[]>([]),
    active = useRef(true);
  const load = () =>
    fetch("/api/positions")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => {
        setPositions(d.positions || []);
        setError("");
      })
      .catch(() => setError("Daftar posisi belum bisa dimuat. Coba lagi, ya."));
  useEffect(() => {
    active.current = true;
    const pending = requests.current;
    load();
    return () => {
      active.current = false;
      pending.forEach((x) => x.abort());
    };
  }, []);
  const add = (files: FileList) => {
    const next = Array.from(files).map((file, i): Item => {
      const valid =
        /\.(pdf|docx)$/i.test(file.name) && file.size <= 10 * 1024 * 1024;
      return {
        key: Date.now() + "-" + i + "-" + file.name,
        file,
        progress: 0,
        state: valid ? "ready" : "error",
        error: valid ? undefined : "Gunakan PDF/DOCX maksimal 10 MB.",
      };
    });
    setItems((old) => [...old, ...next]);
  };
  const patch = (key: string, p: Partial<Item>) =>
    setItems((old) => old.map((i) => (i.key === key ? { ...i, ...p } : i)));
  const upload = (item: Item) =>
    new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest();
      requests.current.push(xhr);
      xhr.open("POST", "/api/upload");
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable)
          patch(item.key, { progress: Math.round((e.loaded / e.total) * 100) });
      };
      xhr.upload.onload = () =>
        patch(item.key, { state: "processing", progress: 100 });
      xhr.onload = () => {
        try {
          const d = JSON.parse(xhr.responseText);
          if (xhr.status < 200 || xhr.status >= 300)
            throw new Error(d.error || "CV belum berhasil diproses.");
          patch(item.key, { state: "done", id: d.candidate.id });
        } catch (e) {
          patch(item.key, {
            state: "error",
            error:
              e instanceof Error ? e.message : "CV belum berhasil diproses.",
          });
        }
        resolve();
      };
      xhr.onerror = () => {
        patch(item.key, {
          state: "error",
          error: "Koneksi terputus. Silakan coba lagi.",
        });
        resolve();
      };
      xhr.onabort = () => resolve();
      const body = new FormData();
      body.append("file", item.file);
      if (position) body.append("positionId", position);
      patch(item.key, { state: "uploading", progress: 0 });
      xhr.send(body);
    });
  const run = async () => {
    setBusy(true);
    for (const i of items.filter((i) => i.state === "ready")) {
      if (!active.current) break;
      await upload(i);
    }
    if (active.current) setBusy(false);
  };
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="mb-2 text-xs uppercase tracking-[.18em] text-primary">
          Lamaran baru, kesempatan baru
        </p>
        <h1 className="text-3xl font-semibold">Temukan potensi di setiap CV</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Tarik dokumen ke sini. Kami bantu membaca dan menilainya untukmu.
        </p>
      </div>
      {error && (
        <div role="alert" className="panel text-sm">
          {error}
          <button onClick={load} className="ml-3 underline">
            Coba lagi
          </button>
        </div>
      )}
      <section className="panel space-y-5">
        <label className="block text-sm font-semibold">
          Posisi tujuan
          <select
            disabled={busy}
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="mt-2 block w-full rounded-lg border p-3 text-sm font-normal"
          >
            <option value="">Tentukan otomatis</option>
            {positions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!busy) setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            if (!busy) add(e.dataTransfer.files);
          }}
          className={`rounded-xl border-2 border-dashed px-5 py-12 text-center transition-colors ${drag ? "border-primary bg-accent" : "border-border bg-muted/40"}`}
        >
          <UploadCloud
            size={42}
            strokeWidth={1.3}
            className="mx-auto mb-5 text-primary"
          />
          <h2 className="text-lg font-semibold">Tarik CV ke sini</h2>
          <p className="my-2 text-sm text-muted-foreground">
            PDF atau DOCX · maksimal 10 MB per berkas
          </p>
          <button
            disabled={busy}
            onClick={() => input.current?.click()}
            className="button-secondary mt-4"
          >
            Pilih berkas
          </button>
          <input
            ref={input}
            type="file"
            multiple
            accept=".pdf,.docx"
            className="sr-only"
            tabIndex={-1}
            aria-label="Pilih berkas CV"
            disabled={busy}
            onChange={(e) => {
              if (e.target.files) add(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
        <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
          <span>Membaca CV</span>
          <span>→</span>
          <span>Menilai</span>
          <span>→</span>
          <span>Selesai</span>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Pembacaan dan penilaian berlangsung di server setelah unggahan
          selesai.
        </p>
      </section>
      <div className="space-y-3" aria-live="polite">
        {items.map((i) => (
          <div key={i.key} className="panel">
            <div className="flex items-center gap-3">
              <FileText size={22} className="shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{i.file.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {i.state === "ready"
                    ? "Siap diunggah"
                    : i.state === "uploading"
                      ? `Mengunggah · ${i.progress}%`
                      : i.state === "processing"
                        ? "Membaca CV & menilai…"
                        : i.state === "done"
                          ? "Selesai, kandidat siap ditinjau"
                          : i.error}
                </p>
              </div>
              {i.state === "done" ? (
                <CheckCircle2 size={20} className="text-shortlist" />
              ) : i.state === "processing" ? (
                <Loader2 size={20} className="animate-spin text-primary" />
              ) : i.state === "error" ? (
                <AlertCircle size={20} className="text-reject" />
              ) : null}
              {!busy && (
                <button
                  aria-label={"Hapus berkas " + i.file.name}
                  onClick={() =>
                    setItems((old) => old.filter((x) => x.key !== i.key))
                  }
                >
                  <X size={17} />
                </button>
              )}
            </div>
            {i.state === "uploading" && (
              <progress
                aria-label={"Progres unggahan " + i.file.name}
                value={i.progress}
                max={100}
                className="mt-3 h-1.5 w-full accent-primary"
              />
            )}
            {i.id && (
              <Link
                className="mt-3 inline-block text-xs font-semibold text-primary"
                href={"/candidates/" + i.id}
              >
                Tinjau kandidat →
              </Link>
            )}
            {i.state === "error" &&
              !busy &&
              /\.(pdf|docx)$/i.test(i.file.name) &&
              i.file.size <= 10 * 1024 * 1024 && (
                <button
                  className="mt-3 text-xs text-primary"
                  onClick={() =>
                    patch(i.key, { state: "ready", error: undefined })
                  }
                >
                  Coba lagi
                </button>
              )}
          </div>
        ))}
      </div>
      <button
        disabled={busy || !items.some((i) => i.state === "ready")}
        onClick={run}
        className="button-primary w-full py-3"
      >
        {busy
          ? "Sedang memproses…"
          : `Mulai menilai${items.some((i) => i.state === "ready") ? " · " + items.filter((i) => i.state === "ready").length + " CV" : ""}`}
      </button>
    </div>
  );
}
