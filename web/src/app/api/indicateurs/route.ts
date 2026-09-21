import { query } from "@/lib/db";
import { getSessionUser, requireRole } from "@/lib/auth";
import { ok } from "@/lib/api";

export async function GET() {
  const user = await getSessionUser();
  const refus = requireRole(user, "consultant");
  if (refus) return refus;

  // Indicateurs globaux (F12) — agrégats sur les sauvegardes, le parc et le journal.
  const indicateurs = await query(
    `SELECT
       (SELECT count(*) FROM utilisateurs)                          AS nb_utilisateurs,
       (SELECT count(*) FROM equipements)                           AS nb_equipements,
       (SELECT count(*) FROM equipements WHERE utilisateur_id IS NULL) AS equipements_non_attribues,
       (SELECT count(*) FROM serveurs)                              AS nb_serveurs,
       (SELECT count(*) FROM sauvegardes)                           AS nb_sauvegardes,
       (SELECT count(*) FROM sauvegardes WHERE statut = 'reussie')  AS sauvegardes_reussies,
       (SELECT count(*) FROM sauvegardes WHERE statut = 'partielle') AS sauvegardes_partielle,
       (SELECT count(*) FROM sauvegardes WHERE statut = 'echouee')  AS sauvegardes_echouees,
       (SELECT count(*) FROM sauvegardes WHERE statut = 'en_cours') AS sauvegardes_en_cours,
       COALESCE((SELECT SUM(fichiers_en_erreur) FROM sauvegardes), 0) AS fichiers_en_erreur_total,
       COALESCE((SELECT SUM(taille_octets) FROM sauvegardes), 0)    AS volume_total_octets`
  );

  const parServeur = await query(
    `SELECT sv.nom AS serveur, count(*) AS nb,
            count(*) FILTER (WHERE b.statut = 'reussie')  AS ok,
            count(*) FILTER (WHERE b.statut = 'partielle') AS partiel,
            count(*) FILTER (WHERE b.statut = 'echouee')  AS echec,
            COALESCE(sum(b.fichiers_en_erreur), 0) AS erreurs,
            COALESCE(round(avg(b.duree_secondes) FILTER (WHERE b.duree_secondes IS NOT NULL))::int, 0) AS duree_moyenne_s,
            max(b.date) AS derniere
       FROM sauvegardes b JOIN serveurs sv ON sv.id = b.serveur_id
       GROUP BY sv.nom
       ORDER BY sv.nom`
  );

  const taux = await query(
    `SELECT round(100.0 * count(*) FILTER (WHERE statut IN ('reussie', 'partielle'))
         / NULLIF(count(*), 0), 1) AS taux_succes
       FROM sauvegardes
       WHERE statut <> 'en_cours'`
  );

  const actions = await query(
    `SELECT action, count(*) AS nb
       FROM journal GROUP BY action ORDER BY nb DESC LIMIT 12`
  );

  return ok({
    indicateurs: indicateurs.rows[0],
    par_serveur: parServeur.rows,
    taux_succes: Number(taux.rows[0]?.taux_succes ?? 0),
    actions: actions.rows,
  });
}