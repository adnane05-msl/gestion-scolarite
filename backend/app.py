"""EduTrack — API REST Flask connectée à la base MySQL gestion_scolarite."""

from flask import Flask, jsonify
from flask_cors import CORS

from config.db import query
from middlewares.erreurs import enregistrer_gestionnaires
from routes import (
    absences_routes,
    enseignants_routes,
    etudiants_routes,
    examens_routes,
    filieres_routes,
    inscriptions_routes,
    modules_routes,
    notifications_routes,
    stats_routes,
)


def creer_application():
    app = Flask(__name__)
    CORS(app)
    enregistrer_gestionnaires(app)

    for module in (
        stats_routes,
        etudiants_routes,
        enseignants_routes,
        filieres_routes,
        modules_routes,
        inscriptions_routes,
        examens_routes,
        absences_routes,
        notifications_routes,
    ):
        app.register_blueprint(module.bp)

    @app.get("/api/health")
    def health():
        info = query("SELECT DATABASE() AS db, VERSION() AS version", one=True)
        return jsonify(status="ok", database=info["db"], mysql=info["version"])

    return app


app = creer_application()

if __name__ == "__main__":
    app.run(debug=True, port=5000)
