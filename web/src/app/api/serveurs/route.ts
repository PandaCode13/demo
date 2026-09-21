import { getSessionUser, requireRole } from "@/lib/auth";
import { query } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { logAction } from "@/lib/journal";
import { str, strOpt } from "@/lib/validation";

export async function GET() {
  const user = await getSessionUser();
  const refus = requireRole(user, "consultant");
  if (refus) return refus;

  const { rows } = await query(
    `SELECT s.id, s.nom, s.description, s.cree_le,
            (SELECT MAX(b.date) FROM sauvegardes b WHERE b.serveur_id = s.id) AS derniere_sauvegarde,
            (SELECT count(*) FROM sauvegardes b WHERE b.serveur_id = s.id) AS nb_sauvegardes
       FROM serveurs s
       ORDER BY s.nom`
  );
  return ok({ serveurs: rows });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  const refus = requireRole(user, "gestionnaire");
  if (refus) return refus;

  const body = await request.json().catch(() => null);
  if (!body) return fail("Corps de requête invalide");

  const nom = str(body.nom, 120);
  const description = strOpt(body.description, 2000);
  if (!nom) return fail("Nom du serveur requis");

  try {
    const { rows } = await query(
      `INSERT INTO serveurs (nom, description) VALUES ($1, $2)
       RETURNING id, nom, description, cree_le`,
      [nom, description]
    );
    await logAction({
      utilisateur_id: user!.id,
      action: "ajout_serveur",
      element_concerne: nom,
      details: "Ajout du serveur de test",
    });
    return ok({ serveur: rows[0] }, 201);
  } catch (err) {
    if ((err as { code?: string }).code === "23505") {
      return fail("Ce nom de serveur existe déjà", 409);
    }
    throw err;
  }
}