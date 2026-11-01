"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import {
  Briefcase,
  Users,
  Settings,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  GitCompare,
  UploadCloud,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Menu,
  X,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
const links = [
  { href: "/", label: "Ringkasan", icon: LayoutDashboard },
  { href: "/candidates", label: "Kandidat", icon: Users },
  { href: "/positions", label: "Posisi", icon: Briefcase },
  { href: "/compare", label: "Bandingkan", icon: GitCompare },
  { href: "/upload", label: "Unggah", icon: UploadCloud },
  { href: "/settings", label: "Pengaturan", icon: Settings },
];
export function Navbar() {
  const pathname = usePathname(),
    router = useRouter();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false),
    [mobile, setMobile] = useState(false),
    [query, setQuery] = useState(""),
    [results, setResults] = useState<{ id: string; name: string }[]>([]),
    [syncing, setSyncing] = useState(false),
    [message, setMessage] = useState("");
  const dialog = useRef<HTMLDialogElement>(null),
    search = useRef<HTMLInputElement>(null);
  const open = () => {
    dialog.current?.showModal();
    setTimeout(() => search.current?.focus(), 0);
  };
  const close = () => dialog.current?.close();
  useEffect(() => {
    try {
      const c = localStorage.getItem("cv-sidebar") === "collapsed";
      setCollapsed(c);
      document.documentElement.dataset.sidebar = c ? "collapsed" : "expanded";
    } catch {}
  }, []);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (dialog.current?.open) close();
        else open();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  useEffect(() => {
    setMobile(false);
    close();
  }, [pathname]);
  useEffect(() => {
    const controller = new AbortController();
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(
      () =>
        fetch("/api/candidates?search=" + encodeURIComponent(query), {
          signal: controller.signal,
        })
          .then((r) => (r.ok ? r.json() : Promise.reject()))
          .then((d) => setResults(d.candidates?.slice(0, 6) || []))
          .catch(() => setResults([])),
      250,
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);
  const sync = async () => {
    close();
    setSyncing(true);
    setMessage("");
    try {
      const r = await fetch("/api/gmail/sync", { method: "POST" });
      const d = await r.json();
      if (!r.ok) throw new Error();
      setMessage(
        d.message || "Sinkronisasi diminta. Cek hasilnya di Pengaturan.",
      );
      window.dispatchEvent(new Event("cv:synced"));
    } catch {
      setMessage(
        "Sinkronisasi belum berhasil. Cek koneksi Gmail di Pengaturan.",
      );
    } finally {
      setSyncing(false);
    }
  };
  useEffect(() => {
    if (!mobile) return;
    const previous = document.activeElement as HTMLElement;
    const aside = document.querySelector<HTMLElement>(".sidebar");
    const nodes = () =>
      Array.from(
        aside?.querySelectorAll<HTMLElement>("a,button:not(:disabled)") || [],
      ).filter((el) => el.offsetParent !== null);
    nodes()[0]?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobile(false);
        return;
      }
      if (e.key === "Tab") {
        const all = nodes();
        if (!all.length) return;
        if (e.shiftKey && document.activeElement === all[0]) {
          e.preventDefault();
          all[all.length - 1].focus();
        } else if (
          !e.shiftKey &&
          document.activeElement === all[all.length - 1]
        ) {
          e.preventDefault();
          all[0].focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [mobile]);
  if (pathname === "/login") return null;
  const current = links.find((l) =>
    l.href === "/" ? pathname === "/" : pathname.startsWith(l.href),
  );
  return (
    <>
      <a className="skip-link" href="#main-content">
        Langsung ke konten
      </a>
      {mobile && (
        <button
          aria-label="Tutup navigasi"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobile(false)}
        />
      )}
      <aside
        className={`sidebar ${collapsed ? "is-collapsed" : ""} ${mobile ? "is-mobile-open" : ""}`}
        aria-label="Navigasi utama"
      >
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-5 font-display font-bold"
        >
          <svg
            aria-hidden="true"
            width="34"
            height="34"
            className="shrink-0"
            viewBox="0 0 34 34"
          >
            <rect
              x="6"
              y="3"
              width="21"
              height="27"
              rx="5"
              fill="currentColor"
              className="text-primary"
            />
            <path
              d="M12 10h9M12 15h5m-2 8 4 4 10-11"
              stroke="hsl(var(--background))"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
          <span className="nav-label whitespace-nowrap">CV Shortlister</span>
        </Link>
        <button
          onClick={open}
          title="Cari · Ctrl / Cmd K"
          className="nav-item mb-6 border"
        >
          <Search size={18} />
          <span className="nav-label">
            Cari apa saja <kbd className="ml-2 text-xs">⌘ K</kbd>
          </span>
        </button>
        <nav className="space-y-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              title={label}
              aria-current={
                (href === "/" ? pathname === "/" : pathname.startsWith(href))
                  ? "page"
                  : undefined
              }
              className="nav-item"
            >
              <Icon size={19} />
              <span className="nav-label">{label}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-2 border-t pt-4">
          <button
            onClick={sync}
            disabled={syncing}
            className="nav-item w-full"
            title="Sync sekarang"
          >
            <RefreshCw size={18} className={syncing ? "animate-spin" : ""} />
            <span className="nav-label">
              {syncing ? "Menyinkronkan…" : "Sync sekarang"}
            </span>
          </button>
          <div className="flex flex-wrap items-center justify-between">
            <ThemeToggle />
            <button
              className="hidden rounded-lg p-2 md:block"
              aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
              onClick={() => {
                setCollapsed(!collapsed);
                document.documentElement.dataset.sidebar = !collapsed
                  ? "collapsed"
                  : "expanded";
                try {
                  localStorage.setItem(
                    "cv-sidebar",
                    !collapsed ? "collapsed" : "expanded",
                  );
                } catch {}
              }}
            >
              {collapsed ? (
                <PanelLeftOpen size={18} />
              ) : (
                <PanelLeftClose size={18} />
              )}
            </button>
            {session && (
              <button
                aria-label="Keluar"
                title="Keluar"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="p-2"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
          <p className="nav-label truncate px-3 text-xs text-muted-foreground">
            {session?.user?.name || session?.user?.email || "Ruang rekrutmen"}
          </p>
        </div>
      </aside>
      <header className="workspace-header">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden"
            aria-label="Buka navigasi"
            onClick={() => setMobile(true)}
          >
            <Menu size={21} />
          </button>
          <Link href="/" className="text-muted-foreground">
            Ruang kerja
          </Link>
          <span className="text-muted-foreground">/</span>
          <span>
            {current?.label || "Kandidat"}
            {pathname.split("/").filter(Boolean).length > 1 ? " / Detail" : ""}
          </span>
        </div>
        <Link href="/upload" className="button-primary">
          <UploadCloud size={16} /> Unggah CV
        </Link>
      </header>
      {message && (
        <div role="status" className="toast">
          {message}
          <button
            aria-label="Tutup pemberitahuan"
            onClick={() => setMessage("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      <dialog
        ref={dialog}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            const buttons = Array.from(
              dialog.current?.querySelectorAll<HTMLButtonElement>(
                ".nav-item:not(:disabled)",
              ) || [],
            );
            if (!buttons.length) return;
            e.preventDefault();
            const i = buttons.indexOf(
              document.activeElement as HTMLButtonElement,
            );
            buttons[
              (i + (e.key === "ArrowDown" ? 1 : -1) + buttons.length) %
                buttons.length
            ]?.focus();
          } else if (
            e.key === "Enter" &&
            document.activeElement === search.current
          ) {
            const first = dialog.current?.querySelector<HTMLButtonElement>(
              ".nav-item:not(:disabled)",
            );
            if (first) {
              e.preventDefault();
              first.click();
            }
          }
        }}
        aria-label="Cari dan buka halaman"
        className="command-dialog"
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className="p-5">
          <div className="flex items-center gap-3">
            <Search size={20} />
            <input
              ref={search}
              aria-label="Cari kandidat atau halaman"
              placeholder="Cari kandidat atau halaman…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-w-0 flex-1 border-0 bg-transparent p-2"
            />
            <button onClick={close} aria-label="Tutup pencarian">
              <X size={18} />
            </button>
          </div>
          <p className="my-3 text-xs text-muted-foreground">
            HALAMAN & TINDAKAN · Tab untuk memilih, Enter untuk membuka
          </p>
          <div className="space-y-1">
            {links
              .filter((l) =>
                l.label.toLowerCase().includes(query.toLowerCase()),
              )
              .map(({ href, label, icon: Icon }) => (
                <button
                  key={href}
                  className="nav-item w-full"
                  onClick={() => {
                    close();
                    router.push(href);
                  }}
                >
                  <Icon size={17} />
                  {label}
                </button>
              ))}
            {!query && (
              <button
                disabled={syncing}
                className="nav-item w-full"
                onClick={sync}
              >
                <RefreshCw size={17} />
                Sync sekarang
              </button>
            )}
            {results.map((c) => (
              <button
                key={c.id}
                className="nav-item w-full"
                onClick={() => {
                  close();
                  router.push("/candidates/" + c.id);
                }}
              >
                <Users size={17} />
                {c.name}
              </button>
            ))}
            {query && results.length === 0 && (
              <p className="p-3 text-sm text-muted-foreground">
                Belum ada kandidat yang cocok.
              </p>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
