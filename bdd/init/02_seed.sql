-- =====================================================================
-- PROTOTYPE IT OPERATIONS MANAGER — Données fictives de démonstration
-- Aucune donnée réelle de Teknosure ou FI2CMD.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- Utilisateurs (F02)
-- ---------------------------------------------------------------------
INSERT INTO utilisateurs (societe, nom, prenom, email, telephone, mot_de_passe, role) VALUES
('TechNova',  'Renaud',  'Alice',   'alice.renaud@technova.demo',   '01 23 45 67 01', crypt('admin123',   gen_salt('bf', 10)), 'admin'),
('TechNova',  'Dupont',  'Marc',    'marc.dupont@technova.demo',    '01 23 45 67 02', crypt('demo123',    gen_salt('bf', 10)), 'gestionnaire'),
('TechNova',  'Girard',  'Paul',    'paul.girard@technova.demo',    '01 23 45 67 03', crypt('demo123',    gen_salt('bf', 10)), 'consultant'),
('InnovData', 'Lambert', 'Sophie',  'sophie.lambert@innovdata.demo','01 23 45 67 04', crypt('demo123',    gen_salt('bf', 10)), 'gestionnaire'),
('InnovData', 'Mercier', 'Julien',  'julien.mercier@innovdata.demo','01 23 45 67 05', crypt('demo123',    gen_salt('bf', 10)), 'consultant'),
('LogiTrans', 'Diallo',  'Fatou',   'fatou.diallo@logitrans.demo',  '01 23 45 67 06', crypt('demo123',    gen_salt('bf', 10)), 'consultant');

-- ---------------------------------------------------------------------
-- Équipements (F03, F05, F06)
-- ---------------------------------------------------------------------
INSERT INTO equipements (utilisateur_id, numero_machine, type, os, os_version, ipv4, mac, dns) VALUES
((SELECT id FROM utilisateurs WHERE email = 'alice.renaud@technova.demo'),   'TECH-WS-0001', 'poste_de_travail', 'Windows', '11 Pro 23H2', '10.0.1.11', '00:1A:2B:3C:4D:01', 'tech-ws-0001.technova.local'),
((SELECT id FROM utilisateurs WHERE email = 'marc.dupont@technova.demo'),    'TECH-WS-0002', 'poste_de_travail', 'Windows', '11 Pro 23H2', '10.0.1.12', '00:1A:2B:3C:4D:02', 'tech-ws-0002.technova.local'),
((SELECT id FROM utilisateurs WHERE email = 'paul.girard@technova.demo'),    'TECH-PC-0003', 'portable',        'Ubuntu',  '24.04 LTS',     '10.0.1.13', '00:1A:2B:3C:4D:03', 'tech-pc-0003.technova.local'),
((SELECT id FROM utilisateurs WHERE email = 'sophie.lambert@innovdata.demo'),'INN-WS-0101', 'poste_de_travail', 'Windows', '10 Pro 22H2', '10.0.2.21', '00:1A:2B:3C:4D:11', 'inn-ws-0101.innovdata.demo'),
((SELECT id FROM utilisateurs WHERE email = 'julien.mercier@innovdata.demo'),'INN-PC-0102', 'portable',        'macOS',   'Sonoma 14.5',  '10.0.2.22', '00:1A:2B:3C:4D:12', 'inn-pc-0102.innovdata.demo'),
((SELECT id FROM utilisateurs WHERE email = 'fatou.diallo@logitrans.demo'),  'LOG-PT-0201', 'poste_de_travail','Windows', '11 Pro 23H2', '10.0.3.31', '00:1A:2B:3C:4D:21', 'log-pt-0201.logitrans.demo'),
(NULL,                                                                       'TECH-CORE-0001', 'serveur',        'Debian', '12',           '10.0.1.10', '00:1A:2B:3C:4D:09', 'tech-core-0001.technova.local'),
(NULL,                                                                       'INN-CORE-0101', 'serveur',        'Ubuntu', '22.04 LTS',    '10.0.2.20', '00:1A:2B:3C:4D:19', 'inn-core-0101.innovdata.demo');

-- ---------------------------------------------------------------------
-- Serveurs de test (F08)
-- ---------------------------------------------------------------------
INSERT INTO serveurs (nom, description) VALUES
('SRV-FICHIERS-01', 'Serveur de fichiers principal — partage et stockage de test'),
('SRV-BDD-01',      'Serveur de base de données — environnement de démonstration'),
('SRV-INFRA-01',    'Serveur d''infrastructure — contrôleur de domaine de test');

-- ---------------------------------------------------------------------
-- Sauvegardes (F09, F10, F11)
-- ---------------------------------------------------------------------
INSERT INTO sauvegardes (serveur_id, date, taille_octets, nombre_fichiers, fichiers_en_erreur, statut, duree_secondes, fichier_rapport) VALUES
((SELECT id FROM serveurs WHERE nom = 'SRV-FICHIERS-01'), now() - interval '12 days 9 hours',  512000000000, 124500, 0,   'reussie',  1873, 'rapport-2026-09-09-srv-fichiers-01.txt'),
((SELECT id FROM serveurs WHERE nom = 'SRV-FICHIERS-01'), now() - interval '9 days 9 hours',   507000000000, 123900, 0,   'reussie',  1805, 'rapport-2026-09-12-srv-fichiers-01.txt'),
((SELECT id FROM serveurs WHERE nom = 'SRV-FICHIERS-01'), now() - interval '7 days 9 hours',   531000000000, 129800, 0,   'partielle',1841, 'rapport-2026-09-14-srv-fichiers-01.txt'),
((SELECT id FROM serveurs WHERE nom = 'SRV-FICHIERS-01'), now() - interval '4 days 9 hours',   488000000000, 121000, 0,   'reussie',  1762, 'rapport-2026-09-17-srv-fichiers-01.txt'),
((SELECT id FROM serveurs WHERE nom = 'SRV-FICHIERS-01'), now() - interval '1 day 9 hours',    266000000000,  80215, 342, 'echouee',  1520, 'rapport-2026-09-20-srv-fichiers-01.txt'),
((SELECT id FROM serveurs WHERE nom = 'SRV-BDD-01'),      now() - interval '11 days 9 hours',   412000000000,  98600, 0,   'reussie',  1533, 'rapport-2026-09-10-srv-bdd-01.txt'),
((SELECT id FROM serveurs WHERE nom = 'SRV-BDD-01'),      now() - interval '5 days 9 hours',    418000000000,  99540, 0,   'reussie',  1568, 'rapport-2026-09-16-srv-bdd-01.txt'),
((SELECT id FROM serveurs WHERE nom = 'SRV-BDD-01'),      now() - interval '2 days 9 hours',    215000000000,  51000, 0,   'reussie',   802, 'rapport-2026-09-19-srv-bdd-01.txt'),
((SELECT id FROM serveurs WHERE nom = 'SRV-INFRA-01'),    now() - interval '12 days 9 hours',   98000000000,   12800, 0,   'reussie',   612, 'rapport-2026-09-09-srv-infra-01.txt'),
((SELECT id FROM serveurs WHERE nom = 'SRV-INFRA-01'),    now() - interval '3 days 9 hours',    97000000000,   12775, 0,   'reussie',   598, 'rapport-2026-09-18-srv-infra-01.txt'),
((SELECT id FROM serveurs WHERE nom = 'SRV-INFRA-01'),    now() - interval '6 hours',              4123000000,     912, 0, 'en_cours',  NULL, NULL);

-- ---------------------------------------------------------------------
-- Journal (F07)
-- ---------------------------------------------------------------------
INSERT INTO journal (utilisateur_id, action, element_concerne, details, date) VALUES
((SELECT id FROM utilisateurs WHERE email = 'alice.renaud@technova.demo'),   'connexion',              'session',                     'Connexion réussie depuis le poste administration', now() - interval '13 days'),
((SELECT id FROM utilisateurs WHERE email = 'alice.renaud@technova.demo'),   'ajout_equipement',       'TECH-WS-0001',                'Ajout du poste de travail Windows 11',           now() - interval '12 days 20 hours'),
((SELECT id FROM utilisateurs WHERE email = 'alice.renaud@technova.demo'),   'association_utilisateur', 'TECH-WS-0001',                'Association avec alice.renaud@technova.demo',    now() - interval '12 days 19 hours'),
((SELECT id FROM utilisateurs WHERE email = 'marc.dupont@technova.demo'),    'modification_equipement', 'INN-WS-0101',                 'Mise à jour de la version d''adresse MAC',       now() - interval '8 days'),
((SELECT id FROM utilisateurs WHERE email = 'marc.dupont@technova.demo'),    'lancement_sauvegarde',    'SRV-FICHIERS-01',             'Déclenchement manuel de la sauvegarde',          now() - interval '1 day 9 hours'),
((SELECT id FROM utilisateurs WHERE email = 'sophie.lambert@innovdata.demo'),'verification_sauvegarde', 'SRV-FICHIERS-01',             'Vérification du rapport : 342 fichiers en erreur', now() - interval '1 day 8 hours'),
((SELECT id FROM utilisateurs WHERE email = 'sophie.lambert@innovdata.demo'),'consultation_indicateurs','indicateurs',                 'Consultation du tableau de bord',                now() - interval '2 days'),
((SELECT id FROM utilisateurs WHERE email = 'fatou.diallo@logitrans.demo'),  'connexion',              'session',                     'Connexion réussie',                              now() - interval '3 hours'),
(NULL,                                                                       'lancement_sauvegarde',    'SRV-INFRA-01',                'Déclenchement planifié (tâche cron)',            now() - interval '6 hours');

COMMIT;