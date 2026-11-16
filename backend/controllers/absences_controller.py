from flask import jsonify, request

from config.db import execute, query
from middlewares.erreurs import ErreurApplicative
from services.validation import SEUIL_ALERTE_ABSENCE, champs_obligatoires, date_valide, entier, pagination


def lister():
    page, taille, decalage = pagination(request.args)
    conditions, params = [], []
    if request.args.get("etudiant"):
        conditions.append("a.id_etudiant = %s")
        params.append(request.args["etudiant"])
    if request.args.get("recherche"):
        motif = f"%{request.args['recherche'].strip()}%"
        conditions.append("(e.nom LIKE %s OR e.prenom LIKE %s OR e.cne LIKE %s)")
        params += [motif, motif, motif]
    if request.args.get("debut"):
        conditions.append("a.date_absence >= %s")
        params.append(date_valide(request.args["debut"], "La date de début"))
    if request.args.get("fin"):
        conditions.append("a.date_absence <= %s")
        params.append(date_valide(request.args["fin"], "La date de fin"))
    if request.args.get("justifie") in ("0", "1"):
        conditions.append("a.justifie = %s")
        params.append(request.args["justifie"] == "1")
    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    base = "FROM ABSENCE a JOIN ETUDIANT e ON e.id_etudiant = a.id_etudiant"
    total = query(f"SELECT COUNT(*) AS n {base} {where}", params, one=True)["n"]
    lignes = query(
        f"""
        SELECT a.id_absence, a.date_absence, a.nb_heures, a.justifie,
               e.id_etudiant, e.nom, e.prenom, e.cne
        {base} {where}
        ORDER BY a.date_absence DESC, a.id_absence DESC
        LIMIT %s OFFSET %s
        """,
        params + [taille, decalage],
    )
    return jsonify(donnees=lignes, total=total, page=page, taille=taille)


def creer():
    d = request.get_json()
    champs_obligatoires(d, "id_etudiant", "date_absence", "nb_heures")
    identifiant, _ = execute(
        "INSERT INTO ABSENCE (id_etudiant, date_absence, nb_heures, justifie) VALUES (%s, %s, %s, %s)",
        (
            d["id_etudiant"],
            date_valide(d["date_absence"], "La date d'absence"),
            entier(d["nb_heures"], "Le nombre d'heures", 1, 24),
            bool(d.get("justifie", False)),
        ),
    )
    # La notification éventuelle est créée par le trigger MySQL, pas ici.
    return jsonify(id_absence=identifiant, message="Absence enregistrée."), 201


def modifier(id_absence):
    d = request.get_json()
    champs_obligatoires(d, "date_absence", "nb_heures")
    execute(
        "UPDATE ABSENCE SET date_absence = %s, nb_heures = %s, justifie = %s WHERE id_absence = %s",
        (
            date_valide(d["date_absence"], "La date d'absence"),
            entier(d["nb_heures"], "Le nombre d'heures", 1, 24),
            bool(d.get("justifie", False)),
            id_absence,
        ),
    )
    return jsonify(message="Absence modifiée.")


def supprimer(id_absence):
    # Une absence ayant déclenché une notification ne peut pas être supprimée (FK 1451).
    _, nb = execute("DELETE FROM ABSENCE WHERE id_absence = %s", (id_absence,))
    if nb == 0:
        raise ErreurApplicative("Absence introuvable.", 404)
    return jsonify(message="Absence supprimée.")


def totaux():
    """Total d'heures par étudiant, les plus absents en premier."""
    limite = entier(request.args.get("limite", 10), "limite", 1, 100)
    return jsonify(
        query(
            """
            SELECT e.id_etudiant, e.nom, e.prenom, e.cne,
                   COUNT(a.id_absence) AS nb_absences,
                   SUM(a.nb_heures) AS total_heures,
                   SUM(CASE WHEN a.justifie = FALSE THEN a.nb_heures ELSE 0 END) AS heures_non_justifiees
            FROM ABSENCE a JOIN ETUDIANT e ON e.id_etudiant = a.id_etudiant
            GROUP BY e.id_etudiant, e.nom, e.prenom, e.cne
            ORDER BY total_heures DESC, e.nom
            LIMIT %s
            """,
            (limite,),
        )
    )


def alertes():
    """Étudiants dépassant le seuil d'heures cumulées (alerte visuelle, distincte des notifications)."""
    lignes = query(
        """
        SELECT e.id_etudiant, e.nom, e.prenom, e.cne, SUM(a.nb_heures) AS total_heures
        FROM ABSENCE a JOIN ETUDIANT e ON e.id_etudiant = a.id_etudiant
        GROUP BY e.id_etudiant, e.nom, e.prenom, e.cne
        HAVING SUM(a.nb_heures) >= %s
        ORDER BY total_heures DESC
        """,
        (SEUIL_ALERTE_ABSENCE,),
    )
    return jsonify(seuil=SEUIL_ALERTE_ABSENCE, etudiants=lignes)
