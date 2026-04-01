"""
===============================================================
  LifeHackIA — App Pronósticos Fútbol
  MÓDULO 2: Entrenamiento del modelo XGBoost
===============================================================
"""

import pandas as pd
import numpy as np
import pickle
import os
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    accuracy_score, classification_report, confusion_matrix
)
from xgboost import XGBClassifier

# ─── CONFIGURACIÓN ────────────────────────────────────────────

FEATURES = [
    "local_goles_favor_prom",
    "local_goles_contra_prom",
    "local_puntos_prom",
    "local_partidos_historial",
    "visit_goles_favor_prom",
    "visit_goles_contra_prom",
    "visit_puntos_prom",
    "visit_partidos_historial",
    "h2h_victorias_local",
    "h2h_total_partidos",
]

TARGET = "resultado"

# ─── CARGA DE DATOS ───────────────────────────────────────────

def cargar_datos(ruta: str) -> pd.DataFrame:
    print(f"📂 Cargando datos desde: {ruta}")
    df = pd.read_csv(ruta)
    print(f"   ✅ {len(df)} partidos cargados")
    
    # Filtrar partidos con historial suficiente
    df = df[df["local_partidos_historial"] >= 3]
    df = df[df["visit_partidos_historial"] >= 3]
    print(f"   📊 {len(df)} partidos con historial suficiente (≥3 partidos previos)")
    
    return df


# ─── ENTRENAMIENTO ────────────────────────────────────────────

def entrenar_modelo(df: pd.DataFrame):
    print("\n🤖 Iniciando entrenamiento del modelo XGBoost...")
    
    # Codificar el target
    le = LabelEncoder()
    y = le.fit_transform(df[TARGET])
    X = df[FEATURES]
    
    print(f"   Clases: {list(le.classes_)}")  # ['EMPATE', 'LOCAL', 'VISITANTE']
    
    # División train / test
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"   Train: {len(X_train)} | Test: {len(X_test)}")
    
    # Modelo XGBoost
    model = XGBClassifier(
        n_estimators=200,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        eval_metric="mlogloss",
        verbosity=0
    )
    
    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        verbose=False
    )
    
    return model, le, X_test, y_test


# ─── EVALUACIÓN ───────────────────────────────────────────────

def evaluar_modelo(model, le, X_test, y_test):
    print("\n📊 Evaluando el modelo...")
    
    preds = model.predict(X_test)
    proba = model.predict_proba(X_test)
    
    acc = accuracy_score(y_test, preds)
    
    print(f"\n   🎯 Precisión general: {acc:.2%}")
    print("\n   📋 Reporte por clase:")
    print(classification_report(
        y_test, preds,
        target_names=le.classes_,
        digits=3
    ))
    
    # Importancia de features
    print("   🔍 Importancia de variables:")
    importancias = pd.Series(
        model.feature_importances_,
        index=FEATURES
    ).sort_values(ascending=False)
    
    for feat, imp in importancias.items():
        barra = "█" * int(imp * 40)
        print(f"   {feat:<35} {barra} {imp:.3f}")
    
    return acc


# ─── GUARDAR MODELO ───────────────────────────────────────────

def guardar_modelo(model, le, features: list):
    os.makedirs("modelo", exist_ok=True)
    
    # Guardar modelo
    with open("modelo/modelo_xgboost.pkl", "wb") as f:
        pickle.dump(model, f)
    
    # Guardar encoder
    with open("modelo/label_encoder.pkl", "wb") as f:
        pickle.dump(le, f)
    
    # Guardar metadata
    import json
    metadata = {
        "features": features,
        "clases": list(le.classes_),
        "version": "1.0.0"
    }
    with open("modelo/metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)
    
    print("\n   💾 Modelo guardado en: modelo/")
    print("   📁 Archivos:")
    print("      - modelo_xgboost.pkl")
    print("      - label_encoder.pkl")
    print("      - metadata.json")


# ─── PREDICCIÓN DE PRUEBA ─────────────────────────────────────

def probar_prediccion(model, le):
    print("\n🧪 Prueba de predicción manual:")
    
    # Ejemplo: Real Madrid vs Barcelona
    ejemplo = pd.DataFrame([{
        "local_goles_favor_prom":   1.8,
        "local_goles_contra_prom":  0.9,
        "local_puntos_prom":        2.2,
        "local_partidos_historial": 5,
        "visit_goles_favor_prom":   1.6,
        "visit_goles_contra_prom":  1.0,
        "visit_puntos_prom":        2.0,
        "visit_partidos_historial": 5,
        "h2h_victorias_local":      3,
        "h2h_total_partidos":       10,
    }])
    
    pred_idx  = model.predict(ejemplo)[0]
    pred_prob = model.predict_proba(ejemplo)[0]
    resultado = le.inverse_transform([pred_idx])[0]
    
    print(f"\n   Partido: Real Madrid vs Barcelona")
    print(f"   Predicción: {resultado}")
    print(f"\n   Probabilidades:")
    for clase, prob in zip(le.classes_, pred_prob):
        barra = "█" * int(prob * 30)
        print(f"   {clase:<12} {barra} {prob:.1%}")


# ─── MAIN ─────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 60)
    print("  LifeHackIA — Entrenamiento Modelo XGBoost")
    print("=" * 60)
    
    # Cargar datos
    ruta_datos = "datos/partidos_features.csv"
    
    if not os.path.exists(ruta_datos):
        print(f"\n❌ No se encontró: {ruta_datos}")
        print("   Ejecuta primero: python 1_recolectar_datos.py")
        exit(1)
    
    df = cargar_datos(ruta_datos)
    
    # Entrenar
    model, le, X_test, y_test = entrenar_modelo(df)
    
    # Evaluar
    accuracy = evaluar_modelo(model, le, X_test, y_test)
    
    # Guardar
    guardar_modelo(model, le, FEATURES)
    
    # Prueba
    probar_prediccion(model, le)
    
    print("\n" + "=" * 60)
    print(f"  ✅ Modelo entrenado con {accuracy:.1%} de precisión")
    print("  🚀 Siguiente paso: python 3_api.py")
    print("=" * 60)
