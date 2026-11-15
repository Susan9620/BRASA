// Hook central de datos para BRASA
// Gestiona peticiones a la API, cancelación de solicitudes obsoletas, caché y estados de carga

import { useState, useEffect, useCallback, useRef } from 'react'
import type {
  AnomaliesResponse,
  BaseFilterParams,
  CalendarResponse,
  ClimatologyResponse,
  CurrentStatusResponse,
  HotspotsResponse,
  RegionsResponse,
  SeasonResponse,
} from '../types'
import {
  fetchAnomalies,
  fetchCalendar,
  fetchClimatology,
  fetchCurrentStatus,
  fetchHotspots,
  fetchRegions,
  fetchSeason,
} from '../api/client'
import { useFilters } from './useFilters'

export interface BrasaDataState {
  regions: RegionsResponse | null
  calendar: CalendarResponse | null
  climatology: ClimatologyResponse | null
  season: SeasonResponse | null
  anomalies: AnomaliesResponse | null
  hotspots: HotspotsResponse | null
  currentStatus: CurrentStatusResponse | null
  isLoading: boolean
  isHotspotsLoading: boolean
  /** true cuando la API no publica la capa de puntos (HTTP 501) */
  hotspotsUnavailable: boolean
  error: string | null
  refetch: () => void
}

export function useBrasaData(): BrasaDataState {
  const { filters, selectedWeek, analyzeTrigger } = useFilters()

  const [regions, setRegions] = useState<RegionsResponse | null>(null)
  const [calendar, setCalendar] = useState<CalendarResponse | null>(null)
  const [climatology, setClimatology] = useState<ClimatologyResponse | null>(null)
  const [season, setSeason] = useState<SeasonResponse | null>(null)
  const [anomalies, setAnomalies] = useState<AnomaliesResponse | null>(null)
  const [hotspots, setHotspots] = useState<HotspotsResponse | null>(null)
  const [currentStatus, setCurrentStatus] = useState<CurrentStatusResponse | null>(null)

  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isHotspotsLoading, setIsHotspotsLoading] = useState<boolean>(false)
  const [hotspotsUnavailable, setHotspotsUnavailable] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)
  const hotspotsAbortRef = useRef<AbortController | null>(null)
  const hotspotsCacheRef = useRef<Map<string, HotspotsResponse>>(new Map())

  // Cargar regiones (países) solo una vez
  useEffect(() => {
    let active = true
    fetchRegions()
      .then((data) => {
        if (active) setRegions(data)
      })
      .catch((err) => {
        console.error('Error al cargar regiones:', err)
      })
    return () => {
      active = false
    }
  }, [])

  // Cargar series al cambiar filtros o disparar análisis
  const loadData = useCallback(() => {
    abortControllerRef.current?.abort()
    const ac = new AbortController()
    abortControllerRef.current = ac

    setIsLoading(true)
    setError(null)

    const baseParams: BaseFilterParams = {
      year_from: filters.yearRange[0],
      year_to: filters.yearRange[1],
      sensor: filters.sensor,
      confidence: filters.confidence,
      daynight: filters.daynight,
      country_code: filters.countryCode,
      geojson: filters.customGeometry?.geojson,
    }

    Promise.all([
      fetchCalendar(baseParams, ac.signal),
      fetchClimatology(baseParams, ac.signal),
      fetchSeason(baseParams, ac.signal),
      fetchAnomalies(baseParams, ac.signal),
      fetchCurrentStatus(baseParams, ac.signal),
    ])
      .then(([calData, climData, seasonData, anomData, statusData]) => {
        setCalendar(calData)
        setClimatology(climData)
        setSeason(seasonData)
        setAnomalies(anomData)
        setCurrentStatus(statusData)
        setIsLoading(false)
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        console.error('Error al consultar datos de BRASA:', err)
        setError('Ocurrió un error al consultar los datos satelitales. Verifique la conexión con el servicio.')
        setIsLoading(false)
      })
    // analyzeTrigger fuerza una nueva consulta aunque los filtros no cambien
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.countryCode,
    filters.yearRange,
    filters.sensor,
    filters.confidence,
    filters.daynight,
    filters.customGeometry?.geojson,
    analyzeTrigger,
  ])

  useEffect(() => {
    loadData()
    return () => abortControllerRef.current?.abort()
  }, [loadData])

  // Focos de la semana y año seleccionados (con caché por combinación de filtros)
  useEffect(() => {
    if (hotspotsUnavailable) return

    const cacheKey = [
      filters.selectedYear,
      selectedWeek,
      filters.countryCode,
      filters.sensor,
      filters.confidence,
      filters.daynight,
      JSON.stringify(filters.customGeometry?.geojson ?? null),
    ].join('|')

    const cached = hotspotsCacheRef.current.get(cacheKey)
    if (cached) {
      setHotspots(cached)
      setIsHotspotsLoading(false)
      return
    }

    hotspotsAbortRef.current?.abort()
    const ac = new AbortController()
    hotspotsAbortRef.current = ac
    setIsHotspotsLoading(true)

    fetchHotspots(
      {
        year_from: filters.yearRange[0],
        year_to: filters.yearRange[1],
        sensor: filters.sensor,
        confidence: filters.confidence,
        daynight: filters.daynight,
        country_code: filters.countryCode,
        year: filters.selectedYear,
        week: selectedWeek,
        geojson: filters.customGeometry?.geojson,
      },
      ac.signal
    )
      .then((res) => {
        hotspotsCacheRef.current.set(cacheKey, res)
        setHotspots(res)
        setIsHotspotsLoading(false)
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        // La versión compacta de la API no publica la capa espacial: dejar de pedirla
        if (String(err?.message).includes('Error 501')) {
          setHotspotsUnavailable(true)
          setHotspots(null)
        } else {
          console.error('Error al cargar focos:', err)
        }
        setIsHotspotsLoading(false)
      })

    return () => ac.abort()
  }, [
    hotspotsUnavailable,
    filters.selectedYear,
    selectedWeek,
    filters.countryCode,
    filters.yearRange,
    filters.sensor,
    filters.confidence,
    filters.daynight,
    filters.customGeometry?.geojson,
  ])

  return {
    regions,
    calendar,
    climatology,
    season,
    anomalies,
    hotspots,
    currentStatus,
    isLoading,
    isHotspotsLoading,
    hotspotsUnavailable,
    error,
    refetch: loadData,
  }
}
