from flask import jsonify, request

from config.db import execute, query
from middlewares.erreurs import ErreurApplicative
from services.validation import pagination


def lister():
    page, taille, decalage = pagination(request.args)
    condition, params = "", []
    if request.args.get("statut") in ("lue", "non_lue"):
        condition = "WHERE n.statut = %s"
        params.append(request.args["statut"])

    base = """
        FROM NOTIFICATION n
        JOIN ABSENCE a  ON a.id_absence  = n.id_absence
        JOIN ETUDIANT e ON e.id_etudiant = a.id_etudiant
    """
    total = query(f"SELECT COUNT(*) AS n {base} {condition}", params, one=True)["n"]
    lignes = query(
        f"""
        SELECT n.id_notification, n.message, n.date_notification, n.statut,
               a.id_absence, a.date_absence, a.nb_heures, a.justifie,
               e.id_etudiant, e.nom, e.prenom, e.cne
        {base} {condition}
        ORDER BY n.date_notification DESC, n.id_notification DESC
        LIMIT %s OFFSET %s
        """,
        params + [taille, decalage],
    )
    return jsonify(donnees=lignes, total=total, page=page, taille=taille)


def compter_non_lues():
    n = query("SELECT COUNT(*) AS n FROM NOTIFICATION WHERE statut = 'non_lue'", one=True)["n"]
    return jsonify(non_lues=n)


def marquer_lue(id_notification):
    _, nb = execute(
        "UPDATE NOTIFICATION SET statut = 'lue' WHERE id_notification = %s", (id_notification,)
    )
    if nb == 0 and not query(
        "SELECT 1 FROM NOTIFICATION WHERE id_notification = %s", (id_notification,), one=True
    ):
        raise ErreurApplicative("Notification introuvable.", 404)
    return jsonify(message="Notification marquée comme lue.")


def tout_marquer_lues():
    _, nb = execute("UPDATE NOTIFICATION SET statut = 'lue' WHERE statut = 'non_lue'")
    return jsonify(message=f"{nb} notification(s) marquée(s) comme lue(s).")
