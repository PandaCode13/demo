import { getSessionUser, requireRole } from "@/lib/auth";
import { query } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { logAction } from "@/lib/journal";
import { str } from "@/lib/validation";
import { runResticBackup } from "@/lib/restic";

export async function GET(request: Request) {
  const user = await getSessionUser();
  const refus = requireRole(user, "consultant");
  if (refus) return refus;

  const url = new URL(request.url);
  const serveurId = url.searchParams.get("serveur_id");
  const statut = url.searchParams.get("statut");
  const limite = Math.min(Number(url.searchParams.get("limite") ?? 200), 500);

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (serveurId) {
    conditions.push(`b.serveur_id = $${params.length + 1}`);
    params.push(Number(serveurId));
  }
  if (statut) {
    conditions.push(`b.statut = $${params.length + 1}::statut_sauvegarde`);
    params.push(statut);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const { rows } = await query(
    `SELECT b.id, b.serveur_id, sv.nom AS serveur, b.date, b.taille_octets,
            b.nombre_fichiers, b.fichiers_en_erreur, b.statut, b.duree_secondes,
            b.fichier_rapport, b.cree_le
       FROM sauvegardes b
       JOIN serveurs sv ON sv.id = b.serveur_id
       ${where}
       ORDER BY b.date DESC
       LIMIT ${limite}`,
    params
  );

  return ok({ sauvegardes: rows });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  const refus = requireRole(user, "gestionnaire");
  if (refus) return refus;

  const body = await request.json().catch(() => null);
  if (!body) return fail("Corps de requête invalide");

  const serveurId = Number(body.serveur_id);
  const mode = str(body.mode, 20) || "manuel";
  if (!Number.isInteger(serveurId)) return fail("serveur_id invalide");

  const serveur = await query(
    `SELECT id, nom, description FROM serveurs WHERE id = $1`,
    [serveurId]
  );
  if (serveur.rowCount === 0) return fail("Serveur introuvable", 404);

  const res = await runResticBackup({
    serveur: String(serveur.rows[0].nom),
    repos: process.env.RESTIC_REPOSITORY ?? "restic-repo:demo",
  });

  const { rows } = await query(
    `INSERT INTO sauvegardes
       (serveur_id, date, taille_octets, nombre_fichiers, fichiers_en_erreur,
        statut, duree_secondes, fichier_rapport)
     VALUES ($1, now(), $2, $3, $4, $5::statut_sauvegarde, $6, $7)
     RETURNING id, serveur_id, date, taille_octets, nombre_fichiers,
               fichiers_en_erreur, statut, duree_secondes, fichier_rapport`,
    [
      serveurId,
      res.taille_octets,
      res.nombre_fichiers,
      res.fichiers_en_erreur,
      res.statut,
      res.duree_secondes,
      res.rapport,
    ]
  );

  await logAction({
    utilisateur_id: user!.id,
    action: "lancement_sauvegarde",
    element_concerne: String(serveur.rows[0].nom),
    details: `Sauvegarde ${mode} — ${res.statut}, ${res.fichiers_en_erreur} fichier(s) en erreur`,
  });

  return ok(
    {
      sauvegarde: rows[0],
      rapport: res.rapport,
    },
    201
  );
}