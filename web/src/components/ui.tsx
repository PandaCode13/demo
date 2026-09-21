"use client";

import { useState, type ReactNode } from "react";
import { LIBELLES_STATUT, LIBELLES_TYPE, LIBELLES_ROLE } from "@/lib/format";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">{children}</h2>;
}

export function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled,
  className = "",
  title,
}: {
  children: ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "danger" | "ghost";
  disabled?: boolean;
  className?: string;
  title?: string;
}) {
  const styles: Record<string, string> = {
    primary:
      "bg-slate-900 text-white hover:bg-slate-700 disabled:bg-slate-300",
    secondary:
      "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:text-slate-300",
    danger: "bg-red-600 text-white hover:bg-red-500 disabled:bg-red-300",
    ghost: "text-slate-600 hover:bg-slate-100",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Input({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none ${className}`}
    />
  );
}

export function Select({
  className = "",
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none ${className}`}
    />
  );
}

export function Textarea({
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none ${className}`}
    />
  );
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
      {children}
    </label>
  );
}

export function StatutBadge({ statut }: { statut: string }) {
  const map: Record<string, string> = {
    en_cours: "bg-blue-100 text-blue-700",
    reussie: "bg-emerald-100 text-emerald-700",
    partielle: "bg-amber-100 text-amber-700",
    echouee: "bg-red-100 text-red-700",
    annulee: "bg-slate-200 text-slate-600",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${map[statut] ?? "bg-slate-100 text-slate-600"}`}>
      {LIBELLES_STATUT[statut] ?? statut}
    </span>
  );
}

export function TypeBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    poste_de_travail: "bg-sky-100 text-sky-700",
    portable: "bg-violet-100 text-violet-700",
    serveur: "bg-indigo-100 text-indigo-700",
    imprimante: "bg-teal-100 text-teal-700",
    autre: "bg-slate-200 text-slate-600",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${map[type] ?? "bg-slate-100 text-slate-600"}`}>
      {LIBELLES_TYPE[type] ?? type}
    </span>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = {
    admin: "bg-slate-900 text-white",
    gestionnaire: "bg-slate-700 text-white",
    consultant: "bg-slate-200 text-slate-700",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${map[role] ?? "bg-slate-100 text-slate-600"}`}>
      {LIBELLES_ROLE[role] ?? role}
    </span>
  );
}

export function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4">
      <div className={`mt-10 w-full ${wide ? "max-w-2xl" : "max-w-lg"} rounded-xl bg-white shadow-xl`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Fermer">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export function Alerte({ children, tone = "error" }: { children: ReactNode; tone?: "error" | "success" }) {
  const styles =
    tone === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";
  return (
    <div className={`rounded-lg border px-3 py-2 text-sm ${styles}`}>
      {children}
    </div>
  );
}

export function FormMessage({ message, tone }: { message: string | null; tone: "error" | "success" }) {
  if (!message) return null;
  return <Alerte tone={tone}>{message}</Alerte>;
}

export function Spinner() {
  return (
    <div className="flex justify-center py-10">
      <div className="size-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700" />
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
      {children}
    </div>
  );
}

export function useFormMessage() {
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<"error" | "success">("error");
  const setError = (e: unknown) => {
    setMessage(e instanceof Error ? e.message : String(e));
    setTone("error");
  };
  const setSuccess = (m: string) => {
    setMessage(m);
    setTone("success");
  };
  return { message, tone, setError, setSuccess, setMessage };
}

export function Th({
  children,
  className = "",
  colSpan,
}: {
  children?: ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <th
      colSpan={colSpan}
      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className = "",
  colSpan,
}: {
  children?: ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td colSpan={colSpan} className={`border-t border-slate-100 px-4 py-3 text-sm ${className}`}>
      {children}
    </td>
  );
}