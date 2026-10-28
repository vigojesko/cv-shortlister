"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
export function notify(message: string) {
  window.dispatchEvent(new CustomEvent("cv:notice", { detail: message }));
}
export function Toast() {
  const [message, setMessage] = useState("");
  useEffect(() => {
    const listener = (e: Event) =>
      setMessage((e as CustomEvent<string>).detail);
    window.addEventListener("cv:notice", listener);
    return () => window.removeEventListener("cv:notice", listener);
  }, []);
  return message ? (
    <div role="status" className="toast">
      {message}
      <button aria-label="Tutup pemberitahuan" onClick={() => setMessage("")}>
        <X size={16} />
      </button>
    </div>
  ) : null;
}
