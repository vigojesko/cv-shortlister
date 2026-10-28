"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import {
  Briefcase,
  Users,
  Settings,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  Sparkles,
  GitCompare,
  UploadCloud,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  if (pathname === "/login") return null;

  const handleSyncNow = async () => {
    try {
      setSyncing(true);
      setSyncMessage(null);
      const res = await fetch("/api/gmail/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSyncMessage(`Sync selesai: ${data.data?.processedCount || 0} CV baru`);
        setTimeout(() => {
          setSyncMessage(null);
          window.location.reload();
        }, 1500);
      } else {
        alert(data.error || "Gagal melakukan sync.");
      }
    } catch (err: any) {
      alert("Terjadi kesalahan saat sync: " + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const navLinks = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/positions", label: "Posisi Pekerjaan", icon: Briefcase },
    { href: "/candidates", label: "Kandidat", icon: Users },
    { href: "/compare", label: "Bandingkan", icon: GitCompare },
    { href: "/upload", label: "Unggah Manual", icon: UploadCloud },
    { href: "/settings", label: "Pengaturan & Gmail", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              CV Shortlister
            </span>
          </Link>

          <nav className="hidden md:flex md:space-x-1 lg:space-x-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleSyncNow}
            disabled={syncing}
            className="flex items-center space-x-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            title="Tarik email dan proses CV sekarang secara manual"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin text-blue-600" : ""}`} />
            <span>{syncing ? "Menyinkronkan..." : "Sync Sekarang"}</span>
          </button>

          {syncMessage && (
            <span className="hidden text-xs text-emerald-600 font-medium sm:inline">
              {syncMessage}
            </span>
          )}

          {session?.user && (
            <div className="flex items-center space-x-2 border-l border-slate-200 pl-3">
              <span className="hidden text-xs text-slate-600 lg:inline">
                {session.user.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center space-x-1 rounded-md p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
                title="Keluar"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
