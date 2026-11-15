// Generador de datos simulados deterministas para BRASA
// Datos de demostración por país (no son registros reales de NASA)
// Temporada seca andina: semanas 32 a 40 (Agosto - Octubre)
// Años críticos: 2012 y 2024

import type {
  AnomaliesResponse,
  BaseFilterParams,
  CalendarResponse,
  CalendarWeekItem,
  ClimatologyResponse,
  ClimatologyWeekItem,
  CurrentStatusResponse,
  EvacuationRequestParams,
  EvacuationResponse,
  EvacuationRiskLevel,
  FireCastRequestParams,
  FireCastResponse,
  HotspotPoint,
  HotspotRequestParams,
  HotspotsResponse,
  RegionsResponse,
  SeasonResponse,
  SeasonYearItem,
  SourceType,
  StatusLevel,
} from '../types'
import { windStretchedPolygonGeoJSON } from '../utils/geoUtils'

// Generador pseudoaleatorio determinista con semilla (Linear Congruential Generator)
function pseudoRandom(seed: number): () => number {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

// Países de demostración (contornos simplificados como rectángulos). NO son límites reales.
// La API mundial usa códigos ISO 3166-1 alfa-3 y no tiene provincias ni cantones.
const MOCK_COUNTRIES: { id: string; name: string; center: [number, number]; zoom: number; bbox: [number, number, number, number]; factor: number }[] = [
  { id: 'ECU', name: 'Ecuador', center: [-1.79, -78.1], zoom: 6, bbox: [-81.0, -5.0, -75.2, 1.5], factor: 1.0 },
  { id: 'COL', name: 'Colombia', center: [4.0, -73.0], zoom: 5, bbox: [-79.0, -4.2, -66.9, 12.5], factor: 1.3 },
  { id: 'PER', name: 'Perú', center: [-9.2, -75.0], zoom: 5, bbox: [-81.3, -18.4, -68.7, -0.1], factor: 1.2 },
  { id: 'BOL', name: 'Bolivia', center: [-16.5, -64.7], zoom: 5, bbox: [-69.6, -22.9, -57.5, -9.7], factor: 2.1 },
  { id: 'BRA', name: 'Brasil', center: [-10.8, -52.9], zoom: 4, bbox: [-73.9, -33.7, -34.8, 5.3], factor: 4.5 },
  { id: 'MEX', name: 'México', center: [23.6, -102.5], zoom: 4, bbox: [-117.1, 14.5, -86.7, 32.7], factor: 1.6 },
]

export const MOCK_REGIONS: RegionsResponse = MOCK_COUNTRIES.map((c) => {
  const [minLon, minLat, maxLon, maxLat] = c.bbox
  return {
    id: c.id,
    name: c.name,
    center: c.center,
    zoom: c.zoom,
    cantons: [],
    geojson: {
      type: 'Polygon',
      coordinates: [[[minLon, minLat], [maxLon, minLat], [maxLon, maxLat], [minLon, maxLat], [minLon, minLat]]],
    },
  }
})

// Función auxiliar para calcular el valor base de fuego según semana y año
function calculateBaseFireValue(year: number, week: number, provinceFactor: number = 1.0): number {
  // Climatología ecuatoriana: temporada seca andina entre semanas 30 y 42, con pico semanas 34-38
  const peakWeek = 36
  const sigma = 3.5
  const gaussian = Math.exp(-Math.pow(week - peakWeek, 2) / (2 * Math.pow(sigma, 2)))

  // Pequeño pico secundario a inicios de año (semana 7-10 en algunas zonas)
  const minorPeak = 0.15 * Math.exp(-Math.pow(week - 8, 2) / (2 * 4))

  // Intensidad base por año
  let yearMultiplier = 1.0
  if (year === 2012) yearMultiplier = 2.45 // Año extremo 2012
  else if (year === 2024) yearMultiplier = 2.85 // Año extremo 2024 (incendios históricos recientes)
  else if (year === 2015 || year === 2016) yearMultiplier = 1.65 // Fenómeno El Niño moderado
  else if (year === 2005 || year === 2020) yearMultiplier = 1.4
  else if (year === 2008 || year === 2018) yearMultiplier = 0.65 // Años muy húmedos (La Niña)
  else {
    const prng = pseudoRandom(year * 7919)
    yearMultiplier = 0.75 + prng() * 0.6
  }

  // Ruido estocástico determinista por semana/año
  const prngWeek = pseudoRandom(year * 1000 + week * 13)
  const noise = 0.8 + prngWeek() * 0.4

  const baseFire = (3 + gaussian * 95 + minorPeak * 25) * yearMultiplier * provinceFactor * noise
  return Math.round(baseFire * 10) / 10
}

// Determinar la fuente satelital según el año y filtro
function resolveSource(year: number, sensorFilter: string): SourceType {
  if (sensorFilter === 'modis') return 'MODIS'
  if (sensorFilter === 'viirs') return 'VIIRS_CAL'
  if (year < 2012) return 'MODIS'
  if (year <= 2018) return 'BOTH'
  return 'VIIRS_CAL'
}

// Escala por sensor (datos simulados), imitando a la API mundial:
// - MODIS: serie base, con leve pérdida de sensibilidad desde 2017.
// - VIIRS: sin datos antes de 2012; detecta ~2.3x más celdas activas.
// - 'harmonized': en la API es la SUMA de ambos sensores (no una armonización).
const modisScale = (year: number) => (year >= 2017 ? 0.82 : 1)
const viirsScale = (year: number) => (year >= 2012 ? 2.3 : 0)

function sensorScale(year: number, sensor?: string): number {
  if (sensor === 'modis') return modisScale(year)
  if (sensor === 'viirs') return viirsScale(year)
  return modisScale(year) + viirsScale(year)
}

// Obtener factor de escala según filtros de confianza y día/noche
function getFilterScales(confidence: string, daynight: string): number {
  let scale = 1.0
  if (confidence === 'nominal_high') scale *= 0.82 // Filtra un 18% de detecciones de baja confianza
  if (daynight === 'D') scale *= 0.72 // 72% de focos son diurnos
  else if (daynight === 'N') scale *= 0.28 // 28% nocturnos
  return scale
}

// Factor multiplicador por país (escala de actividad simulada)
function getRegionFactor(countryCode?: string): number {
  return MOCK_COUNTRIES.find((c) => c.id === countryCode)?.factor ?? 1.0
}

// Simular API: GET /api/regions
export function mockGetRegions(): RegionsResponse {
  return MOCK_REGIONS
}

// Simular API: POST /api/calendar
export function mockGetCalendar(params: BaseFilterParams): CalendarResponse {
  const yearFrom = params.year_from || 2001
  const yearTo = params.year_to || 2025
  const filterScale = getFilterScales(params.confidence, params.daynight)
  const provFactor = getRegionFactor(params.country_code)

  const weeks: CalendarWeekItem[] = []

  for (let y = yearFrom; y <= yearTo; y++) {
    for (let w = 1; w <= 52; w++) {
      const baseVal = calculateBaseFireValue(y, w, provFactor)
      const adjustedVal = Math.round(baseVal * filterScale * sensorScale(y, params.sensor) * 10) / 10
      const source = resolveSource(y, params.sensor)

      weeks.push({
        year: y,
        week: w,
        value: adjustedVal,
        source,
      })
    }
  }

  return {
    unit: 'fire_cell_days',
    weeks,
  }
}

// Simular API: POST /api/climatology
export function mockGetClimatology(params: BaseFilterParams): ClimatologyResponse {
  const provFactor = getRegionFactor(params.country_code)
  const filterScale = getFilterScales(params.confidence, params.daynight)
  const weeks: ClimatologyWeekItem[] = []

  for (let w = 1; w <= 52; w++) {
    const historicalValues: number[] = []
    for (let y = 2001; y <= 2025; y++) {
      const val = calculateBaseFireValue(y, w, provFactor) * filterScale * sensorScale(y, params.sensor)
      historicalValues.push(val)
    }

    historicalValues.sort((a, b) => a - b)
    const n = historicalValues.length
    const sum = historicalValues.reduce((acc, curr) => acc + curr, 0)
    const mean = Math.round((sum / n) * 10) / 10
    const p10 = Math.round(historicalValues[Math.floor(n * 0.1)] * 10) / 10
    const p50 = Math.round(historicalValues[Math.floor(n * 0.5)] * 10) / 10
    const p90 = Math.round(historicalValues[Math.floor(n * 0.9)] * 10) / 10

    weeks.push({
      week: w,
      mean,
      p10,
      p50,
      p90,
    })
  }

  return { weeks }
}

// Simular API: POST /api/season
export function mockGetSeason(params: BaseFilterParams): SeasonResponse {
  const yearFrom = params.year_from || 2001
  const yearTo = params.year_to || 2025
  const provFactor = getRegionFactor(params.country_code)
  const filterScale = getFilterScales(params.confidence, params.daynight)

  const years: SeasonYearItem[] = []

  for (let y = yearFrom; y <= yearTo; y++) {
    let maxVal = -1
    let peakWeek = 36
    let total = 0
    const weekValues: number[] = []

    for (let w = 1; w <= 52; w++) {
      const val = calculateBaseFireValue(y, w, provFactor) * filterScale * sensorScale(y, params.sensor)
      weekValues.push(val)
      total += val
      if (val > maxVal) {
        maxVal = val
        peakWeek = w
      }
    }

    // Umbral de inicio de temporada: cuando la actividad supera el 15% del pico
    const threshold = maxVal * 0.2
    let startWeek = 28
    let endWeek = 44

    for (let w = 1; w <= peakWeek; w++) {
      if (weekValues[w - 1] >= threshold) {
        startWeek = w
        break
      }
    }

    for (let w = peakWeek; w <= 52; w++) {
      if (weekValues[w - 1] < threshold) {
        endWeek = w
        break
      }
    }

    years.push({
      year: y,
      start_week: startWeek,
      peak_week: peakWeek,
      end_week: endWeek,
      total: Math.round(total * 10) / 10,
    })
  }

  return { years }
}

// Simular API: POST /api/anomalies
export function mockGetAnomalies(params: BaseFilterParams): AnomaliesResponse {
  const calendar = mockGetCalendar(params)
  const climatology = mockGetClimatology(params)
  const climMap = new Map(climatology.weeks.map((c) => [c.week, c]))

  const items: {
    year: number
    week: number
    value: number
    zscore: number
    percentile: number
  }[] = []

  // Calcular desviación estándar semanal
  const stdMap = new Map<number, number>()
  for (let w = 1; w <= 52; w++) {
    const c = climMap.get(w)!
    const yearVals = calendar.weeks.filter((k) => k.week === w).map((k) => k.value)
    const variance = yearVals.reduce((acc, v) => acc + Math.pow(v - c.mean, 2), 0) / yearVals.length
    const std = Math.sqrt(variance) || 1
    stdMap.set(w, std)
  }

  calendar.weeks.forEach((item) => {
    const c = climMap.get(item.week)
    if (!c) return
    const std = stdMap.get(item.week) || 1
    const zscore = Math.round(((item.value - c.mean) / std) * 100) / 100

    // Si zscore es significativo (> 1.6) o percentil alto
    if (zscore >= 1.6 && item.value > 15) {
      // Cálculo aproximado de percentil normal
      const percentile = Math.min(99.9, Math.round((0.5 * (1 + Math.tanh(zscore * 0.797885))) * 1000) / 10)
      items.push({
        year: item.year,
        week: item.week,
        value: item.value,
        zscore,
        percentile,
      })
    }
  })

  // Ordenar por zscore descendente
  items.sort((a, b) => b.zscore - a.zscore)

  return { items }
}

// Simular API: POST /api/hotspots
export function mockGetHotspots(params: HotspotRequestParams): HotspotsResponse {
  const year = params.year || 2024
  const week = params.week || 36
  const provFactor = getRegionFactor(params.country_code)
  const baseValue = calculateBaseFireValue(year, week, provFactor)

  // Determinar centro de la región o custom geometry
  const region = MOCK_REGIONS.find((r) => r.id === params.country_code) || MOCK_REGIONS[0]
  const centerLat = region.center[0]
  const centerLon = region.center[1]

  // Cantidad de puntos proporcionales al valor de fire_cell_days
  const count = Math.min(180, Math.max(4, Math.floor(baseValue * 0.7)))
  const prng = pseudoRandom(year * 31337 + week * 997)

  const points: HotspotPoint[] = []
  const sensors = params.sensor === 'modis' ? ['MODIS'] : params.sensor === 'viirs' ? ['VIIRS'] : ['VIIRS', 'MODIS', 'VIIRS']

  // Calcular fechas de la semana
  const dayOfYear = (week - 1) * 7 + 1
  for (let i = 0; i < count; i++) {
    // Generar dispersión en racimos (clusters de fuego realistas)
    const cluster = Math.floor(prng() * 4)
    const clusterOffsets = [
      [0.08, -0.05],
      [-0.12, 0.09],
      [0.04, 0.14],
      [-0.06, -0.11],
    ]
    const cOffset = clusterOffsets[cluster]

    // Escala de país: los racimos se separan ~1° del centro
    const latOffset = (cOffset[0] + (prng() - 0.5) * 0.09) * 10
    const lonOffset = (cOffset[1] + (prng() - 0.5) * 0.09) * 10

    // FRP: Fire Radiative Power en Megawatts
    // La mayoría entre 8 y 45 MW, con algunos focos intensos de 100-240 MW
    const isIntense = prng() > 0.85
    const frp = isIntense
      ? Math.round((70 + prng() * 150) * 10) / 10
      : Math.round((8 + prng() * 55) * 10) / 10

    const dayDelta = Math.floor(prng() * 7)
    const dateObj = new Date(year, 0, dayOfYear + dayDelta)
    const dateStr = dateObj.toISOString().split('T')[0]

    const sensor = sensors[Math.floor(prng() * sensors.length)]

    points.push({
      lat: Math.round((centerLat + latOffset) * 10000) / 10000,
      lon: Math.round((centerLon + lonOffset) * 10000) / 10000,
      date: dateStr,
      frp,
      sensor,
    })
  }

  return { points }
}

// Simular API: POST /api/current-status
export function mockGetCurrentStatus(params: BaseFilterParams): CurrentStatusResponse {
  // Semana actual en el contexto del NASA Space Apps Challenge (o semana 36/46)
  const currentWeek = 37 // Semana crítica de la temporada seca andina
  const currentYear = 2024
  const provFactor = getRegionFactor(params.country_code)
  const filterScale = getFilterScales(params.confidence, params.daynight)

  const value =
    Math.round(
      calculateBaseFireValue(currentYear, currentWeek, provFactor) * filterScale * sensorScale(currentYear, params.sensor) * 10
    ) / 10
  const climatology = mockGetClimatology(params)
  const climWeek = climatology.weeks.find((w) => w.week === currentWeek) || climatology.weeks[36]

  // Cálculo de zscore respecto al histórico de esa semana
  const calendar = mockGetCalendar(params)
  const weekVals = calendar.weeks.filter((k) => k.week === currentWeek).map((k) => k.value)
  const variance = weekVals.reduce((acc, v) => acc + Math.pow(v - climWeek.mean, 2), 0) / (weekVals.length || 1)
  const std = Math.sqrt(variance) || 1
  const zscore = Math.round(((value - climWeek.mean) / std) * 100) / 100

  // Percentil histórico
  const countBelow = weekVals.filter((v) => v <= value).length
  const percentile = Math.min(99.8, Math.round((countBelow / (weekVals.length || 1)) * 1000) / 10)

  let level: StatusLevel = 'normal'
  if (zscore >= 2.0 || percentile >= 90) {
    level = 'inusual'
  } else if (zscore >= 1.0 || percentile >= 70) {
    level = 'elevado'
  }

  return {
    year: currentYear,
    week: currentWeek,
    value,
    percentile,
    zscore,
    level,
  }
}

/**
 * Simulación de propagación en modo mock: no corre el autómata celular real
 * (eso requiere el backend con viento/elevación en vivo). Genera 3 polígonos
 * elípticos deterministas (según lat/lon) solo para poder demostrar la UI
 * sin backend. El viento mostrado es simulado, no real.
 */
export function mockGetFireCast(params: FireCastRequestParams): FireCastResponse {
  const rand = pseudoRandom(Math.round((params.lat * 10000 + params.lon * 10000) ** 2) % 2147483646 || 1)
  const windSpeedKmh = Math.round((8 + rand() * 20) * 10) / 10
  const windDirectionFromDeg = Math.round(rand() * 360)
  const windToDeg = (windDirectionFromDeg + 180) % 360

  const baseRadii: Record<'h6' | 'h12' | 'h24', number> = { h6: 900, h12: 1700, h24: 2800 }
  const stretchFactor = Math.min(1.1, windSpeedKmh / 25)

  const polygons = {
    h6: windStretchedPolygonGeoJSON(params.lat, params.lon, baseRadii.h6, windToDeg, stretchFactor),
    h12: windStretchedPolygonGeoJSON(params.lat, params.lon, baseRadii.h12, windToDeg, stretchFactor),
    h24: windStretchedPolygonGeoJSON(params.lat, params.lon, baseRadii.h24, windToDeg, stretchFactor),
  }

  return {
    ignition: { lat: params.lat, lon: params.lon },
    wind: { speed_kmh: windSpeedKmh, direction_from_deg: windDirectionFromDeg },
    cell_size_m: 180,
    grid_radius_m: 5400,
    polygons,
    model: 'mock_elipse_demostrativa',
    disclaimer:
      'Modo simulación: polígono de demostración (no corre el motor físico real). Conecta el backend para la simulación con viento y pendiente reales.',
  }
}

/**
 * Ruta de evacuación en modo mock: no corre Dijkstra real (eso vive en el backend,
 * sobre la misma grilla de FireCast). Traza una línea desde el brigadista alejándose
 * del punto de ignición, con un pequeño quiebre para simular una desviación.
 */
export function mockGetEvacuationRoute(params: EvacuationRequestParams): EvacuationResponse {
  const { brigade_lat, brigade_lon, ignition_lat, ignition_lon } = params
  const rand = pseudoRandom(
    Math.round((brigade_lat * 10000 + brigade_lon * 10000 + ignition_lat * 100 + ignition_lon * 100) ** 2) % 2147483646 || 1
  )

  const dLat = brigade_lat - ignition_lat
  const dLon = brigade_lon - ignition_lon
  const dist = Math.hypot(dLat, dLon) || 0.0001
  const dirLat = dLat / dist
  const dirLon = dLon / dist

  // Punto de quiebre a mitad de camino, con un pequeño desvío lateral (simula esquivar humo)
  const lateralLat = -dirLon
  const lateralLon = dirLat
  const bendStrength = (rand() - 0.5) * 0.006

  const extend = 0.018 + rand() * 0.01
  const midLat = brigade_lat + dirLat * extend * 0.5 + lateralLat * bendStrength
  const midLon = brigade_lon + dirLon * extend * 0.5 + lateralLon * bendStrength
  const exitLat = brigade_lat + dirLat * extend
  const exitLon = brigade_lon + dirLon * extend

  const toMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const dLa = (lat2 - lat1) * 111_320
    const dLo = (lon2 - lon1) * 111_320 * Math.cos((lat1 * Math.PI) / 180)
    return Math.hypot(dLa, dLo)
  }
  const distanceM = toMeters(brigade_lat, brigade_lon, midLat, midLon) + toMeters(midLat, midLon, exitLat, exitLon)
  const estimatedTimeMin = Math.round((distanceM / 1000 / 3.8) * 60 * 10) / 10 // ~3.8 km/h referencia

  const riskRoll = rand()
  const riskLevel: EvacuationRiskLevel = riskRoll > 0.75 ? 'alto' : riskRoll > 0.45 ? 'moderado' : 'bajo'

  return {
    brigade: { lat: brigade_lat, lon: brigade_lon, fuera_del_area_simulada: false },
    exit_point: { lat: exitLat, lon: exitLon },
    route: {
      type: 'LineString',
      coordinates: [
        [brigade_lon, brigade_lat],
        [midLon, midLat],
        [exitLon, exitLat],
      ],
    },
    distance_m: Math.round(distanceM * 10) / 10,
    estimated_time_min: estimatedTimeMin,
    max_danger_on_path: Math.round(rand() * 0.3 * 100) / 100,
    max_smoke_on_path: Math.round(rand() * 0.3 * 100) / 100,
    risk_level: riskLevel,
    wind: { speed_kmh: Math.round((8 + rand() * 20) * 10) / 10, direction_from_deg: Math.round(rand() * 360) },
    model: 'mock_linea_demostrativa',
    disclaimer:
      'Modo simulación: ruta de demostración (no corre Dijkstra real sobre la grilla). Conecta el backend para la ruta calculada con riesgo y pendiente reales.',
  }
}
