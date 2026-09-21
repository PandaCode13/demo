import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { fail } from "@/lib/api";

export type RoleUtilisateur = "admin" | "gestionnaire" | "consultant";

export interface SessionUser {
  id: number;
  societe: string;
  nom: string;
  prenom: string;
  email: string;
  role: RoleUtilisateur;
}

const COOKIE_NAME = "itom_token";

const ROLE_LEVEL: Record<RoleUtilisateur, number> = {
  consultant: 1,
  gestionnaire: 2,
  admin: 3,
};

function secret(): string {
  const s = process.env.JWT_SECRET;
  if (!s || s === "") {
    throw new Error("JWT_SECRET est manquant dans l'environnement");
  }
  return s;
}

export function signToken(user: SessionUser): string {
  const expire = Number(process.env.JWT_EXPIRES_IN) || 43200;
  return jwt.sign(user, secret(), { expiresIn: expire });
}

export function verifyToken(token: string): SessionUser | null {
  try {
    const payload = jwt.verify(token, secret());
    if (payload && typeof payload === "object" && "id" in payload) {
      return payload as SessionUser;
    }
    return null;
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function roleAtLeast(user: SessionUser, min: RoleUtilisateur): boolean {
  return ROLE_LEVEL[user.role] >= ROLE_LEVEL[min];
}

export function requireRole(user: SessionUser | null, min: RoleUtilisateur) {
  if (!user) return fail("Authentification requise", 401);
  if (!roleAtLeast(user, min))
    return fail("Droits insuffisants pour cette action", 403);
  return null;
}

export { COOKIE_NAME };