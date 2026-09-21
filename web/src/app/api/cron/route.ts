import { query } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { runResticBackup } from "@/lib/restic";
import { logAction } from "@/lib/journal";

const MAX_DOS = 5;

/**
 * Tâche planifiée de sauvegarde (O02).
 * Appelée par un planificateur système (cron / Planificateur de tâches Windows)
 * via le script scripts/cron-tick.mjs.
 *
 * Traite les serveurs dont la dernière sauvegarde est absente ou datent
 * d'au moins 24 heures, puis enregistre le résultat.
 */
export async function POST(request: Request) {
  const attendu = process.env.CRON_TOKEN;
  if (!attendu) return fail("CRON_TOKEN non configuré", 500);

  const reçu = request.headers.get("x-cron-token");
  if (reçu !== attendu) return fail("Jeton non autorisé", 401);

  const { rows: du } = await query(
    `SELECT s.id, s.nom
       FROM serveurs s
       WHERE NOT EXISTS (
         SELECT 1 FROM sauvegardes b
          WHERE b.serveur_id = s.id
            AND b.date > now() - interval '24 hours'
            AND b.statut <> 'en_cours'
       )
       ORDER BY s.nom
       LIMIT $1`,
    [MAX_DOS]
  );

  const executes: Array<{ serveur: string; statut: string }> = [];

  for (const serveur of du) {
    const res = await runResticBackup({
      serveur: String(serveur.nom),
      repos: process.env.RESTIC_REPOSITORY ?? "restic-repo:demo",
    });

    await query(
      `INSERT INTO sauvegardes
         (serveur_id, date, taille_octets, nombre_fichiers, fichiers_en_erreur,
          statut, duree_secondes, fichier_rapport)
       VALUES ($1, now(), $2, $3, $4, $5::statut_sauvegarde, $6, $7)`,
      [
        Number(serveur.id),
        res.taille_octets,
        res.nombre_fichiers,
        res.fichiers_en_erreur,
        res.statut,
        res.duree_secondes,
        res.rapport,
      ]
    );

    executes.push({ serveur: String(serveur.nom), statut: res.statut });
  }

  if (executes.length > 0) {
    await logAction({
      utilisateur_id: null,
      action: "lancement_sauvegarde",
      element_concerne: "tache_planifiee",
      details: `Déclenchement planifié (cron) — ${executes
        .map((e) => `${e.serveur} (${e.statut})`)
        .join(", ")}`,
    });
  }

  return ok({ traites: executes.length, executes });
}