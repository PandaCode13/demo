"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/client";
import type { SessionUser } from "@/lib/auth";

const LIENS = [
  { href: "/", label: "Tableau de bord", icon: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" },
  { href: "/equipements", label: "Équipements", icon: "M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" },
  { href: "/serveurs", label: "Serveurs de test", icon: "M4 8h16M4 16h16M4 5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H4z" },
  { href: "/sauvegardes", label: "Sauvegardes", icon: "M19 7l-7-5-7 5m14 0l-7 5-7-5m14 0v10l-7 5-7-5V7" },
  { href: "/journal", label: "Journal", icon: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 5h6m-6 5h6m-6 4h3" },
  { href: "/utilisateurs", label: "Utilisateurs", icon: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z", adminOnly: true },
];

export default function Sidebar({ utilisateur }: { utilisateur: SessionUser }) {
  const pathname = usePathname();
  const router = useRouter();

  async function seDeconnecter() {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  const visible = LIENS.filter(
    (l) => !("adminOnly" in l && l.adminOnly) || utilisateur.role === "admin"
  );

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-slate-900 text-slate-200">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
        <div className="inline-flex size-9 items-center justify-center rounded-lg bg-white/10">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">IT Operations Manager</p>
          <p className="text-xs text-slate-400">Prototype · {utilisateur.societe}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {visible.map((l) => {
          const actif =
            l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                actif
                  ? "bg-white/10 font-medium text-white"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0">
                <path d={l.icon} />
              </svg>
              {l.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-5 py-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-white">
            {utilisateur.prenom.charAt(0)}
            {utilisateur.nom.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">
              {utilisateur.prenom} {utilisateur.nom}
            </p>
            <p className="truncate text-xs capitalize text-slate-400">
              {utilisateur.role}
            </p>
          </div>
        </div>
        <button
          onClick={seDeconnecter}
          className="w-full rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}