from flask import Blueprint

from controllers import absences_controller as c

bp = Blueprint("absences", __name__, url_prefix="/api/absences")
bp.get("")(c.lister)
bp.get("/totaux")(c.totaux)
bp.get("/alertes")(c.alertes)
bp.post("")(c.creer)
bp.put("/<int:id_absence>")(c.modifier)
bp.delete("/<int:id_absence>")(c.supprimer)
