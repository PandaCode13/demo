import { getSessionUser, requireRole } from "@/lib/auth";
import { query } from "@/lib/db";
import { ok } from "@/lib/api";

export async function GET() {
  const user = await getSessionUser();
  const refus = requireRole(user, "consultant");
  if (refus) return refus;

  const { rows } = await query(
    `SELECT b.id, b.serveur_id, sv.nom AS serveur, b.date, b.statut,
            b.fichiers_en_erreur, b.nombre_fichiers
       FROM sauvegardes b
       JOIN serveurs sv ON sv.id = b.serveur_id
       WHERE b.statut IN ('echouee', 'partielle') OR b.fichiers_en_erreur > 0
       ORDER BY b.date DESC
       LIMIT 25`
  );

  const { rows: compte } = await query(
    `SELECT count(*) AS nb FROM sauvegardes
      WHERE statut IN ('echouee', 'partielle') OR fichiers_en_erreur > 0`
  );

  return ok({ alertes: rows, nb_alertes: Number(compte[0]?.nb ?? 0) });
}