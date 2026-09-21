import { getSessionUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return fail("Non authentifié", 401);
  return ok({ utilisateur: user });
}