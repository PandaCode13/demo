# IT Operations Manager — Prototype

**Piloter l'infogérance, le parc et les sauvegardes d'une SSII depuis une interface unique.**

Prototype fonctionnel développé dans le cadre du **mémoire professionnel FI2CMD** en
collaboration avec **Teknosure**. Il couvre l'ensemble du périmètre fonctionnel défini dans
le cahier des charges (F01 → F12) et les objectifs opérationnels de l'automatisation (O01 → O06).

| Fait avec | Badge |
| --- | --- |
| Framework | Next.js 16 (App Router) — React 19 |
| Langage | TypeScript 5 |
| Style | Tailwind CSS 4 |
| Base de données | PostgreSQL 16 (+ pgcrypto) |
| Conteneurisation | Docker Compose |
| Authentification | Sessions JWT + bcrypt |
| Sauvegardes | Restic (mode simulation par défaut) |

> **Avertissement** : ce dépôt ne contient **aucune donnée réelle**. Tous les enregistrements
> proviennent d'un jeu de données fictif de démonstration (au nom de « TechNova », etc.).
> Avant toute mise en production, se référer à la section [Sécurité et mise en production](#10-sécurité-et-mise-en-production).

---

## Table des matières

1. [Présentation et objectifs](#1-présentation-et-objectifs)
2. [Périmètre fonctionnel](#2-périmètre-fonctionnel)
3. [Architecture technique](#3-architecture-technique)
4. [Jeu de données de démonstration](#4-jeu-de-données-de-démonstration)
5. [Prérequis](#5-prérequis)
6. [Installation et démarrage](#6-installation-et-démarrage)
7. [Déploiement en conteneurs](#7-déploiement-en-conteneurs)
8. [Configuration](#8-configuration)
9. [API REST](#9-api-rest)
10. [Sécurité et mise en production](#10-sécurité-et-mise-en-production)
11. [Automatisation planifiée (O02)](#11-automatisation-planifiée-o02)
12. [Rôles et permissions](#12-rôles-et-permissions)
13. [Qualité et validation](#13-qualité-et-validation)
14. [Structure du projet](#14-structure-du-projet)
15. [Limites connues et perspectives](#15-limites-connues-et-perspectives)

---

## 1. Présentation et objectifs

L'**IT Operations Manager** répond à un besoin exprimé par Teknosure : disposer d'un outil
permettant à une SSII de gérer en un seul endroit :

- la **gestion des utilisateurs** (comptes clients, rôles, droits) ;
- l'**inventaire du parc** (postes, portables, serveurs, imprimantes) et son **association
  aux utilisateurs** ;
- la **supervision des serveurs** sous contrat d'infogérance ;
- les **sauvegardes** : enregistrement, statut, historique, rapport Restic, vérification ;
- le **journal d'activité** traçable par acteur ;
- le **tableau de bord d'indicateurs** pour le suivi opérationnel ;
- l'**automatisation** du déclenchement des sauvegardes via une tâche planifiée.

Le prototype est **monolithique full-stack** : une application Next.js expose à la fois le
front-office (pages React) et le back-office (API REST), ce qui simplifie le déploiement de
la démonstration tout en conservant des couches applicatives clairement séparées.

## 2. Périmètre fonctionnel

| Identifiant | Exigence | Statut |
| --- | --- | --- |
| **F01** | Authentification (connexion / déconnexion / session) | ✓ Implémenté |
| **F02** | Gestion des utilisateurs (CRUD, rôles, activation) | ✓ Implémenté |
| **F03** | Gestion des équipements (inventaire) | ✓ Implémenté |
| **F04** | Recherche et filtres du parc | ✓ Implémenté |
| **F05** | Association utilisateur ↔ équipement | ✓ Implémenté |
| **F06** | Modification des informations d'un équipement | ✓ Implémenté |
| **F07** | Journalisation des actions | ✓ Implémenté |
| **F08** | Gestion des serveurs de test | ✓ Implémenté |
| **F09** | Enregistrement des sauvegardes | ✓ Implémenté |
| **F10** | Suivi du statut des sauvegardes | ✓ Implémenté |
| **F11** | Historique des sauvegardes (rapports) | ✓ Implémenté |
| **F12** | Indicateurs et tableau de bord | ✓ Implémenté |
| **O01** | Informations techniques (rapport de sauvegarde) | ✓ Implémenté |
| **O02** | Tâche planifiée de sauvegarde | ✓ Implémenté |
| **O03** | Intégration Restic | ✓ Implémenté (simulation par défaut) |
| **O04** | Vérification des sauvegardes | ✓ Implémenté |
| **O05** | Notifications d'erreurs | ✓ Implémenté |
| **O06** | Tableau de bord de pilotage | ✓ Implémenté |

## 3. Architecture technique

### 3.1 Vue d'ensemble

```
                    ╔═══════════════════════════════════════════════════════╗
                    ║              Application Next.js 16 (web/)            ║
                    ║                                                       ║
 Front             ║   ┌─────────────┐       ┌──────────────────────────┐   ║
  Navigateur  ───►   ║   │  Pages      │  ──►  │  Routes API (/api/*)    │   ║
                    ║   │  (App Router)│       │  Route Handlers         │   ║
                    ║   └──────┬──────┘       └───────────┬──────────────┘   ║
                    ║          │  fetch client (cookie)   │                  ║
                    ║   ┌──────┴──────┐        ┌──────────┴──────────────┐   ║
                    ║   │ proxy.ts    │        │  Couche services         │   ║
                    ║   │ garde session│        │  auth / db / validation │   ║
                    ║   └─────────────┘        │  journal / restic        │   ║
                    ║                          └──────────┬──────────────┘   ║
                    ╚══════════════════════════════════════╪═════════════════╝
                                                            │  node-postgres (pg)
                    ╔══════════════════════════════════════╧═════════════════╗
                    ║              PostgreSQL 16 (bdd/)                       ║
                    ║  utilisateurs · equipements · serveurs · sauvegardes ·  ║
                    ║  journal  (+ vues & triggers)                           ║
                    ╚════════════════════════════════════════════════════════╝
```

### 3.2 Choix techniques

| Composant | Choix | Justification |
| --- | --- | --- |
| Framework | **Next.js 16 + React 19** | Monolithe full-stack (RSC + route handlers), déploiement simple, TypeScript natif |
| Connecteur BD | **node-postgres (`pg`)** | Driver PostgreSQL officiel et performant, `Pool` de connexions |
| Authentification | **JWT (cookie `HttpOnly`)** + **bcryptjs** | Session signée en cookie non lisible par le navigateur ; hachage bcrypt des mots de passe (compatible avec `pgcrypto` du seed) |
| DAO/Schéma | **SQL versionné** (`bdd/init`) | Reprise fidèle du modèle de données du document de conception |
| Styles | **Tailwind CSS 4** | Design system sobre et cohérent, sans dépendance UI lourde |
| Conteneurs | **Docker Compose** | Environnement reproductible (BD, et variante globale BD + app) |

> **Note Next.js 16** : ce projet respecte les changements majeurs de Next.js 16
> (`proxy.ts` remplace `middleware.ts`, `params`/`searchParams`/`cookies()` asynchrones,
> génériques `RouteContext`/`PageProps`/`LayoutProps`, build Turbopack). Consulter la
> documentation fournie dans `web/node_modules/next/dist/docs/` avant toute modification.

## 4. Jeu de données de démonstration

### 4.1 Comptes

| Rôle | E-mail | Mot de passe |
| --- | --- | --- |
| **Administrateur** | `alice.renaud@technova.demo` | `admin123` |
| **Gestionnaire** | `marc.dupont@technova.demo` | `demo123` |
| **Consultant** | `paul.girard@technova.demo` | `demo123` |

Trois comptes complémentaires existent pour illustrer la multi-société :
`Sophie Lambert` (gestionnaire, InnovData) et `Julien Mercier` / `Fatou Diallo`
(consultants, InnovData / LogiTrans), mot de passe `demo123`.

### 4.2 Contenu

| Entité | Volume | Description |
| --- | --- | --- |
| Utilisateurs | 6 | 3 sociétés différentes, 3 rôles |
| Équipements | 8 | postes, portables, serveurs (dont 2 non attribués) |
| Serveurs | 3 | SRV-FICHIERS-01, SRV-BDD-01, SRV-INFRA-01 |
| Sauvegardes | 11 | statuts réussie / partielle / échouée / en cours |
| Journal | 8 | actions typiques (connexion, CRUD, sauvegardes, vérification) |

Le corpus couvre les trois états opérationnels qui intéressent la démonstration :
un **échec avec 342 fichiers en erreur** (→ notifications O05), une sauvegarde **en cours**,
et un **taux de réussite de 90 %** (→ indicateurs F12).

## 5. Prérequis

- **Node.js ≥ 20.9** (recommandé : 22 LTS) et npm ;
- **Docker Desktop** (pour PostgreSQL) ;
- *Optionnel* : installation Restic pour l'exécution réelle des sauvegardes (sinon simulation).

Vérifications rapides :

```powershell
node -v        # v20.9+ ou 22.x
npm -v
docker --version
docker compose version
```

## 6. Installation et démarrage

### 6.1 Démarrage rapide (développement)

```powershell
# 1) Démarrer la base de données (schéma + seed automatiques au 1er lancement)
cd bdd
docker compose up -d

# 2) Configurer l'application
cd ..\web
Copy-Item .env.example .env.local

# 3) Installer les dépendances
npm install

# 4) Lancer en mode développement
npm run dev
```

Ouvrir **http://localhost:3000** et se connecter avec un compte de la section 4.1.

### 6.2 Cycle de construction

```powershell
npm run lint      # vérifications statiques (ESLint + règles React)
npm run build     # compilation optimisée + validation TypeScript
npm start         # serveur de production (après build)
```

### 6.3 Réinitialiser les données de démonstration

Pour repartir du jeu de données d'origine (supprime le volume de données) :

```powershell
cd bdd
docker compose down -v      # arrête le conteneur et supprime le volume
docker compose up -d        # recrée la base et relance les scripts d'init
```

## 7. Déploiement en conteneurs

Deux stratégies sont fournies :

| Stratégie | Composés | Usage |
| --- | --- | --- |
| **Base seule** (développement) | `bdd/docker-compose.yml` | PostgreSQL uniquement, application lancée via `npm run dev` |
| **Globale** (démonstration complète) | `docker-compose.yml` (racine) | PostgreSQL **+** application servie en production |

### 7.1 Déploiement global

L'application est conteneurisée en sortie **standalone** (`next.config.ts` /
`web/Dockerfile`), image ~55 Mo ne contenant ni `node_modules` ni sources.

```powershell
# à la racine du projet
docker compose up -d --build
```

- L'application répond sur `http://localhost:3000` ;
- la base sur le port `5432` (accessible pour des outils externes) ;
- les variables applicatives sont injectées par Compose (voir `environment` dans
  `docker-compose.yml`).

> **Important** : ne pas faire tourner simultanément le Compose global et
> `bdd/docker-compose.yml` : les deux exposent le port `5432`.

## 8. Configuration

La configuration s'effectue via le fichier **`.env.local`** (non versionné), calqué sur
`.env.example`.

| Variable | Défaut (démo) | Rôle |
| --- | --- | --- |
| `DATABASE_URL` | `postgres://itom:itom_demo@localhost:5432/itom` | Chaîne de connexion PostgreSQL |
| `JWT_SECRET` | `changer-moi-secret-jwt-demo-itom` | Secret de signature des jetons de session |
| `JWT_EXPIRES_IN` | `43200` | Durée de vie des sessions en secondes (12 h) |
| `CRON_TOKEN` | `changer-moi-jeton-cron-demo` | Jeton requis par `POST /api/cron` (en-tête `x-cron-token`) |
| `RESTIC_BINARY` | *(vide)* | Chemin du binaire Restic — **vide = simulation** |
| `RESTIC_REPOSITORY` | *(vide)* | Dépôt Restic (ex. `rest:...`, chemin local, `s3:...`) |
| `RESTIC_PASSWORD` | *(vide)* | Mot de passe du dépôt Restic |
| `CRON_URL` | `http://localhost:3000` | *Script* — URL de l'application (script `cron-tick.mjs`) |

> Le fichier `.env.local` est exclu du dépôt via `.gitignore`. Ne jamais y stocker de
> secret réel.

## 9. API REST

Toutes les routes sont servies par l'application elle-même. Sauf mention contraire,
elles exigent une session (cookie `itom_token`) et vérifient le rôle appelant.

### 9.1 Authentification

| Méthode | Chemin | Rôle min | Corps / paramètres | Description |
| --- | --- | --- | --- | --- |
| `POST` | `/api/auth/login` | public | `{ email, mot_de_passe }` | Connexion ; émet le cookie `HttpOnly` et renvoie le profil |
| `POST` | `/api/auth/logout` | session | — | Déconnexion (supprime le cookie) |
| `GET` | `/api/auth/me` | session | — | Profil de l'utilisateur courant |

### 9.2 Pilotage

| Méthode | Chemin | Rôle min | Description |
| --- | --- | --- | --- |
| `GET` | `/api/indicateurs` | consultant | Agrégats globaux, par serveur, taux de succès, actions fréquentes |
| `GET` | `/api/notifications` | consultant | Alertes (sauvegardes échouées / partielles, fichiers en erreur) |
| `GET` | `/api/journal?limite=500` | consultant | Journal d'activité (par défaut 200, max 500) |

### 9.3 Utilisateurs

| Méthode | Chemin | Rôle min | Description |
| --- | --- | --- | --- |
| `GET` | `/api/utilisateurs` | gestionnaire | Liste des comptes |
| `POST` | `/api/utilisateurs` | admin | Création (mot de passe ≥ 8 caractères) |
| `PUT` | `/api/utilisateurs/:id` | admin | Modification |
| `PATCH` | `/api/utilisateurs/:id` | admin | Réinitialisation du mot de passe |
| `DELETE` | `/api/utilisateurs/:id` | admin | Suppression d'un compte |

Codes d'erreur : `400` validation, `401` non authentifié, `403` droits insuffisants,
`404` introuvable, `409` e-mail déjà utilisé.

### 9.4 Équipements

| Méthode | Chemin | Rôle min | Description |
| --- | --- | --- | --- |
| `GET` | `/api/equipements` | consultant | Liste + **filtres** : `q` (recherche), `type`, `os`, `utilisateur_id`, `non_attribue=1` |
| `POST` | `/api/equipements` | gestionnaire | Création (numéro de machine unique) |
| `GET` | `/api/equipements/:id` | consultant | Détail |
| `PUT` | `/api/equipements/:id` | gestionnaire | Modification (F06) |
| `PATCH` | `/api/equipements/:id` | gestionnaire | Association / dissociation utilisateur (F05) |
| `DELETE` | `/api/equipements/:id` | gestionnaire | Suppression |

Les adresses `ipv4` (`INET`) et `mac` (`MACADDR`) sont validées par PostgreSQL (erreur
`400` si invalides) ; la duplication d'un numéro de machine renvoie `409`.

### 9.5 Serveurs

| Méthode | Chemin | Rôle min | Description |
| --- | --- | --- | --- |
| `GET` | `/api/serveurs` | consultant | Liste |
| `POST` | `/api/serveurs` | gestionnaire | Création |
| `PUT` | `/api/serveurs/:id` | gestionnaire | Modification |
| `DELETE` | `/api/serveurs/:id` | gestionnaire | Suppression |

### 9.6 Sauvegardes

| Méthode | Chemin | Rôle min | Description |
| --- | --- | --- | --- |
| `GET` | `/api/sauvegardes` | consultant | Historique + **filtres** : `serveur_id`, `statut`, `limite` |
| `POST` | `/api/sauvegardes` | gestionnaire | Lancement `{ serveur_id, mode }` → simulation Restic (O03) |
| `GET` | `/api/sauvegardes/:id` | consultant | Détail + rapport `fichier_rapport` |
| `PATCH` | `/api/sauvegardes/:id` | gestionnaire | Vérification manuelle (O04), journalisée |

### 9.7 Automatisation

| Méthode | Chemin | Protection | Description |
| --- | --- | --- | --- |
| `POST` | `/api/cron` | en-tête `x-cron-token` | Détecte les serveurs sans sauvegarde « en cours » depuis **24 h** et déclenche leur sauvegarde |

### 9.8 Format des réponses

```jsonc
// Réussite
{ "data": { /* donnée(s) */ } }

// Erreur
{ "error": "Message explicite" }   // HTTP 4xx/5xx
```

## 10. Sécurité et mise en production

Le prototype applique déjà des pratiques de base, mais un passage en exploitation réelle
exige les mesures suivantes :

| Domaine | Mesures à mettre en œuvre |
| --- | --- |
| Transport | Terminaison TLS (HTTPS) devant le serveur `web`, cookies `Secure` |
| Secrets | `JWT_SECRET` et `CRON_TOKEN` générés aléatoirement et gérés par un coffre-fort (SSM, env du conteneur, secret manager), jamais dans le dépôt |
| Base de données | Compte applicatif dédié (droits limités au schéma métier), sauvegarde de la BD, réseau isolé |
| Mots de passe | Si hébergé : politique de complexité, blocage après échecs répétés, rotation périodique (bcrypt déjà en place) |
| Journaux | Rétention et archivage du `journal` conformément aux obligations (RGPD, traçabilité) ; ne pas y mettre de données sensibles |
| Données | Aucune donnée réelle de client ne doit être importée sans mesure préalable (masquage, consentement) |
| Vulnérabilités | Veille sur les dépendances (`npm audit`) et mises à jour régulières |

## 11. Automatisation planifiée (O02)

### 11.1 Principe

Une **tâche planifiée** appelle périodiquement `POST /api/cron`. Celui-ci identifie les
serveurs dont la dernière sauvegarde date de plus de **24 heures** (hors statut « en cours »)
et déclenche leur sauvegarde. Chaque déclenchement est tracé dans le journal
(action `lancement_sauvegarde`).

### 11.2 Exécution manuelle (test)

```powershell
# depuis web/ — la variable CRON_TOKEN doit valoir celle de .env.local
$env:CRON_TOKEN = "changer-moi-jeton-cron-demo"
node scripts\cron-tick.mjs
# [cron-tick] 200 OK — 1 sauvegarde(s) déclenchée(s).
```

### 11.3 Planification sous Windows

```powershell
# crée la tâche « ITOM-Sauvegarde-Horaire » (toutes les heures, pendant 365 jours)
powershell -ExecutionPolicy Bypass -File .\scripts\creer_tache_planifiee.ps1 -Jeton "changer-moi-jeton-cron-demo"
```

> Penser à définir la variable d'environnement **`CRON_TOKEN`** (et éventuellement
> `CRON_URL`) au niveau du système pour que la tâche planifiée fonctionne sans intervention.

### 11.4 Planification équivalente (Linux / cron)

```cron
0 * * * *   CRON_TOKEN="changer-moi-jeton-cron-demo" node /opt/itom/scripts/cron-tick.mjs
```

## 12. Rôles et permissions

Matrice des accès applicatifs :

| Fonction | Consultant | Gestionnaire | Administrateur |
| --- | :---: | :---: | :---: |
| Tableau de bord, indicateurs, journal, notifications | ✓ | ✓ | ✓ |
| Parc : consultation | ✓ | ✓ | ✓ |
| Parc : création / modification / association / suppression | — | ✓ | ✓ |
| Serveurs : consultation | ✓ | ✓ | ✓ |
| Serveurs : création / modification / suppression | — | ✓ | ✓ |
| Sauvegardes : consultation / rapports | ✓ | ✓ | ✓ |
| Sauvegardes : lancement et vérification (O04) | — | ✓ | ✓ |
| Utilisateurs : consultation | — | ✓ | ✓ |
| Utilisateurs : gestion complète (création, rôles, mot de passe) | — | — | ✓ |
| Administration (comptes, matériel selon rôle) | — | — | ✓ |

La vérification s'effectue côté API avec `requireRole(user, niveauMin)` ; l'interface
masque en parallèle les actions non autorisées.

## 13. Qualité et validation

| Commande | Rôle |
| --- | --- |
| `npm run lint` | ESLint 9 (règles TypeScript, React, Next) — **0 erreur** actuellement |
| `npm run build` | Compilation optimisée (Turbopack), **validation TypeScript**, génération des routes |
| `npx next typegen` | Génération des types globaux Next 16 (`RouteContext`, `PageProps`, …) |

Validation bout-en-bout effectuée (cette version) : connexion des 3 comptes, contrôle des
rôles (401/403), CRUD utilisateurs / équipements / serveurs, lancement d'une sauvegarde
simulée, vérification O04, endpoint cron avec jeton, redirection du `proxy` vers `/login`
sans session, redémarrage de la base sur seed propre.

## 14. Structure du projet

```
Projet/
|-- docker-compose.yml          # Compose global : PostgreSQL + application
|-- Cahier_des_charges_...docx  # Exigences source (F01-F12, O01-O06)
|-- Conception_...docx          # Modèle de données et conception
|-- bdd/                        # Base de données
|   |-- docker-compose.yml      #   PostgreSQL seul (développement)
|   `-- init/
|       |-- 01_schema.sql       #   schéma (tables, types, vues, triggers)
|       `-- 02_seed.sql         #   données fictives de démonstration
`-- web/                        # Application Next.js 16
    |-- next.config.ts          #   sortie standalone
    |-- Dockerfile              #   image de production
    |-- .env.example            #   modèle de configuration
    |-- src/proxy.ts            #   garde de session des pages
    |-- src/app/
    |   |-- api/                #   routes d'API (route handlers)
    |   |   |-- auth/           #     login, logout, me
    |   |   |-- utilisateurs/   #     (+ [id])
    |   |   |-- equipements/    #     (+ [id])
    |   |   |-- serveurs/       #     (+ [id])
    |   |   |-- sauvegardes/    #     (+ [id])
    |   |   `-- journal/        #     indicateurs, notifications, cron
    |   |-- (dashboard)/        #   pages : tableau de bord, équipements,
    |   |   |-- page.tsx        #   serveurs, sauvegardes, utilisateurs, journal
    |   |   `-- ...
    |   `-- login/page.tsx      #   page de connexion
    |-- src/components/         #   vues métier et composants d'interface
    |-- src/lib/                #   db (Pool pg) · auth (JWT) · validation ·
    |                           #   journal · format · restic · client
    `-- scripts/
        |-- cron-tick.mjs       #   appel périodique de l'endpoint /api/cron
        `-- creer_tache_planifiee.ps1    #   inscription de la tâche Windows
```

## 15. Limites connues et perspectives

| Limite | Commentaire | Perspective |
| --- | --- | --- |
| Restic **simulé** par défaut | Les métriques et rapports sont générés de façon réaliste sans binaire | Renseigner `RESTIC_BINARY`, `RESTIC_REPOSITORY`, `RESTIC_PASSWORD` pour exécuter des sauvegardes réelles |
| Pas de fédération / SSO | Authentification locale uniquement | Intégration OIDC / LDAP pour un environnement d'entreprise |
| Notifications applicatives | Alertes visibles dans l'interface | Envoi e-mail / messagerie, abonnements par destinataire |
| Monitoring de l'application | Aucun | Métriques applicatives et journaux centralisés (APM) |
| Tests automatisés | Validation manuelle + lint/build | Ajouter des tests unitaires (API) et de bout en bout (Playwright) |
| Entrée du parc manuelle | Le parc est décrit manuellement dans la démonstration | Importation automatique depuis les contrats / l'inventaire réel |

---

*Directive de bon usage : ce projet est un support pédagogique et de démonstration.
Toute mise en production réelle requiert l'application de la section 10.*