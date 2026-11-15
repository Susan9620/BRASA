"""
BRASA — FireCast (prototipo de motor de propagación de incendios)
===================================================================
Autómata celular probabilístico que combina viento y pendiente de terreno
reales para proyectar la propagación de un incendio desde un punto de
ignición a 6, 12 y 24 horas.

Fuentes de datos (ambas gratuitas, sin API key):
  - Viento actual:  Open-Meteo Forecast API
  - Elevación:      Open-Meteo Elevation API (muestreo + interpolación
                     bilineal; evita depender de un raster DEM completo)

LIMITACIÓN CONOCIDA: no existe aquí un mapa de combustible/vegetación
calibrado por zona (tipo, carga, humedad). Se asume combustible uniforme en
toda la grilla. Por eso esto es un motor de referencia táctica preliminar,
no un pronóstico operacional. Las constantes de calibración (ROS0_KMH,
P_BASE, WIND_C1/C2, SLOPE_A) son valores genéricos inspirados en la
literatura de autómatas celulares para propagación de incendios y deben
ajustarse con datos de campo / incendios históricos reales antes de
cualquier uso operativo.
"""

import math
import random

import numpy as np
import requests
from shapely.geometry import box, mapping
from shapely.ops import unary_union

OPEN_METEO_ELEVATION_URL = "https://api.open-meteo.com/v1/elevation"
OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
HTTP_TIMEOUT_S = 8

# ── Grilla de simulación ───────────────────────────────────────────────
CELL_SIZE_M = 180.0   # tamaño de celda (m)
GRID_N = 61           # celdas por lado (impar) -> radio ~5.5 km desde la ignición
COARSE_N = 9          # grilla gruesa para muestrear elevación (impar; Open-Meteo limita a 100 coords/petición)

# ── Constantes de calibración (placeholder — ver limitación arriba) ────
ROS0_KMH = 0.4        # velocidad base de propagación sin viento/pendiente
P_BASE = 0.58         # probabilidad base de ignición de celda vecina por tick
WIND_C1 = 0.06
WIND_C2 = 0.15
SLOPE_A = 3.5
N_ENSEMBLE = 4        # corridas estocásticas combinadas (reduce ruido del polígono)

EARTH_M_PER_DEG_LAT = 111_320.0
NEIGHBORS = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]


class FireCastError(RuntimeError):
    """Error de datos externos (Open-Meteo) o de entrada inválida."""


def _meters_to_latlon(lat0: float, lon0: float, east_m: float, north_m: float) -> tuple[float, float]:
    dlat = north_m / EARTH_M_PER_DEG_LAT
    dlon = east_m / (EARTH_M_PER_DEG_LAT * math.cos(math.radians(lat0)))
    return lat0 + dlat, lon0 + dlon


def _build_grid_latlon(center_lat: float, center_lon: float, n: int, cell_size_m: float):
    c = (n - 1) / 2
    lat_grid = np.zeros((n, n))
    lon_grid = np.zeros((n, n))
    for i in range(n):
        north_m = (c - i) * cell_size_m
        for j in range(n):
            east_m = (j - c) * cell_size_m
            lat, lon = _meters_to_latlon(center_lat, center_lon, east_m, north_m)
            lat_grid[i, j] = lat
            lon_grid[i, j] = lon
    return lat_grid, lon_grid


def _fetch_elevation_coarse(center_lat: float, center_lon: float) -> np.ndarray:
    """Grilla gruesa de elevación (COARSE_N x COARSE_N) en una sola petición batch a Open-Meteo."""
    coarse_extent_m = (GRID_N - 1) * CELL_SIZE_M
    coarse_spacing_m = coarse_extent_m / (COARSE_N - 1)
    lat_grid, lon_grid = _build_grid_latlon(center_lat, center_lon, COARSE_N, coarse_spacing_m)

    lats = lat_grid.flatten()
    lons = lon_grid.flatten()
    try:
        resp = requests.get(
            OPEN_METEO_ELEVATION_URL,
            params={
                "latitude": ",".join(f"{v:.6f}" for v in lats),
                "longitude": ",".join(f"{v:.6f}" for v in lons),
            },
            timeout=HTTP_TIMEOUT_S,
        )
        resp.raise_for_status()
        elevations = np.array(resp.json()["elevation"], dtype=float)
    except (requests.RequestException, KeyError, ValueError) as exc:
        raise FireCastError(f"No se pudo obtener elevación de Open-Meteo: {exc}") from exc

    return elevations.reshape((COARSE_N, COARSE_N))


def _fetch_wind(lat: float, lon: float) -> tuple[float, float]:
    """Devuelve (velocidad_kmh, direccion_de_origen_deg) del viento actual en el punto."""
    try:
        resp = requests.get(
            OPEN_METEO_FORECAST_URL,
            params={
                "latitude": lat,
                "longitude": lon,
                "current": "wind_speed_10m,wind_direction_10m",
                "wind_speed_unit": "kmh",
                "timezone": "auto",
            },
            timeout=HTTP_TIMEOUT_S,
        )
        resp.raise_for_status()
        current = resp.json()["current"]
        return float(current["wind_speed_10m"]), float(current["wind_direction_10m"])
    except (requests.RequestException, KeyError, ValueError) as exc:
        raise FireCastError(f"No se pudo obtener viento de Open-Meteo: {exc}") from exc


def _bilinear_upsample(coarse: np.ndarray, n_fine: int) -> np.ndarray:
    """Interpola una grilla gruesa (m x m) a una fina (n_fine x n_fine) por bilinear simple."""
    m = coarse.shape[0]
    fine = np.zeros((n_fine, n_fine))
    scale = (m - 1) / (n_fine - 1)
    for i in range(n_fine):
        fi = i * scale
        i0 = int(math.floor(fi))
        i1 = min(i0 + 1, m - 1)
        ti = fi - i0
        for j in range(n_fine):
            fj = j * scale
            j0 = int(math.floor(fj))
            j1 = min(j0 + 1, m - 1)
            tj = fj - j0
            v0 = coarse[i0, j0] * (1 - tj) + coarse[i0, j1] * tj
            v1 = coarse[i1, j0] * (1 - tj) + coarse[i1, j1] * tj
            fine[i, j] = v0 * (1 - ti) + v1 * ti
    return fine


def _spread_probability(di: int, dj: int, dz: float, wind_speed_kmh: float, wind_vec: tuple[float, float]) -> float:
    dist_factor = math.sqrt(2) if di != 0 and dj != 0 else 1.0
    horiz_dist = CELL_SIZE_M * dist_factor

    # Viento: ángulo entre la dirección hacia la celda vecina y hacia donde sopla el viento
    nx, ny = float(dj), float(-di)  # (este, norte); i crece hacia el sur
    norm = math.hypot(nx, ny) or 1.0
    nx, ny = nx / norm, ny / norm
    cos_theta = nx * wind_vec[0] + ny * wind_vec[1]
    p_w = math.exp(wind_speed_kmh * WIND_C1) * math.exp(wind_speed_kmh * WIND_C2 * (cos_theta - 1))

    # Pendiente: a favor (cuesta arriba en la dirección de avance) acelera, en contra frena
    slope_rad = math.atan2(dz, horiz_dist)
    p_s = math.exp(SLOPE_A * max(-1.0, min(1.0, math.tan(slope_rad))))

    p = (P_BASE * p_w * p_s) ** dist_factor  # exponente corrige el artefacto "diamante" diagonal
    return max(0.02, min(0.95, p))


def _run_single_ca(elevation: np.ndarray, wind_speed_kmh: float, wind_dir_from_deg: float, n_ticks: int, seed: int):
    n = elevation.shape[0]
    c = n // 2
    state = np.zeros((n, n), dtype=np.uint8)  # 0=combustible, 1=ardiendo, 2=quemado
    state[c, c] = 1
    frontier = {(c, c)}

    wind_to_deg = (wind_dir_from_deg + 180.0) % 360.0
    wind_rad = math.radians(wind_to_deg)
    wind_vec = (math.sin(wind_rad), math.cos(wind_rad))  # (este, norte)

    rng = random.Random(seed)
    snapshots: list[tuple[int, np.ndarray]] = []

    for tick in range(1, n_ticks + 1):
        new_frontier = set()
        for (i, j) in frontier:
            for (di, dj) in NEIGHBORS:
                ni, nj = i + di, j + dj
                if not (0 <= ni < n and 0 <= nj < n):
                    continue
                if state[ni, nj] != 0:
                    continue
                dz = float(elevation[ni, nj] - elevation[i, j])
                p = _spread_probability(di, dj, dz, wind_speed_kmh, wind_vec)
                if rng.random() < p:
                    state[ni, nj] = 1
                    new_frontier.add((ni, nj))
        for (i, j) in frontier:
            state[i, j] = 2
        frontier = new_frontier
        snapshots.append((tick, (state > 0).copy()))
        if not frontier:
            break

    return snapshots


def _mask_at_hour(snapshots, n: int, tick_hours: float, hours: float) -> np.ndarray:
    target_tick = max(1, round(hours / tick_hours))
    mask = np.zeros((n, n), dtype=bool)
    for tick, snap in snapshots:
        if tick <= target_tick:
            mask = snap
        else:
            break
    return mask


def _mask_to_geojson(mask: np.ndarray, lat_grid: np.ndarray, lon_grid: np.ndarray, cell_size_m: float, center_lat: float):
    if not mask.any():
        return None
    half_lat = (cell_size_m / 2) / EARTH_M_PER_DEG_LAT
    half_lon = (cell_size_m / 2) / (EARTH_M_PER_DEG_LAT * math.cos(math.radians(center_lat)))
    boxes = []
    for (i, j) in np.argwhere(mask):
        lat, lon = float(lat_grid[i, j]), float(lon_grid[i, j])
        boxes.append(box(lon - half_lon, lat - half_lat, lon + half_lon, lat + half_lat))
    merged = unary_union(boxes).buffer(0)
    simplified = merged.simplify(half_lon * 0.6, preserve_topology=True)
    return mapping(simplified)


def compute_hazard_grid(lat: float, lon: float, hours: tuple[int, ...] = (6, 12, 24)) -> dict:
    """Corre la simulación y devuelve las grillas crudas (numpy), reutilizables por
    otros módulos (p. ej. evacuation.py) sin tener que repetir las llamadas a Open-Meteo
    ni la simulación en sí. run_firecast() construye el GeoJSON a partir de esto."""
    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
        raise FireCastError("Coordenadas fuera de rango.")

    elevation_coarse = _fetch_elevation_coarse(lat, lon)
    elevation = _bilinear_upsample(elevation_coarse, GRID_N)
    wind_speed_kmh, wind_dir_deg = _fetch_wind(lat, lon)

    lat_grid, lon_grid = _build_grid_latlon(lat, lon, GRID_N, CELL_SIZE_M)
    tick_hours = (CELL_SIZE_M / 1000.0) / ROS0_KMH
    n_ticks = max(1, math.ceil(max(hours) / tick_hours) + 2)

    # Ensamble de corridas estocásticas: una celda se reporta como "en riesgo"
    # si ardió en al menos la mitad de las corridas (reduce el ruido de una sola tirada).
    accum = {h: np.zeros((GRID_N, GRID_N), dtype=int) for h in hours}
    base_seed = int(abs(lat * 1000) + abs(lon * 1000))
    for run_idx in range(N_ENSEMBLE):
        snapshots = _run_single_ca(elevation, wind_speed_kmh, wind_dir_deg, n_ticks, seed=base_seed + run_idx)
        for h in hours:
            accum[h] += _mask_at_hour(snapshots, GRID_N, tick_hours, h).astype(int)

    return {
        "lat_grid": lat_grid,
        "lon_grid": lon_grid,
        "elevation": elevation,
        "accum": accum,
        "n_ensemble": N_ENSEMBLE,
        "wind_speed_kmh": wind_speed_kmh,
        "wind_dir_from_deg": wind_dir_deg,
        "ignition": {"lat": lat, "lon": lon},
    }


def run_firecast(lat: float, lon: float, hours: tuple[int, ...] = (6, 12, 24)) -> dict:
    grid = compute_hazard_grid(lat, lon, hours)

    polygons = {}
    for h in hours:
        mask = grid["accum"][h] >= max(1, N_ENSEMBLE // 2)
        polygons[f"h{h}"] = _mask_to_geojson(mask, grid["lat_grid"], grid["lon_grid"], CELL_SIZE_M, lat)

    return {
        "ignition": grid["ignition"],
        "wind": {
            "speed_kmh": round(grid["wind_speed_kmh"], 1),
            "direction_from_deg": round(grid["wind_dir_from_deg"], 1),
        },
        "cell_size_m": CELL_SIZE_M,
        "grid_radius_m": (GRID_N // 2) * CELL_SIZE_M,
        "polygons": polygons,
        "model": "automata_celular_probabilistico_v1",
        "disclaimer": (
            "Prototipo de referencia táctica: usa viento y pendiente reales (Open-Meteo), "
            "pero asume combustible/vegetación uniforme (sin mapa de biomasa calibrado). "
            "No sustituye un análisis operacional de manejo del fuego."
        ),
    }
