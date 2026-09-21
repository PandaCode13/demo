import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import SauvegardesView from "@/components/SauvegardesView";

export const metadata: Metadata = { title: "Sauvegardes" };

export default async function SauvegardesPage() {
  const utilisateur = await getSessionUser();
  if (!utilisateur) redirect("/login");
  return <SauvegardesView utilisateur={utilisateur} />;
}