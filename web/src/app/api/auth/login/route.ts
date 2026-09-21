import bcrypt from "bcryptjs";
import { COOKIE_NAME, signToken, type SessionUser } from "@/lib/auth";
import { query } from "@/lib/db";

export async function POST(request: Request) {
  let body: { email?: string; mot_de_passe?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const motDePasse = typeof body.mot_de_passe === "string" ? body.mot_de_passe : "";

  if (!email || !motDePasse) {
    return Response.json({ error: "E-mail et mot de passe requis" }, { status: 400 });
  }

  const { rows } = await query<{
    id: number;
    societe: string;
    nom: string;
    prenom: string;
    email: string;
    mot_de_passe: string;
    role: SessionUser["role"];
    actif: boolean;
  }>(`SELECT id, societe, nom, prenom, email, mot_de_passe, role, actif
        FROM utilisateurs WHERE email = $1`, [email]);

  const utilisateur = rows[0];
  if (!utilisateur) {
    return Response.json({ error: "Identifiants invalides" }, { status: 401 });
  }
  if (!utilisateur.actif) {
    return Response.json({ error: "Compte désactivé" }, { status: 403 });
  }

  const valide = await bcrypt.compare(motDePasse, utilisateur.mot_de_passe);
  if (!valide) {
    return Response.json({ error: "Identifiants invalides" }, { status: 401 });
  }

  const session: SessionUser = {
    id: utilisateur.id,
    societe: utilisateur.societe,
    nom: utilisateur.nom,
    prenom: utilisateur.prenom,
    email: utilisateur.email,
    role: utilisateur.role,
  };

  const token = signToken(session);

  try {
    await query(
      `INSERT INTO journal (utilisateur_id, action, element_concerne, details)
       VALUES ($1, 'connexion', 'session', 'Connexion réussie')`,
      [session.id]
    );
  } catch {
    // ignore
  }

  const response = Response.json({
    data: { utilisateur: session },
  });
  response.headers.set(
    "Set-Cookie",
    `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${process.env.JWT_EXPIRES_IN ?? 43200}`
  );
  return response;
}