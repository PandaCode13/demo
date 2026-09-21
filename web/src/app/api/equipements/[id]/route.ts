import { getSessionUser, requireRole } from "@/lib/auth";
import { query } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { logAction } from "@/lib/journal";
import { str, strOpt, TYPE_EQUIPEMENTS, type ValidType } from "@/lib/validation";

async function getEquipement(idN: number) {
  const { rows } = await query(
    `SELECT e.id, e.utilisateur_id, e.numero_machine, e.type, e.os, e.os_version,
            e.ipv4, e.mac, e.dns, e.cree_le, e.mis_a_jour_le
       FROM equipements e WHERE e.id = $1`,
    [idN]
  );
  return rows[0] ?? null;
}

export async function GET(_req: Request, ctx: RouteContext<"/api/equipements/[id]">) {
  const user = await getSessionUser();
  const refus = requireRole(user, "consultant");
  if (refus) return refus;

  const { id } = await ctx.params;
  const idN = Number(id);
  if (!Number.isInteger(idN)) return fail("Identifiant invalide");

  const equipement = await getEquipement(idN);
  if (!equipement) return fail("Équipement introuvable", 404);
  return ok({ equipement });
}

export async function PUT(request: Request, ctx: RouteContext<"/api/equipements/[id]">) {
  const user = await getSessionUser();
  const refus = requireRole(user, "gestionnaire");
  if (refus) return refus;

  const { id } = await ctx.params;
  const idN = Number(id);
  if (!Number.isInteger(idN)) return fail("Identifiant invalide");

  const existant = await getEquipement(idN);
  if (!existant) return fail("Équipement introuvable", 404);

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
  if (!os || !osVersion) return fail("Système d'exploitation et version requis");

  if (utilisateurId) {
    const u = await query(`SELECT id FROM utilisateurs WHERE id = $1`, [utilisateurId]);
    if (u.rowCount === 0) return fail("Utilisateur associé introuvable", 400);
  }

  try {
    await query(
      `UPDATE equipements
          SET utilisateur_id = $1, numero_machine = $2, type = $3::type_equipement,
              os = $4, os_version = $5, ipv4 = $6::inet, mac = $7::macaddr, dns = $8
        WHERE id = $9`,
      [utilisateurId, numeroMachine, type, os, osVersion, ipv4, mac, dns, idN]
    );
    await logAction({
      utilisateur_id: user!.id,
      action: "modification_equipement",
      element_concerne: numeroMachine,
      details: `Mise à jour des informations techniques`,
    });
    return ok({ modifie: true });
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === "23505") return fail("Ce numéro de machine existe déjà", 409);
    if (code === "22P02") return fail("Adresse IPv4 ou MAC invalide");
    throw err;
  }
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/equipements/[id]">) {
  const user = await getSessionUser();
  const refus = requireRole(user, "gestionnaire");
  if (refus) return refus;

  const { id } = await ctx.params;
  const idN = Number(id);
  if (!Number.isInteger(idN)) return fail("Identifiant invalide");

  const existant = await getEquipement(idN);
  if (!existant) return fail("Équipement introuvable", 404);

  await query(`DELETE FROM equipements WHERE id = $1`, [idN]);
  await logAction({
    utilisateur_id: user!.id,
    action: "suppression_equipement",
    element_concerne: String(existant.numero_machine),
    details: "Suppression de l'équipement",
  });
  return ok({ supprime: true });
}

export async function PATCH(request: Request, ctx: RouteContext<"/api/equipements/[id]">) {
  // Association / dissociation utilisateur-équipement (F05)
  const user = await getSessionUser();
  const refus = requireRole(user, "gestionnaire");
  if (refus) return refus;

  const { id } = await ctx.params;
  const idN = Number(id);
  if (!Number.isInteger(idN)) return fail("Identifiant invalide");

  const existant = await getEquipement(idN);
  if (!existant) return fail("Équipement introuvable", 404);

  const body = await request.json().catch(() => null);
  if (!body) return fail("Corps de requête invalide");

  const utilisateurId = body.utilisateur_id ? Number(body.utilisateur_id) : null;

  if (utilisateurId) {
    const u = await query(`SELECT id FROM utilisateurs WHERE id = $1`, [utilisateurId]);
    if (u.rowCount === 0) return fail("Utilisateur associé introuvable", 400);
  }

  await query(`UPDATE equipements SET utilisateur_id = $1 WHERE id = $2`, [
    utilisateurId,
    idN,
  ]);

  await logAction({
    utilisateur_id: user!.id,
    action: utilisateurId
      ? "association_utilisateur"
      : "dissociation_utilisateur",
    element_concerne: String(existant.numero_machine),
    details: utilisateurId
      ? `Association avec l'utilisateur #${utilisateurId}`
      : "Retrait de l'association utilisateur",
  });
  return ok({ modifie: true });
}