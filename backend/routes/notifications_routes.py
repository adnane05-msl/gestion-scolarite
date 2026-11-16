from flask import Blueprint

from controllers import notifications_controller as c

bp = Blueprint("notifications", __name__, url_prefix="/api/notifications")
bp.get("")(c.lister)
bp.get("/non-lues")(c.compter_non_lues)
bp.put("/<int:id_notification>/lue")(c.marquer_lue)
bp.put("/tout-lues")(c.tout_marquer_lues)
