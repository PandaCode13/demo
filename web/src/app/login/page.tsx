import type { Metadata } from "next";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage(
  props: PageProps<"/login">
) {
  const searchParams = await props.searchParams;
  const retour =
    typeof searchParams.retour === "string" ? searchParams.retour : undefined;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mb-2 inline-flex size-12 items-center justify-center rounded-xl bg-white/10 text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-white">IT Operations Manager</h1>
          <p className="mt-1 text-sm text-slate-300">
            Prototype de démonstration — gestion centralisée du parc et des sauvegardes
          </p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-xl">
          <LoginForm retour={retour} />
        </div>
        <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-slate-300">
          <p className="mb-2 font-medium text-slate-200">Comptes de démonstration :</p>
          <ul className="space-y-1">
            <li><span className="font-mono">admin</span> : alice.renaud@technova.demo · mot de passe <span className="font-mono">admin123</span></li>
            <li><span className="font-mono">gestionnaire</span> : marc.dupont@technova.demo · mot de passe <span className="font-mono">demo123</span></li>
            <li><span className="font-mono">consultant</span> : paul.girard@technova.demo · mot de passe <span className="font-mono">demo123</span></li>
          </ul>
        </div>
      </div>
    </div>
  );
}