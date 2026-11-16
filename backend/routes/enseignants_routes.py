from flask import Blueprint

from controllers import enseignants_controller as c

bp = Blueprint("enseignants", __name__, url_prefix="/api/enseignants")
bp.get("")(c.lister)
bp.post("")(c.creer)
bp.put("/<int:id_enseignant>")(c.modifier)
bp.delete("/<int:id_enseignant>")(c.supprimer)
bp.put("/<int:id_enseignant>/modules")(c.definir_modules)
