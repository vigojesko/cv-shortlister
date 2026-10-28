"use client";
import { AlertCircle } from "lucide-react";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div role="alert" className="panel">
      <AlertCircle className="mb-4 text-review" />
      <h1 className="text-xl font-semibold">Ada yang belum berjalan lancar</h1>
      <p className="my-3 text-sm text-muted-foreground">
        Coba muat ulang halaman ini. Perubahan yang belum disimpan mungkin perlu
        diisi kembali.
      </p>
      <button onClick={reset} className="button-primary">
        Coba lagi
      </button>
    </div>
  );
}
