import { getSessionUser, requireRole } from "@/lib/auth";
import { query } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import bcrypt from "bcryptjs";
import { logAction } from "@/lib/journal";
import { isEmail, str, strOpt, bool, ROLES, type ValidRole } from "@/lib/validation";

export async function PUT(request: Request, ctx: RouteContext<"/api/utilisateurs/[id]">) {
  const user = await getSessionUser();
  const refus = requireRole(user, "admin");
  if (refus) return refus;

  const { id } = await ctx.params;
  const idN = Number(id);
  if (!Number.isInteger(idN)) return fail("Identifiant invalide");

  const body = await request.json().catch(() => null);
  if (!body) return fail("Corps de requête invalide");

  const existant = await query(
    `SELECT id, email FROM utilisateurs WHERE id = $1`,
    [idN]
  );
  if (existant.rowCount === 0) return fail("Utilisateur introuvable", 404);

  const societe = str(body.societe, 120);
  const nom = str(body.nom, 80);
  const prenom = str(body.prenom, 80);
  const email = str(body.email, 255).toLowerCase();
  const telephone = strOpt(body.telephone, 30);
  const role: ValidRole = ROLES.includes(body.role) ? body.role : "consultant";
  const actif = body.actif === undefined ? true : bool(body.actif);

  if (!societe || !nom || !prenom) return fail("Société, nom et prénom requis");
  if (!isEmail(email)) return fail("Adresse e-mail invalide");

  try {
    const { rows } = await query(
      `UPDATE utilisateurs
          SET societe = $1, nom = $2, prenom = $3, email = $4, telephone = $5,
              role = $6, actif = $7
        WHERE id = $8
        RETURNING id, societe, nom, prenom, email, telephone, role, actif, mis_a_jour_le`,
      [societe, nom, prenom, email, telephone, role, actif, idN]
    );
    await logAction({
      utilisateur_id: user!.id,
      action: "modification_utilisateur",
      element_concerne: email,
      details: `Mise à jour du profil (rôle ${role})`,
    });
    return ok({ utilisateur: rows[0] });
  } catch (err) {
    if ((err as { code?: string }).code === "23505") {
      return fail("Cette adresse e-mail est déjà utilisée", 409);
    }
    throw err;
  }
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/utilisateurs/[id]">) {
  const user = await getSessionUser();
  const refus = requireRole(user, "admin");
  if (refus) return refus;

  const { id } = await ctx.params;
  const idN = Number(id);
  if (!Number.isInteger(idN)) return fail("Identifiant invalide");

  if (idN === user!.id) return fail("Impossible de supprimer son propre compte", 400);

  const existant = await query(`SELECT email FROM utilisateurs WHERE id = $1`, [idN]);
  if (existant.rowCount === 0) return fail("Utilisateur introuvable", 404);

  await query(`DELETE FROM utilisateurs WHERE id = $1`, [idN]);
  await logAction({
    utilisateur_id: user!.id,
    action: "suppression_utilisateur",
    element_concerne: String(existant.rows[0].email),
    details: "Suppression du compte",
  });
  return ok({ supprime: true });
}

export async function PATCH(request: Request, ctx: RouteContext<"/api/utilisateurs/[id]">) {
  const user = await getSessionUser();
  const refus = requireRole(user, "admin");
  if (refus) return refus;

  const { id } = await ctx.params;
  const idN = Number(id);

  const body = await request.json().catch(() => null);
  if (!body) return fail("Corps de requête invalide");

  const nouveauMotDePasse = typeof body.mot_de_passe === "string" ? body.mot_de_passe : "";
  if (nouveauMotDePasse.length < 8)
    return fail("Le mot de passe doit contenir au moins 8 caractères");

  const hash = await bcrypt.hash(nouveauMotDePasse, 10);
  await query(`UPDATE utilisateurs SET mot_de_passe = $1 WHERE id = $2`, [hash, idN]);
  await logAction({
    utilisateur_id: user!.id,
    action: "reinitialisation_mot_de_passe",
    element_concerne: `utilisateur #${idN}`,
    details: "Réinitialisation du mot de passe",
  });
  return ok({ modifie: true });
}