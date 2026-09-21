import { getSessionUser, requireRole } from "@/lib/auth";
import { query } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { logAction } from "@/lib/journal";
import { str } from "@/lib/validation";

export async function GET(_req: Request, ctx: RouteContext<"/api/sauvegardes/[id]">) {
  const user = await getSessionUser();
  const refus = requireRole(user, "consultant");
  if (refus) return refus;

  const { id } = await ctx.params;
  const idN = Number(id);
  if (!Number.isInteger(idN)) return fail("Identifiant invalide");

  const { rows } = await query(
    `SELECT b.id, b.serveur_id, sv.nom AS serveur, b.date, b.taille_octets,
            b.nombre_fichiers, b.fichiers_en_erreur, b.statut, b.duree_secondes,
            b.fichier_rapport, b.cree_le
       FROM sauvegardes b
       JOIN serveurs sv ON sv.id = b.serveur_id
       WHERE b.id = $1`,
    [idN]
  );
  if (rows.length === 0) return fail("Sauvegarde introuvable", 404);
  return ok({ sauvegarde: rows[0] });
}

export async function PATCH(request: Request, ctx: RouteContext<"/api/sauvegardes/[id]">) {
  // Vérification manuelle d'une sauvegarde (O04) — journalisée.
  const user = await getSessionUser();
  const refus = requireRole(user, "gestionnaire");
  if (refus) return refus;

  const { id } = await ctx.params;
  const idN = Number(id);
  if (!Number.isInteger(idN)) return fail("Identifiant invalide");

  const existant = await query(
    `SELECT b.id, sv.nom AS serveur, b.statut, b.fichiers_en_erreur
       FROM sauvegardes b JOIN serveurs sv ON sv.id = b.serveur_id
       WHERE b.id = $1`,
    [idN]
  );
  if (existant.rowCount === 0) return fail("Sauvegarde introuvable", 404);

  const body = await request.json().catch(() => null);
  const note = str(body?.note, 2000);

  await logAction({
    utilisateur_id: user!.id,
    action: "verification_sauvegarde",
    element_concerne: String(existant.rows[0].serveur),
    details:
      `Vérification de la sauvegarde #${idN} — ` +
      (note || `retour : ${existant.rows[0].statut}`),
  });

  return ok({ verifie: true });
}