"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client";
import { formatDate } from "@/lib/format";
import {
  Input,
  Label,
  Spinner,
  Alerte,
  EmptyState,
  Th,
  Td,
} from "@/components/ui";

interface Entree {
  id: number;
  date: string;
  action: string;
  element_concerne: string;
  details: string | null;
  nom: string | null;
  prenom: string | null;
  email: string | null;
}

const LIBELLES_ACTION: Record<string, string> = {
  connexion: "Connexion",
  ajout_utilisateur: "Ajout d'un utilisateur",
  modification_utilisateur: "Modification d'un utilisateur",
  suppression_utilisateur: "Suppression d'un utilisateur",
  reinitialisation_mot_de_passe: "Réinitialisation du mot de passe",
  ajout_equipement: "Ajout d'un équipement",
  modification_equipement: "Modification d'un équipement",
  suppression_equipement: "Suppression d'un équipement",
  association_utilisateur: "Association utilisateur",
  dissociation_utilisateur: "Dissociation utilisateur",
  ajout_serveur: "Ajout d'un serveur",
  modification_serveur: "Modification d'un serveur",
  suppression_serveur: "Suppression d'un serveur",
  lancement_sauvegarde: "Lancement d'une sauvegarde",
  verification_sauvegarde: "Vérification d'une sauvegarde",
  consultation_indicateurs: "Consultation des indicateurs",
};

export default function JournalView() {
  const [entrees, setEntrees] = useState<Entree[]>([]);
  const [filtre, setFiltre] = useState("");
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async (avecIndicateur = true) => {
    if (avecIndicateur) setChargement(true);
    try {
      const d = await api<{ entrees: Entree[] }>("/api/journal?limite=500");
      setEntrees(d.entrees);
      setErreur(null);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur");
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { void charger(false); }, 0);
    return () => clearTimeout(t);
  }, [charger]);

  const visibles = entrees.filter((e) => {
    if (!filtre.trim()) return true;
    const f = filtre.toLowerCase();
    return (
      e.element_concerne.toLowerCase().includes(f) ||
      (e.nom ?? "").toLowerCase().includes(f) ||
      (e.prenom ?? "").toLowerCase().includes(f) ||
      (e.email ?? "").toLowerCase().includes(f) ||
      (e.details ?? "").toLowerCase().includes(f) ||
      (LIBELLES_ACTION[e.action] ?? e.action).toLowerCase().includes(f)
    );
  });

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Journal des actions</h1>
        <p className="mt-1 text-sm text-slate-500">
          Traçabilité des opérations du prototype (F07) — lecture seule.
        </p>
      </header>

      <div className="max-w-md">
        <Label>Filtrer le journal</Label>
        <Input
          placeholder="Utilisateur, équipement, action…"
          value={filtre}
          onChange={(e) => setFiltre(e.target.value)}
        />
      </div>

      {erreur && <Alerte>{erreur}</Alerte>}
      {chargement ? (
        <Spinner />
      ) : visibles.length === 0 ? (
        <EmptyState>Aucune entrée de journal ne correspond au filtre.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <Th>Date</Th>
                <Th>Action</Th>
                <Th>Élément concerné</Th>
                <Th>Détails</Th>
                <Th>Utilisateur</Th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((e) => (
                <tr key={e.id} className="align-top hover:bg-slate-50/60">
                  <Td className="whitespace-nowrap text-slate-600">{formatDate(e.date)}</Td>
                  <Td className="font-medium text-slate-900">
                    {LIBELLES_ACTION[e.action] ?? e.action}
                  </Td>
                  <Td className="font-mono text-xs text-slate-700">{e.element_concerne}</Td>
                  <Td className="max-w-md text-slate-600">{e.details ?? "—"}</Td>
                  <Td className="text-slate-600">
                    {e.prenom && e.nom ? (
                      <>
                        {e.prenom} {e.nom}
                        <p className="text-xs text-slate-400">{e.email}</p>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">système / planifié</span>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}