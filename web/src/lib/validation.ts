export const TYPE_EQUIPEMENTS = [
  "poste_de_travail",
  "portable",
  "serveur",
  "imprimante",
  "autre",
] as const;

export type ValidType = (typeof TYPE_EQUIPEMENTS)[number];

export const STATUTS_SAUVEGARDE = [
  "en_cours",
  "reussie",
  "partielle",
  "echouee",
  "annulee",
] as const;

export const ROLES = ["admin", "gestionnaire", "consultant"] as const;

export type ValidRole = (typeof ROLES)[number];

export function isEmail(v: unknown): v is string {
  return (
    typeof v === "string" &&
    /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) &&
    v.length <= 255
  );
}

export function str(v: unknown, max = 500): string {
  if (typeof v !== "string") return "";
  return v.trim().slice(0, max);
}

export function strOpt(v: unknown, max = 500): string | null {
  const s = str(v, max);
  return s === "" ? null : s;
}

export function intOpt(v: unknown, min = 0): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  if (!Number.isInteger(n)) return null;
  if (n < min) return null;
  return n;
}

export function bool(v: unknown): boolean {
  return v === true || v === "true" || v === 1;
}