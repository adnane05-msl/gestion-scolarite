from flask import jsonify, request

from config.db import execute, execute_many, query
from middlewares.erreurs import ErreurApplicative
from services.validation import champs_obligatoires, pagination

# Sous-requête : la filière "actuelle" = inscription la plus récente de l'étudiant
_FILIERE_ACTUELLE = """
    LEFT JOIN INSCRIPTION i ON i.id_inscription = (
        SELECT i2.id_inscription FROM INSCRIPTION i2
        WHERE i2.id_etudiant = e.id_etudiant
        ORDER BY i2.annee_universitaire DESC, i2.date_inscription DESC, i2.id_inscription DESC
        LIMIT 1
    )
    LEFT JOIN FILIERE f ON f.id_filiere = i.id_filiere
"""


def lister():
    recherche = request.args.get("recherche", "").strip()
    id_filiere = request.args.get("filiere")
    page, taille, decalage = pagination(request.args)

    conditions, params = [], []
    if recherche:
        motif = f"%{recherche}%"
        # CONCAT permet de retrouver un etudiant a partir de son nom complet,
        # saisi dans un sens ou dans l'autre ("Bilal Berrada" ou "Berrada Bilal").
        conditions.append(
            "(e.nom LIKE %s OR e.prenom LIKE %s OR e.cne LIKE %s"
            " OR CONCAT(e.prenom, ' ', e.nom) LIKE %s"
            " OR CONCAT(e.nom, ' ', e.prenom) LIKE %s)"
        )
        params += [motif] * 5
    if id_filiere:
        conditions.append("f.id_filiere = %s")
        params.append(id_filiere)
    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    total = query(
        f"SELECT COUNT(*) AS n FROM ETUDIANT e {_FILIERE_ACTUELLE} {where}", params, one=True
    )["n"]
    lignes = query(
        f"""
        SELECT e.id_etudiant, e.nom, e.prenom, e.email, e.cne,
               f.id_filiere, f.nom_filiere
        FROM ETUDIANT e {_FILIERE_ACTUELLE} {where}
        ORDER BY e.nom, e.prenom
        LIMIT %s OFFSET %s
        """,
        params + [taille, decalage],
    )
    return jsonify(donnees=lignes, total=total, page=page, taille=taille)


def tous_minimal():
    """Liste légère (id, nom, prénom, cne) pour les listes déroulantes."""
    recherche = request.args.get("recherche", "").strip()
    motif = f"%{recherche}%"
    return jsonify(
        query(
            """
            SELECT id_etudiant, nom, prenom, cne FROM ETUDIANT
            WHERE nom LIKE %s OR prenom LIKE %s OR cne LIKE %s
               OR CONCAT(prenom, ' ', nom) LIKE %s
               OR CONCAT(nom, ' ', prenom) LIKE %s
            ORDER BY nom, prenom LIMIT 30
            """,
            (motif,) * 5,
        )
    )


def fiche(id_etudiant):
    etudiant = query("SELECT * FROM ETUDIANT WHERE id_etudiant = %s", (id_etudiant,), one=True)
    if not etudiant:
        raise ErreurApplicative("Étudiant introuvable.", 404)

    inscriptions = query(
        """
        SELECT i.id_inscription, i.date_inscription, i.annee_universitaire,
               f.id_filiere, f.nom_filiere
        FROM INSCRIPTION i JOIN FILIERE f ON f.id_filiere = i.id_filiere
        WHERE i.id_etudiant = %s
        ORDER BY i.annee_universitaire DESC, i.date_inscription DESC
        """,
        (id_etudiant,),
    )

    modules = []
    if inscriptions:
        modules = query(
            """
            SELECT m.id_module, m.nom_module, m.semestre
            FROM CONTENIR c JOIN MODULE m ON m.id_module = c.id_module
            WHERE c.id_filiere = %s
            ORDER BY m.semestre, m.nom_module
            """,
            (inscriptions[0]["id_filiere"],),
        )

    notes = query(
        """
        SELECT n.id_note, m.nom_module, x.date_examen, n.valeur_note, n.date_saisie
        FROM NOTE n
        JOIN EXAMEN x ON x.id_examen = n.id_examen
        JOIN MODULE m ON m.id_module = x.id_module
        WHERE n.id_etudiant = %s
        ORDER BY x.date_examen
        """,
        (id_etudiant,),
    )

    moyenne = query(
        "SELECT ROUND(AVG(valeur_note), 2) AS m FROM NOTE WHERE id_etudiant = %s",
        (id_etudiant,),
        one=True,
    )["m"]

    absences = query(
        """
        SELECT COALESCE(SUM(nb_heures), 0) AS total,
               COALESCE(SUM(CASE WHEN justifie = FALSE THEN nb_heures ELSE 0 END), 0) AS non_justifiees,
               COUNT(*) AS nombre
        FROM ABSENCE WHERE id_etudiant = %s
        """,
        (id_etudiant,),
        one=True,
    )

    notifications = query(
        """
        SELECT n.id_notification, n.message, n.date_notification, n.statut,
               a.id_absence, a.date_absence, a.nb_heures, a.justifie
        FROM NOTIFICATION n JOIN ABSENCE a ON a.id_absence = n.id_absence
        WHERE a.id_etudiant = %s
        ORDER BY n.date_notification DESC
        """,
        (id_etudiant,),
    )

    return jsonify(
        etudiant=etudiant,
        inscriptions=inscriptions,
        modules=modules,
        notes=notes,
        moyenne=moyenne,
        absences=absences,
        notifications=notifications,
    )


def creer():
    d = request.get_json()
    champs_obligatoires(d, "nom", "prenom", "cne")
    identifiant, _ = execute(
        "INSERT INTO ETUDIANT (nom, prenom, email, cne) VALUES (%s, %s, %s, %s)",
        (d["nom"].strip(), d["prenom"].strip(), (d.get("email") or None), d["cne"].strip()),
    )
    return jsonify(id_etudiant=identifiant, message="Étudiant ajouté."), 201


def modifier(id_etudiant):
    d = request.get_json()
    champs_obligatoires(d, "nom", "prenom", "cne")
    _, nb = execute(
        "UPDATE ETUDIANT SET nom = %s, prenom = %s, email = %s, cne = %s WHERE id_etudiant = %s",
        (d["nom"].strip(), d["prenom"].strip(), (d.get("email") or None), d["cne"].strip(), id_etudiant),
    )
    if nb == 0 and not query("SELECT 1 FROM ETUDIANT WHERE id_etudiant = %s", (id_etudiant,), one=True):
        raise ErreurApplicative("Étudiant introuvable.", 404)
    return jsonify(message="Étudiant modifié.")


def dependances(id_etudiant):
    """Compte les données liées qui empêchent la suppression de l'étudiant."""
    if not query("SELECT 1 FROM ETUDIANT WHERE id_etudiant = %s", (id_etudiant,), one=True):
        raise ErreurApplicative("Étudiant introuvable.", 404)

    def compte(sql):
        return query(sql, (id_etudiant,), one=True)["n"]

    detail = {
        "inscriptions": compte("SELECT COUNT(*) AS n FROM INSCRIPTION WHERE id_etudiant = %s"),
        "notes": compte("SELECT COUNT(*) AS n FROM NOTE WHERE id_etudiant = %s"),
        "absences": compte("SELECT COUNT(*) AS n FROM ABSENCE WHERE id_etudiant = %s"),
        "notifications": compte(
            "SELECT COUNT(*) AS n FROM NOTIFICATION no "
            "JOIN ABSENCE a ON a.id_absence = no.id_absence WHERE a.id_etudiant = %s"
        ),
    }
    detail["total"] = sum(detail.values())
    return jsonify(detail)


def supprimer(id_etudiant):
    """Supprime un étudiant.

    Par défaut la contrainte de clé étrangère bloque (erreur 1451) si des données
    liées existent. Avec ?avec_donnees=1, l'utilisateur a confirmé explicitement
    la suppression des lignes dépendantes : elles sont retirées dans l'ordre
    inverse des dépendances, en une seule transaction.
    """
    if request.args.get("avec_donnees") != "1":
        _, nb = execute("DELETE FROM ETUDIANT WHERE id_etudiant = %s", (id_etudiant,))
        if nb == 0:
            raise ErreurApplicative("Étudiant introuvable.", 404)
        return jsonify(message="Étudiant supprimé.")

    if not query("SELECT 1 FROM ETUDIANT WHERE id_etudiant = %s", (id_etudiant,), one=True):
        raise ErreurApplicative("Étudiant introuvable.", 404)

    execute_many([
        (
            "DELETE FROM NOTIFICATION WHERE id_absence IN "
            "(SELECT id_absence FROM ABSENCE WHERE id_etudiant = %s)",
            (id_etudiant,),
        ),
        ("DELETE FROM ABSENCE WHERE id_etudiant = %s", (id_etudiant,)),
        ("DELETE FROM NOTE WHERE id_etudiant = %s", (id_etudiant,)),
        ("DELETE FROM INSCRIPTION WHERE id_etudiant = %s", (id_etudiant,)),
        ("DELETE FROM ETUDIANT WHERE id_etudiant = %s", (id_etudiant,)),
    ])
    return jsonify(message="Étudiant et données associées supprimés.")
