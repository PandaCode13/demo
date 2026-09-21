"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { Card, Spinner, StatutBadge, Alerte, Th, Td, EmptyState } from "@/components/ui";
import { formatBytes, formatDate, formatDuree } from "@/lib/format";

interface Indicateurs {
  nb_utilisateurs: number;
  nb_equipements: number;
  equipements_non_attribues: number;
  nb_serveurs: number;
  nb_sauvegardes: number;
  sauvegardes_reussies: number;
  sauvegardes_partielle: number;
  sauvegardes_echouees: number;
  sauvegardes_en_cours: number;
  fichiers_en_erreur_total: number;
  volume_total_octets: number;
}

interface ParServeur {
  serveur: string;
  nb: number;
  ok: number;
  partiel: number;
  echec: number;
  erreurs: number;
  duree_moyenne_s: number | null;
  derniere: string | null;
}

interface Alerte {
  id: number;
  serveur: string;
  date: string;
  statut: string;
  fichiers_en_erreur: number;
  nombre_fichiers: number;
}

interface Donnees {
  indicateurs: Indicateurs;
  par_serveur: ParServeur[];
  taux_succes: number;
  actions: { action: string; nb: number }[];
  alertes: Alerte[];
}

export default function DashboardView() {
  const [donnees, setDonnees] = useState<Donnees | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const ind = await api<{
          indicateurs: Indicateurs;
          par_serveur: ParServeur[];
          taux_succes: number;
          actions: { action: string; nb: number }[];
        }>("/api/indicateurs");
        const notif = await api<{ alertes: Alerte[] }>("/api/notifications");
        setDonnees({ ...ind, alertes: notif.alertes ?? [] });
      } catch (e) {
        setErreur(e instanceof Error ? e.message : "Erreur");
      }
    })();
  }, []);

  if (erreur) return <Alerte>{erreur}</Alerte>;
  if (!donnees) return <Spinner />;

  const i = donnees.indicateurs;
  const cartes = [
    { label: "Équipements", valeur: i.nb_equipements, detail: `${i.equipements_non_attribues} non attribués` },
    { label: "Utilisateurs", valeur: i.nb_utilisateurs, detail: "parc centralisé" },
    { label: "Serveurs de test", valeur: i.nb_serveurs, detail: "surveillés" },
    { label: "Sauvegardes", valeur: i.nb_sauvegardes, detail: `${i.sauvegardes_reussies} réussies` },
    {
      label: "Taux de succès",
      valeur: `${donnees.taux_succes}%`,
      detail: `${i.sauvegardes_partielle} partielles · ${i.sauvegardes_echouees} échouées`,
    },
    {
      label: "Fichiers en erreur",
      valeur: i.fichiers_en_erreur_total,
      detail: "à vérifier (O04)",
    },
    { label: "Volume traité", valeur: formatBytes(i.volume_total_octets), detail: "cumul des sauvegardes" },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Tableau de bord</h1>
        <p className="mt-1 text-sm text-slate-500">
          Indicateurs centralisés de l&apos;infrastructure de démonstration (F12).
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {cartes.map((c) => (
          <Card key={c.label}>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{c.label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{c.valeur}</p>
            <p className="mt-1 text-xs text-slate-400">{c.detail}</p>
          </Card>
        ))}
      </div>

      {donnees.alertes.length > 0 && (
        <Card>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-red-600">
            Alerte — sauvegardes en erreur (O05)
          </h2>
          <div className="space-y-2">
            {donnees.alertes.slice(0, 5).map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm">
                <div className="flex items-center gap-3">
                  <StatutBadge statut={a.statut} />
                  <span className="font-medium text-slate-900">{a.serveur}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">{formatDate(a.date)}</p>
                  <p className="text-xs text-red-600">
                    {a.fichiers_en_erreur} fichier(s) en erreur sur {a.nombre_fichiers}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Résultats par serveur
          </h2>
          <table className="w-full">
            <thead>
              <tr>
                <Th>Serveur</Th>
                <Th>Résultats</Th>
                <Th>Dernière</Th>
              </tr>
            </thead>
            <tbody>
              {donnees.par_serveur.map((s) => (
                <tr key={s.serveur}>
                  <Td className="font-medium text-slate-900">{s.serveur}</Td>
                  <Td>
                    <span className="text-xs text-slate-600">
                      {s.ok} ✓ · {s.partiel} ◐ · {s.echec} ✗ — {s.erreurs} erreur(s)
                    </span>
                  </Td>
                  <Td className="text-xs text-slate-500">{formatDate(s.derniere)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Durée moyenne par serveur
          </h2>
          {donnees.par_serveur.length === 0 ? (
            <EmptyState>Aucune sauvegarde enregistrée.</EmptyState>
          ) : (
            <div className="space-y-3">
              {donnees.par_serveur.map((s) => (
                <div key={s.serveur}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-800">{s.serveur}</span>
                    <span className="text-slate-500">{formatDuree(s.duree_moyenne_s)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-slate-700"
                      style={{
                        width: `${Math.min(
                          100,
                          (s.duree_moyenne_s ?? 0) / 40
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {donnees.alertes.length === 0 && (
        <Card className="border-emerald-200 bg-emerald-50">
          <p className="text-sm text-emerald-700">
            Aucune alerte — toutes les sauvegardes sont conformes.
          </p>
        </Card>
      )}
    </div>
  );
}