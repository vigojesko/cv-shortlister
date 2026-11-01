"use client";
import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { FileCheck2, ArrowRight, ShieldCheck } from "lucide-react";
const errors: Record<string, string> = {
  NotInvited: "Email ini belum terdaftar sebagai penguji. Hubungi pengelola aplikasi.",
  GmailPermission: "Izinkan akses baca Gmail agar CV dapat ditarik otomatis.",
  GmailUnavailable: "Akun ini belum memiliki Gmail aktif, atau akses dibatasi admin kantor.",
  Reconnect: "Hubungkan ulang akun Google dan setujui izin Gmail.",
};
export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { const code = new URLSearchParams(window.location.search).get("error"); if (code) setError(errors[code] || "Belum berhasil masuk. Coba lagi atau hubungi pengelola aplikasi."); }, []);
  return <main className="flex min-h-[80vh] items-center justify-center px-4"><section className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-xl">
    <FileCheck2 className="h-10 w-10 text-primary" aria-hidden="true" />
    <h1 className="mt-5 text-3xl font-bold">Rekrutmen lebih ringan.</h1>
    <p className="mt-3 text-muted-foreground">Masuk dengan akun Gmail atau Google Workspace kantor. Hubungkan inbox sekali, lalu CV masuk dan dinilai otomatis sesuai posisi Anda.</p>
    {error && <p role="alert" className="mt-5 rounded-lg border border-red-400 p-3 text-sm">{error}</p>}
    <button className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-50" disabled={loading} onClick={async () => { setLoading(true); try { await signIn("google", { callbackUrl: "/" }); } catch { setError("Koneksi gagal. Silakan coba lagi."); setLoading(false); } }}>
      {loading ? "Membuka Google…" : "Masuk dengan Google"}<ArrowRight size={18} />
    </button>
    <p className="mt-5 flex gap-2 text-xs text-muted-foreground"><ShieldCheck className="shrink-0" size={16} />Password tetap di Google. Aplikasi meminta izin baca Gmail untuk memproses lampiran CV. Data akun Anda terpisah dari pengguna lain.</p>
    <p className="mt-4 text-xs text-muted-foreground">Setelah masuk, buat posisi pertama untuk memulai screening. Email kantor berbasis Outlook belum didukung.</p>
  </section></main>;
}
