from flask import Blueprint

from controllers import filieres_controller as c

bp = Blueprint("filieres", __name__, url_prefix="/api/filieres")
bp.get("")(c.lister)
bp.post("")(c.creer)
bp.put("/<int:id_filiere>")(c.modifier)
bp.delete("/<int:id_filiere>")(c.supprimer)
bp.get("/<int:id_filiere>/etudiants")(c.etudiants)
bp.get("/<int:id_filiere>/modules")(c.modules)
bp.put("/<int:id_filiere>/modules")(c.definir_modules)
