import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  MapContainer,
  TileLayer,
  ImageOverlay,
  Rectangle,
  Polyline,
  GeoJSON,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import {
  Brain,
  Flame,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Compass,
  Radar,
  Globe,
  Filter,
  RotateCcw,
  ChevronDown,
  Eye,
  Grid,
  MapPin,
  Sparkles,
} from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import {
  COUNTRIES,
  CONTINENTS,
  getCountriesForContinent,
  getCountrySilhouette,
} from '../utils/territoryData'
import { MOCK_REGIONS } from '../api/mock'
import type { Region } from '../types'

interface CellData {
  id: string
  bounds: [[number, number], [number, number]]
  center: [number, number]
  probabilidad: number
  isLand: boolean
}

// Escala de color oficial YlOrRd de matplotlib (idéntica al Colab V3)
function getYlOrRdColor(prob: number) {
  if (prob >= 0.8) return { color: '#800026', bg: 'bg-[#800026]', text: 'text-white', label: 'Crítico (≥80%)' }
  if (prob >= 0.6) return { color: '#bd0026', bg: 'bg-[#bd0026]', text: 'text-white', label: 'Muy Alto (60-80%)' }
  if (prob >= 0.4) return { color: '#e31a1c', bg: 'bg-[#e31a1c]', text: 'text-white', label: 'Alto (40-60%)' }
  if (prob >= 0.34) return { color: '#fc4e2a', bg: 'bg-[#fc4e2a]', text: 'text-white', label: 'Alerta V3 (≥34%)' }
  if (prob >= 0.18) return { color: '#fd8d3c', bg: 'bg-[#fd8d3c]', text: 'text-slate-900', label: 'Moderado (18-34%)' }
  if (prob >= 0.05) return { color: '#feb24c', bg: 'bg-[#feb24c]', text: 'text-slate-900', label: 'Bajo (5-18%)' }
  return { color: '#ffffcc', bg: 'bg-[#ffffcc]', text: 'text-slate-900', label: 'Mínimo (<5%)' }
}

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.3 })
  }, [center, zoom, map])
  return null
}

// Función para extraer bounding box de cualquier geometría GeoJSON
function getBoundingBoxFromGeometry(geom: any): { minLat: number; maxLat: number; minLon: number; maxLon: number } | null {
  if (!geom || !geom.coordinates) return null
  let minLat = 90,
    maxLat = -90,
    minLon = 180,
    maxLon = -180

  const traverse = (coords: any) => {
    if (Array.isArray(coords)) {
      if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
        const [lon, lat] = coords
        if (lat < minLat) minLat = lat
        if (lat > maxLat) maxLat = lat
        if (lon < minLon) minLon = lon
        if (lon > maxLon) maxLon = lon
      } else {
        coords.forEach(traverse)
      }
    }
  }

  traverse(geom.coordinates)
  if (minLat > maxLat || minLon > maxLon) return null
  return { minLat, maxLat, minLon, maxLon }
}

// Retícula global clara en todo el planeta (meridianos y paralelos adaptativos)
function DynamicGraticule({ visible }: { visible: boolean }) {
  const map = useMap()
  const [bounds, setBounds] = useState(() => map.getBounds())
  const [zoom, setZoom] = useState(() => map.getZoom())

  useMapEvents({
    moveend() {
      setBounds(map.getBounds())
      setZoom(map.getZoom())
    },
    zoomend() {
      setBounds(map.getBounds())
      setZoom(map.getZoom())
    },
  })

  const lines = useMemo(() => {
    if (!visible) return []
    // Escala adaptativa de cuadrícula:
    // zoom <= 3: cada 5.0° (vista planetaria)
    // zoom 4 a 6: cada 1.0° (vista continental o país)
    // zoom >= 7: cada 0.5° (resolución exacta 0.5° del modelo V3)
    const step = zoom <= 3 ? 5.0 : zoom <= 6 ? 1.0 : 0.5

    const south = Math.max(-85, Math.floor(bounds.getSouth() / step) * step - step * 2)
    const north = Math.min(85, Math.ceil(bounds.getNorth() / step) * step + step * 2)
    const west = Math.max(-180, Math.floor(bounds.getWest() / step) * step - step * 3)
    const east = Math.min(180, Math.ceil(bounds.getEast() / step) * step + step * 3)

    const polylines: [number, number][][] = []

    // Paralelos (horizontales de latitud constante)
    for (let lat = south; lat <= north; lat = Number((lat + step).toFixed(4))) {
      polylines.push([
        [lat, -180],
        [lat, 180],
      ])
    }

    // Meridianos (verticales de longitud constante)
    for (let lon = west; lon <= east; lon = Number((lon + step).toFixed(4))) {
      polylines.push([
        [-85, lon],
        [85, lon],
      ])
    }

    return polylines
  }, [visible, bounds, zoom])

  if (!visible) return null

  return (
    <>
      {lines.map((line, idx) => (
        <Polyline
          key={`graticule-${idx}`}
          positions={line}
          interactive={false}
          pathOptions={{
            color: '#94a3b8',
            weight: 0.75,
            opacity: 0.45,
          }}
        />
      ))}
    </>
  )
}

// Captura de eventos del ratón para hover y clic interactivo
function MapInteractions({
  onCellClick,
  onCellHover,
}: {
  onCellClick: (lat: number, lon: number) => void
  onCellHover: (lat: number, lon: number) => void
}) {
  useMapEvents({
    click(e) {
      onCellClick(e.latlng.lat, e.latlng.lng)
    },
    mousemove(e) {
      onCellHover(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export const Prediccion: React.FC = () => {
  // Filtros territoriales: Por defecto Ecuador - Chimborazo
  const [selectedContinent, setSelectedContinent] = useState<string>('América del Sur')
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('ECU')
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>('chimborazo')
  const [mapLayer, setMapLayer] = useState<'osm' | 'satellite' | 'topo'>('osm')
  const [showGlobalGrid, setShowGlobalGrid] = useState<boolean>(true)
  const [globalHeatmapOpacity, setGlobalHeatmapOpacity] = useState<number>(0.85)

  // Tabla binaria con todas las 91,654 celdas del planeta en memoria (259 KB)
  const [gridArray, setGridArray] = useState<Uint8Array | null>(null)

  // Celda seleccionada
  const [selectedCell, setSelectedCell] = useState<CellData | null>(null)
  const [hoveredCell, setHoveredCell] = useState<CellData | null>(null)

  const tileUrls = {
    osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    topo: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
  }

  const attributions = {
    osm: '&copy; OpenStreetMap contributors',
    satellite: 'Tiles &copy; Esri, Maxar',
    topo: '&copy; OpenTopoMap contributors',
  }

  // Carga de la tabla binaria (259 KB)
  useEffect(() => {
    fetch('/data/brasa_v3_grid.bin')
      .then((res) => {
        if (!res.ok) throw new Error('Error cargando tabla binaria de celdas')
        return res.arrayBuffer()
      })
      .then((buf) => {
        setGridArray(new Uint8Array(buf))
      })
      .catch((err) => console.error(err))
  }, [])

  // Consulta de celda de 0.5° en 0 milisegundos
  const queryCell = useCallback(
    (lat: number, lon: number): CellData => {
      const cellLatMin = Math.floor(lat / 0.5) * 0.5
      const cellLatMax = cellLatMin + 0.5
      const cellLonMin = Math.floor(lon / 0.5) * 0.5
      const cellLonMax = cellLonMin + 0.5
      const centerLat = Number((cellLatMin + 0.25).toFixed(3))
      const centerLon = Number((cellLonMin + 0.25).toFixed(3))

      let prob = 0.01
      let isLand = true

      if (gridArray) {
        const r = Math.max(0, Math.min(359, Math.floor((90.0 - centerLat) / 0.5)))
        const c = Math.max(0, Math.min(719, Math.floor((centerLon - -180.0) / 0.5)))
        const idx = r * 720 + c
        const val = gridArray[idx]
        if (val === 255) {
          isLand = false
          prob = 0.0
        } else {
          prob = val / 100.0
        }
      }

      return {
        id: `${centerLat}_${centerLon}`,
        bounds: [
          [cellLatMin, cellLonMin],
          [cellLatMax, cellLonMax],
        ],
        center: [centerLat, centerLon],
        probabilidad: prob,
        isLand,
      }
    },
    [gridArray]
  )

  // Países disponibles
  const availableCountries = useMemo(() => {
    if (selectedContinent === 'all') return COUNTRIES
    return getCountriesForContinent(selectedContinent)
  }, [selectedContinent])

  const activeCountry = useMemo(() => {
    return (
      COUNTRIES.find((c) => c.code === selectedCountryCode) ||
      COUNTRIES.find((c) => c.code === 'ECU') ||
      COUNTRIES[0]
    )
  }, [selectedCountryCode])

  const isEcuador = selectedCountryCode === 'ECU'
  const isGlobalView = selectedCountryCode === 'GLOBAL'
  const provincesList = useMemo(() => MOCK_REGIONS as Region[], [])

  const currentProvince = useMemo(() => {
    if (!isEcuador || selectedProvinceId === 'all') return null
    return provincesList.find((p) => p.id === selectedProvinceId) || null
  }, [isEcuador, selectedProvinceId, provincesList])

  // Centro y zoom según selección
  const mapCenterAndZoom = useMemo<{ center: [number, number]; zoom: number }>(() => {
    if (isGlobalView) {
      return { center: [15, 0], zoom: 2 }
    }
    if (isEcuador) {
      if (currentProvince) {
        return { center: currentProvince.center as [number, number], zoom: 9 }
      }
      return { center: [-1.83, -78.18], zoom: 7 }
    }
    return {
      center: [activeCountry.lat, activeCountry.lon],
      zoom: activeCountry.zoom || 5,
    }
  }, [isGlobalView, isEcuador, currentProvince, activeCountry])

  // 1. SILUETAS VECTORIALES PARA RESALTAR EL PERÍMETRO DEL ÁREA SELECCIONADA
  const provinceFeature = useMemo(() => {
    if (!currentProvince?.geojson) return null
    return {
      type: 'Feature' as const,
      properties: { name: currentProvince.name },
      geometry: currentProvince.geojson as any,
    }
  }, [currentProvince])

  const countryFeature = useMemo(() => {
    if (isGlobalView) return null
    if (isEcuador) {
      if (currentProvince) return null
      return getCountrySilhouette('ECU') as any
    }
    return getCountrySilhouette(selectedCountryCode) as any
  }, [isGlobalView, isEcuador, currentProvince, selectedCountryCode])

  // 2. LÍMITES EXACTOS DEL ÁREA SELECCIONADA PARA COLOREAR ÚNICAMENTE ESA ZONA
  const selectedAreaBounds = useMemo(() => {
    if (isGlobalView) return null

    if (isEcuador) {
      if (currentProvince) {
        if (currentProvince.geojson?.coordinates) {
          const bbox = getBoundingBoxFromGeometry(currentProvince.geojson)
          if (bbox) return bbox
        }
        // Acotar a la provincia seleccionada
        const [pLat, pLon] = currentProvince.center
        return {
          minLat: pLat - 0.75,
          maxLat: pLat + 0.75,
          minLon: pLon - 0.75,
          maxLon: pLon + 0.75,
        }
      }
      // Todo el Ecuador
      return { minLat: -5.0, maxLat: 1.5, minLon: -81.2, maxLon: -75.0 }
    }

    // Otro país seleccionado: extraer bounding box de su silueta oficial
    const silhouette = getCountrySilhouette(selectedCountryCode)
    if (silhouette?.geometry) {
      const bbox = getBoundingBoxFromGeometry(silhouette.geometry)
      if (bbox) return bbox
    }

    const { lat, lon } = activeCountry
    return {
      minLat: lat - 3.5,
      maxLat: lat + 3.5,
      minLon: lon - 3.5,
      maxLon: lon + 3.5,
    }
  }, [isGlobalView, isEcuador, currentProvince, selectedCountryCode, activeCountry])

  // 3. GENERAR LAS CUADRÍCULAS COLOREADAS EXCLUSIVAS DEL ÁREA SELECCIONADA
  const coloredAreaCells = useMemo<CellData[]>(() => {
    if (!selectedAreaBounds || !gridArray) return []

    const { minLat, maxLat, minLon, maxLon } = selectedAreaBounds
    const cells: CellData[] = []

    const startLat = Math.floor(minLat / 0.5) * 0.5
    const endLat = Math.ceil(maxLat / 0.5) * 0.5
    const startLon = Math.floor(minLon / 0.5) * 0.5
    const endLon = Math.ceil(maxLon / 0.5) * 0.5

    for (let lat = startLat; lat < endLat; lat += 0.5) {
      for (let lon = startLon; lon < endLon; lon += 0.5) {
        const cell = queryCell(lat + 0.1, lon + 0.1)
        if (cell.isLand) {
          cells.push(cell)
        }
      }
    }
    return cells
  }, [selectedAreaBounds, gridArray, queryCell])

  // Estadísticas del área resaltada
  const areaStats = useMemo(() => {
    if (!coloredAreaCells.length) return null
    const alerts = coloredAreaCells.filter((c) => c.probabilidad >= 0.34).length
    const maxP = Math.max(...coloredAreaCells.map((c) => c.probabilidad))
    return {
      count: coloredAreaCells.length,
      alerts,
      maxP: (maxP * 100).toFixed(1),
    }
  }, [coloredAreaCells])

  // Clic en el mapa
  const handleMapClick = useCallback(
    (lat: number, lon: number) => {
      const cell = queryCell(lat, lon)
      setSelectedCell(cell)
    },
    [queryCell]
  )

  // Hover en el mapa
  const handleMapHover = useCallback(
    (lat: number, lon: number) => {
      const cell = queryCell(lat, lon)
      if (cell.isLand) {
        setHoveredCell(cell)
      } else {
        setHoveredCell(null)
      }
    },
    [queryCell]
  )

  const handleResetFilters = () => {
    setSelectedContinent('América del Sur')
    setSelectedCountryCode('ECU')
    setSelectedProvinceId('chimborazo')
    setSelectedCell(null)
  }

  const selectedRisk = selectedCell ? getYlOrRdColor(selectedCell.probabilidad) : null

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1680px] mx-auto space-y-6">
      {/* Encabezado Científico de BRASA V3 */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                <Globe className="w-3.5 h-3.5 text-purple-600" />
                BRASA V3 • Modelo Mundial (0.5° × 0.5°)
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {isGlobalView
                  ? 'Vista Planetaria Continua'
                  : currentProvince
                  ? `Área Exclusiva: Provincia de ${currentProvince.name}`
                  : `Área Exclusiva: ${activeCountry.name}`}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0B1B3D] tracking-tight mt-1.5">
              BRASA V3 · probabilidad experimental mundial · semana 2025-12-29
            </h1>
            <p className="text-slate-600 text-sm mt-1 max-w-3xl">
              Retícula cartográfica global en todo el mapa. Al seleccionar un país o provincia, los colores de predicción se
              dibujan <strong>únicamente en esa área</strong> para resaltarla con total claridad sobre el fondo neutro.
            </p>
          </div>

          {/* Tarjetas de Resumen del Área Resaltada */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Cuadrículas Activas</span>
              <span className="text-sm font-bold text-slate-800 font-mono">
                {areaStats ? `${areaStats.count} celdas` : '91,654'}
              </span>
            </div>
            <div className="bg-amber-50/80 border border-amber-200 rounded-xl px-4 py-2 text-center">
              <span className="text-[10px] uppercase font-bold text-amber-700 block">En Alerta V3</span>
              <span className="text-sm font-extrabold text-amber-800 font-mono">
                {areaStats ? `${areaStats.alerts}` : '≥34%'}
              </span>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-center">
              <span className="text-[10px] uppercase font-bold text-red-600 block">Riesgo Máx</span>
              <span className="text-sm font-black text-red-700 font-mono">
                {areaStats ? `${areaStats.maxP}%` : 'Sahel'}
              </span>
            </div>
          </div>
        </div>

        {/* Barra de Filtros y Selección Territorial */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 font-bold text-[#0B1B3D] uppercase tracking-wider text-[11px] mr-1">
              <Filter className="w-3.5 h-3.5 text-[#FF7900]" />
              Área de Análisis:
            </span>

            {/* Continente */}
            <div className="relative">
              <select
                value={selectedContinent}
                onChange={(e) => {
                  const val = e.target.value
                  setSelectedContinent(val)
                  if (val !== 'all') {
                    const firstCountry = getCountriesForContinent(val)[0]
                    if (firstCountry) setSelectedCountryCode(firstCountry.code)
                  } else {
                    setSelectedCountryCode('GLOBAL')
                  }
                }}
                className="appearance-none bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2 font-bold text-slate-700 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#FF7900]/30 transition-all cursor-pointer"
              >
                <option value="all">Todo el Mundo (Vista Global)</option>
                {CONTINENTS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* País */}
            <div className="relative">
              <select
                value={selectedCountryCode}
                onChange={(e) => {
                  setSelectedCountryCode(e.target.value)
                  if (e.target.value === 'ECU') setSelectedProvinceId('chimborazo')
                }}
                className="appearance-none bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2 font-bold text-slate-700 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#FF7900]/30 transition-all cursor-pointer"
              >
                <option value="GLOBAL">Vista Global Amplia</option>
                {availableCountries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Subregión / Provincia (Si se elige Ecuador) */}
            {isEcuador && (
              <div className="relative">
                <select
                  value={selectedProvinceId}
                  onChange={(e) => setSelectedProvinceId(e.target.value)}
                  className="appearance-none bg-purple-50 border border-purple-200 text-purple-900 rounded-xl pl-3 pr-8 py-2 font-bold hover:border-purple-300 focus:outline-hidden focus:ring-2 focus:ring-purple-400/30 transition-all cursor-pointer"
                >
                  <option value="all">Todo el Ecuador (~90 Cuadrículas)</option>
                  {provincesList.map((p) => (
                    <option key={p.id} value={p.id}>
                      Provincia de {p.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-purple-600 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}
          </div>

          {/* Toggle de Cuadrícula Clara */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowGlobalGrid(!showGlobalGrid)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                showGlobalGrid
                  ? 'bg-slate-800 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Grid className="w-3.5 h-3.5 text-[#FF7900]" />
              <span>Líneas de Cuadrícula: {showGlobalGrid ? 'Visibles' : 'Ocultas'}</span>
            </button>

            <button
              type="button"
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 text-slate-400 hover:text-slate-700 font-semibold transition-colors px-2.5 py-1.5 rounded-lg hover:bg-slate-100"
              title="Restablecer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Mapa y Detalle */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Mapa Interactivo Cuadriculado */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-3.5 px-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2">
              <Radar className="w-4 h-4 text-[#FF7900]" />
              <span className="text-xs font-bold text-[#0B1B3D]">
                {isGlobalView
                  ? 'Retícula Global · Vista Mundial'
                  : currentProvince
                  ? `Cuadrículas Térmicas Exclusivas de ${currentProvince.name}`
                  : `Cuadrículas Térmicas Exclusivas de ${activeCountry.name}`}
              </span>
            </div>

            {/* Capas limpias */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMapLayer('osm')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  mapLayer === 'osm'
                    ? 'bg-[#0B1B3D] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Calles / Carto
              </button>
              <button
                type="button"
                onClick={() => setMapLayer('satellite')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  mapLayer === 'satellite'
                    ? 'bg-[#0B1B3D] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Satélite
              </button>
              <button
                type="button"
                onClick={() => setMapLayer('topo')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  mapLayer === 'topo'
                    ? 'bg-[#0B1B3D] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Relieve
              </button>
            </div>
          </div>

          <div className="relative flex-1 min-h-[540px] sm:min-h-[640px] bg-[#f8f9fa]">
            <MapContainer
              center={mapCenterAndZoom.center}
              zoom={mapCenterAndZoom.zoom}
              className="w-full h-full min-h-[540px] sm:min-h-[640px]"
              scrollWheelZoom={true}
              minZoom={2}
              maxBounds={[
                [-90, -180],
                [90, 180],
              ]}
            >
              <MapController center={mapCenterAndZoom.center} zoom={mapCenterAndZoom.zoom} />
              <TileLayer attribution={attributions[mapLayer]} url={tileUrls[mapLayer]} />

              {/* 1. LÍNEAS DE CUADRÍCULA CLARAS EN TODO EL MAPA (Meridianos y Paralelos claros) */}
              <DynamicGraticule visible={showGlobalGrid} />

              {/* 2. SILUETA DEL ÁREA SELECCIONADA (Para que resalte el contorno de la provincia o país) */}
              {provinceFeature && (
                <GeoJSON
                  key={`province-outline-${currentProvince?.id}`}
                  data={provinceFeature}
                  pathOptions={{
                    color: '#0B1B3D',
                    weight: 2.5,
                    fillColor: '#FF7900',
                    fillOpacity: 0.05,
                  }}
                />
              )}

              {countryFeature && (
                <GeoJSON
                  key={`country-outline-${selectedCountryCode}`}
                  data={countryFeature}
                  pathOptions={{
                    color: '#0B1B3D',
                    weight: 2.5,
                    fillColor: '#FF7900',
                    fillOpacity: 0.04,
                  }}
                />
              )}

              {/* 3. SI ES VISTA GLOBAL: MOSTRAR LA CAPA DE CALOR MUNDIAL */}
              {isGlobalView && (
                <ImageOverlay
                  url="/data/brasa_v3_heatmap.png"
                  bounds={[
                    [-90, -180],
                    [90, 180],
                  ]}
                  opacity={globalHeatmapOpacity}
                />
              )}

              {/* 4. SI HAY UN PAÍS O PROVINCIA SELECCIONADA: COLOREAR ÚNICAMENTE ESA ÁREA */}
              {!isGlobalView &&
                coloredAreaCells.map((cell) => {
                  const isSelected = selectedCell?.id === cell.id
                  const isHovered = hoveredCell?.id === cell.id
                  const risk = getYlOrRdColor(cell.probabilidad)
                  const isAlert = cell.probabilidad >= 0.34

                  return (
                    <Rectangle
                      key={cell.id}
                      bounds={cell.bounds}
                      pathOptions={{
                        color: isSelected ? '#0B1B3D' : isHovered ? '#4f46e5' : 'rgba(255, 255, 255, 0.45)',
                        weight: isSelected ? 3.5 : isHovered ? 2 : 0.8,
                        fillColor: risk.color,
                        fillOpacity: isSelected ? 0.85 : isHovered ? 0.75 : 0.65,
                        dashArray: isSelected ? '4, 4' : undefined,
                      }}
                      eventHandlers={{
                        click: () => setSelectedCell(cell),
                      }}
                    >
                      <Tooltip direction="top" opacity={0.95}>
                        <div className="text-xs font-sans space-y-0.5">
                          <p className="font-bold text-slate-800">
                            Cuadrícula ({cell.center[0]}°, {cell.center[1]}°)
                          </p>
                          <p className="font-extrabold text-purple-700">
                            Probabilidad MODIS: {(cell.probabilidad * 100).toFixed(1)}%
                          </p>
                          {isAlert && (
                            <p className="text-red-600 font-bold text-[10px]">
                              ⚠️ Supera umbral de ignición (≥34%)
                            </p>
                          )}
                        </div>
                      </Tooltip>
                    </Rectangle>
                  )
                })}

              {/* Contorno de la celda seleccionada si se hizo clic fuera del área precargada */}
              {selectedCell && !coloredAreaCells.some((c) => c.id === selectedCell.id) && (
                <Rectangle
                  bounds={selectedCell.bounds}
                  pathOptions={{
                    color: '#0B1B3D',
                    weight: 3,
                    fillColor: selectedRisk ? selectedRisk.color : '#FF7900',
                    fillOpacity: 0.6,
                    dashArray: '4, 4',
                  }}
                />
              )}

              {/* Captura de hover y clic */}
              <MapInteractions onCellClick={handleMapClick} onCellHover={handleMapHover} />
            </MapContainer>

            {/* BARRA DE LEYENDA YlOrRd VERTICAL IDÉNTICA AL NOTEBOOK COLAB */}
            <div className="absolute top-4 right-4 z-[400] bg-white/95 backdrop-blur-xs p-3 rounded-2xl border border-slate-200/90 shadow-xl flex items-center gap-3">
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-slate-700 mb-1">1.0</span>
                <div
                  className="w-4 h-44 rounded-md border border-slate-300 shadow-inner"
                  style={{
                    background:
                      'linear-gradient(to bottom, #800026 0%, #bd0026 20%, #e31a1c 40%, #fc4e2a 50%, #fd8d3c 60%, #feb24c 75%, #fed976 90%, #ffffcc 100%)',
                  }}
                />
                <span className="text-[10px] font-bold text-slate-700 mt-1">0.0</span>
              </div>

              <div className="flex flex-col justify-between h-44 text-[9px] font-mono font-bold text-slate-500 py-0.5">
                <span>1.0 (Crítico)</span>
                <span>0.8</span>
                <span>0.6</span>
                <span className="text-amber-700 font-extrabold">0.34 (Umbral V3)</span>
                <span>0.2</span>
                <span>0.0 (Mínimo)</span>
              </div>

              <div
                className="text-[10px] font-bold text-slate-600 tracking-wider whitespace-nowrap pl-1 border-l border-slate-200"
                style={{
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                }}
              >
                P(detección MODIS en semana siguiente)
              </div>
            </div>
          </div>
        </div>

        {/* Panel Lateral: Detalle de la Cuadrícula */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#FF7900]" />
                <h3 className="text-sm font-bold text-[#0B1B3D]">Cuadrícula Seleccionada</h3>
              </div>
              {selectedCell && (
                <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">
                  {selectedCell.center[0]}°, {selectedCell.center[1]}°
                </span>
              )}
            </div>

            {selectedCell && selectedRisk ? (
              <div className="mt-4 space-y-4">
                {/* Límites de la cuadrícula de 0.5° */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Centroide geográfico:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {selectedCell.center[0]}°, {selectedCell.center[1]}°
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                    <span>Límites de cuadrícula:</span>
                    <span className="font-mono text-slate-700">
                      [{selectedCell.bounds[0][0]}° a {selectedCell.bounds[1][0]}° N]
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Resolución espacial:</span>
                    <span className="font-semibold text-slate-700">0.5° × 0.5° (~55 km × 55 km)</span>
                  </div>
                </div>

                {/* Barra de Probabilidad */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700 flex items-center gap-1.5">
                      <Brain className="w-3.5 h-3.5 text-purple-600" />
                      Probabilidad P(MODIS)
                    </span>
                    <span className="text-lg font-black text-purple-700 font-mono">
                      {(selectedCell.probabilidad * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, selectedCell.probabilidad * 100)}%`,
                        backgroundColor: selectedRisk.color,
                      }}
                    />
                  </div>
                </div>

                {/* Diagnóstico Operativo según Umbral V3 (0.34) */}
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                    selectedCell.probabilidad >= 0.34
                      ? 'bg-red-50/90 border-red-200 text-red-900'
                      : selectedCell.probabilidad >= 0.18
                      ? 'bg-amber-50/90 border-amber-200 text-amber-900'
                      : 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
                  }`}
                >
                  {selectedCell.probabilidad >= 0.34 ? (
                    <>
                      <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-bold">SUPERÓ EL UMBRAL V3 (≥34%)</strong>
                        <p className="text-[11px] opacity-90 mt-0.5">
                          Alta probabilidad de al menos una detección térmica MODIS en esta cuadrícula durante la próxima semana.
                        </p>
                      </div>
                    </>
                  ) : selectedCell.probabilidad >= 0.18 ? (
                    <>
                      <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-bold">Riesgo Moderado (18-34%)</strong>
                        <p className="text-[11px] opacity-90 mt-0.5">
                          Condiciones atmosféricas y antecedentes propicios para brotes térmicos.
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-bold">Condición Estable (&lt;18%)</strong>
                        <p className="text-[11px] opacity-90 mt-0.5">
                          Baja probabilidad de anomalías térmicas en esta cuadrícula.
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Enlace al Simulador Táctico */}
                <Link
                  to={`/simulador?lat=${selectedCell.center[0]}&lon=${selectedCell.center[1]}&sensor=MODIS&date=2025-12-29`}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#FF7900] hover:bg-[#E56D00] text-white rounded-xl font-bold text-xs shadow-xs hover:shadow transition-all"
                >
                  <Flame className="w-4 h-4" />
                  <span>Simular propagación en esta cuadrícula</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                <MapPin className="w-6 h-6 mx-auto text-slate-300" />
                <p className="font-semibold text-slate-500">Ninguna cuadrícula seleccionada</p>
                <p className="text-[11px] text-slate-400">
                  Haz clic en cualquier cuadrícula del área coloreada para inspeccionar sus datos y simular propagación.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Prediccion
