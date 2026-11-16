USE gestion_scolarite;

-- AVANT INDEX
EXPLAIN SELECT * FROM ETUDIANT WHERE nom = 'Amrani';

EXPLAIN SELECT * FROM ABSENCE
WHERE date_absence BETWEEN '2026-10-01' AND '2026-10-15';

-- CREATION DES INDEX
-- Index 1 : recherche d un etudiant par son nom (fonction de recherche de l application)
CREATE INDEX idx_etudiant_nom ON ETUDIANT(nom, prenom);

-- Index 2 : filtrage des absences sur une periode (suivi mensuel de l assiduite)
CREATE INDEX idx_absence_date ON ABSENCE(date_absence);

-- APRES INDEX
EXPLAIN SELECT * FROM ETUDIANT WHERE nom = 'Amrani';

EXPLAIN SELECT * FROM ABSENCE
WHERE date_absence BETWEEN '2026-10-01' AND '2026-10-15';cd