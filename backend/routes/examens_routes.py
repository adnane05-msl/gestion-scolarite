from flask import Blueprint

from controllers import examens_controller as c

bp = Blueprint("examens", __name__, url_prefix="/api/examens")
bp.get("")(c.lister)
bp.post("")(c.creer)
bp.put("/<int:id_examen>")(c.modifier)
bp.delete("/<int:id_examen>")(c.supprimer)
bp.get("/<int:id_examen>/etudiants")(c.etudiants_concernes)
bp.post("/<int:id_examen>/notes")(c.enregistrer_notes)
bp.get("/classement")(c.classement)
