"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { formatDate } from "@/lib/format";
import {
  Button,
  Card,
  Input,
  Label,
  Textarea,
  Modal,
  Spinner,
  Alerte,
  EmptyState,
  StatutBadge,
  FormMessage,
  useFormMessage,
} from "@/components/ui";
import type { SessionUser } from "@/lib/auth";

interface Serveur {
  id: number;
  nom: string;
  description: string | null;
  cree_le: string;
  derniere_sauvegarde: string | null;
  nb_sauvegardes: number;
}

interface ResultatSauvegarde {
  sauvegarde: {
    id: number;
    statut: string;
    fichiers_en_erreur: number;
    nombre_fichiers: number;
    taille_octets: number;
  };
  rapport: string;
}

export default function ServeursView({ utilisateur }: { utilisateur: SessionUser }) {
  const router = useRouter();
  const [serveurs, setServeurs] = useState<Serveur[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [modalAjout, setModalAjout] = useState(false);
  const [enCours, setEnCours] = useState<number | null>(null);
  const [resultat, setResultat] = useState<ResultatSauvegarde | null>(null);

  const gestionnaire = utilisateur.role === "admin" || utilisateur.role === "gestionnaire";

  const charger = useCallback(async (avecIndicateur = true) => {
    if (avecIndicateur) setChargement(true);
    try {
      const d = await api<{ serveurs: Serveur[] }>("/api/serveurs");
      setServeurs(d.serveurs);
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

  async function lancerSauvegarde(serveur: Serveur) {
    setEnCours(serveur.id);
    setErreur(null);
    try {
      const d = await api<ResultatSauvegarde>("/api/sauvegardes", {
        method: "POST",
        body: JSON.stringify({ serveur_id: serveur.id, mode: "manuel" }),
      });
      setResultat(d);
      charger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur");
    } finally {
      setEnCours(null);
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Serveurs de test</h1>
          <p className="mt-1 text-sm text-slate-500">
            Infrastructure de démonstration et déclenchement des sauvegardes (F08, F09).
          </p>
        </div>
        {gestionnaire && <Button onClick={() => setModalAjout(true)}>+ Ajouter un serveur</Button>}
      </header>

      {erreur && <Alerte>{erreur}</Alerte>}
      {chargement ? (
        <Spinner />
      ) : serveurs.length === 0 ? (
        <EmptyState>Aucun serveur de test.</EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {serveurs.map((s) => (
            <Card key={s.id} className="flex flex-col">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{s.nom}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {s.description ?? "Sans description"}
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-1 text-xs text-slate-500">
                <p>Dernière sauvegarde : {formatDate(s.derniere_sauvegarde)}</p>
                <p>{s.nb_sauvegardes} sauvegarde(s) enregistrée(s)</p>
              </div>
              {gestionnaire && (
                <div className="mt-4 flex gap-2">
                  <Button
                    className="flex-1"
                    disabled={enCours !== null}
                    onClick={() => lancerSauvegarde(s)}
                  >
                    {enCours === s.id ? "Sauvegarde en cours…" : "Lancer une sauvegarde"}
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Card>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Automatisation (O02)
        </h2>
        <p className="text-sm text-slate-600">
          La tâche planifiée est déclenchée par un planificateur système (cron ou{" "}
          Planificateur de tâches Windows) via <code className="rounded bg-slate-100 px-1">scripts/cron-tick.mjs</code>{" "}
          — voir la documentation d&apos;installation. Elle traite les serveurs sans sauvegarde
          réussie depuis 24 h et enregistre automatiquement le résultat.
        </p>
      </Card>

      {modalAjout && (
        <Modal title="Ajouter un serveur de test" onClose={() => setModalAjout(false)}>
          <FormulaireServeur onFait={() => { setModalAjout(false); charger(); }} />
        </Modal>
      )}

      {resultat && (
        <Modal title={`Résultat de la sauvegarde`} onClose={() => setResultat(null)} wide>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
              <StatutBadge statut={resultat.sauvegarde.statut} />
              <span className="text-xs text-slate-500">
                #{resultat.sauvegarde.id} · {resultat.sauvegarde.nombre_fichiers} fichiers ·{" "}
                {resultat.sauvegarde.fichiers_en_erreur} en erreur
              </span>
            </div>
            <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs leading-relaxed text-emerald-300">
              {resultat.rapport}
            </pre>
            <p className="text-xs text-slate-500">
              L&apos;exécution est simulée (Restic en mode démonstration, O03). Enregistrement
              automatique dans l&apos;historique des sauvegardes.
            </p>
            <div className="flex justify-end">
              <Button onClick={() => router.push("/sauvegardes")}>
                Voir l&apos;historique
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function FormulaireServeur({ onFait }: { onFait: () => void }) {
  const { message, tone, setError, setSuccess } = useFormMessage();
  const [charge, setCharge] = useState(false);
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");

  async function soumettre(e: FormEvent) {
    e.preventDefault();
    setCharge(true);
    try {
      await api("/api/serveurs", { method: "POST", body: JSON.stringify({ nom, description }) });
      setSuccess("Serveur ajouté et journalisé.");
      setTimeout(onFait, 700);
    } catch (err) {
      setError(err);
      setCharge(false);
    }
  }

  return (
    <form onSubmit={soumettre} className="space-y-4">
      <div><Label>Nom du serveur *</Label><Input required value={nom} onChange={(e) => setNom(e.target.value)} placeholder="SRV-FICHIERS-02" /></div>
      <div><Label>Description</Label><Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Rôle du serveur de test…" /></div>
      <FormMessage message={message} tone={tone} />
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onFait}>Annuler</Button>
        <Button type="submit" disabled={charge}>{charge ? "Enregistrement…" : "Enregistrer"}</Button>
      </div>
    </form>
  );
}