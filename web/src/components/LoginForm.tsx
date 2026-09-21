"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";

export default function LoginForm({ retour }: { retour?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function soumettre(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    try {
      await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, mot_de_passe: motDePasse }),
      });
      router.push(retour && retour.startsWith("/") ? retour : "/");
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur inattendue");
      setChargement(false);
    }
  }

  return (
    <form onSubmit={soumettre} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
          Adresse e-mail
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="alice.renaud@technova.demo"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
          Mot de passe
        </label>
        <input
          type="password"
          required
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          placeholder="••••••••"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>
      {erreur && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {erreur}
        </div>
      )}
      <button
        type="submit"
        disabled={chargement}
        className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:bg-slate-300"
      >
        {chargement ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}