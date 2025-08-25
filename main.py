from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional

app = FastAPI(title="PaintPro API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyticsInput(BaseModel):
    tipo_vehiculo: str
    perfil: str
    pintores: int
    chapistas: int
    horario: str
    horas_dia: float
    dias_mes: int
    pt: float
    coches_semana_real: Optional[float] = 0

@app.post("/analytics/preview")
def analytics_preview(payload: AnalyticsInput):
    data = payload.model_dump()
    real_sem = float(data.get("coches_semana_real") or 0)
    real_mes = round(real_sem * 4.3) if real_sem else None
    capacidad_mes = round(real_mes * 1.15) if real_mes else None
    gap = None
    if capacidad_mes and real_mes:
        gap = round(((capacidad_mes - real_mes)/capacidad_mes)*100)
    def msg(g):
        if g is None: return "Completa Analytics para descubrir tu potencial real."
        if g >= 0: return f"Tu taller puede producir aproximadamente un {g:.0f}% más. Te ayudamos a convertirlo en coches entregados."
        return "Tu taller rinde por encima de lo esperado. Te ayudamos a mantener ese nivel reduciendo consumo y mejorando margen."
    return {
        "summary": {
            "capacidad_teorica_mes": capacidad_mes,
            "real_declarado_mes": real_mes,
            "gap_percent": gap,
            "mensaje": msg(gap if gap is not None else 0)
        }
    }

@app.get("/health")
def health():
    import datetime as dt
    return {"status":"ok","ts": dt.datetime.utcnow().isoformat()+"Z"}
