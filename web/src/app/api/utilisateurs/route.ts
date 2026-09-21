import { getSessionUser, requireRole } from "@/lib/auth";
import { query } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import bcrypt from "bcryptjs";
import { logAction } from "@/lib/journal";
import { isEmail, str, strOpt, bool, ROLES, type ValidRole } from "@/lib/validation";

export async function GET() {
  const user = await getSessionUser();
  const refus = requireRole(user, "gestionnaire");
  if (refus) return refus;

  const { rows } = await query(
    `SELECT id, societe, nom, prenom, email, telephone, role, actif, cree_le, mis_a_jour_le
       FROM utilisateurs ORDER BY nom, prenom`
  );
  return ok({ utilisateurs: rows });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  const refus = requireRole(user, "admin");
  if (refus) return refus;

  const body = await request.json().catch(() => null);
  if (!body) return fail("Corps de requête invalide");

  const societe = str(body.societe, 120);
  const nom = str(body.nom, 80);
  const prenom = str(body.prenom, 80);
  const email = str(body.email, 255).toLowerCase();
  const telephone = strOpt(body.telephone, 30);
  const motDePasse = str(body.mot_de_passe, 72);
  const role: ValidRole = ROLES.includes(body.role) ? body.role : "consultant";
  const actif = body.actif === undefined ? true : bool(body.actif);

  if (!societe || !nom || !prenom) return fail("Société, nom et prénom requis");
  if (!isEmail(email)) return fail("Adresse e-mail invalide");
  if (motDePasse.length < 8)
    return fail("Le mot de passe doit contenir au moins 8 caractères");

  const hash = await bcrypt.hash(motDePasse, 10);

  try {
    const { rows } = await query(
      `INSERT INTO utilisateurs (societe, nom, prenom, email, telephone, mot_de_passe, role, actif)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, societe, nom, prenom, email, telephone, role, actif, cree_le`,
      [societe, nom, prenom, email, telephone, hash, role, actif]
    );
    await logAction({
      utilisateur_id: user!.id,
      action: "ajout_utilisateur",
      element_concerne: email,
      details: `Création du compte ${role}`,
    });
    return ok({ utilisateur: rows[0] }, 201);
  } catch (err) {
    if ((err as { code?: string }).code === "23505") {
      return fail("Cette adresse e-mail est déjà utilisée", 409);
    }
    throw err;
  }
}