import { getSessionUser, requireRole } from "@/lib/auth";
import { query } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { logAction } from "@/lib/journal";
import { str, strOpt, TYPE_EQUIPEMENTS, type ValidType } from "@/lib/validation";

export async function GET(request: Request) {
  const user = await getSessionUser();
  const refus = requireRole(user, "consultant");
  if (refus) return refus;

  const url = new URL(request.url);
  const q = str(url.searchParams.get("q"), 120);
  const type = str(url.searchParams.get("type"), 40);
  const os = str(url.searchParams.get("os"), 80);
  const utilisateurId = url.searchParams.get("utilisateur_id");
  const nonAttribue = url.searchParams.get("non_attribue") === "1";

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (q) {
    conditions.push(
      `(e.numero_machine ILIKE $${params.length + 1}
        OR e.os ILIKE $${params.length + 1}
        OR e.os_version ILIKE $${params.length + 1}
        OR e.dns ILIKE $${params.length + 1}
        OR c.nom ILIKE $${params.length + 1}
        OR c.prenom ILIKE $${params.length + 1}
        OR c.email ILIKE $${params.length + 1})`
    );
    params.push(`%${q}%`);
  }
  if (type) {
    conditions.push(`e.type = $${params.length + 1}::type_equipement`);
    params.push(type);
  }
  if (os) {
    conditions.push(`e.os = $${params.length + 1}`);
    params.push(os);
  }
  if (nonAttribue) {
    conditions.push(`e.utilisateur_id IS NULL`);
  } else if (utilisateurId) {
    conditions.push(`e.utilisateur_id = $${params.length + 1}`);
    params.push(Number(utilisateurId));
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const { rows } = await query(
    `SELECT e.id, e.numero_machine, e.type, e.os, e.os_version, e.ipv4, e.mac,
            e.dns, e.cree_le, e.mis_a_jour_le, e.utilisateur_id,
            c.nom AS utilisateur_nom, c.prenom AS utilisateur_prenom,
            c.email AS utilisateur_email, c.societe AS utilisateur_societe
       FROM equipements e
       LEFT JOIN utilisateurs c ON c.id = e.utilisateur_id
       ${where}
       ORDER BY e.numero_machine`,
    params
  );

  const { rows: types } = await query(
    `SELECT DISTINCT os FROM equipements ORDER BY os`
  );

  return ok({ equipements: rows, os_disponibles: types.map((t) => t.os) });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  const refus = requireRole(user, "gestionnaire");
  if (refus) return refus;

  const body = await request.json().catch(() => null);
  if (!body) return fail("Corps de requête invalide");

  const numeroMachine = str(body.numero_machine, 60);
  const type: ValidType = TYPE_EQUIPEMENTS.includes(body.type)
    ? body.type
    : "poste_de_travail";
  const os = str(body.os, 80);
  const osVersion = str(body.os_version, 40);
  const ipv4 = strOpt(body.ipv4, 45);
  const mac = strOpt(body.mac, 32);
  const dns = strOpt(body.dns, 255);
  const utilisateurId = body.utilisateur_id
    ? Number(body.utilisateur_id)
    : null;

  if (!numeroMachine) return fail("Numéro de machine requis");
  if (!os) return fail("Système d'exploitation requis");
  if (!osVersion) return fail("Version du système d'exploitation requise");

  if (utilisateurId) {
    const u = await query(`SELECT id FROM utilisateurs WHERE id = $1`, [utilisateurId]);
    if (u.rowCount === 0) return fail("Utilisateur associé introuvable", 400);
  }

  try {
    const { rows } = await query(
      `INSERT INTO equipements
         (utilisateur_id, numero_machine, type, os, os_version, ipv4, mac, dns)
       VALUES ($1, $2, $3::type_equipement, $4, $5, $6::inet, $7::macaddr, $8)
       RETURNING id`,
      [utilisateurId, numeroMachine, type, os, osVersion, ipv4, mac, dns]
    );
    await logAction({
      utilisateur_id: user!.id,
      action: "ajout_equipement",
      element_concerne: numeroMachine,
      details: `Ajout de l'équipement ${os} ${osVersion}`,
    });
    return ok({ id: rows[0].id }, 201);
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === "23505") return fail("Ce numéro de machine existe déjà", 409);
    if (code === "22P02") return fail("Adresse IPv4 ou MAC invalide");
    throw err;
  }
}