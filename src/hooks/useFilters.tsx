// Contexto y Hook de Filtros para BRASA
// Soporte jerárquico completo: País -> Provincia -> Ciudad / Cantón

import React, { createContext, useContext, useState, useMemo } from 'react'
import type {
  ConfidenceLevel,
  CustomGeometry,
  DayNight,
  FilterState,
  SensorType,
} from '../types'
import { circleToPolygonGeoJSON } from '../utils/geoUtils'
import { getProvincesForCountry } from '../utils/territoryData'

export interface FiltersContextType {
  filters: FilterState
  selectedWeek: number
  coverageRadiusMeters: number
  setSelectedWeek: (week: number) => void
  setCoverageRadiusMeters: (radius: number) => void
  setCountry: (code: string, name?: string, center?: [number, number]) => void
  setProvinceId: (id: string, center?: [number, number]) => void
  setCantonId: (id: string, center?: [number, number]) => void
  setYearRange: (range: [number, number]) => void
  setSelectedYear: (year: number) => void
  setSensor: (sensor: SensorType) => void
  setConfidence: (confidence: ConfidenceLevel) => void
  setDayNight: (daynight: DayNight) => void
  setCustomGeometry: (geometry: CustomGeometry | null) => void
  resetFilters: () => void
  analyzeTrigger: number
  triggerAnalyze: () => void
}

const DEFAULT_RADIUS = 18500

const DEFAULT_FILTERS: FilterState = {
  country: 'ECU',
  countryName: 'Ecuador',
  provinceId: 'chimborazo',
  cantonId: 'riobamba',
  yearRange: [2001, 2025],
  selectedYear: 2024,
  sensor: 'harmonized',
  confidence: 'nominal_high',
  daynight: 'all',
  customGeometry: {
    type: 'circle',
    center: [-1.6709, -78.6545],
    radiusMeters: DEFAULT_RADIUS,
    geojson: circleToPolygonGeoJSON(-1.6709, -78.6545, DEFAULT_RADIUS),
  },
  coverageRadiusMeters: DEFAULT_RADIUS,
}

const FiltersContext = createContext<FiltersContextType | undefined>(undefined)

export const FiltersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [selectedWeek, setSelectedWeek] = useState<number>(36) // Semana pico en temporada seca
  const [coverageRadiusMeters, setCoverageRadiusState] = useState<number>(DEFAULT_RADIUS)
  const [analyzeTrigger, setAnalyzeTrigger] = useState<number>(0)

  const setCoverageRadiusMeters = (radius: number) => {
    setCoverageRadiusState(radius)
    setFilters((prev) => {
      const center = prev.customGeometry?.center || [-1.6709, -78.6545]
      return {
        ...prev,
        coverageRadiusMeters: radius,
        customGeometry:
          prev.customGeometry?.type === 'circle' || !prev.customGeometry
            ? {
                type: 'circle',
                center,
                radiusMeters: radius,
                geojson: circleToPolygonGeoJSON(center[0], center[1], radius),
              }
            : prev.customGeometry,
      }
    })
  }

  const setCountry = (code: string, name?: string, center?: [number, number]) => {
    const provs = getProvincesForCountry(code)
    const firstProv = provs[0]
    const firstCanton = firstProv?.cantons?.[0]
    const newCenter = center || firstProv?.center || [-1.6709, -78.6545]
    const radius = filters.coverageRadiusMeters || DEFAULT_RADIUS

    setFilters((prev) => ({
      ...prev,
      country: code,
      countryName: name || (code === 'ECU' ? 'Ecuador' : code),
      provinceId: firstProv ? firstProv.id : '',
      cantonId: firstCanton ? firstCanton.id : '',
      customGeometry: {
        type: 'circle',
        center: newCenter,
        radiusMeters: radius,
        geojson: circleToPolygonGeoJSON(newCenter[0], newCenter[1], radius),
      },
    }))
  }

  const setProvinceId = (provinceId: string, center?: [number, number]) => {
    setFilters((prev) => {
      const provs = getProvincesForCountry(prev.country)
      const prov = provs.find((p) => p.id === provinceId)
      const firstCanton = prov?.cantons?.[0]
      const newCenter = center || prov?.center || (provinceId === 'chimborazo' ? [-1.6709, -78.6545] : [-0.2298, -78.5249])
      const radius = prev.coverageRadiusMeters || DEFAULT_RADIUS

      return {
        ...prev,
        provinceId,
        cantonId: firstCanton ? firstCanton.id : '',
        customGeometry: {
          type: 'circle',
          center: newCenter,
          radiusMeters: radius,
          geojson: circleToPolygonGeoJSON(newCenter[0], newCenter[1], radius),
        },
      }
    })
  }

  const setCantonId = (cantonId: string, center?: [number, number]) => {
    setFilters((prev) => {
      const newCenter = center || prev.customGeometry?.center || [-1.6709, -78.6545]
      const radius = prev.coverageRadiusMeters || DEFAULT_RADIUS
      return {
        ...prev,
        cantonId,
        customGeometry: {
          type: 'circle',
          center: newCenter,
          radiusMeters: radius,
          geojson: circleToPolygonGeoJSON(newCenter[0], newCenter[1], radius),
        },
      }
    })
  }

  const setYearRange = (yearRange: [number, number]) => {
    setFilters((prev) => ({ ...prev, yearRange }))
  }

  const setSelectedYear = (selectedYear: number) => {
    setFilters((prev) => ({ ...prev, selectedYear }))
  }

  const setSensor = (sensor: SensorType) => {
    setFilters((prev) => ({ ...prev, sensor }))
  }

  const setConfidence = (confidence: ConfidenceLevel) => {
    setFilters((prev) => ({ ...prev, confidence }))
  }

  const setDayNight = (daynight: DayNight) => {
    setFilters((prev) => ({ ...prev, daynight }))
  }

  const setCustomGeometry = (customGeometry: CustomGeometry | null) => {
    setFilters((prev) => ({ ...prev, customGeometry }))
  }

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS)
    setSelectedWeek(36)
    setCoverageRadiusState(DEFAULT_RADIUS)
    setAnalyzeTrigger((prev) => prev + 1)
  }

  const triggerAnalyze = () => {
    setAnalyzeTrigger((prev) => prev + 1)
  }

  const value = useMemo(
    () => ({
      filters,
      selectedWeek,
      coverageRadiusMeters,
      setSelectedWeek,
      setCoverageRadiusMeters,
      setCountry,
      setProvinceId,
      setCantonId,
      setYearRange,
      setSelectedYear,
      setSensor,
      setConfidence,
      setDayNight,
      setCustomGeometry,
      resetFilters,
      analyzeTrigger,
      triggerAnalyze,
    }),
    [filters, selectedWeek, coverageRadiusMeters, analyzeTrigger]
  )

  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>
}

export function useFilters(): FiltersContextType {
  const context = useContext(FiltersContext)
  if (!context) {
    throw new Error('useFilters debe utilizarse dentro de FiltersProvider')
  }
  return context
}
