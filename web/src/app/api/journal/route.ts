import { getSessionUser, requireRole } from "@/lib/auth";
import { query } from "@/lib/db";
import { ok } from "@/lib/api";

export async function GET(request: Request) {
  const user = await getSessionUser();
  const refus = requireRole(user, "consultant");
  if (refus) return refus;

  const url = new URL(request.url);
  const limite = Math.min(Number(url.searchParams.get("limite") ?? 200), 500);

  const { rows } = await query(
    `SELECT j.id, j.date, j.action, j.element_concerne, j.details,
            u.nom, u.prenom, u.email
       FROM journal j
       LEFT JOIN utilisateurs u ON u.id = j.utilisateur_id
       ORDER BY j.date DESC
       LIMIT $1`,
    [limite]
  );
  return ok({ entrees: rows });
}