from flask import Blueprint, request, jsonify
from backend.services.team_service import calcular_team

team_bp = Blueprint("team_bp", __name__)

@team_bp.route("/calc", methods=["POST"])
def calc_team():
    data = request.get_json(force=True) or {}
    analytics = data.get("analytics", {})
    optimicer = data.get("optimicer", {})
    res = calcular_team(analytics, optimicer)
    return jsonify(res), 200
