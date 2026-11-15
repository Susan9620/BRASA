import React, { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Polyline, Popup, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import { Flame, ChevronDown, ChevronRight, MapPinOff, Wind, Navigation2, Loader2, AlertTriangle, X, Footprints, Flag } from 'lucide-react'
import type { EvacuationResponse, FireCastResponse, HotspotsResponse, Region, CustomGeometry } from '../types'
import { fetchEvacuationRoute, fetchFireCast } from '../api/client'
import { formatCoordinates } from '../utils/geoUtils'

const RISK_COLORS: Record<string, string> = { bajo: '#16A34A', moderado: '#F59E0B', alto: '#DC2626' }

interface MapViewProps {
  region: Region | undefined
  hotspots: HotspotsResponse | null
  isLoadingHotspots: boolean
  /** La API no publica la capa de puntos (versión compacta) */
  hotspotsUnavailable?: boolean
  customGeometry?: CustomGeometry | null
}

/** Encuadra el mapa en el país (o en el área personalizada) cada vez que cambia */
function FitToShape({ shape, fallbackCenter, fallbackZoom }: { shape: unknown; fallbackCenter: [number, number]; fallbackZoom: number }) {
  const map = useMap()
  const key = JSON.stringify(shape ?? fallbackCenter)

  useEffect(() => {
    try {
      if (shape) {
        const bounds = L.geoJSON(shape as GeoJSON.GeoJsonObject).getBounds()
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [24, 24], maxZoom: 9 })
          return
        }
      }
    } catch {
      // GeoJSON inválido: se usa el centro de respaldo
    }
    map.setView(fallbackCenter, fallbackZoom)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map])

  return null
}

/**
 * Centra/ajusta el mapa sobre la simulación FireCast: zoom rápido al elegir el punto
 * (feedback inmediato) y encuadre preciso sobre el polígono de 24h cuando llega el resultado.
 * Sin esto, a nivel de zoom país los polígonos (radio ~5.4 km) son invisibles.
 */
function FireCastFocus({ ignition, fireCast }: { ignition: { lat: number; lon: number } | null; fireCast: FireCastResponse | null }) {
  const map = useMap()

  useEffect(() => {
    if (ignition) map.flyTo([ignition.lat, ignition.lon], 12, { duration: 0.6 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ignition, map])

  useEffect(() => {
    if (!fireCast) return
    const outer = fireCast.polygons.h24 ?? fireCast.polygons.h12 ?? fireCast.polygons.h6
    if (!outer) return
    try {
      const bounds = L.geoJSON(outer as GeoJSON.GeoJsonObject).getBounds()
      if (bounds.isValid()) map.flyToBounds(bounds, { padding: [48, 48], maxZoom: 14, duration: 0.6 })
    } catch {
      // ignorar geojson invalido
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fireCast, map])

  return null
}

/** Encuadra el mapa sobre una ruta de evacuación recién calculada (brigadista + salida) */
function EvacuationFocus({ evacuation }: { evacuation: EvacuationResponse | null }) {
  const map = useMap()

  useEffect(() => {
    if (!evacuation) return
    try {
      const bounds = L.geoJSON(evacuation.route as unknown as GeoJSON.GeoJsonObject).getBounds()
      if (bounds.isValid()) map.flyToBounds(bounds, { padding: [56, 56], maxZoom: 15, duration: 0.6 })
    } catch {
      // ignorar geojson invalido
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evacuation, map])

  return null
}

/** Captura clics en el mapa: según el modo activo, elige el punto de ignición o la posición del brigadista */
function MapClickCapture({ mode, onPick }: { mode: 'ignition' | 'brigade' | null; onPick: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      if (!mode) return
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function getFrpColor(frp: number): { fill: string; stroke: string } {
  if (frp >= 100) return { fill: '#F97316', stroke: '#9A3412' }
  if (frp >= 60) return { fill: '#FB923C', stroke: '#C2410C' }
  if (frp >= 30) return { fill: '#FDBA74', stroke: '#C2410C' }
  return { fill: '#FED7AA', stroke: '#EA580C' }
}

function getFrpRadius(frp: number): number {
  return Math.min(14.5, Math.max(3.5, Math.round(Math.sqrt(frp) * 1.45)))
}

const TILES = {
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    label: 'Estándar',
  },
  topo: { url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', attribution: 'OpenTopoMap', label: 'Relieve' },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Esri, Maxar, Earthstar Geographics',
    label: 'Satélite',
  },
} as const

export const MapView: React.FC<MapViewProps> = ({
  region,
  hotspots,
  isLoadingHotspots,
  hotspotsUnavailable = false,
  customGeometry,
}) => {
  const [mapLayer, setMapLayer] = useState<keyof typeof TILES>('osm')
  const [showList, setShowList] = useState(false)
  const points = hotspots?.points ?? []

  // FireCast: simulación de propagación (prototipo, independiente de la BD histórica)
  const [fireCastEnabled, setFireCastEnabled] = useState(false)
  const [ignition, setIgnition] = useState<{ lat: number; lon: number } | null>(null)
  const [fireCast, setFireCast] = useState<FireCastResponse | null>(null)
  const [fireCastLoading, setFireCastLoading] = useState(false)
  const [fireCastError, setFireCastError] = useState<string | null>(null)
  const fireCastRequestId = useRef(0)

  const runFireCast = (lat: number, lon: number) => {
    setIgnition({ lat, lon })
    setFireCast(null)
    setFireCastError(null)
    setFireCastLoading(true)
    const requestId = ++fireCastRequestId.current

    fetchFireCast({ lat, lon })
      .then((data) => {
        if (fireCastRequestId.current !== requestId) return
        setFireCast(data)
      })
      .catch((err) => {
        if (fireCastRequestId.current !== requestId) return
        setFireCastError(err instanceof Error ? err.message : 'No se pudo simular la propagación.')
      })
      .finally(() => {
        if (fireCastRequestId.current !== requestId) return
        setFireCastLoading(false)
      })
  }

  const resetFireCast = () => {
    setIgnition(null)
    setFireCast(null)
    setFireCastError(null)
    setFireCastLoading(false)
  }

  const toggleFireCastMode = () => {
    setEvacuationEnabled(false)
    setFireCastEnabled((enabled) => {
      if (enabled) resetFireCast()
      return !enabled
    })
  }

  const windArrowDeg = fireCast ? (fireCast.wind.direction_from_deg + 180) % 360 : 0

  // Ruta de evacuación: depende del resultado de FireCast (mismo punto de ignición)
  const [evacuationEnabled, setEvacuationEnabled] = useState(false)
  const [brigade, setBrigade] = useState<{ lat: number; lon: number } | null>(null)
  const [evacuation, setEvacuation] = useState<EvacuationResponse | null>(null)
  const [evacuationLoading, setEvacuationLoading] = useState(false)
  const [evacuationError, setEvacuationError] = useState<string | null>(null)
  const evacuationRequestId = useRef(0)

  const runEvacuation = (lat: number, lon: number) => {
    if (!fireCast) return
    setBrigade({ lat, lon })
    setEvacuation(null)
    setEvacuationError(null)
    setEvacuationLoading(true)
    const requestId = ++evacuationRequestId.current

    fetchEvacuationRoute({
      brigade_lat: lat,
      brigade_lon: lon,
      ignition_lat: fireCast.ignition.lat,
      ignition_lon: fireCast.ignition.lon,
    })
      .then((data) => {
        if (evacuationRequestId.current !== requestId) return
        setEvacuation(data)
      })
      .catch((err) => {
        if (evacuationRequestId.current !== requestId) return
        setEvacuationError(err instanceof Error ? err.message : 'No se pudo calcular la ruta de evacuación.')
      })
      .finally(() => {
        if (evacuationRequestId.current !== requestId) return
        setEvacuationLoading(false)
      })
  }

  const resetEvacuation = () => {
    setBrigade(null)
    setEvacuation(null)
    setEvacuationError(null)
    setEvacuationLoading(false)
  }

  const toggleEvacuationMode = () => {
    if (!fireCast) return
    setFireCastEnabled(false)
    setEvacuationEnabled((enabled) => {
      if (enabled) resetEvacuation()
      return !enabled
    })
  }

  // Dinámico: si se elige un nuevo punto de ignición con un brigadista ya marcado,
  // recalcula la ruta de inmediato contra la nueva simulación.
  useEffect(() => {
    if (fireCast && brigade) {
      runEvacuation(brigade.lat, brigade.lon)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fireCast])

  const pickMode: 'ignition' | 'brigade' | null = evacuationEnabled ? 'brigade' : fireCastEnabled ? 'ignition' : null
  const handleMapPick = (lat: number, lon: number) => {
    if (pickMode === 'brigade') runEvacuation(lat, lon)
    else if (pickMode === 'ignition') runFireCast(lat, lon)
  }
  const riskColor = evacuation ? RISK_COLORS[evacuation.risk_level] : RISK_COLORS.bajo

  const fallbackCenter: [number, number] = region?.center ?? [-1.79, -78.1]
  const fallbackZoom = region?.zoom ?? 5
  const focusShape = customGeometry?.geojson ?? region?.geojson ?? null
  const regionKey = useMemo(() => region?.id ?? 'none', [region])

  return (
    <div className="bg-white rounded-[28px] p-6 sm:p-7 border border-slate-200/70 space-y-4">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#FF7900]">Mapa · {region?.name ?? '—'}</p>
          <h2 className="mt-2 text-xl sm:text-2xl font-black tracking-tight text-[#0B1B3D]">Focos detectados</h2>
          <p className="mt-1 text-sm text-slate-500">
            {hotspotsUnavailable ? 'Contorno del país analizado.' : 'Tamaño según potencia radiativa (FRP).'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="inline-flex p-1 rounded-full border border-slate-200">
            {(Object.keys(TILES) as (keyof typeof TILES)[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setMapLayer(key)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                  mapLayer === key ? 'bg-[#0B1B3D] text-white' : 'text-slate-500 hover:text-[#0B1B3D]'
                }`}
              >
                {TILES[key].label}
              </button>
            ))}
          </div>
          {!hotspotsUnavailable && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFF2E6] text-[#C2410C] text-xs font-bold">
              <Flame className="w-3.5 h-3.5 fill-current" />
              {isLoadingHotspots ? '…' : points.length} focos
            </span>
          )}

          <button
            type="button"
            onClick={toggleFireCastMode}
            title="Simular propagación estimada a 6h/12h/24h desde un punto (prototipo)"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
              fireCastEnabled ? 'bg-[#0B1B3D] text-white' : 'bg-[#FFF2E6] text-[#C2410C] hover:bg-[#FFE4C7]'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            FireCast {fireCastEnabled ? '· activo' : '(beta)'}
          </button>

          <button
            type="button"
            onClick={toggleEvacuationMode}
            disabled={!fireCast}
            title={
              fireCast
                ? 'Marcar la posición de un brigadista y trazar la ruta segura de salida (prototipo)'
                : 'Primero simula una propagación con FireCast'
            }
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
              !fireCast
                ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                : evacuationEnabled
                  ? 'bg-[#0B1B3D] text-white'
                  : 'bg-[#E8F3FF] text-[#0B5FA8] hover:bg-[#D7ECFF]'
            }`}
          >
            <Footprints className="w-3.5 h-3.5" />
            Ruta de evacuación {evacuationEnabled ? '· activa' : ''}
          </button>
        </div>
      </div>

      {/* Mapa */}
      <div
        className={`relative w-full h-[460px] rounded-2xl overflow-hidden border border-slate-200 bg-[#F4F6F9] ${
          pickMode ? 'cursor-crosshair' : ''
        }`}
      >
        <MapContainer center={fallbackCenter} zoom={fallbackZoom} scrollWheelZoom className="w-full h-full">
          <FitToShape shape={focusShape} fallbackCenter={fallbackCenter} fallbackZoom={fallbackZoom} />
          <MapClickCapture mode={pickMode} onPick={handleMapPick} />
          {fireCastEnabled && <FireCastFocus ignition={ignition} fireCast={fireCast} />}
          {evacuationEnabled && <EvacuationFocus evacuation={evacuation} />}
          <TileLayer url={TILES[mapLayer].url} attribution={TILES[mapLayer].attribution} />

          {/* Contorno del país */}
          {region?.geojson && (
            <GeoJSON
              key={`region-${regionKey}`}
              data={region.geojson}
              style={{ color: '#FF7900', weight: 2, fillColor: '#FF7900', fillOpacity: 0.06 }}
            />
          )}

          {/* Área personalizada cargada por el usuario */}
          {customGeometry?.geojson && (
            <GeoJSON
              key={JSON.stringify(customGeometry.geojson)}
              data={customGeometry.geojson}
              style={{ color: '#071C3A', weight: 2, fillColor: '#7DD3FC', fillOpacity: 0.22 }}
            />
          )}

          {points.map((pt, idx) => {
            const { fill, stroke } = getFrpColor(pt.frp)
            return (
              <CircleMarker
                key={`${pt.lat}-${pt.lon}-${idx}`}
                center={[pt.lat, pt.lon]}
                radius={getFrpRadius(pt.frp)}
                pathOptions={{ color: stroke, fillColor: fill, fillOpacity: 0.78, weight: 1.1 }}
              >
                <Popup>
                  <div className="space-y-1 text-xs">
                    <p className="font-black text-[#0B1B3D]">
                      Foco · <span className="text-[#FF7900]">{pt.sensor}</span>
                    </p>
                    <p>Fecha: {pt.date}</p>
                    <p>FRP: {pt.frp} MW</p>
                    <p>{formatCoordinates(pt.lat, pt.lon)}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setFireCastEnabled(true)
                        runFireCast(pt.lat, pt.lon)
                      }}
                      className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-[#C2410C] hover:text-[#9A3412]"
                    >
                      <Wind className="w-3 h-3" /> Simular propagación 24h desde aquí
                    </button>
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}

          {/* FireCast: polígonos de propagación estimada (24h → 12h → 6h, de afuera hacia adentro) */}
          {fireCast?.polygons.h24 && (
            <GeoJSON
              key={`fc-h24-${fireCast.ignition.lat}-${fireCast.ignition.lon}`}
              data={fireCast.polygons.h24}
              style={{ color: '#F9A825', weight: 1.5, fillColor: '#FFD54F', fillOpacity: 0.22 }}
            />
          )}
          {fireCast?.polygons.h12 && (
            <GeoJSON
              key={`fc-h12-${fireCast.ignition.lat}-${fireCast.ignition.lon}`}
              data={fireCast.polygons.h12}
              style={{ color: '#EF6C00', weight: 1.5, fillColor: '#FFA726', fillOpacity: 0.32 }}
            />
          )}
          {fireCast?.polygons.h6 && (
            <GeoJSON
              key={`fc-h6-${fireCast.ignition.lat}-${fireCast.ignition.lon}`}
              data={fireCast.polygons.h6}
              style={{ color: '#C62828', weight: 1.5, fillColor: '#E53935', fillOpacity: 0.45 }}
            />
          )}
          {ignition && (
            <CircleMarker
              center={[ignition.lat, ignition.lon]}
              radius={6}
              pathOptions={{ color: '#0B1B3D', fillColor: '#FF7900', fillOpacity: 1, weight: 2 }}
            />
          )}

          {/* Ruta de evacuación: línea animada coloreada por nivel de riesgo + marcador de salida */}
          {evacuation && (
            <Polyline
              key={`evac-route-${evacuation.brigade.lat}-${evacuation.brigade.lon}-${evacuation.exit_point.lat}`}
              positions={evacuation.route.coordinates.map(([lon, lat]) => [lat, lon] as [number, number])}
              pathOptions={{ color: riskColor, weight: 4, dashArray: '9 7', className: 'brasa-route-flow' }}
            />
          )}
          {evacuation && (
            <CircleMarker
              center={[evacuation.exit_point.lat, evacuation.exit_point.lon]}
              radius={7}
              pathOptions={{ color: '#0B1B3D', fillColor: '#16A34A', fillOpacity: 1, weight: 2 }}
            >
              <Tooltip direction="top" offset={[0, -6]}>Salida segura</Tooltip>
            </CircleMarker>
          )}
          {brigade && (
            <CircleMarker
              center={[brigade.lat, brigade.lon]}
              radius={7}
              pathOptions={{ color: '#0B1B3D', fillColor: '#2563EB', fillOpacity: 1, weight: 2 }}
            >
              <Tooltip direction="top" offset={[0, -6]}>Brigadista</Tooltip>
            </CircleMarker>
          )}
        </MapContainer>

        {/* Animación "marching ants" para la línea de ruta de evacuación */}
        <style>{`
          @keyframes brasa-route-dash { to { stroke-dashoffset: -32; } }
          .brasa-route-flow { animation: brasa-route-dash 1s linear infinite; }
        `}</style>

        {/* Panel FireCast: hint / carga / error / resultado */}
        {(fireCastEnabled || evacuationEnabled) && (
          <div className="absolute top-3 left-3 right-3 z-[400] bg-white/95 backdrop-blur-xs px-4 py-3 rounded-2xl border border-slate-200 shadow-md text-xs space-y-2">
            {evacuationEnabled && !fireCastEnabled && !brigade && (
              <p className="flex items-center gap-2 text-slate-600">
                <Footprints className="w-4 h-4 shrink-0 text-[#0B5FA8]" />
                Haz clic en el mapa para marcar la posición del brigadista y trazar la ruta de salida.
              </p>
            )}

            {fireCastEnabled && !ignition && (
              <p className="flex items-center gap-2 text-slate-600">
                <Wind className="w-4 h-4 shrink-0 text-[#FF7900]" />
                Haz clic en el mapa (o en un foco) para simular la propagación estimada desde ese punto.
              </p>
            )}

            {ignition && fireCastLoading && (
              <p className="flex items-center gap-2 text-slate-600">
                <Loader2 className="w-4 h-4 shrink-0 text-[#FF7900] animate-spin" />
                Simulando propagación con viento y pendiente en tiempo real…
              </p>
            )}

            {ignition && !fireCastLoading && fireCastError && (
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-600 font-bold">{fireCastError}</p>
                  <div className="mt-1.5 flex gap-3">
                    <button
                      type="button"
                      onClick={() => runFireCast(ignition.lat, ignition.lon)}
                      className="font-bold text-[#0B1B3D] hover:text-[#FF7900]"
                    >
                      Reintentar
                    </button>
                    <button type="button" onClick={resetFireCast} className="font-bold text-slate-500 hover:text-[#0B1B3D]">
                      Elegir otro punto
                    </button>
                  </div>
                </div>
              </div>
            )}

            {ignition && !fireCastLoading && !fireCastError && fireCast && (
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-[#0B1B3D] font-bold">
                    <Navigation2
                      className="w-4 h-4 text-[#FF7900]"
                      style={{ transform: `rotate(${windArrowDeg}deg)` }}
                    />
                    Viento {fireCast.wind.speed_kmh} km/h
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#E53935] inline-block" />6h</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#FFA726] inline-block" />12h</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#FFD54F] inline-block" />24h</span>
                  </div>
                  <button
                    type="button"
                    onClick={resetFireCast}
                    className="text-slate-400 hover:text-[#0B1B3D]"
                    aria-label="Elegir otro punto"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-slate-500 leading-snug">{fireCast.disclaimer}</p>
              </div>
            )}

            {evacuationEnabled && brigade && (
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                {evacuationLoading && (
                  <p className="flex items-center gap-2 text-slate-600">
                    <Loader2 className="w-4 h-4 shrink-0 text-[#0B5FA8] animate-spin" />
                    Calculando ruta segura (evitando peligro y humo)…
                  </p>
                )}

                {!evacuationLoading && evacuationError && (
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-red-600 font-bold">{evacuationError}</p>
                      <button
                        type="button"
                        onClick={() => runEvacuation(brigade.lat, brigade.lon)}
                        className="mt-1 font-bold text-[#0B1B3D] hover:text-[#FF7900]"
                      >
                        Reintentar
                      </button>
                    </div>
                  </div>
                )}

                {!evacuationLoading && !evacuationError && evacuation && (
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-bold" style={{ color: riskColor }}>
                        <Flag className="w-4 h-4" />
                        Riesgo {evacuation.risk_level} · {(evacuation.distance_m / 1000).toFixed(1)} km ·{' '}
                        {evacuation.estimated_time_min} min a pie
                      </div>
                      <button
                        type="button"
                        onClick={resetEvacuation}
                        className="text-slate-400 hover:text-[#0B1B3D]"
                        aria-label="Quitar ruta"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {evacuation.brigade.fuera_del_area_simulada && (
                      <p className="text-slate-500">La posición marcada está fuera del área simulada (~5.4 km); se usó el borde más cercano.</p>
                    )}
                    <p className="text-slate-500 leading-snug">{evacuation.disclaimer}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Aviso: la API no publica puntos */}
        {hotspotsUnavailable && (
          <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-sm z-[400] flex gap-2.5 items-start bg-white/95 backdrop-blur-xs px-4 py-3 rounded-2xl border border-slate-200 shadow-md text-xs text-slate-600">
            <MapPinOff className="w-4 h-4 shrink-0 text-[#FF7900] mt-0.5" />
            <p>
              <strong className="text-[#0B1B3D]">Puntos no disponibles en esta versión de la API.</strong> Las series,
              el calendario y las estadísticas sí usan los datos del país.
            </p>
          </div>
        )}

        {/* Leyenda FRP (solo si hay puntos) */}
        {points.length > 0 && (
          <div className="absolute bottom-3 right-3 z-[400] bg-white/95 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-slate-200/90 shadow-md text-xs">
            <span className="font-bold text-slate-800 block mb-1">Potencia (FRP, MW)</span>
            <div className="flex items-center gap-3 text-slate-600">
              {[
                ['15', 'w-2.5 h-2.5 bg-[#FED7AA] border-[#EA580C]'],
                ['30', 'w-3.5 h-3.5 bg-[#FDBA74] border-[#C2410C]'],
                ['60', 'w-4.5 h-4.5 bg-[#FB923C] border-[#C2410C]'],
                ['100', 'w-5.5 h-5.5 bg-[#F97316] border-[#9A3412]'],
              ].map(([label, cls]) => (
                <span key={label} className="flex items-center gap-1.5">
                  <span className={`rounded-full border inline-block ${cls}`} />
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lista de focos */}
      {!hotspotsUnavailable && (
        <>
          <button
            type="button"
            onClick={() => setShowList(!showList)}
            className="flex items-center gap-1.5 text-xs font-bold text-[#0B1B3D] hover:text-[#FF7900] transition-colors"
          >
            {showList ? <ChevronDown className="w-3.5 h-3.5 text-[#FF7900]" /> : <ChevronRight className="w-3.5 h-3.5 text-[#FF7900]" />}
            Focos en la semana ({points.length})
          </button>
          {showList && (
            <div className="pt-2 border-t border-slate-100 max-h-48 overflow-y-auto space-y-1">
              {points.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">No se registran focos en esta semana.</p>
              ) : (
                points.slice(0, 20).map((pt, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-[#F4F6F9]">
                    <span className="text-slate-600">
                      {pt.date} · {formatCoordinates(pt.lat, pt.lon)}
                    </span>
                    <span className="font-bold text-[#E53935]">
                      {pt.frp} MW ({pt.sensor})
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
