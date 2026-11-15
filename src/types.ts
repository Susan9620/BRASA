// Definición de tipos para BRASA - NASA Space Apps Challenge 2026
// Equipo CODE RED

export type SensorType = 'harmonized' | 'modis' | 'viirs'
export type ConfidenceLevel = 'nominal_high' | 'all'
export type DayNight = 'all' | 'D' | 'N'
export type SourceType = 'MODIS' | 'BOTH' | 'VIIRS_CAL'
export type StatusLevel = 'normal' | 'elevado' | 'inusual'

export interface BoundingBox {
  minLon: number
  minLat: number
  maxLon: number
  maxLat: number
}

export type GeometryType = 'bbox' | 'polygon' | 'circle'

export interface CustomGeometry {
  type: GeometryType
  coordinates?: [number, number][] // Para polígonos [lat, lon]
  center?: [number, number] // Para círculos [lat, lon]
  radiusMeters?: number // Para círculos
  geojson?: GeoJSON.GeoJsonObject
}

export interface BaseFilterParams {
  year_from: number
  year_to: number
  sensor: SensorType
  confidence: ConfidenceLevel
  daynight: DayNight
  geojson?: GeoJSON.GeoJsonObject
  bbox?: [number, number, number, number] // [minLon, minLat, maxLon, maxLat]
  /** País en ISO 3166-1 alfa-3 (p. ej. 'ECU'), según la API mundial */
  country_code?: string
}

export interface CalendarWeekItem {
  year: number
  week: number
  value: number
  source: SourceType
}

export interface CalendarResponse {
  unit: 'fire_cell_days'
  weeks: CalendarWeekItem[]
}

export interface ClimatologyWeekItem {
  week: number
  mean: number
  p10: number
  p50: number
  p90: number
}

export interface ClimatologyResponse {
  weeks: ClimatologyWeekItem[]
}

export interface SeasonYearItem {
  year: number
  start_week: number
  peak_week: number
  end_week: number
  total: number
}

export interface SeasonResponse {
  years: SeasonYearItem[]
}

export interface AnomalyItem {
  year: number
  week: number
  value: number
  zscore: number
  percentile: number
}

export interface AnomaliesResponse {
  items: AnomalyItem[]
}

export interface HotspotPoint {
  lat: number
  lon: number
  date: string
  frp: number
  sensor: string
}

export interface HotspotsResponse {
  points: HotspotPoint[]
}

export interface HotspotRequestParams extends BaseFilterParams {
  date_from?: string
  date_to?: string
  year?: number
  week?: number
}

export interface CurrentStatusResponse {
  /** Año de la semana evaluada. Opcional hasta que el backend real lo devuelva. */
  year?: number
  week: number
  value: number
  percentile: number
  zscore: number
  level: StatusLevel
}

export interface Canton {
  id: string
  name: string
  lat: number
  lon: number
  bbox?: [number, number, number, number]
}

export interface Region {
  id: string
  name: string
  geojson: GeoJSON.Polygon | GeoJSON.GeoJsonObject | any
  center: [number, number] // [lat, lon]
  zoom: number
  cantons?: Canton[]
}

export type RegionsResponse = Region[]

// FireCast — prototipo de simulación de propagación de incendios
export interface FireCastRequestParams {
  lat: number
  lon: number
}

export interface FireCastWind {
  speed_kmh: number
  direction_from_deg: number
}

export interface FireCastPolygons {
  h6: GeoJSON.GeoJsonObject | null
  h12: GeoJSON.GeoJsonObject | null
  h24: GeoJSON.GeoJsonObject | null
}

export interface FireCastResponse {
  ignition: { lat: number; lon: number }
  wind: FireCastWind
  cell_size_m: number
  grid_radius_m: number
  polygons: FireCastPolygons
  model: string
  disclaimer: string
}

// Ruta segura de evacuación — consume el mismo punto de ignición que FireCast
export type EvacuationRiskLevel = 'bajo' | 'moderado' | 'alto'

export interface EvacuationRequestParams {
  brigade_lat: number
  brigade_lon: number
  ignition_lat: number
  ignition_lon: number
}

export interface EvacuationResponse {
  brigade: { lat: number; lon: number; fuera_del_area_simulada: boolean }
  exit_point: { lat: number; lon: number }
  route: GeoJSON.LineString
  distance_m: number
  estimated_time_min: number
  max_danger_on_path: number
  max_smoke_on_path: number
  risk_level: EvacuationRiskLevel
  wind: FireCastWind
  model: string
  disclaimer: string
}

// Estado de filtros del cliente
export interface FilterState {
  countryCode: string // ISO3, p. ej. 'ECU'
  yearRange: [number, number] // [2005, 2025]
  selectedYear: number // p. ej. 2024
  sensor: SensorType
  confidence: ConfidenceLevel
  daynight: DayNight
  customGeometry?: CustomGeometry | null
}
