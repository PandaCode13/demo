export function formatBytes(o: number | null | undefined): string {
  if (o === null || o === undefined) return "—";
  const units = ["o", "Ko", "Mo", "Go", "To"];
  if (o === 0) return "0 o";
  const i = Math.min(units.length - 1, Math.floor(Math.log(o) / Math.log(1024)));
  const v = o / Math.pow(1024, i);
  const decim = v >= 100 ? 0 : v >= 10 ? 1 : 2;
  return `${v.toFixed(decim)} ${units[i]}`;
}

export function formatDuree(s: number | null | undefined): string {
  if (s === null || s === undefined) return "—";
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  if (m === 0) return `${sec} s`;
  return `${m} min ${String(sec).padStart(2, "0")} s`;
}

export function formatDate(v: string | Date | null | undefined): string {
  if (!v) return "—";
  const d = typeof v === "string" ? new Date(v) : v;
  return d.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

export function formatDateCourt(v: string | Date | null | undefined): string {
  if (!v) return "—";
  const d = typeof v === "string" ? new Date(v) : v;
  return d.toLocaleDateString("fr-FR", { dateStyle: "medium" });
}

export const LIBELLES_STATUT: Record<string, string> = {
  en_cours: "En cours",
  reussie: "Réussie",
  partielle: "Partielle",
  echouee: "Échouée",
  annulee: "Annulée",
};

export const LIBELLES_TYPE: Record<string, string> = {
  poste_de_travail: "Poste de travail",
  portable: "Portable",
  serveur: "Serveur",
  imprimante: "Imprimante",
  autre: "Autre",
};

export const LIBELLES_ROLE: Record<string, string> = {
  admin: "Administrateur",
  gestionnaire: "Gestionnaire",
  consultant: "Consultant",
};