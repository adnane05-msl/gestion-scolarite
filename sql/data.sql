USE gestion_scolarite;

INSERT INTO FILIERE (id_filiere, nom_filiere, description) VALUES
(1, 'Informatique', 'Tronc commun informatique'),
(2, 'Reseaux et Telecoms', 'Infrastructures et telecommunications'),
(3, 'Data et IA', 'Science des donnees et intelligence artificielle'),
(4, 'Genie Logiciel', 'Conception et developpement logiciel'),
(5, 'Cybersecurite', 'Securite des systemes d information');

INSERT INTO MODULE (id_module, nom_module, semestre) VALUES
(1, 'Bases de donnees', 1),
(2, 'Programmation Python', 1),
(3, 'Reseaux IP', 2),
(4, 'Machine Learning', 3),
(5, 'Developpement Web', 2),
(6, 'Systemes d exploitation', 1),
(7, 'Statistiques', 2),
(8, 'Cryptographie', 3),
(9, 'Big Data', 4),
(10, 'Genie logiciel', 3);

INSERT INTO CONTENIR (id_filiere, id_module) VALUES
(1,1),(1,2),(1,5),(1,6),
(2,3),(2,6),(2,8),
(3,1),(3,2),(3,4),(3,7),(3,9),
(4,1),(4,2),(4,5),(4,10),
(5,3),(5,6),(5,8),(5,10);

INSERT INTO ENSEIGNANT (id_enseignant, nom, prenom, email, specialite) VALUES
(1, 'Alaoui',   'Karim',   'k.alaoui@inpt.ma',   'Bases de donnees'),
(2, 'Bennani',  'Salma',   's.bennani@inpt.ma',  'Intelligence artificielle'),
(3, 'Cherkaoui','Youssef', 'y.cherkaoui@inpt.ma','Reseaux'),
(4, 'Daoudi',   'Nadia',   'n.daoudi@inpt.ma',   'Developpement web'),
(5, 'El Idrissi','Omar',   'o.elidrissi@inpt.ma','Securite informatique'),
(6, 'Fassi',    'Imane',   'i.fassi@inpt.ma',    'Mathematiques appliquees');

INSERT INTO ENSEIGNER (id_enseignant, id_module) VALUES
(1,1),(1,9),
(2,4),(2,2),
(3,3),(3,6),
(4,5),(4,10),
(5,8),
(6,7);

INSERT INTO ETUDIANT (id_etudiant, nom, prenom, email, cne) VALUES
(1,  'Amrani',   'Hamza',   'hamza.amrani@etu.ma',   'CNE001'),
(2,  'Berrada',  'Sara',   'sara.berrada@etu.ma',    'CNE002'),
(3,  'Chraibi',  'Mehdi',  'mehdi.chraibi@etu.ma',   'CNE003'),
(4,  'Dahmani',  'Lina',   'lina.dahmani@etu.ma',    'CNE004'),
(5,  'Elamrani', 'Yassine','yassine.elamrani@etu.ma','CNE005'),
(6,  'Fathi',    'Khadija','khadija.fathi@etu.ma',   'CNE006'),
(7,  'Ghazi',    'Anas',   'anas.ghazi@etu.ma',      'CNE007'),
(8,  'Hamdi',    'Meryem', 'meryem.hamdi@etu.ma',    'CNE008'),
(9,  'Idrissi',  'Reda',   'reda.idrissi@etu.ma',    'CNE009'),
(10, 'Jaouhari', 'Ikram',  'ikram.jaouhari@etu.ma',  'CNE010'),
(11, 'Kabbaj',   'Soufiane','soufiane.kabbaj@etu.ma','CNE011'),
(12, 'Lamrani',  'Hajar',  'hajar.lamrani@etu.ma',   'CNE012'),
(13, 'Mouline',  'Zakaria','zakaria.mouline@etu.ma', 'CNE013'),
(14, 'Naciri',   'Oumaima','oumaima.naciri@etu.ma',  'CNE014'),
(15, 'Ouazzani', 'Bilal',  'bilal.ouazzani@etu.ma',  'CNE015'),
(16, 'Rachidi',  'Nisrine','nisrine.rachidi@etu.ma', 'CNE016'),
(17, 'Saidi',    'Walid',  'walid.saidi@etu.ma',     'CNE017'),
(18, 'Tazi',     'Asmae',  'asmae.tazi@etu.ma',      'CNE018'),
(19, 'Yacoubi',  'Ayoub',  'ayoub.yacoubi@etu.ma',   'CNE019'),
(20, 'Zouhair',  'Chaimae','chaimae.zouhair@etu.ma', 'CNE020');

INSERT INTO INSCRIPTION (id_etudiant, id_filiere, date_inscription, annee_universitaire) VALUES
(1,1,'2026-09-10',2026),(2,1,'2026-09-10',2026),(3,1,'2026-09-11',2026),(4,1,'2026-09-11',2026),
(5,2,'2026-09-12',2026),(6,2,'2026-09-12',2026),(7,2,'2026-09-12',2026),(8,2,'2026-09-13',2026),
(9,3,'2026-09-13',2026),(10,3,'2026-09-13',2026),(11,3,'2026-09-14',2026),(12,3,'2026-09-14',2026),
(13,4,'2026-09-15',2026),(14,4,'2026-09-15',2026),(15,4,'2026-09-15',2026),(16,4,'2026-09-16',2026),
(17,5,'2026-09-16',2026),(18,5,'2026-09-16',2026),(19,5,'2026-09-17',2026),(20,5,'2026-09-17',2026);

INSERT INTO EXAMEN (id_examen, id_module, date_examen) VALUES
(1,1,'2027-01-12'),(2,2,'2027-01-14'),(3,3,'2027-01-16'),(4,4,'2027-01-18'),(5,5,'2027-01-20'),
(6,6,'2027-01-22'),(7,7,'2027-01-24'),(8,8,'2027-01-26'),(9,9,'2027-01-28'),(10,10,'2027-01-30');

-- Une note par etudiant pour chaque examen des modules de sa filiere
INSERT INTO NOTE (id_etudiant, id_examen, valeur_note, date_saisie)
SELECT i.id_etudiant,
       x.id_examen,
       ROUND(6 + RAND() * 13, 2),
       DATE_ADD(x.date_examen, INTERVAL 7 DAY)
FROM INSCRIPTION i
JOIN CONTENIR c ON c.id_filiere = i.id_filiere
JOIN EXAMEN   x ON x.id_module  = c.id_module;

INSERT INTO ABSENCE (id_etudiant, date_absence, nb_heures, justifie) VALUES
(1, '2026-10-05', 2, FALSE),
(1, '2026-10-19', 4, TRUE),
(2, '2026-10-06', 3, FALSE),
(3, '2026-10-08', 2, TRUE),
(5, '2026-10-12', 6, FALSE),
(5, '2026-11-02', 2, FALSE),
(7, '2026-10-15', 4, FALSE),
(9, '2026-10-20', 2, TRUE),
(11,'2026-10-21', 8, FALSE),
(13,'2026-11-03', 3, FALSE),
(16,'2026-11-05', 2, TRUE),
(18,'2026-11-09', 5, FALSE);
