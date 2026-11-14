import React from 'react'
import { useBrasaData } from '../hooks/useBrasaData'
import { useFilters } from '../hooks/useFilters'
import { FiltersPanel } from '../components/FiltersPanel'
import { KpiCards } from '../components/KpiCards'
import { MapView } from '../components/MapView'
import { FireCalendar } from '../components/FireCalendar'
import { TimelinePlayer } from '../components/TimelinePlayer'
import { ExportControls } from '../components/ExportControls'
import { ErrorMessage } from '../components/ErrorMessage'

export const Explore: React.FC = () => {
  const {
    filters,
    selectedWeek,
    setSelectedWeek,
    setSelectedYear,
    setCustomGeometry,
  } = useFilters()

  const {
    regions,
    calendar,
    climatology,
    season,
    anomalies,
    hotspots,
    currentStatus,
    isLoading,
    isHotspotsLoading,
    error,
    refetch,
  } = useBrasaData()

  const selectedRegion = regions?.find((r) => r.id === filters.provinceId) || regions?.[0]
  const selectedCanton = selectedRegion?.cantons?.find((c) => c.id === filters.cantonId)

  const handleSelectWeekAndYear = (year: number, week: number) => {
    setSelectedYear(year)
    setSelectedWeek(week)
  }

  const handleClearGeometry = () => {
    setCustomGeometry(null)
  }

  return (
    <div className="space-y-5 py-6 px-4 sm:px-6 lg:px-8 max-w-[1680px] mx-auto">
      {/* 1. Título y área analizada idéntico a la captura */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-black text-[#0B2D5B] tracking-tight">
          Explorar
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
          Área analizada:{' '}
          <strong className="text-slate-800 font-bold">
            {selectedCanton ? selectedCanton.name : 'Riobamba'} - {selectedRegion?.name || 'Chimborazo'}
          </strong>
        </p>
      </div>

      {/* Manejo de error si ocurriera */}
      {error && <ErrorMessage message={error} onRetry={refetch} />}

      {/* 2. Fila de 4 KPI Cards (Overview) */}
      <KpiCards
        season={season}
        currentStatus={currentStatus}
        selectedYear={filters.selectedYear}
        isLoading={isLoading}
      />

      {/* 3. Grid Principal de 2 Columnas idéntico a la captura */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Columna Izquierda: Mapa, Línea temporal, Exportación CSV y Calendario Heatmap */}
        <div className="lg:col-span-8 space-y-4">
          {/* Mapa Leaflet */}
          <MapView
            region={selectedRegion}
            canton={selectedCanton}
            hotspots={hotspots}
            isLoadingHotspots={isHotspotsLoading}
            selectedYear={filters.selectedYear}
            selectedWeek={selectedWeek}
            customGeometry={filters.customGeometry}
            onClearGeometry={handleClearGeometry}
          />

          {/* Línea Temporal de Observación */}
          <TimelinePlayer
            currentWeek={selectedWeek}
            selectedYear={filters.selectedYear}
            onWeekChange={(week) => setSelectedWeek(week)}
          />

          {/* Exportar Datos Científicos (CSV) */}
          <ExportControls
            calendar={calendar}
            hotspots={hotspots}
            climatology={climatology}
            anomalies={anomalies}
            selectedYear={filters.selectedYear}
            selectedWeek={selectedWeek}
          />

          {/* Calendario Histórico de Actividad Satelital (2001–2025) */}
          <FireCalendar
            calendar={calendar}
            isLoading={isLoading}
            selectedYear={filters.selectedYear}
            selectedWeek={selectedWeek}
            onSelectWeek={handleSelectWeekAndYear}
          />
        </div>

        {/* Columna Derecha: Filtros de Análisis */}
        <div className="lg:col-span-4">
          <FiltersPanel regions={regions} />
        </div>
      </div>
    </div>
  )
}
