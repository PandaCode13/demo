-- =====================================================================
-- PROTOTYPE IT OPERATIONS MANAGER — Schéma PostgreSQL
-- Document source : Conception_IT_Operations_Manager.docx (modèle de données)
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- Réinitialisation reproductible en environnement de démonstration
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS journal CASCADE;
DROP TABLE IF EXISTS sauvegardes CASCADE;
DROP TABLE IF EXISTS serveurs CASCADE;
DROP TABLE IF EXISTS equipements CASCADE;
DROP TABLE IF EXISTS utilisateurs CASCADE;

DROP TYPE IF EXISTS role_utilisateur CASCADE;
DROP TYPE IF EXISTS type_equipement CASCADE;
DROP TYPE IF EXISTS statut_sauvegarde CASCADE;

-- ---------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- hachage des mots de passe (seed)

-- ---------------------------------------------------------------------
-- Énumérations
-- ---------------------------------------------------------------------
CREATE TYPE role_utilisateur AS ENUM ('admin', 'gestionnaire', 'consultant');
CREATE TYPE type_equipement  AS ENUM ('poste_de_travail', 'portable', 'serveur', 'imprimante', 'autre');
CREATE TYPE statut_sauvegarde AS ENUM ('en_cours', 'reussie', 'partielle', 'echouee', 'annulee');

-- ---------------------------------------------------------------------
-- Table : utilisateurs
-- F02 Gestion des utilisateurs  /  F01 Authentification
-- ---------------------------------------------------------------------
CREATE TABLE utilisateurs (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    societe        VARCHAR(120) NOT NULL,
    nom            VARCHAR(80)  NOT NULL,
    prenom         VARCHAR(80)  NOT NULL,
    email          VARCHAR(255) NOT NULL UNIQUE CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
    telephone      VARCHAR(30),
    mot_de_passe   TEXT         NOT NULL, -- hash bcrypt (pgcrypto crypt())
    role           role_utilisateur NOT NULL DEFAULT 'consultant',
    actif          BOOLEAN      NOT NULL DEFAULT TRUE,
    cree_le        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    mis_a_jour_le  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Table : equipements
-- F03 Gestion des équipements  /  F05 Association utilisateur-équipement
-- F06 Modification des informations  /  O01 Informations techniques
-- ---------------------------------------------------------------------
CREATE TABLE equipements (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    utilisateur_id BIGINT REFERENCES utilisateurs(id) ON DELETE SET NULL,
    numero_machine VARCHAR(60) NOT NULL UNIQUE,
    type           type_equipement NOT NULL DEFAULT 'poste_de_travail',
    os             VARCHAR(80) NOT NULL,
    os_version     VARCHAR(40) NOT NULL,
    ipv4           INET,        -- validation adresse IPv4/IPv6
    mac            MACADDR,     -- validation adresse MAC
    dns            VARCHAR(255),
    cree_le        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    mis_a_jour_le  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Table : serveurs
-- F08 Gestion des serveurs de test
-- ---------------------------------------------------------------------
CREATE TABLE serveurs (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nom         VARCHAR(120) NOT NULL UNIQUE,
    description TEXT,
    cree_le     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Table : sauvegardes
-- F09 Enregistrement  /  F10 Statut  /  F11 Historique
-- ---------------------------------------------------------------------
CREATE TABLE sauvegardes (
    id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    serveur_id         BIGINT NOT NULL REFERENCES serveurs(id) ON DELETE CASCADE,
    date               TIMESTAMPTZ NOT NULL DEFAULT now(),
    taille_octets      BIGINT NOT NULL DEFAULT 0 CHECK (taille_octets >= 0),
    nombre_fichiers    BIGINT NOT NULL DEFAULT 0 CHECK (nombre_fichiers >= 0),
    fichiers_en_erreur BIGINT NOT NULL DEFAULT 0 CHECK (fichiers_en_erreur >= 0),
    statut             statut_sauvegarde NOT NULL DEFAULT 'en_cours',
    duree_secondes     INTEGER CHECK (duree_secondes >= 0),
    fichier_rapport    TEXT,
    cree_le            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Table : journal
-- F07 Journalisation des actions
-- ---------------------------------------------------------------------
CREATE TABLE journal (
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    utilisateur_id   BIGINT REFERENCES utilisateurs(id) ON DELETE SET NULL,
    action           VARCHAR(80) NOT NULL,
    element_concerne VARCHAR(255) NOT NULL,
    details          TEXT,
    date             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Index
-- ---------------------------------------------------------------------
CREATE INDEX idx_equipements_utilisateur  ON equipements(utilisateur_id);
CREATE INDEX idx_equipements_os           ON equipements(os);
CREATE INDEX idx_sauvegardes_serveur_date ON sauvegardes(serveur_id, date DESC);
CREATE INDEX idx_sauvegardes_statut       ON sauvegardes(statut);
CREATE INDEX idx_journal_date             ON journal(date DESC);
CREATE INDEX idx_journal_utilisateur      ON journal(utilisateur_id);
CREATE INDEX idx_utilisateurs_nom         ON utilisateurs(nom, prenom);

-- ---------------------------------------------------------------------
-- Triggers : mise à jour automatique de mis_a_jour_le
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION maj_mis_a_jour_le() RETURNS trigger AS $$
BEGIN
    NEW.mis_a_jour_le := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_utilisateurs_maj BEFORE UPDATE ON utilisateurs
    FOR EACH ROW EXECUTE FUNCTION maj_mis_a_jour_le();
CREATE TRIGGER trg_equipements_maj BEFORE UPDATE ON equipements
    FOR EACH ROW EXECUTE FUNCTION maj_mis_a_jour_le();

-- ---------------------------------------------------------------------
-- Vues utiles
-- ---------------------------------------------------------------------

-- Vue : équipements avec leur utilisateur associé (F04 recherche / F05)
CREATE VIEW v_equipements AS
SELECT e.id,
       e.numero_machine,
       e.type,
       e.os,
       e.os_version,
       e.ipv4,
       e.mac,
       e.dns,
       u.id    AS utilisateur_id,
       u.nom,
       u.prenom,
       u.email,
       u.societe,
       u.telephone,
       e.cree_le,
       e.mis_a_jour_le
FROM equipements e
LEFT JOIN utilisateurs u ON u.id = e.utilisateur_id;

-- Vue : journal lisible avec l'identité de l'acteur (F07 / F11)
CREATE VIEW v_journal AS
SELECT j.id,
       j.date,
       j.action,
       j.element_concerne,
       j.details,
       u.nom,
       u.prenom,
       u.email
FROM journal j
LEFT JOIN utilisateurs u ON u.id = j.utilisateur_id
ORDER BY j.date DESC;

-- Vue : indicateurs des sauvegardes par serveur (F12)
CREATE VIEW v_indicateurs_sauvegardes AS
SELECT s.serveur_id,
       sv.nom                                        AS serveur,
       count(*)                                      AS nb_sauvegardes,
       count(*) FILTER (WHERE s.statut = 'reussie')  AS nb_reussies,
       count(*) FILTER (WHERE s.statut = 'partielle') AS nb_partielle,
       count(*) FILTER (WHERE s.statut = 'echouee')  AS nb_echouees,
       count(*) FILTER (WHERE s.statut = 'en_cours') AS nb_en_cours,
       COALESCE(sum(s.fichiers_en_erreur), 0)        AS fichiers_en_erreur_total,
       COALESCE(sum(s.taille_octets), 0)             AS taille_totale_octets,
       round(
           avg(s.duree_secondes)
           FILTER (WHERE s.duree_secondes IS NOT NULL)
       )::int                                        AS duree_moyenne_secondes,
       max(s.date)                                   AS derniere_sauvegarde
FROM sauvegardes s
JOIN serveurs sv ON sv.id = s.serveur_id
GROUP BY s.serveur_id, sv.nom;

COMMIT;