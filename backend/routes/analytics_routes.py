from flask import Blueprint, request, jsonify
from backend.services.analytics_service import calc_analytics
import logging

analytics_bp = Blueprint("analytics", __name__, url_prefix="/api/analytics")
log = logging.getLogger("__name__")

PRESETS = {
    "express":    {"leve": 62, "media": 30, "fuerte": 6,  "gran": 2},
    "multimarca": {"leve": 29, "media": 49, "fuerte": 14, "gran": 8},
    "gran":       {"leve": 8,  "media": 28, "fuerte": 37, "gran": 27},
}

def _f(x, d=0.0):
    try:
        if x is None or x == "": return d
        return float(x)
    except: return d

def _i(x, d=0):
    try:
        if x is None or x == "": return d
        return int(float(x))
    except: return d

def _resolve_mix(p):
    # 1) Modo explícito (preferido)
    mode = (p.get("mix_mode") or "").strip().lower()
    if mode == "preset":
        preset = (p.get("mix_preset") or "").strip().lower()
        mix = PRESETS.get(preset)
        if mix: return mix, None
    if mode == "custom":
        mc = p.get("mix_custom") or {}
        leve, media, fuerte, gran = _f(mc.get("leve")), _f(mc.get("media")), _f(mc.get("fuerte")), _f(mc.get("gran"))
        s = leve+media+fuerte+gran
        if s <= 0:
            return PRESETS["multimarca"], "custom_vacio"
        if abs(s-100) > 0.01:
            # normalizamos a 100
            leve, media, fuerte, gran = [x*100.0/s for x in (leve,media,fuerte,gran)]
            return {"leve":leve,"media":media,"fuerte":fuerte,"gran":gran}, "custom_normalizado"
        return {"leve":leve,"media":media,"fuerte":fuerte,"gran":gran}, None

    # 2) Compatibilidad (si alguien envía mix “sueltos”)
    legacy = p.get("mix") or p.get("repair_mix") or {}
    if legacy:
        leve, media, fuerte, gran = _f(legacy.get("leve")), _f(legacy.get("media")), _f(legacy.get("fuerte")), _f(legacy.get("gran"))
        s = leve+media+fuerte+gran
        if s > 0:
            if 0 < s <= 1.0000001:  # venían como fracción
                leve, media, fuerte, gran = [x*100 for x in (leve,media,fuerte,gran)]
                s = leve+media+fuerte+gran
            if abs(s-100) > 0.01:
                leve, media, fuerte, gran = [x*100.0/s for x in (leve,media,fuerte,gran)]
                return {"leve":leve,"media":media,"fuerte":fuerte,"gran":gran}, "legacy_normalizado"
            return {"leve":leve,"media":media,"fuerte":fuerte,"gran":gran}, None

    # 3) Fallback
    return PRESETS["multimarca"], "preset_default"

def _adapt_payload(raw):
    p = raw or {}
    mix, mix_note = _resolve_mix(p)

    payload = {
        "horas_dia":     _i(p.get("horas_dia"), 8),
        "dias_semana":   _i(p.get("dias_semana"), 5),
        "horario":      (p.get("horario") or "continua").strip().lower(),
        "pintores":      _i(p.get("pintores"), 0),
        "chapistas":     _i(p.get("chapistas"), 0),
        "coches_semana": _i(p.get("coches_semana"), 0),
        "pagador":      (p.get("pagador") or "aseguradora").strip().lower(),

        "mix": mix,
        "peritacion": {
            "importe_total":         _f((p.get("peritacion") or {}).get("importe_total"), 0),
            "horas_pintura": _f((p.get("peritacion") or {}).get("horas_pint"), 0),
            "horas_chapa":   _f((p.get("peritacion") or {}).get("horas_chap"), 0),
            "materiales":    _f((p.get("peritacion") or {}).get("mat_pint"), 0),
            "recambios":     _f((p.get("peritacion") or {}).get("recambios"), 0),
        },
        "compraventa": {
            "precio_pieza":     _f((p.get("compraventa") or {}).get("precio_pieza"), 0),
            "piezas_por_coche": _i((p.get("compraventa") or {}).get("piezas_por_coche"), 1),
        },
        "tipo_vehiculo": p.get("tipo_vehiculo"),
    }
    return payload, mix_note

@analytics_bp.post("/calc")
def analytics_calc():
    try:
        raw = request.get_json(force=True) or {}
        # antes usabas: payload, mix_note = _adapt_payload(raw)
        payload = raw  # <-- ya no adaptamos nada

        res = calc_analytics(payload)

        return jsonify(res), 200
    except Exception as e:
        import traceback
        print("[Analytics] ERROR en /api/analytics/calc")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 400


