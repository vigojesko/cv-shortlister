"use client";

import { Toast } from "./Toast";
import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toast />
    </SessionProvider>
  );
}
