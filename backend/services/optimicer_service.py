# optimicer_service.py
# ------------------------------------------------------------
# Cálculos de capacidad y cuello de botella para Optimicer.
# Usa la "Biblia" (constantes y tablas) existente en tu proyecto.
# No modifica valores: solo los consume.
# ------------------------------------------------------------

from math import isfinite
from typing import Dict, Any, Optional

# ============================================================
#             Biblia (se respeta la tuya)
# ============================================================
# Si ya están definidas en tu proyecto, estas asignaciones
# no se ejecutarán porque el nombre existirá en globals().
# (Esto permite usar el archivo de forma aislada sin romper nada.)

G = globals()

if 'FACTOR_CONTINUO' not in G:      FACTOR_CONTINUO = 0.93
if 'FACTOR_PARTIDO'  not in G:      FACTOR_PARTIDO  = 0.85
if 'SEMANAS_MES'     not in G:      SEMANAS_MES     = 4
if 'MARGEN_PINTURA'  not in G:      MARGEN_PINTURA  = 0.30
if 'MARGEN_RECAMBIOS' not in G:     MARGEN_RECAMBIOS = 0.06
if 'EXTRA_MINUTOS_POR_VEH' not in G: EXTRA_MINUTOS_POR_VEH = 20
if 'EXTRA_HORAS_POR_VEH' not in G:  EXTRA_HORAS_POR_VEH = EXTRA_MINUTOS_POR_VEH / 60.0

# Tablas de horas MO por tipo de daño (según tu captura)
if 'H_PINT' not in G:
    H_PINT = { 'leve': 2.67, 'media': 5.62, 'fuerte': 9.90, 'gran': 14.34 }
if 'H_CHAP' not in G:
    H_CHAP = { 'leve': 1.075, 'media': 2.97, 'fuerte': 5.61, 'gran': 8.14 }

# ============================================================
#                 Helpers seguros (numéricos)
# ============================================================

def _n(v: Any, d: float = 0.0) -> float:
    """Convierte a float de forma segura (usa d si no es número)."""
    try:
        x = float(v)
        return x if isfinite(x) else d
    except Exception:
        return d

def _i(v: Any, d: int = 0) -> int:
    """Convierte a int de forma segura."""
    try:
        return int(float(v))
    except Exception:
        return d

def _clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))

# ============================================================
#            Pequeñas funciones de dominio
# ============================================================

def h_efectivas_dia(horas_dia: float, jornada: str) -> float:
    """Horas efectivas/día según jornada."""
    j = (jornada or 'continua').lower()
    f = FACTOR_CONTINUO if j == 'continua' else FACTOR_PARTIDO
    return max(0.0, horas_dia * f)

def mix_or_default(mix: Optional[Dict[str, float]]) -> Dict[str, float]:
    """Normaliza el mix a un diccionario con claves leve/media/fuerte/gran
       y asegura que suma 1. Si viene vacío, usa un mix multimarca típico."""
    if not isinstance(mix, dict):
        mix = {'leve': 0.30, 'media': 0.50, 'fuerte': 0.15, 'gran': 0.05}
    L = _n(mix.get('leve'), 0.0)
    M = _n(mix.get('media'), 0.0)
    F = _n(mix.get('fuerte'), 0.0)
    G_ = _n(mix.get('gran'), 0.0)
    s = L + M + F + G_
    if s <= 0:
        L, M, F, G_ = 0.30, 0.50, 0.15, 0.05
        s = 1.0
    return {
        'leve':   _clamp(L/s, 0.0, 1.0),
        'media':  _clamp(M/s, 0.0, 1.0),
        'fuerte': _clamp(F/s, 0.0, 1.0),
        'gran':   _clamp(G_/s, 0.0, 1.0),
    }

def hp_hc_promedio(mix: Dict[str, float]) -> tuple[float, float]:
    """Horas promedio de pintura (hp) y chapa (hc) ponderadas por el mix."""
    hp = (H_PINT['leve']   * mix['leve']   +
          H_PINT['media']  * mix['media']  +
          H_PINT['fuerte'] * mix['fuerte'] +
          H_PINT['gran']   * mix['gran'])
    hc = (H_CHAP['leve']   * mix['leve']   +
          H_CHAP['media']  * mix['media']  +
          H_CHAP['fuerte'] * mix['fuerte'] +
          H_CHAP['gran']   * mix['gran'])
    return hp, hc

def ciclo_cabina_min_prom(mix: Dict[str, float], barniz: str) -> float:
    """
    Tiempo medio de ciclo de cabina (minutos) ajustado por barniz.
    Base de referencia: 480 min (~1 ciclo "día"). Ajustes simples:
      - rápido: 0.7
      - aire:   0.8
      - conv:   1.0
    """
    base = 480.0
    b = (barniz or 'convencional').lower()
    if b == 'rapido':
        k = 0.70
    elif b == 'aire':
        k = 0.80
    else:
        k = 1.00
    return base * k

def tiempo_pistola_min(ciclo_min: float, barniz: str) -> float:
    """Tiempo mínimo de pistola (min). Mantengo regla simple (25% del ciclo)."""
    return max(0.0, ciclo_min * 0.25)

# ============================================================
#                Función principal (API)
# ============================================================

def calcular_optimicer(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Entradas esperadas en payload (todas opcionales, se normalizan):
      - pintores, chapistas, cabinas, plenums
      - jornada ('continua'|'partida'), horas_dia, dias_semana, semanas_mes
      - mix: {leve, media, fuerte, gran}
      - barniz: 'rapido'|'convencional'|'aire'
      - puestos_pintura, puestos_chapa  (si los usas en guardarraíl)
    """
    p = payload or {}

    # ---- Entradas
    pintores   = _i(p.get('pintores'), 0)
    chapistas  = _i(p.get('chapistas'), 0)
    cabinas    = _i(p.get('cabinas'), 0)
    plenums    = _i(p.get('plenums'), 0)           # de momento informativo
    horas_dia  = _n(p.get('horas_dia'), 8.0)
    dias_sem   = _i(p.get('dias_semana'), 5)
    semanas    = _i(p.get('semanas_mes'), SEMANAS_MES)
    jornada    = (p.get('jornada') or 'continua').lower()
    barniz     = (p.get('barniz')  or 'convencional').lower()
    mix        = mix_or_default(p.get('mix'))

    # Guardarraíl opcional de estructura (puestos/empleado)
    puestos_pintura = _n(p.get('puestos_pintura'), 0.0)
    puestos_chapa   = _n(p.get('puestos_chapa'), 0.0)

    ratio_pp_emp: Optional[float] = None
    ratio_pc_emp: Optional[float] = None
    if pintores > 0 and puestos_pintura > 0:
        ratio_pp_emp = puestos_pintura / pintores  # referencia ~1.3
    if chapistas > 0 and puestos_chapa > 0:
        ratio_pc_emp = puestos_chapa / chapistas

    # ---- Derivados base
    h_eff = h_efectivas_dia(horas_dia, jornada)       # h efectivas/día
    hp, hc = hp_hc_promedio(mix)                      # h promedio por coche
    ciclo_min = ciclo_cabina_min_prom(mix, barniz)    # min por ciclo de cabina
    pistola_min = tiempo_pistola_min(ciclo_min, barniz)

    # ---- Capacidad diaria "push" de cada área
    cap_pint_dia = (pintores  * h_eff / hp) if (pintores > 0 and hp > 0) else 0.0
    cap_chap_dia = (chapistas * h_eff / hc) if (chapistas > 0 and hc > 0) else 0.0
    cap_cab_dia  = (cabinas * (480.0 / ciclo_min)) if (cabinas > 0 and ciclo_min > 0) else 0.0

    # ---- Cuello de botella baseline
    caps = {'pintura': cap_pint_dia, 'chapa': cap_chap_dia, 'cabina': cap_cab_dia}
    cuello = min(caps, key=caps.get) if caps else 'cabina'
    cap_base_dia = caps.get(cuello, 0.0)

    # ---- Producción semanal / mensual (ideal por disponibilidad)
    veh_sem = cap_base_dia * dias_sem
    veh_mes = veh_sem * semanas

    # ---- Reglas simples de recomendación (no prescriben cambios: solo info)
    recomendaciones = []

    # Guardarraíl: no recomendar cabina si se "comen" puestos
    # Regla: si al añadir 1 cabina restas 2 puestos de chapa/pintura y
    #        los puestos por empleado caerían por debajo de ~1.3 -> no recomendar.
    GUARDARRAIL_PP = 1.3
    if cabinas >= 1 and puestos_pintura > 0 and pintores > 0:
        if (puestos_pintura - 2) / pintores < GUARDARRAIL_PP:
            recomendaciones.append({
                'area': 'cabina',
                'tipo': 'guardarrail',
                'razon': 'Añadir cabina quita 2 puestos; bajarías de 1,3 puestos/pintor.'
            })

    # Señal de cabina como cuello
    if cuello == 'cabina':
        recomendaciones.append({
            'area': 'cabina',
            'tipo': 'cuello',
            'razon': 'La cabina limita la producción diaria.',
            'sugerencia': 'Considera OVA (One Visit) o mejorar secado para reducir ciclo.'
        })

    # Jornada
    if jornada == 'partida':
        recomendaciones.append({
            'area': 'organizacion',
            'tipo': 'jornada',
            'razon': 'La jornada partida reduce las horas efectivas (factor 0.85).',
            'sugerencia': 'Valorar jornada continua (factor 0.93).'
        })

    # Barniz
    if barniz != 'rapido':
        recomendaciones.append({
            'area': 'pintura',
            'tipo': 'barniz',
            'razon': 'Barniz no rápido alarga el ciclo de cabina.',
            'sugerencia': 'Migrar a barniz rápido cuando sea compatible.'
        })

    # Puestos/empleado
    if ratio_pp_emp is not None and ratio_pp_emp < 1.3:
        recomendaciones.append({
            'area': 'pintura',
            'tipo': 'puestos',
            'razon': f'Puestos/pintor bajos ({ratio_pp_emp:.2f}).',
            'sugerencia': 'Ampliar mesas/prep hasta ~1.3 por pintor.'
        })
    if ratio_pc_emp is not None and ratio_pc_emp < 1.3:
        recomendaciones.append({
            'area': 'chapa',
            'tipo': 'puestos',
            'razon': f'Puestos/chapista bajos ({ratio_pc_emp:.2f}).',
            'sugerencia': 'Ampliar puestos/chapista hasta ~1.3.'
        })

    # ========================================================
    #             Salida para el frontend
    # ========================================================
    out: Dict[str, Any] = {
        'parametros': {
            'hp_h': hp,                         # horas pintura por coche (promedio)
            'hc_h': hc,                         # horas chapa por coche (promedio)
            'ciclo_cabina_min': ciclo_min,
            'tiempo_pistola_min': pistola_min,
            'h_efectivas_dia': h_eff,
            'dias_semana': dias_sem,
            'semanas_mes': semanas,
        },
        'capacidad': {
            'pintura_dia': round(cap_pint_dia, 2),
            'chapa_dia':   round(cap_chap_dia, 2),
            'cabina_dia':  round(cap_cab_dia, 2),
            'veh_sem':     round(veh_sem, 1),
            'veh_mes':     round(veh_mes, 1),
        },
        'cuello': cuello,            # 'pintura' | 'chapa' | 'cabina'
        'recomendaciones': recomendaciones,
    }
    return out

# ------------------------------------------------------------
# Fin del módulo
# ------------------------------------------------------------
