import { query } from "@/lib/db";

export interface EntreeJournal {
  utilisateur_id: number | null;
  action: string;
  element_concerne: string;
  details?: string | null;
}

export async function logAction(entree: EntreeJournal): Promise<void> {
  try {
    await query(
      `INSERT INTO journal (utilisateur_id, action, element_concerne, details)
       VALUES ($1, $2, $3, $4)`,
      [
        entree.utilisateur_id,
        entree.action,
        entree.element_concerne,
        entree.details ?? null,
      ]
    );
  } catch (err) {
    // La journalisation ne doit jamais bloquer une action métier.
    console.error("Échec de journalisation", err);
  }
}