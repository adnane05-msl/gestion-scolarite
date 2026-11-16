from flask import jsonify

from config.db import query


def tableau_de_bord():
    compte = lambda table: query(f"SELECT COUNT(*) AS n FROM {table}", one=True)["n"]  # noqa: E731

    cartes = {
        "etudiants": compte("ETUDIANT"),
        "enseignants": compte("ENSEIGNANT"),
        "filieres": compte("FILIERE"),
        "modules": compte("MODULE"),
        "examens": compte("EXAMEN"),
        "notifications_non_lues": query(
            "SELECT COUNT(*) AS n FROM NOTIFICATION WHERE statut = 'non_lue'", one=True
        )["n"],
    }

    etudiants_par_filiere = query(
        """
        SELECT f.nom_filiere, COUNT(DISTINCT i.id_etudiant) AS nb_etudiants
        FROM FILIERE f
        LEFT JOIN INSCRIPTION i ON i.id_filiere = f.id_filiere
        GROUP BY f.id_filiere, f.nom_filiere
        ORDER BY f.nom_filiere
        """
    )

    moyenne_par_module = query(
        """
        SELECT m.nom_module, ROUND(AVG(n.valeur_note), 2) AS moyenne
        FROM MODULE m
        JOIN EXAMEN x ON x.id_module = m.id_module
        JOIN NOTE n   ON n.id_examen = x.id_examen
        GROUP BY m.id_module, m.nom_module
        ORDER BY m.nom_module
        """
    )

    absences_par_mois = query(
        """
        SELECT DATE_FORMAT(date_absence, '%Y-%m') AS mois,
               SUM(nb_heures) AS heures
        FROM ABSENCE
        GROUP BY mois
        ORDER BY mois
        """
    )

    derniers_inscrits = query(
        """
        SELECT e.id_etudiant, e.nom, e.prenom, e.cne, f.nom_filiere, i.date_inscription
        FROM INSCRIPTION i
        JOIN ETUDIANT e ON e.id_etudiant = i.id_etudiant
        JOIN FILIERE f  ON f.id_filiere  = i.id_filiere
        ORDER BY i.date_inscription DESC, i.id_inscription DESC
        LIMIT 6
        """
    )

    notifications_recentes = query(
        """
        SELECT n.id_notification, n.message, n.date_notification, n.statut,
               e.id_etudiant, e.nom, e.prenom
        FROM NOTIFICATION n
        JOIN ABSENCE a  ON a.id_absence  = n.id_absence
        JOIN ETUDIANT e ON e.id_etudiant = a.id_etudiant
        ORDER BY n.date_notification DESC, n.id_notification DESC
        LIMIT 6
        """
    )

    return jsonify(
        cartes=cartes,
        etudiants_par_filiere=etudiants_par_filiere,
        moyenne_par_module=moyenne_par_module,
        absences_par_mois=absences_par_mois,
        derniers_inscrits=derniers_inscrits,
        notifications_recentes=notifications_recentes,
    )
