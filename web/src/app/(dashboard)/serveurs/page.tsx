import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import ServeursView from "@/components/ServeursView";

export const metadata: Metadata = { title: "Serveurs de test" };

export default async function ServeursPage() {
  const utilisateur = await getSessionUser();
  if (!utilisateur) redirect("/login");
  return <ServeursView utilisateur={utilisateur} />;
}