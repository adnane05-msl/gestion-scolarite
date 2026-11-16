"""Génère un volume réaliste de données (pour la démonstration des index / EXPLAIN).

Usage : python generer_donnees.py   (depuis le dossier backend, venv activé)
"""
import random
from datetime import date, timedelta

from config.db import get_connection

NB_ETUDIANTS = 2000
NOMS = ["Amrani", "Berrada", "Chraibi", "Dahmani", "Elamrani", "Fathi", "Ghazi", "Hamdi", "Idrissi",
        "Jaouhari", "Kabbaj", "Lamrani", "Mouline", "Naciri", "Ouazzani", "Rachidi", "Saidi", "Tazi",
        "Yacoubi", "Zouhair", "Benjelloun", "Sekkat", "Lahlou", "Mernissi"]
PRENOMS = ["Hamza", "Sara", "Mehdi", "Lina", "Yassine", "Khadija", "Anas", "Meryem", "Reda", "Ikram",
           "Soufiane", "Hajar", "Zakaria", "Oumaima", "Bilal", "Nisrine", "Walid", "Asmae", "Ayoub", "Chaimae"]

conn = get_connection()
cur = conn.cursor()
cur.execute("SELECT id_filiere FROM FILIERE")
filieres = [r[0] for r in cur.fetchall()]
cur.execute("SELECT COALESCE(MAX(id_etudiant), 0) FROM ETUDIANT")
depart = cur.fetchone()[0] + 1

etudiants = [(depart + i, random.choice(NOMS), random.choice(PRENOMS), f"etudiant{depart + i}@etu.ma", f"CNE{depart + i:05d}")
             for i in range(NB_ETUDIANTS)]
cur.executemany("INSERT INTO ETUDIANT (id_etudiant, nom, prenom, email, cne) VALUES (%s, %s, %s, %s, %s)", etudiants)
cur.executemany("INSERT INTO INSCRIPTION (id_etudiant, id_filiere, date_inscription, annee_universitaire) VALUES (%s, %s, %s, %s)",
                [(e[0], random.choice(filieres), date(2026, 9, 20), 2026) for e in etudiants])
conn.commit()

cur.execute("""
    INSERT INTO NOTE (id_etudiant, id_examen, valeur_note, date_saisie)
    SELECT i.id_etudiant, x.id_examen, ROUND(6 + RAND() * 13, 2), DATE_ADD(x.date_examen, INTERVAL 7 DAY)
    FROM INSCRIPTION i
    JOIN CONTENIR c ON c.id_filiere = i.id_filiere
    JOIN EXAMEN   x ON x.id_module  = c.id_module
    WHERE i.id_etudiant >= %s
""", (depart,))
conn.commit()

absences = []
for e in etudiants:
    for _ in range(random.randint(0, 3)):
        absences.append((e[0], date(2026, 10, 1) + timedelta(days=random.randint(0, 45)), random.choice([2, 3, 4, 6, 8]), random.random() < 0.4))
cur.executemany("INSERT INTO ABSENCE (id_etudiant, date_absence, nb_heures, justifie) VALUES (%s, %s, %s, %s)", absences)
conn.commit()

for table in ["ETUDIANT", "INSCRIPTION", "NOTE", "ABSENCE", "NOTIFICATION"]:
    cur.execute(f"SELECT COUNT(*) FROM {table}")
    print(f"{table} : {cur.fetchone()[0]} lignes")
cur.close()
conn.close()
