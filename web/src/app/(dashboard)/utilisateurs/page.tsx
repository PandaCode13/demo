import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import UtilisateursView from "@/components/UtilisateursView";

export const metadata: Metadata = { title: "Utilisateurs" };

export default async function UtilisateursPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/");
  return <UtilisateursView session={session} />;
}