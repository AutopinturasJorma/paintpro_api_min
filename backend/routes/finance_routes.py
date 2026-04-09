# backend/routes/finance_routes.py
from flask import Blueprint, request, jsonify
import traceback
from backend.services.analytics_service import calc_analytics
from backend.services.finance_service import calcular_finance

# prefijo /api/finance
finance_bp = Blueprint('finance', __name__, url_prefix="/api/finance")


@finance_bp.route('/calc', methods=['POST'])
def calc_finance():
    """
    Pipeline en serie:
    1️⃣ Ejecuta Analytics con el payload recibido.
    2️⃣ Pasa sus KPIs y finance_bridge al cálculo de Finance.
    3️⃣ Devuelve los resultados combinados.
    """
    try:
        # === Paso 1: recibir y ejecutar analytics ===
        payload = request.get_json(force=True, silent=True) or {}
        analytics_res = calc_analytics(payload)

        # === Paso 2: construir payload enriquecido para Finance ===
        enriched_payload = {
            **payload,
            **analytics_res.get("kpis", {}),
            **analytics_res.get("finance_bridge", {})
        }

        # === Paso 3: ejecutar Finance ===
        finance_res = calcular_finance(enriched_payload)

        # Incluimos datos base de Analytics por depuración (opcional)
        finance_res["analytics_base"] = {
            "kpis": analytics_res.get("kpis", {}),
            "finance_bridge": analytics_res.get("finance_bridge", {})
        }

        return jsonify(finance_res), 200

    except Exception as e:
        print("\n[Finance] ERROR en /api/finance/calc")
        print(traceback.format_exc())
        return jsonify({
            "error": f"{type(e).__name__}: {str(e)}"
        }), 500
