from flask import Blueprint

from controllers import inscriptions_controller as c

bp = Blueprint("inscriptions", __name__, url_prefix="/api/inscriptions")
bp.get("")(c.lister)
bp.post("")(c.creer)
bp.delete("/<int:id_inscription>")(c.supprimer)
