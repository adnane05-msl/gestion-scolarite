from flask import jsonify, request

from config.db import execute, execute_many, query
from middlewares.erreurs import ErreurApplicative
from services.validation import champs_obligatoires, entier


def _decoder_ids(valeur):
    return [int(x) for x in valeur.split(",")] if valeur else []


def lister():
    recherche = request.args.get("recherche", "").strip()
    semestre = request.args.get("semestre")
    conditions, params = ["m.nom_module LIKE %s"], [f"%{recherche}%"]
    if semestre:
        conditions.append("m.semestre = %s")
        params.append(entier(semestre, "semestre", 1, 6))

    lignes = query(
        f"""
        SELECT m.id_module, m.nom_module, m.semestre,
               (SELECT GROUP_CONCAT(f.nom_filiere ORDER BY f.nom_filiere SEPARATOR ', ')
                FROM CONTENIR c JOIN FILIERE f ON f.id_filiere = c.id_filiere
                WHERE c.id_module = m.id_module) AS filieres,
               (SELECT GROUP_CONCAT(c.id_filiere) FROM CONTENIR c WHERE c.id_module = m.id_module) AS ids_filieres,
               (SELECT GROUP_CONCAT(CONCAT(en.prenom, ' ', en.nom) ORDER BY en.nom SEPARATOR ', ')
                FROM ENSEIGNER e JOIN ENSEIGNANT en ON en.id_enseignant = e.id_enseignant
                WHERE e.id_module = m.id_module) AS enseignants,
               (SELECT GROUP_CONCAT(e.id_enseignant) FROM ENSEIGNER e WHERE e.id_module = m.id_module) AS ids_enseignants
        FROM MODULE m
        WHERE {' AND '.join(conditions)}
        ORDER BY m.semestre, m.nom_module
        """,
        params,
    )
    for l in lignes:
        l["ids_filieres"] = _decoder_ids(l["ids_filieres"])
        l["ids_enseignants"] = _decoder_ids(l["ids_enseignants"])
    return jsonify(lignes)


def creer():
    d = request.get_json()
    champs_obligatoires(d, "nom_module", "semestre")
    identifiant, _ = execute(
        "INSERT INTO MODULE (nom_module, semestre) VALUES (%s, %s)",
        (d["nom_module"].strip(), entier(d["semestre"], "semestre", 1, 6)),
    )
    return jsonify(id_module=identifiant, message="Module ajouté."), 201


def modifier(id_module):
    d = request.get_json()
    champs_obligatoires(d, "nom_module", "semestre")
    execute(
        "UPDATE MODULE SET nom_module = %s, semestre = %s WHERE id_module = %s",
        (d["nom_module"].strip(), entier(d["semestre"], "semestre", 1, 6), id_module),
    )
    return jsonify(message="Module modifié.")


def supprimer(id_module):
    # Les liens CONTENIR / ENSEIGNER sont retirés ; les EXAMEN bloquent (FK) s'il en existe.
    execute_many([
        ("DELETE FROM CONTENIR WHERE id_module = %s", (id_module,)),
        ("DELETE FROM ENSEIGNER WHERE id_module = %s", (id_module,)),
        ("DELETE FROM MODULE WHERE id_module = %s", (id_module,)),
    ])
    return jsonify(message="Module supprimé.")


def definir_filieres(id_module):
    d = request.get_json() or {}
    ids = d.get("ids_filieres", [])
    if not isinstance(ids, list):
        raise ErreurApplicative("ids_filieres doit être une liste.")
    instructions = [("DELETE FROM CONTENIR WHERE id_module = %s", (id_module,))]
    instructions += [
        ("INSERT INTO CONTENIR (id_filiere, id_module) VALUES (%s, %s)", (int(i), id_module)) for i in ids
    ]
    execute_many(instructions)
    return jsonify(message="Filières du module mises à jour.")


def definir_enseignants(id_module):
    d = request.get_json() or {}
    ids = d.get("ids_enseignants", [])
    if not isinstance(ids, list):
        raise ErreurApplicative("ids_enseignants doit être une liste.")
    instructions = [("DELETE FROM ENSEIGNER WHERE id_module = %s", (id_module,))]
    instructions += [
        ("INSERT INTO ENSEIGNER (id_enseignant, id_module) VALUES (%s, %s)", (int(i), id_module)) for i in ids
    ]
    execute_many(instructions)
    return jsonify(message="Enseignants du module mis à jour.")
