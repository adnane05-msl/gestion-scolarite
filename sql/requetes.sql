USE gestion_scolarite;

-- 1. SELECTION ET FILTRAGE
-- Les etudiants inscrits en Data et IA pour l annee 2026
SELECT e.nom, e.prenom, e.cne, i.date_inscription
FROM ETUDIANT e
JOIN INSCRIPTION i ON i.id_etudiant = e.id_etudiant
JOIN FILIERE f     ON f.id_filiere  = i.id_filiere
WHERE f.nom_filiere = 'Data et IA'
  AND i.annee_universitaire = 2026
ORDER BY e.nom;

-- 2. JOINTURE SIMPLE
-- Le releve de notes d un etudiant identifie par son CNE
SELECT m.nom_module, x.date_examen, n.valeur_note
FROM NOTE n
JOIN EXAMEN x   ON x.id_examen = n.id_examen
JOIN MODULE m   ON m.id_module = x.id_module
JOIN ETUDIANT e ON e.id_etudiant = n.id_etudiant
WHERE e.cne = 'CNE009'
ORDER BY x.date_examen;

-- 3. JOINTURE MULTIPLE
-- Qui enseigne quoi, et dans quelles filieres
SELECT CONCAT(ens.prenom, ' ', ens.nom) AS enseignant,
       m.nom_module,
       f.nom_filiere
FROM ENSEIGNANT ens
JOIN ENSEIGNER en ON en.id_enseignant = ens.id_enseignant
JOIN MODULE m     ON m.id_module      = en.id_module
JOIN CONTENIR c   ON c.id_module      = m.id_module
JOIN FILIERE f    ON f.id_filiere     = c.id_filiere
ORDER BY enseignant, f.nom_filiere;

-- 4. AGREGATION AVEC GROUP BY
-- Moyenne et nombre de notes par module
SELECT m.nom_module,
       COUNT(n.id_note)              AS nb_notes,
       ROUND(AVG(n.valeur_note), 2)  AS moyenne,
       MIN(n.valeur_note)            AS note_min,
       MAX(n.valeur_note)            AS note_max
FROM MODULE m
JOIN EXAMEN x ON x.id_module = m.id_module
JOIN NOTE n   ON n.id_examen = x.id_examen
GROUP BY m.id_module, m.nom_module
ORDER BY moyenne DESC;

-- 5. GROUP BY AVEC HAVING
-- Les etudiants cumulant plus de 2 heures d absence non justifiee
SELECT e.nom, e.prenom,
       COUNT(a.id_absence)  AS nb_absences,
       SUM(a.nb_heures)     AS heures_non_justifiees
FROM ETUDIANT e
JOIN ABSENCE a ON a.id_etudiant = e.id_etudiant
WHERE a.justifie = FALSE
GROUP BY e.id_etudiant, e.nom, e.prenom
HAVING SUM(a.nb_heures) > 2
ORDER BY heures_non_justifiees DESC;

-- 6. SOUS-REQUETE
-- Les etudiants dont la moyenne depasse la moyenne generale de la promotion
SELECT e.nom, e.prenom,
       ROUND(AVG(n.valeur_note), 2) AS moyenne
FROM ETUDIANT e
JOIN NOTE n ON n.id_etudiant = e.id_etudiant
GROUP BY e.id_etudiant, e.nom, e.prenom
HAVING AVG(n.valeur_note) > (SELECT AVG(valeur_note) FROM NOTE)
ORDER BY moyenne DESC;

-- 7. SOUS-REQUETE CORRELEE
-- Les etudiants n ayant aucune absence enregistree
SELECT e.nom, e.prenom, e.cne
FROM ETUDIANT e
WHERE NOT EXISTS (
    SELECT 1
    FROM ABSENCE a
    WHERE a.id_etudiant = e.id_etudiant
)
ORDER BY e.nom;

-- 8. REQUETE ELABOREE
-- Classement des etudiants a l interieur de chaque filiere,
-- avec leur moyenne et leur total d heures d absence
SELECT f.nom_filiere,
       s.nom,
       s.prenom,
       s.moyenne,
       s.heures_absence,
       RANK() OVER (PARTITION BY s.id_filiere ORDER BY s.moyenne DESC) AS rang
FROM (
    SELECT i.id_filiere,
           e.id_etudiant,
           e.nom,
           e.prenom,
           ROUND(AVG(n.valeur_note), 2) AS moyenne,
           (SELECT COALESCE(SUM(a.nb_heures), 0)
            FROM ABSENCE a
            WHERE a.id_etudiant = e.id_etudiant) AS heures_absence
    FROM ETUDIANT e
    JOIN INSCRIPTION i ON i.id_etudiant = e.id_etudiant
    JOIN NOTE n        ON n.id_etudiant = e.id_etudiant
    GROUP BY i.id_filiere, e.id_etudiant, e.nom, e.prenom
) AS s
JOIN FILIERE f ON f.id_filiere = s.id_filiere
ORDER BY f.nom_filiere, rang;