from flask import Blueprint

from controllers import stats_controller as c

bp = Blueprint("stats", __name__, url_prefix="/api/stats")
bp.get("")(c.tableau_de_bord)
