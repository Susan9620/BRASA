// Contexto y Hook de Filtros para BRASA (API mundial: filtrado por país ISO3)

import React, { createContext, useContext, useState, useMemo } from 'react'
import type { ConfidenceLevel, CustomGeometry, DayNight, FilterState, SensorType } from '../types'
import { DATA_YEAR_MAX, DATA_YEAR_MIN, DEFAULT_COUNTRY } from '../utils/dataConfig'

export interface FiltersContextType {
  filters: FilterState
  selectedWeek: number
  setSelectedWeek: (week: number) => void
  setCountryCode: (code: string) => void
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

const DEFAULT_WEEK = 36

const DEFAULT_FILTERS: FilterState = {
  countryCode: DEFAULT_COUNTRY,
  yearRange: [DATA_YEAR_MIN, DATA_YEAR_MAX],
  selectedYear: 2024,
  // MODIS por defecto: serie continua más larga. 'harmonized' en la API es la suma de ambos sensores.
  sensor: 'modis',
  confidence: 'nominal_high',
  daynight: 'all',
  customGeometry: null,
}

const FiltersContext = createContext<FiltersContextType | undefined>(undefined)

export const FiltersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [selectedWeek, setSelectedWeek] = useState<number>(DEFAULT_WEEK)
  const [analyzeTrigger, setAnalyzeTrigger] = useState<number>(0)

  const value = useMemo<FiltersContextType>(
    () => ({
      filters,
      selectedWeek,
      setSelectedWeek,
      // Al cambiar de país se descarta cualquier área personalizada del país anterior
      setCountryCode: (countryCode) => setFilters((prev) => ({ ...prev, countryCode, customGeometry: null })),
      setYearRange: (yearRange) =>
        setFilters((prev) => ({
          ...prev,
          yearRange,
          selectedYear: Math.min(Math.max(prev.selectedYear, yearRange[0]), yearRange[1]),
        })),
      setSelectedYear: (selectedYear) => setFilters((prev) => ({ ...prev, selectedYear })),
      setSensor: (sensor) => setFilters((prev) => ({ ...prev, sensor })),
      setConfidence: (confidence) => setFilters((prev) => ({ ...prev, confidence })),
      setDayNight: (daynight) => setFilters((prev) => ({ ...prev, daynight })),
      setCustomGeometry: (customGeometry) => setFilters((prev) => ({ ...prev, customGeometry })),
      resetFilters: () => {
        setFilters(DEFAULT_FILTERS)
        setSelectedWeek(DEFAULT_WEEK)
        setAnalyzeTrigger((prev) => prev + 1)
      },
      analyzeTrigger,
      triggerAnalyze: () => setAnalyzeTrigger((prev) => prev + 1),
    }),
    [filters, selectedWeek, analyzeTrigger]
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
