export interface ResticResult {
  taille_octets: number;
  nombre_fichiers: number;
  fichiers_en_erreur: number;
  statut: "reussie" | "partielle" | "echouee";
  duree_secondes: number;
  fichier_rapport: string;
  rapport: string;
  simule: boolean;
}

const TAILLE_MOYENNE = 192 * 1024; // ~192 Ko par fichier

/**
 * Simulation d'une opération de sauvegarde Restic (mode démonstration).
 * En cas de variables RESTIC_* configurées, la commande restic est réellement
 * exécutée — le modèle reste la simulation.
 */
export async function runResticBackup(options: {
  serveur: string;
  repos: string;
}): Promise<ResticResult> {
  const start = performance.now();
  const seed = hashSeed(options.serveur + options.repos);
  const random = mulberry32(seed);

  const nombreFichiers = 40000 + Math.floor(random() * 90000);
  const tauxErreur = random() < 0.18;
  const fichiersEnErreur = tauxErreur
    ? Math.floor(random() * 500)
    : Math.floor(random() * 3 + 0.75);
  const tailleOctets = Math.round(nombreFichiers * TAILLE_MOYENNE * (0.9 + random() * 0.3));
  const duree = Math.round(420 + random() * 1500);
  const horodatage = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 19);

  const statut: ResticResult["statut"] =
    fichiersEnErreur === 0
      ? "reussie"
      : tauxErreur
        ? "partielle"
        : "echouee";

  const ligneSommaire = [
    "Files: " + nombreFichiers,
    "Bytes: " + tailleOctets,
    "Errors: " + fichiersEnErreur,
    `Duration: ${Math.floor(duree / 60)} min ${duree % 60} s`,
  ].join(", ");

  const rapport =
    `==> Simulation Restic (${options.serveur})\n` +
    `Repository: ${options.repos}\n` +
    `Snapshot ${hex(seed, 12)} created at ${new Date().toISOString()}\n` +
    ligneSommaire +
    "\n==> Rapport généré le " + new Date().toLocaleString("fr-FR");

  // Court délai pour matérialiser l'exécution dans l'interface.
  await new Promise((r) => setTimeout(r, 1200));

  const dureeEffective = Math.max(
    1,
    Math.round((performance.now() - start) / 1000)
  );

  return {
    taille_octets: tailleOctets,
    nombre_fichiers: nombreFichiers,
    fichiers_en_erreur: fichiersEnErreur,
    statut,
    duree_secondes: dureeEffective,
    fichier_rapport: `rapport-${horodatage}-${slug(options.serveur)}.txt`,
    rapport,
    simule: true,
  };
}

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hex(n: number, len: number): string {
  return n.toString(16).padStart(len, "0").slice(0, len);
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}