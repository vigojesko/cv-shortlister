import type { Metadata } from "next";
import "./globals.css";
import localFont from "next/font/local";
const display = localFont({
  src: "../public/fonts/jakarta.ttf",
  variable: "--font-display",
  display: "swap",
});
const ui = localFont({
  src: "../public/fonts/dm.ttf",
  variable: "--font-ui",
  display: "swap",
});
import { Providers } from "@/components/Providers";
import { PageMotion } from "@/components/Motion";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  title: "CV Shortlister - Penyaring CV Otomatis Berbasis AI",
  icons: { icon: "/favicon.svg", apple: "/apple-touch-icon.png" },
  openGraph: {
    title: "CV Shortlister",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  description:
    "Tool otomatis untuk tim HR menyaring CV pelamar dari Gmail menggunakan AI Gemini.",
};

export default function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{const t=localStorage.getItem("cv-theme");document.documentElement.classList.toggle("dark",t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))}catch{}`,
          }}
        />
      </head>
      <body
        className={`${display.variable} ${ui.variable} min-h-screen bg-background text-foreground antialiased`}
      >
        <Providers>
          <Navbar />
          <main id="main-content" className="workspace-main">
            <PageMotion>{children}</PageMotion>
          </main>
          {modal}
        </Providers>
      </body>
    </html>
  );
}
