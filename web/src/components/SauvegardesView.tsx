"use client";

import { Fragment, useCallback, useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/client";
import { formatBytes, formatDate, formatDuree, LIBELLES_STATUT } from "@/lib/format";
import {
  Button,
  Select,
  Label,
  Modal,
  Spinner,
  Alerte,
  EmptyState,
  StatutBadge,
  Th,
  Td,
  FormMessage,
  useFormMessage,
} from "@/components/ui";
import type { SessionUser } from "@/lib/auth";

interface Sauvegarde {
  id: number;
  serveur_id: number;
  serveur: string;
  date: string;
  taille_octets: number;
  nombre_fichiers: number;
  fichiers_en_erreur: number;
  statut: string;
  duree_secondes: number | null;
  fichier_rapport: string | null;
}

export default function SauvegardesView({ utilisateur }: { utilisateur: SessionUser }) {
  const [sauvegardes, setSauvegardes] = useState<Sauvegarde[]>([]);
  const [serveurs, setServeurs] = useState<{ id: number; nom: string }[]>([]);
  const [filtreServeur, setFiltreServeur] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("");
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [deplie, setDeplie] = useState<number | null>(null);
  const [verifie, setVerifie] = useState<Sauvegarde | null>(null);

  const gestionnaire = utilisateur.role === "admin" || utilisateur.role === "gestionnaire";

  const charger = useCallback(async (avecIndicateur = true) => {
    if (avecIndicateur) setChargement(true);
    try {
      const params = new URLSearchParams();
      if (filtreServeur) params.set("serveur_id", filtreServeur);
      if (filtreStatut) params.set("statut", filtreStatut);
      const d = await api<{ sauvegardes: Sauvegarde[] }>(
        `/api/sauvegardes${params.toString() ? `?${params}` : ""}`
      );
      setSauvegardes(d.sauvegardes);
      setErreur(null);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur");
    } finally {
      setChargement(false);
    }
  }, [filtreServeur, filtreStatut]);

  useEffect(() => {
    const t = setTimeout(() => { void charger(false); }, 0);
    return () => clearTimeout(t);
  }, [charger]);

  useEffect(() => {
    api<{ serveurs: { id: number; nom: string }[] }>("/api/serveurs")
      .then((d) => setServeurs(d.serveurs))
      .catch(() => setServeurs([]));
  }, []);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Historique des sauvegardes</h1>
        <p className="mt-1 text-sm text-slate-500">
          Statut, volume, erreurs et rapports (F09, F10, F11).
        </p>
      </header>

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-56">
          <Label>Serveur</Label>
          <Select value={filtreServeur} onChange={(e) => setFiltreServeur(e.target.value)}>
            <option value="">Tous</option>
            {serveurs.map((s) => (
              <option key={s.id} value={s.id}>{s.nom}</option>
            ))}
          </Select>
        </div>
        <div className="w-52">
          <Label>Statut</Label>
          <Select value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)}>
            <option value="">Tous</option>
            <option value="en_cours">En cours</option>
            <option value="reussie">Réussie</option>
            <option value="partielle">Partielle</option>
            <option value="echouee">Échouée</option>
            <option value="annulee">Annulée</option>
          </Select>
        </div>
        <Button variant="secondary" onClick={() => void charger()}>Actualiser</Button>
      </div>

      {erreur && <Alerte>{erreur}</Alerte>}
      {chargement ? (
        <Spinner />
      ) : sauvegardes.length === 0 ? (
        <EmptyState>Aucune sauvegarde ne correspond aux critères.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <Th>Date</Th>
                <Th>Serveur</Th>
                <Th>Statut</Th>
                <Th>Volume</Th>
                <Th>Fichiers</Th>
                <Th>Erreurs</Th>
                <Th>Durée</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {sauvegardes.map((b) => (
                <Fragment key={b.id}>
                  <tr className="cursor-pointer hover:bg-slate-50/60" onClick={() => setDeplie(deplie === b.id ? null : b.id)}>
                    <Td className="whitespace-nowrap text-slate-600">{formatDate(b.date)}</Td>
                    <Td className="font-medium text-slate-900">{b.serveur}</Td>
                    <Td><StatutBadge statut={b.statut} /></Td>
                    <Td className="text-slate-600">{formatBytes(b.taille_octets)}</Td>
                    <Td className="text-slate-600">{b.nombre_fichiers.toLocaleString("fr-FR")}</Td>
                    <Td className={b.fichiers_en_erreur > 0 ? "font-medium text-red-600" : "text-slate-600"}>
                      {b.fichiers_en_erreur}
                    </Td>
                    <Td className="text-slate-600">{formatDuree(b.duree_secondes)}</Td>
                    <Td className="text-right">
                      {gestionnaire && (
                        <Button
                          variant="ghost"
                          className="!px-2 !py-1 text-xs"
                          onClick={(ev) => { ev.stopPropagation(); setVerifie(b); }}
                        >
                          Vérifier (O04)
                        </Button>
                      )}
                    </Td>
                  </tr>
                  {deplie === b.id && (
                    <tr key={`r-${b.id}`}>
                      <Td colSpan={8} className="bg-slate-50">
                        <div className="rounded-lg bg-slate-900 p-4">
                          <pre className="whitespace-pre-wrap break-words text-xs leading-relaxed text-emerald-300">
                            {b.fichier_rapport ?? "Rapport de simulation Restic non disponible pour cette entrée."}
                          </pre>
                        </div>
                      </Td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {verifie && (
        <Modal title={`Vérification — sauvegarde #${verifie.id} (${verifie.serveur})`} onClose={() => setVerifie(null)}>
          <FormulaireVerification sauvegarde={verifie} onFait={() => { setVerifie(null); charger(); }} />
        </Modal>
      )}
    </div>
  );
}

function FormulaireVerification({ sauvegarde, onFait }: { sauvegarde: Sauvegarde; onFait: () => void }) {
  const { message, tone, setError, setSuccess } = useFormMessage();
  const [charge, setCharge] = useState(false);
  const [note, setNote] = useState(
    sauvegarde.fichiers_en_erreur > 0
      ? `Contrôle effectué : ${sauvegarde.fichiers_en_erreur} fichier(s) en erreur signalé(s), provenance à analyser.`
      : "Contrôle effectué : aucun fichier en erreur."
  );

  async function soumettre(e: FormEvent) {
    e.preventDefault();
    setCharge(true);
    try {
      await api(`/api/sauvegardes/${sauvegarde.id}`, {
        method: "PATCH",
        body: JSON.stringify({ note }),
      });
      setSuccess("Vérification journalisée (F07, O04).");
      setTimeout(onFait, 700);
    } catch (err) {
      setError(err);
      setCharge(false);
    }
  }

  return (
    <form onSubmit={soumettre} className="space-y-4">
      <p className="text-sm text-slate-600">
        Statut actuel : <StatutBadge statut={sauvegarde.statut} /> —{" "}
        {LIBELLES_STATUT[sauvegarde.statut] ?? sauvegarde.statut}.
      </p>
      <div>
        <Label>Compte-rendu de la vérification</Label>
        <textarea
          rows={4}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>
      <FormMessage message={message} tone={tone} />
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onFait}>Annuler</Button>
        <Button type="submit" disabled={charge}>{charge ? "Enregistrement…" : "Journaliser la vérification"}</Button>
      </div>
    </form>
  );
}