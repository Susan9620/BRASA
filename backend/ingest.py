"""
BRASA — Script de ingesta de datos NASA FIRMS
=============================================
Lee todos los CSVs de ../data/raw/ y los carga en SQLite (brasa.db).
Ejecutar UNA sola vez antes de lanzar el servidor.

Uso:
    cd backend
    python ingest.py

Columnas estándar NASA FIRMS (MODIS):
  latitude, longitude, brightness, scan, track, acq_date, acq_time,
  satellite, instrument, confidence, version, bright_t31, frp, daynight, type

Columnas estándar NASA FIRMS (VIIRS S-NPP / NOAA-20):
  latitude, longitude, bright_ti4, scan, track, acq_date, acq_time,
  satellite, instrument, confidence, version, bright_ti5, frp, daynight, type
"""

import sqlite3
import pandas as pd
import numpy as np
from pathlib import Path
import sys

RAW_DIR = Path(__file__).parent.parent / "data" / "raw"
DB_PATH = Path(__file__).parent / "brasa.db"

# Provincias de Ecuador con sus bounding boxes [minLat, maxLat, minLon, maxLon]
PROVINCE_BOUNDS = {
    "chimborazo": (-2.40, -1.35, -79.15, -78.35),
    "pichincha":  (-0.65,  0.25, -79.05, -78.10),
    "guayas":     (-2.85, -1.30, -80.45, -79.40),
    "azuay":      (-3.40, -2.60, -79.50, -78.60),
    "loja":       (-4.60, -3.50, -80.00, -78.90),
    "imbabura":   ( 0.15,  0.70, -78.60, -77.85),
    "manabi":     (-1.80,  0.20, -80.80, -79.80),
}

CANTON_BOUNDS = {
    "riobamba":    (-1.72, -1.62, -78.70, -78.59),
    "guano":       (-1.65, -1.55, -78.68, -78.58),
    "colta":       (-1.76, -1.66, -78.80, -78.70),
    "alausi":      (-2.25, -2.15, -78.90, -78.80),
    "guamote":     (-1.98, -1.88, -78.77, -78.67),
    "chambo":      (-1.75, -1.65, -78.63, -78.53),
    "pallatanga":  (-2.05, -1.95, -79.02, -78.92),
    "quito":       (-0.28, -0.18, -78.58, -78.48),
    "cayambe":     (-0.01,  0.09, -78.20, -78.10),
    "mejia":       (-0.56, -0.46, -78.62, -78.52),
    "ruminahui":   (-0.38, -0.28, -78.50, -78.40),
    "guayaquil":   (-2.24, -2.14, -79.94, -79.84),
    "samborondon": (-2.19, -2.09, -79.77, -79.67),
    "daule":       (-1.91, -1.81, -80.03, -79.93),
    "milagro":     (-2.18, -2.08, -79.63, -79.53),
    "cuenca":      (-2.95, -2.85, -79.06, -78.96),
    "gualaceo":    (-2.94, -2.84, -78.83, -78.73),
    "paute":       (-2.83, -2.73, -78.81, -78.71),
    "loja":        (-4.04, -3.94, -79.26, -79.16),
    "catamayo":    (-4.03, -3.93, -79.40, -79.30),
    "calvas":      (-4.37, -4.27, -79.60, -79.50),
    "ibarra":      ( 0.30,  0.40, -78.17, -78.07),
    "otavalo":     ( 0.18,  0.28, -78.32, -78.22),
    "cotacachi":   ( 0.25,  0.35, -78.32, -78.22),
    "portoviejo":  (-1.10, -1.00, -80.50, -80.40),
    "manta":       (-1.02, -0.92, -80.76, -80.66),
    "chone":       (-0.75, -0.65, -80.14, -80.04),
}


def normalize_confidence(conf):
    """Normaliza el campo confidence a 'h', 'n', 'l' para VIIRS o numérico para MODIS."""
    if pd.isna(conf):
        return "n"
    s = str(conf).strip().lower()
    if s in ("h", "n", "l", "high", "nominal", "low"):
        return s[0]
    try:
        v = int(float(s))
        return "h" if v >= 80 else ("n" if v >= 50 else "l")
    except Exception:
        return "n"


def load_csv(path: Path) -> pd.DataFrame:
    print(f"  Leyendo {path.name} ...")
    df = pd.read_csv(path, low_memory=False)
    df.columns = [c.strip().lower() for c in df.columns]

    # Coordenadas
    df = df.rename(columns={"lat": "latitude", "lon": "longitude"})
    df = df.dropna(subset=["latitude", "longitude"])

    # Fecha
    if "acq_date" in df.columns:
        df["date"] = pd.to_datetime(df["acq_date"], errors="coerce")
    elif "date" in df.columns:
        df["date"] = pd.to_datetime(df["date"], errors="coerce")
    else:
        raise ValueError(f"No se encontró columna de fecha en {path.name}")

    df = df.dropna(subset=["date"])
    df["year"] = df["date"].dt.year.astype(int)
    df["week"] = df["date"].dt.isocalendar().week.astype(int)

    # Sensor
    if "instrument" in df.columns:
        df["sensor"] = df["instrument"].str.upper().str.strip()
    elif "satellite" in df.columns:
        df["sensor"] = df["satellite"].str.upper().str.strip()
    else:
        df["sensor"] = "UNKNOWN"

    # FRP
    df["frp"] = pd.to_numeric(df.get("frp", 0), errors="coerce").fillna(0.0)

    # Day/Night
    if "daynight" in df.columns:
        df["daynight"] = df["daynight"].str.upper().str.strip().str[0]
    else:
        df["daynight"] = "D"

    # Confidence
    conf_col = "confidence"
    if conf_col in df.columns:
        df["confidence_raw"] = df[conf_col].apply(normalize_confidence)
    else:
        df["confidence_raw"] = "n"

    result = df[[
        "latitude", "longitude", "date", "year", "week",
        "sensor", "frp", "daynight", "confidence_raw"
    ]].copy()
    result.columns = [
        "lat", "lon", "date", "year", "week",
        "sensor", "frp", "daynight", "confidence"
    ]
    result["date"] = result["date"].dt.strftime("%Y-%m-%d")
    return result


def main():
    csv_files = list(RAW_DIR.glob("*.csv"))
    if not csv_files:
        print(f"❌ No se encontraron CSVs en {RAW_DIR}")
        print("   Descarga los archivos de Google Drive a data/raw/ y vuelve a ejecutar.")
        sys.exit(1)

    print(f"📂 Encontrados {len(csv_files)} archivos CSV en {RAW_DIR}")
    frames = []
    for f in sorted(csv_files):
        try:
            frames.append(load_csv(f))
        except Exception as e:
            print(f"  ⚠️  Error en {f.name}: {e}")

    if not frames:
        print("❌ No se pudo leer ningún CSV.")
        sys.exit(1)

    df = pd.concat(frames, ignore_index=True)
    df = df.drop_duplicates(subset=["lat", "lon", "date", "sensor"])

    print(f"\n✅ Total de registros únicos: {len(df):,}")
    print(f"   Rango de años: {df['year'].min()} – {df['year'].max()}")
    print(f"   Sensores: {df['sensor'].unique().tolist()}")

    # Asignar province_id y canton_id por bounding box
    print("\n🗺️  Asignando provincias y cantones...")

    def assign_province(row):
        lat, lon = row["lat"], row["lon"]
        for prov, (minlat, maxlat, minlon, maxlon) in PROVINCE_BOUNDS.items():
            if minlat <= lat <= maxlat and minlon <= lon <= maxlon:
                return prov
        return None

    def assign_canton(row):
        lat, lon = row["lat"], row["lon"]
        for canton, (minlat, maxlat, minlon, maxlon) in CANTON_BOUNDS.items():
            if minlat <= lat <= maxlat and minlon <= lon <= maxlon:
                return canton
        return None

    df["province_id"] = df.apply(assign_province, axis=1)
    df["canton_id"] = df.apply(assign_canton, axis=1)

    print(f"   Registros con provincia asignada: {df['province_id'].notna().sum():,}")

    # Guardar en SQLite
    print(f"\n💾 Guardando en {DB_PATH} ...")
    conn = sqlite3.connect(DB_PATH)
    df.to_sql("hotspots", conn, if_exists="replace", index=False)

    # Índices para consultas rápidas
    conn.execute("CREATE INDEX IF NOT EXISTS idx_year_week ON hotspots(year, week)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_province ON hotspots(province_id)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_canton ON hotspots(canton_id)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_sensor ON hotspots(sensor)")
    conn.commit()
    conn.close()

    print(f"✅ Base de datos creada exitosamente.")
    print(f"   Archivo: {DB_PATH}")
    print(f"\n🚀 Ahora ejecuta: uvicorn main:app --reload")


if __name__ == "__main__":
    main()
