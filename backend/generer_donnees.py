import os
import random
from datetime import date, timedelta

import mysql.connector
from dotenv import load_dotenv

load_dotenv()

NB_ETUDIANTS = 2000

NOMS = ["Amrani", "Berrada", "Chraibi", "Dahmani", "Elamrani", "Fathi",
        "Ghazi", "Hamdi", "Idrissi", "Jaouhari", "Kabbaj", "Lamrani",
        "Mouline", "Naciri", "Ouazzani", "Rachidi", "Saidi", "Tazi",
        "Yacoubi", "Zouhair", "Benjelloun", "Sekkat", "Lahlou", "Mernissi"]

PRENOMS = ["Hamza", "Sara", "Mehdi", "Lina", "Yassine", "Khadija", "Anas",
           "Meryem", "Reda", "Ikram", "Soufiane", "Hajar", "Zakaria",
           "Oumaima", "Bilal", "Nisrine", "Walid", "Asmae", "Ayoub", "Chaimae"]

conn = mysql.connector.connect(
    host=os.getenv("DB_HOST"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    database=os.getenv("DB_NAME"),
)
cur = conn.cursor()

cur.execute("SELECT id_filiere FROM FILIERE")
filieres = [r[0] for r in cur.fetchall()]

cur.execute("SELECT MAX(id_etudiant) FROM ETUDIANT")
depart = cur.fetchone()[0] + 1

etudiants = []
for i in range(NB_ETUDIANTS):
    ident = depart + i
    etudiants.append((
        ident,
        random.choice(NOMS),
        random.choice(PRENOMS),
        f"etudiant{ident}@etu.ma",
        f"CNE{ident:05d}",
    ))

cur.executemany(
    "INSERT INTO ETUDIANT (id_etudiant, nom, prenom, email, cne) "
    "VALUES (%s, %s, %s, %s, %s)",
    etudiants,
)

inscriptions = [
    (e[0], random.choice(filieres), date(2026, 9, 20), 2026) for e in etudiants
]
cur.executemany(
    "INSERT INTO INSCRIPTION (id_etudiant, id_filiere, date_inscription, annee_universitaire) "
    "VALUES (%s, %s, %s, %s)",
    inscriptions,
)
conn.commit()

cur.execute(
    """
    INSERT INTO NOTE (id_etudiant, id_examen, valeur_note, date_saisie)
    SELECT i.id_etudiant, x.id_examen,
           ROUND(6 + RAND() * 13, 2),
           DATE_ADD(x.date_examen, INTERVAL 7 DAY)
    FROM INSCRIPTION i
    JOIN CONTENIR c ON c.id_filiere = i.id_filiere
    JOIN EXAMEN   x ON x.id_module  = c.id_module
    WHERE i.id_etudiant >= %s
    """,
    (depart,),
)
conn.commit()

absences = []
for e in etudiants:
    for _ in range(random.randint(0, 3)):
        jour = date(2026, 10, 1) + timedelta(days=random.randint(0, 45))
        absences.append((e[0], jour, random.choice([2, 3, 4, 6, 8]), random.random() < 0.4))

cur.executemany(
    "INSERT INTO ABSENCE (id_etudiant, date_absence, nb_heures, justifie) "
    "VALUES (%s, %s, %s, %s)",
    absences,
)
conn.commit()

for table in ["ETUDIANT", "INSCRIPTION", "NOTE", "ABSENCE", "NOTIFICATION"]:
    cur.execute(f"SELECT COUNT(*) FROM {table}")
    print(f"{table} : {cur.fetchone()[0]} lignes")

cur.close()
conn.close()