import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatScore(score: number): string {
  return Math.round(score * 10) / 10 + "";
}

export function getStatusBadge(status: string) {
  switch (status) {
    case "SHORTLIST":
      return {
        label: "Lolos Shortlist",
        bg: "bg-emerald-100 text-emerald-800 border-emerald-300",
        badge: "bg-emerald-500",
      };
    case "MAYBE":
      return {
        label: "Dipertimbangkan",
        bg: "bg-amber-100 text-amber-800 border-amber-300",
        badge: "bg-amber-500",
      };
    case "REJECT":
      return {
        label: "Tidak Memenuhi",
        bg: "bg-rose-100 text-rose-800 border-rose-300",
        badge: "bg-rose-500",
      };
    case "NEEDS_HR_REVIEW":
      return {
        label: "Perlu Dicek HR",
        bg: "bg-purple-100 text-purple-800 border-purple-300",
        badge: "bg-purple-500",
      };
    default:
      return {
        label: status,
        bg: "bg-slate-100 text-slate-800 border-slate-300",
        badge: "bg-slate-500",
      };
  }
}

export function getAspectBadge(aspect: string) {
  switch (aspect) {
    case "skills":
      return { label: "Keahlian Teknis", color: "bg-blue-50 text-blue-700 border-blue-200" };
    case "experience":
      return { label: "Pengalaman Kerja", color: "bg-indigo-50 text-indigo-700 border-indigo-200" };
    case "education":
      return { label: "Latar Pendidikan", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    case "portfolio":
      return { label: "Portofolio & Karya", color: "bg-amber-50 text-amber-700 border-amber-200" };
    default:
      return { label: aspect, color: "bg-slate-50 text-slate-700 border-slate-200" };
  }
}
