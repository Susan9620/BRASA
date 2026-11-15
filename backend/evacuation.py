"""
BRASA — Ruta segura de evacuación (prototipo)
===============================================
Dado un punto de ignición y la posición de un brigadista, calcula la ruta más
rápida hacia afuera del área de simulación evitando:
  - Celdas con alta probabilidad de estar en llamas (según el polígono de
    propagación de firecast.py, a 6h/12h/24h — cuanto antes se espera el
    fuego en una celda, mayor penalización).
  - El penacho de humo estimado: un cono a favor del viento, más amplio y
    peligroso que el propio incendio (el humo viaja más lejos que el fuego).

Se reutiliza exactamente la misma grilla/simulación de firecast.py
(compute_hazard_grid) para que la ruta sea consistente con los polígonos que
ve el usuario en el mapa.

Costo de movimiento en terreno abierto: función de caminata de Tobler (1993),
un estándar de análisis de rutas de menor costo en SIG:
    W(km/h) = 6 * exp(-3.5 * |pendiente + 0.05|)
donde pendiente = dz/dx (tangente del ángulo de inclinación).

LIMITACIÓN CONOCIDA: no usa una red de caminos/trochas real (OpenStreetMap);
asume desplazamiento a pie campo traviesa, penalizado solo por pendiente y
peligro. Es una referencia táctica, no una ruta validada en campo.
"""

import heapq
import math

import numpy as np

from firecast import (
    CELL_SIZE_M,
    GRID_N,
    EARTH_M_PER_DEG_LAT,
    compute_hazard_grid,
    FireCastError,
)

NEIGHBORS = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]

# ── Parámetros de peligro (ver limitación arriba) ──────────────────────
BLOCK_DANGER = 0.5          # celdas con score >= esto se consideran infranqueables
DANGER_COST_WEIGHT = 8.0    # cuánto penaliza (en múltiplo de tiempo) acercarse a una celda peligrosa

# ── Parámetros de humo ──────────────────────────────────────────────────
SMOKE_CONE_DEG = 55.0        # semiángulo del cono de humo a favor del viento
SMOKE_RADIUS_FACTOR = 1.8    # el humo se extiende más lejos que el fuego (x radio de grilla)
SMOKE_COST_WEIGHT = 4.0

WALK_SPEED_FLOOR_KMH = 0.5   # evita división por ~0 en pendientes extremas


class EvacuationError(FireCastError):
    """Error de datos externos o de ruteo (hereda de FireCastError: misma fuente de datos)."""


def _tobler_speed_kmh(slope: float) -> float:
    speed = 6.0 * math.exp(-3.5 * abs(slope + 0.05))
    return max(WALK_SPEED_FLOOR_KMH, speed)


def _danger_scores(accum: dict, n_ensemble: int) -> np.ndarray:
    """Combina los 3 horizontes en un score 0..1 por celda, dando más peso a
    que el fuego llegue PRONTO (6h) que a que llegue eventualmente (24h)."""
    h6, h12, h24 = accum[6] / n_ensemble, accum[12] / n_ensemble, accum[24] / n_ensemble
    score = 1.0 * h6 + 0.6 * np.clip(h12 - h6, 0, 1) + 0.3 * np.clip(h24 - h12, 0, 1)
    return np.clip(score, 0.0, 1.0)


def _latlon_to_index(lat: float, lon: float, center_lat: float, center_lon: float) -> tuple[int, int]:
    north_m = (lat - center_lat) * EARTH_M_PER_DEG_LAT
    east_m = (lon - center_lon) * EARTH_M_PER_DEG_LAT * math.cos(math.radians(center_lat))
    c = (GRID_N - 1) / 2
    j = round(c + east_m / CELL_SIZE_M)
    i = round(c - north_m / CELL_SIZE_M)
    return i, j


def _smoke_factor(i: int, j: int, center: float, wind_vec: tuple[float, float], max_radius_cells: float) -> float:
    di, dj = i - center, j - center
    dist = math.hypot(di, dj)
    if dist < 1e-6 or dist > max_radius_cells:
        return 0.0
    nx, ny = dj / dist, -di / dist  # (este, norte)
    cos_theta = nx * wind_vec[0] + ny * wind_vec[1]
    angle = math.degrees(math.acos(max(-1.0, min(1.0, cos_theta))))
    if angle > SMOKE_CONE_DEG:
        return 0.0
    alignment = math.cos(math.radians(angle * 90.0 / SMOKE_CONE_DEG))  # 1 en el eje, 0 en el borde del cono
    decay = max(0.0, 1.0 - dist / max_radius_cells)
    return max(0.0, alignment) * decay


def plan_evacuation_route(brigade_lat: float, brigade_lon: float, ignition_lat: float, ignition_lon: float) -> dict:
    grid = compute_hazard_grid(ignition_lat, ignition_lon)
    n = GRID_N
    c = (n - 1) / 2

    danger = _danger_scores(grid["accum"], grid["n_ensemble"])

    wind_to_deg = (grid["wind_dir_from_deg"] + 180.0) % 360.0
    wind_rad = math.radians(wind_to_deg)
    wind_vec = (math.sin(wind_rad), math.cos(wind_rad))
    max_radius_cells = (n / 2) * SMOKE_RADIUS_FACTOR

    smoke = np.zeros((n, n))
    for i in range(n):
        for j in range(n):
            smoke[i, j] = _smoke_factor(i, j, c, wind_vec, max_radius_cells)

    bi, bj = _latlon_to_index(brigade_lat, brigade_lon, ignition_lat, ignition_lon)
    start_in_domain = 0 <= bi < n and 0 <= bj < n
    bi, bj = max(0, min(n - 1, bi)), max(0, min(n - 1, bj))

    def is_border(i: int, j: int) -> bool:
        return i == 0 or j == 0 or i == n - 1 or j == n - 1

    if is_border(bi, bj) and danger[bi, bj] < BLOCK_DANGER:
        return {
            "brigade": {"lat": brigade_lat, "lon": brigade_lon, "fuera_del_area_simulada": not start_in_domain},
            "exit_point": {"lat": brigade_lat, "lon": brigade_lon},
            "route": {"type": "LineString", "coordinates": [[brigade_lon, brigade_lat], [brigade_lon, brigade_lat]]},
            "distance_m": 0.0,
            "estimated_time_min": 0.0,
            "max_danger_on_path": round(float(danger[bi, bj]), 2),
            "max_smoke_on_path": 0.0,
            "risk_level": "bajo",
            "wind": {
                "speed_kmh": round(grid["wind_speed_kmh"], 1),
                "direction_from_deg": round(grid["wind_dir_from_deg"], 1),
            },
            "model": "dijkstra_tobler_v1",
            "disclaimer": "La posición indicada ya está en el borde del área simulada, fuera de la zona de peligro detectada.",
        }

    # Dijkstra desde la posición del brigadista; el primer borde "seguro" alcanzado es la salida.
    dist = np.full((n, n), np.inf)
    dist[bi, bj] = 0.0
    prev: dict[tuple[int, int], tuple[int, int]] = {}
    visited = np.zeros((n, n), dtype=bool)
    heap: list[tuple[float, int, int]] = [(0.0, bi, bj)]
    exit_cell = None

    while heap:
        d, i, j = heapq.heappop(heap)
        if visited[i, j]:
            continue
        visited[i, j] = True

        if is_border(i, j) and danger[i, j] < BLOCK_DANGER and (i, j) != (bi, bj):
            exit_cell = (i, j)
            break

        for (di, dj) in NEIGHBORS:
            ni, nj = i + di, j + dj
            if not (0 <= ni < n and 0 <= nj < n) or visited[ni, nj]:
                continue
            if danger[ni, nj] >= BLOCK_DANGER:
                continue  # infranqueable

            dist_factor = math.sqrt(2) if di != 0 and dj != 0 else 1.0
            horiz_m = CELL_SIZE_M * dist_factor
            dz = float(grid["elevation"][ni, nj] - grid["elevation"][i, j])
            slope = dz / horiz_m
            speed_kmh = _tobler_speed_kmh(slope)
            base_time_s = horiz_m / (speed_kmh * 1000.0 / 3600.0)

            danger_penalty = 1.0 + DANGER_COST_WEIGHT * danger[ni, nj]
            smoke_penalty = SMOKE_COST_WEIGHT * smoke[ni, nj] * base_time_s

            edge_cost = base_time_s * danger_penalty + smoke_penalty
            new_dist = d + edge_cost
            if new_dist < dist[ni, nj]:
                dist[ni, nj] = new_dist
                prev[(ni, nj)] = (i, j)
                heapq.heappush(heap, (new_dist, ni, nj))

    if exit_cell is None:
        raise EvacuationError(
            "No se encontró una salida segura dentro del área simulada (~5.4 km). "
            "La zona de peligro/humo podría rodear completamente la posición indicada."
        )

    # Reconstruir ruta
    path_cells = [exit_cell]
    cur = exit_cell
    while cur in prev:
        cur = prev[cur]
        path_cells.append(cur)
    path_cells.reverse()

    coords = [[float(grid["lon_grid"][i, j]), float(grid["lat_grid"][i, j])] for (i, j) in path_cells]
    total_time_s = dist[exit_cell]
    total_distance_m = sum(
        CELL_SIZE_M * (math.sqrt(2) if path_cells[k][0] != path_cells[k + 1][0] and path_cells[k][1] != path_cells[k + 1][1] else 1.0)
        for k in range(len(path_cells) - 1)
    )
    max_danger_on_path = max((float(danger[i, j]) for (i, j) in path_cells), default=0.0)
    max_smoke_on_path = max((float(smoke[i, j]) for (i, j) in path_cells), default=0.0)
    combined_risk = max(max_danger_on_path, 0.6 * max_smoke_on_path)
    risk_level = "alto" if combined_risk >= 0.35 else "moderado" if combined_risk >= 0.15 else "bajo"

    return {
        "brigade": {"lat": brigade_lat, "lon": brigade_lon, "fuera_del_area_simulada": not start_in_domain},
        "exit_point": {"lat": float(grid["lat_grid"][exit_cell]), "lon": float(grid["lon_grid"][exit_cell])},
        "route": {"type": "LineString", "coordinates": coords},
        "distance_m": round(total_distance_m, 1),
        "estimated_time_min": round(total_time_s / 60.0, 1),
        "max_danger_on_path": round(max_danger_on_path, 2),
        "max_smoke_on_path": round(max_smoke_on_path, 2),
        "risk_level": risk_level,
        "wind": {
            "speed_kmh": round(grid["wind_speed_kmh"], 1),
            "direction_from_deg": round(grid["wind_dir_from_deg"], 1),
        },
        "model": "dijkstra_tobler_v1",
        "disclaimer": (
            "Prototipo de referencia táctica: ruta campo traviesa estimada (sin red de caminos real), "
            "penalizada por pendiente (función de Tobler), riesgo de incendio y cono de humo a favor del viento. "
            "No sustituye instrucciones de un coordinador de incidentes en terreno."
        ),
    }
