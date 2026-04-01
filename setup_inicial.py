"""
setup_inicial.py
Se ejecuta automáticamente al arrancar en Railway.
Genera datos demo y entrena el modelo si no existe.
"""

import os
import sys

print("🚀 LifeHackIA — Setup inicial en Railway...")

# Verificar si el modelo ya existe
if os.path.exists("modelo/modelo_xgboost.pkl"):
    print("✅ Modelo ya entrenado. Saltando setup.")
    sys.exit(0)

print("📊 Modelo no encontrado. Generando datos y entrenando...")

# ── Paso 1: Generar datos demo ─────────────────────────────────
import random
import pandas as pd
from datetime import datetime

random.seed(42)

equipos = [
    "Real Madrid", "Barcelona", "Atlético Madrid", "Sevilla",
    "Valencia", "Villarreal", "Athletic Club", "Real Sociedad",
    "Betis", "Osasuna", "Celta Vigo", "Getafe"
]

registros = []
fecha_base = datetime(2023, 8, 1)

for jornada in range(1, 38):
    equipos_jornada = equipos.copy()
    random.shuffle(equipos_jornada)
    for i in range(0, len(equipos_jornada) - 1, 2):
        local     = equipos_jornada[i]
        visitante = equipos_jornada[i + 1]
        goles_l   = random.choices([0,1,2,3,4], weights=[15,30,30,15,10])[0]
        goles_v   = random.choices([0,1,2,3,4], weights=[20,35,25,15,5])[0]

        if goles_l > goles_v:   resultado = "LOCAL"
        elif goles_l < goles_v: resultado = "VISITANTE"
        else:                   resultado = "EMPATE"

        registros.append({
            "partido_id":       jornada * 100 + i,
            "fecha":            (fecha_base + pd.Timedelta(days=jornada * 7)).strftime("%Y-%m-%d"),
            "equipo_local":     local,
            "equipo_visitante": visitante,
            "goles_local":      goles_l,
            "goles_visitante":  goles_v,
            "resultado":        resultado
        })

df = pd.DataFrame(registros)
os.makedirs("datos", exist_ok=True)
df.to_csv("datos/partidos_raw.csv", index=False)
print(f"   ✅ {len(df)} partidos demo generados")

# ── Paso 2: Calcular features ─────────────────────────────────
df = df.sort_values("fecha").reset_index(drop=True)
features_lista = []

for idx, partido in df.iterrows():
    fecha     = partido["fecha"]
    local     = partido["equipo_local"]
    visitante = partido["equipo_visitante"]

    hist_l = df[
        ((df["equipo_local"] == local) | (df["equipo_visitante"] == local)) &
        (df["fecha"] < fecha)
    ].tail(5)

    hist_v = df[
        ((df["equipo_local"] == visitante) | (df["equipo_visitante"] == visitante)) &
        (df["fecha"] < fecha)
    ].tail(5)

    h2h = df[
        ((df["equipo_local"] == local) & (df["equipo_visitante"] == visitante)) |
        ((df["equipo_local"] == visitante) & (df["equipo_visitante"] == local))
    ]

    def stats(hist, nombre):
        if len(hist) == 0:
            return {"gf": 1.0, "gc": 1.0, "pts": 1.0, "n": 0}
        gf, gc, pts = [], [], []
        for _, h in hist.iterrows():
            if h["equipo_local"] == nombre:
                gf.append(h["goles_local"]); gc.append(h["goles_visitante"])
                pts.append(3 if h["resultado"]=="LOCAL" else (1 if h["resultado"]=="EMPATE" else 0))
            else:
                gf.append(h["goles_visitante"]); gc.append(h["goles_local"])
                pts.append(3 if h["resultado"]=="VISITANTE" else (1 if h["resultado"]=="EMPATE" else 0))
        return {"gf": sum(gf)/len(gf), "gc": sum(gc)/len(gc), "pts": sum(pts)/len(pts), "n": len(hist)}

    sl = stats(hist_l, local)
    sv = stats(hist_v, visitante)
    h2h_wins = len(h2h[(h2h["equipo_local"]==local) & (h2h["resultado"]=="LOCAL")])

    features_lista.append({
        "partido_id":               partido["partido_id"],
        "local_goles_favor_prom":   round(sl["gf"], 2),
        "local_goles_contra_prom":  round(sl["gc"], 2),
        "local_puntos_prom":        round(sl["pts"], 2),
        "local_partidos_historial": sl["n"],
        "visit_goles_favor_prom":   round(sv["gf"], 2),
        "visit_goles_contra_prom":  round(sv["gc"], 2),
        "visit_puntos_prom":        round(sv["pts"], 2),
        "visit_partidos_historial": sv["n"],
        "h2h_victorias_local":      h2h_wins,
        "h2h_total_partidos":       len(h2h),
        "resultado":                partido["resultado"]
    })

df_feat = pd.DataFrame(features_lista)
df_feat = df_feat[df_feat["local_partidos_historial"] >= 3]
df_feat = df_feat[df_feat["visit_partidos_historial"] >= 3]
df_feat.to_csv("datos/partidos_features.csv", index=False)
print(f"   ✅ {len(df_feat)} partidos con features calculadas")

# ── Paso 3: Entrenar modelo ───────────────────────────────────
import pickle
import json
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score
from xgboost import XGBClassifier

FEATURES = [
    "local_goles_favor_prom", "local_goles_contra_prom",
    "local_puntos_prom", "local_partidos_historial",
    "visit_goles_favor_prom", "visit_goles_contra_prom",
    "visit_puntos_prom", "visit_partidos_historial",
    "h2h_victorias_local", "h2h_total_partidos"
]

le = LabelEncoder()
y  = le.fit_transform(df_feat["resultado"])
X  = df_feat[FEATURES]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = XGBClassifier(n_estimators=200, max_depth=5, learning_rate=0.05,
                      random_state=42, eval_metric="mlogloss", verbosity=0)
model.fit(X_train, y_train)

acc = accuracy_score(y_test, model.predict(X_test))
print(f"   🎯 Precisión del modelo: {acc:.2%}")

os.makedirs("modelo", exist_ok=True)
with open("modelo/modelo_xgboost.pkl", "wb") as f: pickle.dump(model, f)
with open("modelo/label_encoder.pkl", "wb") as f:  pickle.dump(le, f)
with open("modelo/metadata.json", "w") as f:
    json.dump({"features": FEATURES, "clases": list(le.classes_), "version": "1.0.0"}, f)

print("   💾 Modelo guardado en modelo/")
print("\n✅ Setup completo. Iniciando API...")
