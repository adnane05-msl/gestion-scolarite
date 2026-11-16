from flask import jsonify, request

from config.db import execute, execute_many, query
from middlewares.erreurs import ErreurApplicative
from services.validation import champs_obligatoires, date_valide, note_valide


def lister():
    return jsonify(
        query(
            """
            SELECT x.id_examen, x.date_examen, m.id_module, m.nom_module, m.semestre,
                   (SELECT COUNT(*) FROM NOTE n WHERE n.id_examen = x.id_examen) AS nb_notes,
                   (SELECT COUNT(DISTINCT i.id_etudiant)
                    FROM CONTENIR c JOIN INSCRIPTION i ON i.id_filiere = c.id_filiere
                    WHERE c.id_module = x.id_module) AS nb_concernes
            FROM EXAMEN x JOIN MODULE m ON m.id_module = x.id_module
            ORDER BY x.date_examen DESC, x.id_examen DESC
            """
        )
    )


def creer():
    d = request.get_json()
    champs_obligatoires(d, "id_module", "date_examen")
    identifiant, _ = execute(
        "INSERT INTO EXAMEN (id_module, date_examen) VALUES (%s, %s)",
        (d["id_module"], date_valide(d["date_examen"], "La date d'examen")),
    )
    return jsonify(id_examen=identifiant, message="Examen créé."), 201


def modifier(id_examen):
    d = request.get_json()
    champs_obligatoires(d, "id_module", "date_examen")
    execute(
        "UPDATE EXAMEN SET id_module = %s, date_examen = %s WHERE id_examen = %s",
        (d["id_module"], date_valide(d["date_examen"], "La date d'examen"), id_examen),
    )
    return jsonify(message="Examen modifié.")


def supprimer(id_examen):
    # Les NOTE associées bloquent la suppression (FK 1451) : comportement voulu.
    _, nb = execute("DELETE FROM EXAMEN WHERE id_examen = %s", (id_examen,))
    if nb == 0:
        raise ErreurApplicative("Examen introuvable.", 404)
    return jsonify(message="Examen supprimé.")


def etudiants_concernes(id_examen):
    """Étudiants inscrits dans une filière contenant le module de l'examen, avec leur note éventuelle."""
    examen = query(
        "SELECT x.id_examen, x.date_examen, m.nom_module FROM EXAMEN x JOIN MODULE m ON m.id_module = x.id_module WHERE x.id_examen = %s",
        (id_examen,),
        one=True,
    )
    if not examen:
        raise ErreurApplicative("Examen introuvable.", 404)
    etudiants = query(
        """
        SELECT DISTINCT e.id_etudiant, e.cne, e.nom, e.prenom, f.nom_filiere,
               n.id_note, n.valeur_note
        FROM EXAMEN x
        JOIN CONTENIR c     ON c.id_module    = x.id_module
        JOIN INSCRIPTION i  ON i.id_filiere   = c.id_filiere
        JOIN ETUDIANT e     ON e.id_etudiant  = i.id_etudiant
        JOIN FILIERE f      ON f.id_filiere   = i.id_filiere
        LEFT JOIN NOTE n    ON n.id_examen    = x.id_examen AND n.id_etudiant = e.id_etudiant
        WHERE x.id_examen = %s
        ORDER BY e.nom, e.prenom
        """,
        (id_examen,),
    )
    return jsonify(examen=examen, etudiants=etudiants)


def enregistrer_notes(id_examen):
    """Enregistre ou met à jour un lot de notes : [{id_etudiant, valeur_note}]."""
    d = request.get_json() or {}
    notes = d.get("notes", [])
    if not isinstance(notes, list) or not notes:
        raise ErreurApplicative("Aucune note à enregistrer.")

    instructions = []
    for n in notes:
        if n.get("valeur_note") in (None, ""):
            continue
        valeur = note_valide(n["valeur_note"])
        instructions.append((
            """
            INSERT INTO NOTE (id_etudiant, id_examen, valeur_note, date_saisie)
            VALUES (%s, %s, %s, CURDATE())
            ON DUPLICATE KEY UPDATE valeur_note = VALUES(valeur_note), date_saisie = CURDATE()
            """,
            (n["id_etudiant"], id_examen, valeur),
        ))
    if not instructions:
        raise ErreurApplicative("Aucune note valide à enregistrer.")
    execute_many(instructions)
    return jsonify(message=f"{len(instructions)} note(s) enregistrée(s).")


def classement():
    id_filiere = request.args.get("filiere")
    condition, params = "", []
    if id_filiere:
        condition = "WHERE s.id_filiere = %s"
        params.append(id_filiere)
    return jsonify(
        query(
            f"""
            SELECT f.nom_filiere, s.id_etudiant, s.cne, s.nom, s.prenom, s.moyenne, s.nb_notes,
                   RANK() OVER (PARTITION BY s.id_filiere ORDER BY s.moyenne DESC) AS rang
            FROM (
                SELECT i.id_filiere, e.id_etudiant, e.cne, e.nom, e.prenom,
                       ROUND(AVG(n.valeur_note), 2) AS moyenne, COUNT(n.id_note) AS nb_notes
                FROM ETUDIANT e
                JOIN INSCRIPTION i ON i.id_etudiant = e.id_etudiant
                JOIN NOTE n        ON n.id_etudiant = e.id_etudiant
                GROUP BY i.id_filiere, e.id_etudiant, e.cne, e.nom, e.prenom
            ) AS s
            JOIN FILIERE f ON f.id_filiere = s.id_filiere
            {condition}
            ORDER BY f.nom_filiere, rang
            LIMIT 100
            """,
            params,
        )
    )
