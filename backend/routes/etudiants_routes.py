from flask import Blueprint

from controllers import etudiants_controller as c

bp = Blueprint("etudiants", __name__, url_prefix="/api/etudiants")
bp.get("")(c.lister)
bp.get("/minimal")(c.tous_minimal)
bp.get("/<int:id_etudiant>")(c.fiche)
bp.post("")(c.creer)
bp.put("/<int:id_etudiant>")(c.modifier)
bp.delete("/<int:id_etudiant>")(c.supprimer)
