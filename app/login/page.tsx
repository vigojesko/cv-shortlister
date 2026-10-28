"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sparkles, Lock, Mail, AlertCircle, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@cvshortlister.local");
  const [password, setPassword] = useState("AdminPassword123!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error || "Email atau password tidak sesuai.");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      setError("Terjadi kesalahan sistem saat mencoba masuk.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-xl">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-md">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
            CV Shortlister
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Masuk ke dasbor penyeleksian CV otomatis HR
          </p>
        </div>

        {error && (
          <div className="mt-6 flex items-start space-x-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider">
              Email Administrator
            </label>
            <div className="relative mt-1">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-lg border border-border py-2.5 pl-10 pr-3 text-sm text-foreground placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="nama@perusahaan.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider">
              Password
            </label>
            <div className="relative mt-1">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-lg border border-border py-2.5 pl-10 pr-3 text-sm text-foreground placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center space-x-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary disabled:opacity-50"
          >
            <span>{loading ? "Memverifikasi..." : "Masuk ke Sistem"}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-6 rounded-lg bg-muted p-3 text-xs text-muted-foreground border border-border">
          <p className="font-semibold text-foreground">Akun Demo Awal:</p>
          <p>
            Email:{" "}
            <code className="text-primary">admin@cvshortlister.local</code>
          </p>
          <p>
            Password: <code className="text-primary">AdminPassword123!</code>
          </p>
        </div>
      </div>
    </div>
  );
}
