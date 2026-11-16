"""Conversion des erreurs MySQL et applicatives en réponses JSON lisibles."""

from decimal import Decimal

import mysql.connector
from flask import jsonify
from flask.json.provider import DefaultJSONProvider


class ErreurApplicative(Exception):
    """Erreur métier renvoyée au client avec un code HTTP."""

    def __init__(self, message, statut=400):
        super().__init__(message)
        self.message = message
        self.statut = statut


class FournisseurJSON(DefaultJSONProvider):
    """Permet à Flask de sérialiser les Decimal renvoyés par MySQL."""

    @staticmethod
    def default(objet):
        if isinstance(objet, Decimal):
            return float(objet)
        return DefaultJSONProvider.default(objet)


MESSAGES_MYSQL = {
    1062: ("Cette valeur existe déjà (contrainte d'unicité).", 409),
    1451: ("Suppression impossible : des données associées existent encore.", 409),
    1452: ("Référence invalide : l'élément lié n'existe pas.", 400),
    3819: ("Valeur refusée par une contrainte de vérification (CHECK).", 400),
    1048: ("Un champ obligatoire est vide.", 400),
    1406: ("Valeur trop longue pour un champ.", 400),
}


def enregistrer_gestionnaires(app):
    app.json = FournisseurJSON(app)

    @app.errorhandler(ErreurApplicative)
    def erreur_applicative(e):
        return jsonify(erreur=e.message), e.statut

    @app.errorhandler(mysql.connector.Error)
    def erreur_mysql(e):
        message, statut = MESSAGES_MYSQL.get(e.errno, (f"Erreur base de données : {e.msg}", 500))
        return jsonify(erreur=message, code_mysql=e.errno), statut

    @app.errorhandler(404)
    def introuvable(_):
        return jsonify(erreur="Ressource introuvable."), 404

    @app.errorhandler(Exception)
    def erreur_generale(e):
        return jsonify(erreur=f"Erreur interne : {e}"), 500
