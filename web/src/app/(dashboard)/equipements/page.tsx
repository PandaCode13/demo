import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import EquipementsView from "@/components/EquipementsView";

export const metadata: Metadata = { title: "Équipements" };

export default async function EquipementsPage() {
  const utilisateur = await getSessionUser();
  if (!utilisateur) redirect("/login");
  return <EquipementsView utilisateur={utilisateur} />;
}