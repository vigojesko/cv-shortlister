"use client";
import { Skeleton } from "@/components/Visuals";
import { notify } from "@/components/Toast";

import { useEffect, useState } from "react";
import {
  Mail,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  Key,
  ShieldCheck,
  Save,
  Trash2,
} from "lucide-react";

interface GmailAccount {
  id: string;
  email: string;
  isConnected: boolean;
  lastSyncAt: string | null;
  lastErrorMessage: string | null;
  syncIntervalMinutes: number;
  backfillDays: number;
}

export default function SettingsPage() {
  const [account, setAccount] = useState<GmailAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [syncInterval, setSyncInterval] = useState(15);
  const [backfillDays, setBackfillDays] = useState(14);
  const [message, setMessage] = useState<string | null>(null);

  const loadAccount = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/gmail/account");
      const data = await res.json();
      if (data.account) {
        setAccount(data.account);
        setSyncInterval(data.account.syncIntervalMinutes || 15);
        setBackfillDays(data.account.backfillDays || 14);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccount();

    const urlParams = new URLSearchParams(window.location.search);
    const successMsg = urlParams.get("success");
    const errorMsg = urlParams.get("error");
    if (successMsg) setMessage(successMsg);
    if (errorMsg) setMessage(`Error: ${errorMsg}`);
  }, []);

  const handleDisconnect = async () => {
    if (
      !confirm(
        "Apakah Anda yakin ingin memutuskan integrasi Gmail? Auto-sync akan berhenti.",
      )
    )
      return;

    try {
      const res = await fetch("/api/gmail/account", { method: "DELETE" });
      if (res.ok) {
        setAccount(null);
        notify("Akun Gmail berhasil diputuskan.");
      }
    } catch (err: any) {
      notify("Error: " + err.message);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      const res = await fetch("/api/gmail/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          syncIntervalMinutes: syncInterval,
          backfillDays: backfillDays,
        }),
      });

      if (res.ok) {
        notify("Pengaturan sinkronisasi berhasil disimpan.");
        loadAccount();
      } else {
        notify("Gagal menyimpan pengaturan.");
      }
    } catch (err: any) {
      notify("Error: " + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSyncNow = async () => {
    try {
      setSyncing(true);
      const res = await fetch("/api/gmail/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        notify(
          `Sync Berhasil!\nEmail Ditemukan: ${data.data.messagesFound}\nCV Diproses: ${data.data.processedCount}\nDilewati: ${data.data.skippedCount}`,
        );
        loadAccount();
      } else {
        notify("Gagal sync: " + (data.error || ""));
      }
    } catch (err: any) {
      notify("Error: " + err.message);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return <Skeleton />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Pengaturan Integrasi Gmail & Auto-Sync
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola koneksi OAuth 2.0 Gmail, jadwal polling cron, dan rentang
          penarikan email.
        </p>
      </div>

      {message && (
        <div className="rounded-xl border border-primary bg-primary/10 p-4 text-sm text-primary shadow-sm">
          {message}
        </div>
      )}

      {/* Gmail Connection Card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
        <div className="flex flex-col justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0 border-b border-border pb-5">
          <div className="flex items-center space-x-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Google Gmail API
              </h2>
              <p className="text-xs text-muted-foreground">
                Scope: <code className="text-foreground">gmail.readonly</code>{" "}
                (Hanya membaca email & attachment lamaran)
              </p>
            </div>
          </div>

          <div>
            {account && account.isConnected ? (
              <div className="flex items-center space-x-2">
                <span className="flex items-center space-x-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>Terhubung</span>
                </span>
                <button
                  onClick={handleDisconnect}
                  className="rounded-lg border border-border px-3 py-1 text-xs font-semibold text-muted-foreground hover:bg-rose-50 hover:text-rose-600 transition"
                >
                  Putuskan
                </button>
              </div>
            ) : (
              <a
                href="/api/gmail/connect"
                className="inline-flex items-center space-x-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary transition"
              >
                <Mail className="h-4 w-4" />
                <span>Hubungkan Gmail (OAuth 2.0)</span>
              </a>
            )}
          </div>
        </div>

        {/* Account Status Details */}
        {account ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
            <div className="rounded-lg bg-muted p-3.5 space-y-1 border border-border">
              <span className="font-semibold text-foreground">
                Akun Terhubung:
              </span>
              <p className="text-sm font-bold text-foreground">
                {account.email}
              </p>
            </div>

            <div className="rounded-lg bg-muted p-3.5 space-y-1 border border-border">
              <span className="font-semibold text-foreground">
                Sinkronisasi Terakhir:
              </span>
              <p className="text-sm font-bold text-foreground">
                {account.lastSyncAt
                  ? new Date(account.lastSyncAt).toLocaleString("id-ID")
                  : "Belum pernah berjalan"}
              </p>
            </div>

            {account.lastErrorMessage && (
              <div className="col-span-full rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                <b>Peringatan Error Terakhir:</b> {account.lastErrorMessage}
                <div className="mt-2">
                  <a
                    href="/api/gmail/connect"
                    className="inline-block rounded bg-rose-600 px-2.5 py-1 font-semibold text-white hover:bg-rose-700"
                  >
                    Hubungkan Ulang Akun Google
                  </a>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
            Belum ada akun Gmail yang dikaitkan. Klik tombol &ldquo;Hubungkan
            Gmail&rdquo; di atas untuk login melalui Google Consent Screen.
          </div>
        )}

        {/* Quick Sync Action */}
        {account && account.isConnected && (
          <div className="flex items-center justify-between border-t border-border pt-4">
            <div className="text-xs text-muted-foreground">
              Sistem berjalan otomatis di latar belakang setiap{" "}
              {account.syncIntervalMinutes} menit.
            </div>
            <button
              onClick={handleSyncNow}
              disabled={syncing}
              className="flex items-center space-x-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm hover:bg-muted disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${syncing ? "animate-spin text-primary" : ""}`}
              />
              <span>{syncing ? "Menyinkronkan..." : "Sync Sekarang"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Sync Preferences Form */}
      {account && (
        <form
          onSubmit={handleSaveSettings}
          className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4"
        >
          <h2 className="text-base font-bold text-foreground">
            Jadwal Sinkronisasi & Batasan Backfill
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-foreground">
                Interval Polling Otomatis (Menit)
              </label>
              <input
                type="number"
                min="1"
                max="1440"
                value={syncInterval}
                onChange={(e) =>
                  setSyncInterval(parseInt(e.target.value) || 15)
                }
                className="mt-1 w-full rounded-lg border border-border p-2 text-xs font-semibold"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Standar: 15 menit. Penjadwal cron akan otomatis memeriksa email
                baru.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground">
                Rentang Backfill Awal (Hari Terakhir)
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={backfillDays}
                onChange={(e) =>
                  setBackfillDays(parseInt(e.target.value) || 14)
                }
                className="mt-1 w-full rounded-lg border border-border p-2 text-xs font-semibold"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Hanya mencari email pelamar yang diterima dalam X hari terakhir.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingSettings}
              className="flex items-center space-x-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              <span>
                {savingSettings ? "Menyimpan..." : "Simpan Pengaturan"}
              </span>
            </button>
          </div>
        </form>
      )}

      {/* Security & Token Info */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-3">
        <h3 className="flex items-center space-x-2 text-sm font-bold text-foreground">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Keamanan & Enkripsi Data</span>
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Semua Google Refresh Token disimpan terenkripsi menggunakan algoritma
          standar militer <b>AES-256-GCM</b> di database lokal. Token otorisasi
          tidak pernah dikirim ke browser client atau terekspos ke luar server.
        </p>
      </div>
    </div>
  );
}
