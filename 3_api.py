"""
===============================================================
  LifeHackIA — App Pronósticos Fútbol
  MÓDULO 3: API REST con FastAPI
  
  Ejecutar con:
    pip install fastapi uvicorn
    python 3_api.py
  
  Documentación automática en:
    http://localhost:8000/docs
===============================================================
"""

import pickle
import json
import os
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import uvicorn

# ─── CARGAR MODELO ────────────────────────────────────────────

def cargar_modelo():
    """Carga el modelo entrenado y sus metadatos."""
    try:
        with open("modelo/modelo_xgboost.pkl", "rb") as f:
            model = pickle.load(f)
        with open("modelo/label_encoder.pkl", "rb") as f:
            le = pickle.load(f)
        with open("modelo/metadata.json", "r") as f:
            metadata = json.load(f)
        print("✅ Modelo cargado correctamente")
        return model, le, metadata
    except FileNotFoundError:
        print("⚠️  Modelo no encontrado. Ejecuta: python 2_entrenar_modelo.py")
        return None, None, None

MODEL, LABEL_ENCODER, METADATA = cargar_modelo()

# ─── FASTAPI APP ──────────────────────────────────────────────

app = FastAPI(
    title="⚽ LifeHackIA — Pronósticos de Fútbol",
    description="""
    API de predicción de resultados de fútbol usando Machine Learning.
    
    ## Endpoints principales
    - **POST /pronostico** — Predice el resultado de un partido
    - **GET /equipos** — Lista equipos disponibles
    - **GET /salud** — Estado de la API
    
    Desarrollado con ❤️ por @LifeHackIA desde Buenaventura, Colombia
    """,
    version="1.0.0"
)

# Permitir peticiones desde el frontend (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── MODELOS DE DATOS ─────────────────────────────────────────

class EquipoStats(BaseModel):
    """Estadísticas de un equipo en sus últimos partidos."""
    
    goles_favor_prom:  float = Field(
        ..., ge=0, le=10,
        description="Promedio de goles a favor (últimos 5 partidos)",
        example=1.8
    )
    goles_contra_prom: float = Field(
        ..., ge=0, le=10,
        description="Promedio de goles en contra (últimos 5 partidos)",
        example=0.9
    )
    puntos_prom:       float = Field(
        ..., ge=0, le=3,
        description="Promedio de puntos obtenidos (últimos 5 partidos)",
        example=2.2
    )
    partidos_historial: int = Field(
        ..., ge=1, le=100,
        description="Número de partidos en el historial",
        example=5
    )


class SolicitudPronostico(BaseModel):
    """Datos necesarios para generar un pronóstico."""
    
    equipo_local:    str = Field(..., example="Real Madrid")
    equipo_visitante: str = Field(..., example="Barcelona")
    stats_local:     EquipoStats
    stats_visitante: EquipoStats
    h2h_victorias_local:  int = Field(0, ge=0, description="Victorias del local en enfrentamientos directos")
    h2h_total_partidos:   int = Field(0, ge=0, description="Total partidos directos entre ambos")


class ResultadoPronostico(BaseModel):
    """Resultado de la predicción."""
    
    partido:       str
    prediccion:    str
    confianza:     float
    probabilidades: dict
    recomendacion: str
    advertencia:   str


# ─── ENDPOINTS ────────────────────────────────────────────────

@app.get("/", tags=["General"])
def inicio():
    """Bienvenida a la API."""
    return {
        "mensaje": "⚽ LifeHackIA — API de Pronósticos de Fútbol",
        "version": "1.0.0",
        "estado":  "activa",
        "docs":    "/docs"
    }


@app.get("/salud", tags=["General"])
def salud():
    """Verifica el estado de la API y el modelo."""
    modelo_cargado = MODEL is not None
    return {
        "api":    "✅ Activa",
        "modelo": "✅ Cargado" if modelo_cargado else "❌ No cargado",
        "version_modelo": METADATA.get("version") if METADATA else None
    }


@app.post("/pronostico", response_model=ResultadoPronostico, tags=["Predicciones"])
def generar_pronostico(solicitud: SolicitudPronostico):
    """
    Genera el pronóstico de un partido de fútbol.
    
    Devuelve:
    - **prediccion**: LOCAL / EMPATE / VISITANTE
    - **confianza**: Porcentaje de seguridad del modelo
    - **probabilidades**: Probabilidad de cada resultado
    - **recomendacion**: Interpretación del pronóstico
    """
    if MODEL is None:
        raise HTTPException(
            status_code=503,
            detail="Modelo no disponible. Ejecuta python 2_entrenar_modelo.py primero."
        )
    
    # Construir el vector de features
    features_df = pd.DataFrame([{
        "local_goles_favor_prom":    solicitud.stats_local.goles_favor_prom,
        "local_goles_contra_prom":   solicitud.stats_local.goles_contra_prom,
        "local_puntos_prom":         solicitud.stats_local.puntos_prom,
        "local_partidos_historial":  solicitud.stats_local.partidos_historial,
        "visit_goles_favor_prom":    solicitud.stats_visitante.goles_favor_prom,
        "visit_goles_contra_prom":   solicitud.stats_visitante.goles_contra_prom,
        "visit_puntos_prom":         solicitud.stats_visitante.puntos_prom,
        "visit_partidos_historial":  solicitud.stats_visitante.partidos_historial,
        "h2h_victorias_local":       solicitud.h2h_victorias_local,
        "h2h_total_partidos":        solicitud.h2h_total_partidos,
    }])
    
    # Predicción
    pred_idx   = MODEL.predict(features_df)[0]
    pred_proba = MODEL.predict_proba(features_df)[0]
    resultado  = LABEL_ENCODER.inverse_transform([pred_idx])[0]
    confianza  = float(max(pred_proba))
    
    # Probabilidades por clase
    probabilidades = {
        clase: round(float(prob) * 100, 1)
        for clase, prob in zip(LABEL_ENCODER.classes_, pred_proba)
    }
    
    # Recomendación interpretada
    recomendaciones = {
        "LOCAL":     f"El modelo favorece a {solicitud.equipo_local}",
        "VISITANTE": f"El modelo favorece a {solicitud.equipo_visitante}",
        "EMPATE":    "El modelo prevé un partido muy equilibrado"
    }
    
    # Advertencia según confianza
    if confianza < 0.45:
        advertencia = "⚠️ Partido muy incierto. Baja confianza en la predicción."
    elif confianza < 0.60:
        advertencia = "📊 Confianza moderada. El partido puede ir a cualquier lado."
    else:
        advertencia = "✅ Alta confianza en esta predicción."
    
    return ResultadoPronostico(
        partido=f"{solicitud.equipo_local} vs {solicitud.equipo_visitante}",
        prediccion=resultado,
        confianza=round(confianza * 100, 1),
        probabilidades=probabilidades,
        recomendacion=recomendaciones[resultado],
        advertencia=advertencia
    )


@app.get("/ejemplo", tags=["Predicciones"])
def ejemplo_pronostico():
    """
    Devuelve un ejemplo de solicitud para /pronostico.
    Útil para integrar el frontend.
    """
    return {
        "descripcion": "Ejemplo de solicitud para POST /pronostico",
        "solicitud": {
            "equipo_local": "Real Madrid",
            "equipo_visitante": "Barcelona",
            "stats_local": {
                "goles_favor_prom": 1.8,
                "goles_contra_prom": 0.9,
                "puntos_prom": 2.2,
                "partidos_historial": 5
            },
            "stats_visitante": {
                "goles_favor_prom": 1.6,
                "goles_contra_prom": 1.0,
                "puntos_prom": 2.0,
                "partidos_historial": 5
            },
            "h2h_victorias_local": 3,
            "h2h_total_partidos": 10
        }
    }


# ─── MAIN ─────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 60)
    print("  LifeHackIA — API de Pronósticos en ejecución")
    print("=" * 60)
    print("  📡 URL:  http://localhost:8000")
    print("  📚 Docs: http://localhost:8000/docs")
    print("=" * 60)
    
    uvicorn.run(
        "3_api:app",
        host="0.0.0.0",
        port=8000,
        reload=True  # Recarga automática al guardar cambios
    )
