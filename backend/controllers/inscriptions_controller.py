from flask import jsonify, request

from config.db import execute, query
from middlewares.erreurs import ErreurApplicative
from services.validation import ANNEE_UNIVERSITAIRE_COURANTE, champs_obligatoires, date_valide, entier, pagination


def lister():
    page, taille, decalage = pagination(request.args)
    conditions, params = [], []
    if request.args.get("filiere"):
        conditions.append("i.id_filiere = %s")
        params.append(request.args["filiere"])
    if request.args.get("annee"):
        conditions.append("i.annee_universitaire = %s")
        params.append(entier(request.args["annee"], "annee"))
    if request.args.get("etudiant"):
        conditions.append("i.id_etudiant = %s")
        params.append(request.args["etudiant"])
    if request.args.get("recherche"):
        motif = f"%{request.args['recherche'].strip()}%"
        conditions.append("(e.nom LIKE %s OR e.prenom LIKE %s OR e.cne LIKE %s)")
        params += [motif, motif, motif]
    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    base = """
        FROM INSCRIPTION i
        JOIN ETUDIANT e ON e.id_etudiant = i.id_etudiant
        JOIN FILIERE f  ON f.id_filiere  = i.id_filiere
    """
    total = query(f"SELECT COUNT(*) AS n {base} {where}", params, one=True)["n"]
    lignes = query(
        f"""
        SELECT i.id_inscription, i.date_inscription, i.annee_universitaire,
               e.id_etudiant, e.nom, e.prenom, e.cne,
               f.id_filiere, f.nom_filiere
        {base} {where}
        ORDER BY i.date_inscription DESC, i.id_inscription DESC
        LIMIT %s OFFSET %s
        """,
        params + [taille, decalage],
    )
    annees = [a["annee_universitaire"] for a in query(
        "SELECT DISTINCT annee_universitaire FROM INSCRIPTION ORDER BY annee_universitaire DESC"
    )]
    return jsonify(donnees=lignes, total=total, page=page, taille=taille, annees=annees)


def creer():
    d = request.get_json()
    champs_obligatoires(d, "id_etudiant", "id_filiere", "date_inscription")
    annee = entier(d.get("annee_universitaire", ANNEE_UNIVERSITAIRE_COURANTE), "annee_universitaire", 2000, 2100)
    date_inscription = date_valide(d["date_inscription"], "La date d'inscription")

    doublon = query(
        """
        SELECT 1 FROM INSCRIPTION
        WHERE id_etudiant = %s AND id_filiere = %s AND annee_universitaire = %s
        """,
        (d["id_etudiant"], d["id_filiere"], annee),
        one=True,
    )
    if doublon:
        raise ErreurApplicative("Cet étudiant est déjà inscrit dans cette filière pour cette année.", 409)

    identifiant, _ = execute(
        """
        INSERT INTO INSCRIPTION (id_etudiant, id_filiere, date_inscription, annee_universitaire)
        VALUES (%s, %s, %s, %s)
        """,
        (d["id_etudiant"], d["id_filiere"], date_inscription, annee),
    )
    return jsonify(id_inscription=identifiant, message="Inscription enregistrée."), 201


def supprimer(id_inscription):
    _, nb = execute("DELETE FROM INSCRIPTION WHERE id_inscription = %s", (id_inscription,))
    if nb == 0:
        raise ErreurApplicative("Inscription introuvable.", 404)
    return jsonify(message="Inscription supprimée.")
