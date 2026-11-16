from flask import jsonify, request

from config.db import execute, execute_many, query
from middlewares.erreurs import ErreurApplicative
from services.validation import champs_obligatoires


def lister():
    lignes = query(
        """
        SELECT f.id_filiere, f.nom_filiere, f.description,
               (SELECT COUNT(DISTINCT i.id_etudiant) FROM INSCRIPTION i WHERE i.id_filiere = f.id_filiere) AS nb_etudiants,
               (SELECT COUNT(*) FROM CONTENIR c WHERE c.id_filiere = f.id_filiere) AS nb_modules
        FROM FILIERE f
        ORDER BY f.nom_filiere
        """
    )
    return jsonify(lignes)


def creer():
    d = request.get_json()
    champs_obligatoires(d, "nom_filiere")
    identifiant, _ = execute(
        "INSERT INTO FILIERE (nom_filiere, description) VALUES (%s, %s)",
        (d["nom_filiere"].strip(), d.get("description") or None),
    )
    return jsonify(id_filiere=identifiant, message="Filière ajoutée."), 201


def modifier(id_filiere):
    d = request.get_json()
    champs_obligatoires(d, "nom_filiere")
    execute(
        "UPDATE FILIERE SET nom_filiere = %s, description = %s WHERE id_filiere = %s",
        (d["nom_filiere"].strip(), d.get("description") or None, id_filiere),
    )
    return jsonify(message="Filière modifiée.")


def supprimer(id_filiere):
    # Les liens CONTENIR sont retirés ; les INSCRIPTION bloquent (FK) si des étudiants existent.
    execute_many([
        ("DELETE FROM CONTENIR WHERE id_filiere = %s", (id_filiere,)),
        ("DELETE FROM FILIERE WHERE id_filiere = %s", (id_filiere,)),
    ])
    return jsonify(message="Filière supprimée.")


def etudiants(id_filiere):
    return jsonify(
        query(
            """
            SELECT DISTINCT e.id_etudiant, e.nom, e.prenom, e.cne, e.email, i.annee_universitaire
            FROM INSCRIPTION i JOIN ETUDIANT e ON e.id_etudiant = i.id_etudiant
            WHERE i.id_filiere = %s
            ORDER BY e.nom, e.prenom
            """,
            (id_filiere,),
        )
    )


def modules(id_filiere):
    return jsonify(
        query(
            """
            SELECT m.id_module, m.nom_module, m.semestre
            FROM CONTENIR c JOIN MODULE m ON m.id_module = c.id_module
            WHERE c.id_filiere = %s
            ORDER BY m.semestre, m.nom_module
            """,
            (id_filiere,),
        )
    )


def definir_modules(id_filiere):
    d = request.get_json() or {}
    ids = d.get("ids_modules", [])
    if not isinstance(ids, list):
        raise ErreurApplicative("ids_modules doit être une liste.")
    instructions = [("DELETE FROM CONTENIR WHERE id_filiere = %s", (id_filiere,))]
    instructions += [
        ("INSERT INTO CONTENIR (id_filiere, id_module) VALUES (%s, %s)", (id_filiere, int(i)))
        for i in ids
    ]
    execute_many(instructions)
    return jsonify(message="Modules de la filière mis à jour.")
