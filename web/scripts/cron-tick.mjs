#!/usr/bin/env node
/**
 * Déclencheur de la tâche planifiée de sauvegarde (O02).
 * À exécuter périodiquement (cron, Planificateur de tâches Windows) :
 *
 *   CRON_TOKEN=jeton node scripts/cron-tick.mjs
 *
 * Variables d'environnement :
 *   CRON_URL   URL de l'application (défaut http://localhost:3000)
 *   CRON_TOKEN Jeton correspondant à CRON_TOKEN de l'application
 */
const url = (process.env.CRON_URL ?? "http://localhost:3000") + "/api/cron";
const token = process.env.CRON_TOKEN ?? "";

if (!token) {
  console.error("[cron-tick] CRON_TOKEN absent — abandon.");
  process.exit(1);
}

const res = await fetch(url, {
  method: "POST",
  headers: { "x-cron-token": token, "content-type": "application/json" },
  cache: "no-store",
});

const body = await res.json().catch(() => ({}));
console.log(
  `[cron-tick] ${res.status} ${res.ok ? "OK" : body.error ?? ""} — ` +
    `${body.data?.traites ?? 0} sauvegarde(s) déclenchée(s).`
);
process.exit(res.ok ? 0 : 1);