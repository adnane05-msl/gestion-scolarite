from flask import Blueprint

from controllers import modules_controller as c

bp = Blueprint("modules", __name__, url_prefix="/api/modules")
bp.get("")(c.lister)
bp.post("")(c.creer)
bp.put("/<int:id_module>")(c.modifier)
bp.delete("/<int:id_module>")(c.supprimer)
bp.put("/<int:id_module>/filieres")(c.definir_filieres)
bp.put("/<int:id_module>/enseignants")(c.definir_enseignants)
