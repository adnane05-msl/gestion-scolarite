from flask import jsonify, request

from config.db import execute, execute_many, query
from middlewares.erreurs import ErreurApplicative
from services.validation import champs_obligatoires


def lister():
    recherche = request.args.get("recherche", "").strip()
    motif = f"%{recherche}%"
    lignes = query(
        """
        SELECT en.id_enseignant, en.nom, en.prenom, en.email, en.specialite,
               GROUP_CONCAT(m.nom_module ORDER BY m.nom_module SEPARATOR ', ') AS modules,
               GROUP_CONCAT(m.id_module ORDER BY m.nom_module) AS ids_modules
        FROM ENSEIGNANT en
        LEFT JOIN ENSEIGNER e ON e.id_enseignant = en.id_enseignant
        LEFT JOIN MODULE m    ON m.id_module     = e.id_module
        WHERE en.nom LIKE %s OR en.prenom LIKE %s OR en.specialite LIKE %s
           OR CONCAT(en.prenom, ' ', en.nom) LIKE %s
           OR CONCAT(en.nom, ' ', en.prenom) LIKE %s
        GROUP BY en.id_enseignant
        ORDER BY en.nom, en.prenom
        """,
        (motif,) * 5,
    )
    for l in lignes:
        l["ids_modules"] = [int(x) for x in l["ids_modules"].split(",")] if l["ids_modules"] else []
    return jsonify(lignes)


def creer():
    d = request.get_json()
    champs_obligatoires(d, "nom", "prenom")
    identifiant, _ = execute(
        "INSERT INTO ENSEIGNANT (nom, prenom, email, specialite) VALUES (%s, %s, %s, %s)",
        (d["nom"].strip(), d["prenom"].strip(), d.get("email") or None, d.get("specialite") or None),
    )
    return jsonify(id_enseignant=identifiant, message="Enseignant ajouté."), 201


def modifier(id_enseignant):
    d = request.get_json()
    champs_obligatoires(d, "nom", "prenom")
    execute(
        "UPDATE ENSEIGNANT SET nom = %s, prenom = %s, email = %s, specialite = %s WHERE id_enseignant = %s",
        (d["nom"].strip(), d["prenom"].strip(), d.get("email") or None, d.get("specialite") or None, id_enseignant),
    )
    return jsonify(message="Enseignant modifié.")


def supprimer(id_enseignant):
    # Les affectations ENSEIGNER sont de simples liens : on les retire avant.
    execute_many([
        ("DELETE FROM ENSEIGNER WHERE id_enseignant = %s", (id_enseignant,)),
        ("DELETE FROM ENSEIGNANT WHERE id_enseignant = %s", (id_enseignant,)),
    ])
    return jsonify(message="Enseignant supprimé.")


def definir_modules(id_enseignant):
    """Remplace la liste des modules enseignés (table ENSEIGNER)."""
    d = request.get_json() or {}
    ids = d.get("ids_modules", [])
    if not isinstance(ids, list):
        raise ErreurApplicative("ids_modules doit être une liste.")
    instructions = [("DELETE FROM ENSEIGNER WHERE id_enseignant = %s", (id_enseignant,))]
    instructions += [
        ("INSERT INTO ENSEIGNER (id_enseignant, id_module) VALUES (%s, %s)", (id_enseignant, int(i)))
        for i in ids
    ]
    execute_many(instructions)
    return jsonify(message="Modules mis à jour.")
