FACTOR_CONTINUO = 0.93
FACTOR_PARTIDO  = 0.85

def eficiencia_por_pt(pt: float) -> float:
    # PT = puestos / empleado
    if pt >= 2.0: return 1.20
    if pt >= 1.5: return 1.10
    if pt >= 1.3: return 1.05
    return 1.00

# Horas medias de pintura y chapa por tipo
H_PINT = {"leve": 2.67, "media": 5.62, "fuerte": 9.90, "gran": 14.34}
H_CHAP = {"leve": 1.075, "media": 2.97, "fuerte": 5.61, "gran": 8.14}

# Mix por perfil (si no se recibe uno específico)
PERFIL = {
    "express":   {"leve": 0.62, "media": 0.30, "fuerte": 0.06, "gran": 0.02},
    "multimarca":{"leve": 0.29, "media": 0.49, "fuerte": 0.14, "gran": 0.08},
    "gran":      {"leve": 0.08, "media": 0.28, "fuerte": 0.37, "gran": 0.27},
}

# Ciclos cabina por barniz (horas aprox)
CICLO_CAB_RAPIDO = {"leve": 1.25, "media": 1.6, "fuerte": 1.9, "gran": 2.2}
CICLO_CAB_CONV   = {k: v + 0.25 for k, v in CICLO_CAB_RAPIDO.items()}

# Plenum (leves) secado al aire (h)
CICLO_PLENUM_AIRE = 1.0  # 60 min aprox

# OneVisit: ahorro medio en pintura (h)
ONEVISIT_AHORRO_H = {"leve": 0.08, "media": 0.13, "fuerte": 0.20, "gran": 0.33}

# Maniobras + elección color (se hace en preparación, no en cabina)
T_MANI_COLOR_H = 20/60.0  # 0.333 h
