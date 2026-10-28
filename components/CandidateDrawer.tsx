"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
export function CandidateDrawer({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null),
    router = useRouter();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    ref.current?.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = old;
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="candidate-drawer"
      aria-label="Profil kandidat"
      onCancel={(e) => {
        e.preventDefault();
        router.back();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) router.back();
      }}
    >
      <div className="min-h-full bg-background p-4 sm:p-7">
        <div className="sticky top-0 z-30 mb-5 flex justify-end">
          <button
            autoFocus
            className="button-secondary"
            onClick={() => router.back()}
          >
            <X size={16} />
            Tutup profil{" "}
            <kbd className="text-xs text-muted-foreground">Esc</kbd>
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
