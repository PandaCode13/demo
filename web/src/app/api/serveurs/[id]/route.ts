import { getSessionUser, requireRole } from "@/lib/auth";
import { query } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { logAction } from "@/lib/journal";
import { str, strOpt } from "@/lib/validation";

export async function PUT(request: Request, ctx: RouteContext<"/api/serveurs/[id]">) {
  const user = await getSessionUser();
  const refus = requireRole(user, "gestionnaire");
  if (refus) return refus;

  const { id } = await ctx.params;
  const idN = Number(id);
  if (!Number.isInteger(idN)) return fail("Identifiant invalide");

  const existant = await query(`SELECT id, nom FROM serveurs WHERE id = $1`, [idN]);
  if (existant.rowCount === 0) return fail("Serveur introuvable", 404);

  const body = await request.json().catch(() => null);
  if (!body) return fail("Corps de requête invalide");

  const nom = str(body.nom, 120);
  const description = strOpt(body.description, 2000);
  if (!nom) return fail("Nom du serveur requis");

  try {
    const { rows } = await query(
      `UPDATE serveurs SET nom = $1, description = $2 WHERE id = $3
       RETURNING id, nom, description, cree_le`,
      [nom, description, idN]
    );
    await logAction({
      utilisateur_id: user!.id,
      action: "modification_serveur",
      element_concerne: nom,
      details: "Mise à jour du serveur de test",
    });
    return ok({ serveur: rows[0] });
  } catch (err) {
    if ((err as { code?: string }).code === "23505") {
      return fail("Ce nom de serveur existe déjà", 409);
    }
    throw err;
  }
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/serveurs/[id]">) {
  const user = await getSessionUser();
  const refus = requireRole(user, "gestionnaire");
  if (refus) return refus;

  const { id } = await ctx.params;
  const idN = Number(id);
  if (!Number.isInteger(idN)) return fail("Identifiant invalide");

  const existant = await query(`SELECT id, nom FROM serveurs WHERE id = $1`, [idN]);
  if (existant.rowCount === 0) return fail("Serveur introuvable", 404);

  await query(`DELETE FROM serveurs WHERE id = $1`, [idN]);
  await logAction({
    utilisateur_id: user!.id,
    action: "suppression_serveur",
    element_concerne: String(existant.rows[0].nom),
    details: "Suppression du serveur de test",
  });
  return ok({ supprime: true });
}