import { COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  const response = Response.json({ data: { deconnecte: true } });
  response.headers.set(
    "Set-Cookie",
    `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
  return response;
}