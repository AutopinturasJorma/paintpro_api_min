# backend/routes/optimicer_routes.py
from flask import Blueprint, request, jsonify
import traceback
from backend.services.optimicer_service import calcular_optimicer

optimicer_bp = Blueprint('optimicer', __name__, url_prefix="/api/optimicer")

@optimicer_bp.route('/calc', methods=['POST'])
def calc_optimicer():
    try:
        payload = request.get_json(force=True, silent=True) or {}
        data = calcular_optimicer(payload)
        return jsonify(data), 200
    except Exception:
        print("\n[Optimicer] ERROR en /api/optimicer/calc")
        print(traceback.format_exc())
        return jsonify({"error":"Internal Server Error"}), 500
