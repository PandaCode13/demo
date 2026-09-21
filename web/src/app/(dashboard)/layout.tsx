import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const utilisateur = await getSessionUser();
  if (!utilisateur) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <Sidebar utilisateur={utilisateur} />
      <main className="flex-1 overflow-x-hidden px-6 py-6">{children}</main>
    </div>
  );
}