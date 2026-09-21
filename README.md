# IT Operations Manager — Prototype

**Piloter l'infogérance, le parc informatique et les sauvegardes d'une SSII depuis une
interface unique.**

Prototype fonctionnel développé dans le cadre du **mémoire professionnel FI2CMD**, en
collaboration avec **Teknosure**. Il couvre l'ensemble du périmètre défini dans le cahier des
charges (besoins F01 → F12) et les objectifs opérationnels (O01 → O06) : gestion des
utilisateurs, inventaire du parc, supervision des serveurs, sauvegardes Restic (simulées par
défaut), journal d'activité, tableau de bord d'indicateurs et tâche planifiée.

| Composant | Technologie |
| --- | --- |
| Interface & API | **Next.js 16** (App Router) — React 19, TypeScript 5, Tailwind CSS 4 |
| Base de données | **PostgreSQL 16** (schéma versionné + données de démonstration) |
| Conteneurisation | **Docker Compose** |
| Authentification | Sessions **JWT** (cookie HttpOnly) + **bcrypt** |
| Sauvegardes | **Restic** (mode simulation par défaut, exécution réelle possible) |

> **Avertissement** : ce dépôt ne contient **aucune donnée réelle**. Tous les enregistrements
> proviennent d'un jeu de données fictif de démonstration (« TechNova », etc.).

---

## Structure du dépôt

```
Projet/
|-- Cahier_des_charges_IT_Operations_Manager.docx   # exigences source (F01–F12, O01–O06)
|-- Conception_IT_Operations_Manager.docx           # analyse & modèle de données
|-- docker-compose.yml                              # déploiement global (PostgreSQL + application)
|-- bdd/                                            # base de données
|   |-- docker-compose.yml                          #   PostgreSQL seul (développement)
|   `-- init/                                       #   01_schema.sql + 02_seed.sql
`-- web/                                            # application Next.js (voir web/README.md)
    |-- src/app/                                    #   pages et routes d'API
    |-- src/components/                             #   vues métier
    |-- src/lib/                                    #   services (db, auth, restic, …)
    `-- scripts/                                    #   automatisation (cron, tâche Windows)
```

## Démarrage rapide

### Option A — Tout en conteneurs (recommandé pour la démonstration)

```powershell
docker compose up -d --build
```

- Application : **http://localhost:3000**
- Base de données : port `5432` (db/user/mdp : `itom` / `itom` / `itom_demo`)

Schéma et données de démonstration sont initialisés automatiquement au premier démarrage.

### Option B — Développement (base conteneurisée + application locale)

```powershell
# 1) Base de données
docker compose -f bdd\docker-compose.yml up -d

# 2) Application
cd web
Copy-Item .env.example .env.local
npm install
npm run dev          # http://localhost:3000
```

## Comptes de démonstration

| Rôle | E-mail | Mot de passe |
| --- | --- | --- |
| Administrateur | `alice.renaud@technova.demo` | `admin123` |
| Gestionnaire | `marc.dupont@technova.demo` | `demo123` |
| Consultant | `paul.girard@technova.demo` | `demo123` |

## Documentation

| Sujet | Où |
| --- | --- |
| Application (installation, API REST, rôles, automatisation, limites) | [`web/README.md`](web/README.md) |
| Exigences fonctionnelles et opérationnelles | `Cahier_des_charges_IT_Operations_Manager.docx` |
| Conception et modèle de données | `Conception_IT_Operations_Manager.docx` |
| Configuration applicative | [`web/.env.example`](web/.env.example) |

## Informations pratiques

- **Réinitialiser les données de démonstration** : `docker compose -f bdd\docker-compose.yml down -v`
  puis `up -d` (les scripts d'initialisation sont rejoués).
- **Ports** : `3000` (interface) et `5432` (PostgreSQL). Ne pas superposer les deux modes A et B
  simultanément — ils se partagent le port 5432.
- **Sécurité** : valeurs de démonstration uniquement (secrets JWT/cron, mots de passe). Tout
  passage en exploitation réelle impose l'application des mesures décrites dans
  `web/README.md` (section « Sécurité et mise en production »).