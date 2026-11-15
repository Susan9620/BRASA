import React, { useState } from 'react'
import { Filter, RotateCcw, Search, Upload, X, ChevronDown } from 'lucide-react'
import { useFilters } from '../hooks/useFilters'
import type { RegionsResponse, SensorType, ConfidenceLevel, DayNight } from '../types'
import { DATA_YEARS, SENSOR_LABELS } from '../utils/dataConfig'

interface FiltersPanelProps {
  regions: RegionsResponse | null
  className?: string
}

export const FiltersPanel: React.FC<FiltersPanelProps> = ({ regions, className = '' }) => {
  const {
    filters,
    setCountryCode,
    setYearRange,
    setSelectedYear,
    setSensor,
    setConfidence,
    setDayNight,
    setCustomGeometry,
    resetFilters,
    triggerAnalyze,
  } = useFilters()

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false)
  const [geoJsonFileName, setGeoJsonFileName] = useState<string | null>(null)

  const selectedRegion = regions?.find((r) => r.id === filters.countryCode)
  const sortedRegions = [...(regions ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'es'))

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const parsed = JSON.parse(text)
        setCustomGeometry({
          type: 'polygon',
          geojson: parsed,
        })
        setGeoJsonFileName(file.name)
      } catch (err) {
        alert('El archivo no contiene un formato GeoJSON válido.')
        console.error(err)
      }
    }
    reader.readAsText(file)
  }

  const clearCustomArea = () => {
    setCustomGeometry(null)
    setGeoJsonFileName(null)
  }

  const content = (
    <div className="space-y-4 text-xs font-sans">
      {/* 1. Header con icono y botón de restablecer */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2 font-bold text-[#0B2D5B] text-sm">
          <Filter className="w-4 h-4 text-[#FF7900]" />
          <span>Filtros de Análisis</span>
        </div>
        <button
          type="button"
          onClick={resetFilters}
          className="text-[11px] font-semibold text-slate-400 hover:text-[#0B2D5B] flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded-md hover:bg-slate-100"
          title="Restablecer filtros a valores iniciales"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Restablecer</span>
        </button>
      </div>

      {/* 2. Ubicación */}
      <div className="space-y-2">
        <label htmlFor="country-select" className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
          PAÍS
        </label>
        <div className="relative">
          <select
            id="country-select"
            value={filters.countryCode}
            onChange={(e) => {
              setCountryCode(e.target.value)
              setGeoJsonFileName(null)
            }}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 pr-7 text-xs font-bold text-slate-700 focus:ring-1 focus:ring-[#FF7900] focus:outline-hidden appearance-none shadow-2xs"
          >
            {sortedRegions.length === 0 && <option value={filters.countryCode}>Cargando países…</option>}
            {sortedRegions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* 3. Área personalizada (opcional) */}
      <div className="space-y-2 pt-1 border-t border-slate-100">
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
          ÁREA PERSONALIZADA <span className="normal-case font-medium">(opcional)</span>
        </label>
        {filters.customGeometry ? (
          <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#FFF8F2] border border-[#FF7900]/30">
            <span className="truncate font-bold text-[#0B1B3D]">{geoJsonFileName ?? 'Área personalizada'}</span>
            <button
              type="button"
              onClick={clearCustomArea}
              className="shrink-0 p-1 rounded-md text-slate-400 hover:text-[#E53935]"
              aria-label="Quitar área personalizada"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <label className="flex items-center justify-center gap-2 p-2 border border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-[#F4F6F9] transition-colors text-xs text-slate-600 font-semibold">
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span>Cargar GeoJSON</span>
            <input type="file" accept=".geojson,.json" onChange={handleFileUpload} className="hidden" />
          </label>
        )}
        <p className="text-xs text-slate-400">Sin área, se analiza todo el país (celdas de 1°).</p>
      </div>

      {/* 4. Período histórico */}
      <div className="space-y-2 pt-1 border-t border-slate-100">
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
          PERÍODO HISTÓRICO
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-xs text-slate-400 font-medium block mb-1">Desde</span>
            <div className="relative">
              <select
                value={filters.yearRange[0]}
                onChange={(e) =>
                  setYearRange([Number(e.target.value), filters.yearRange[1]])
                }
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 pr-7 text-xs font-bold text-slate-700 shadow-2xs appearance-none"
              >
                {DATA_YEARS.map((y) => (
                  <option key={y} value={y} disabled={y > filters.yearRange[1]}>
                    {y}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block mb-1">Hasta</span>
            <div className="relative">
              <select
                value={filters.yearRange[1]}
                onChange={(e) =>
                  setYearRange([filters.yearRange[0], Number(e.target.value)])
                }
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 pr-7 text-xs font-bold text-slate-700 shadow-2xs appearance-none"
              >
                {DATA_YEARS.map((y) => (
                  <option key={y} value={y} disabled={y < filters.yearRange[0]}>
                    {y}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="selected-year-select" className="text-xs text-slate-400 font-medium block mb-1">
            Año en foco (mapa y gráficos)
          </label>
          <div className="relative">
            <select
              id="selected-year-select"
              value={filters.selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 pr-7 text-xs font-black text-slate-800 shadow-2xs appearance-none"
            >
              {Array.from(
                { length: filters.yearRange[1] - filters.yearRange[0] + 1 },
                (_, i) => filters.yearRange[0] + i
              ).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 5. Sensor satelital */}
      <div className="space-y-2 pt-1 border-t border-slate-100">
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
          SENSOR SATELITAL
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {(['modis', 'viirs', 'harmonized'] as const).map((id) => ({ id, label: SENSOR_LABELS[id] })).map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSensor(s.id as SensorType)}
              className={`px-2 py-2 text-xs rounded-xl font-black transition-all text-center border ${
                filters.sensor === s.id
                  ? 'bg-[#071C3A] text-white border-[#071C3A] shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-[#F4F6F9]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          MODIS (1 km) y VIIRS (375 m) no son directamente comparables. «Ambos» suma sus detecciones sin armonizar.
        </p>
      </div>

      {/* 6. Confianza y Día/Noche */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
        <div>
          <label htmlFor="confidence-select" className="text-xs text-slate-400 font-medium block mb-1">
            Confianza
          </label>
          <div className="relative">
            <select
              id="confidence-select"
              value={filters.confidence}
              onChange={(e) => setConfidence(e.target.value as ConfidenceLevel)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 pr-7 text-xs font-bold text-slate-700 shadow-2xs appearance-none"
            >
              <option value="nominal_high">Nominal / Alta</option>
              <option value="all">Todas</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <div>
          <label htmlFor="daynight-select" className="text-xs text-slate-400 font-medium block mb-1">
            Paso Satelital
          </label>
          <div className="relative">
            <select
              id="daynight-select"
              value={filters.daynight}
              onChange={(e) => setDayNight(e.target.value as DayNight)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 pr-7 text-xs font-bold text-slate-700 shadow-2xs appearance-none"
            >
              <option value="all">Día y Noche</option>
              <option value="D">Diurno</option>
              <option value="N">Nocturno</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 7. Botón principal: ANALIZAR ÁREA */}
      <div className="pt-2">
        <button
          type="button"
          onClick={triggerAnalyze}
          className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-[#FF7900] hover:bg-[#E66D00] text-white font-black rounded-xl shadow-md shadow-[#FF7900]/30 transition-all text-xs uppercase tracking-wider focus:outline-hidden"
        >
          <Search className="w-4 h-4" />
          <span>ACTUALIZAR</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      <div
        className={`bg-white rounded-[28px] p-6 border border-slate-200/70 hidden lg:block ${className}`}
      >
        {content}
      </div>

      {/* Versión Móvil: Botón flotante y Bottom Sheet */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          className="fixed bottom-5 right-5 z-30 flex items-center gap-2 px-5 py-3.5 bg-[#FF7900] text-white rounded-full shadow-2xl font-black text-sm hover:bg-[#E66D00]"
          aria-label="Abrir panel de filtros"
        >
          <Filter className="w-4 h-4" />
          <span>Filtros ({selectedRegion?.name ?? filters.countryCode})</span>
        </button>

        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 bg-[#071C3A]/60 backdrop-blur-xs flex flex-col justify-end">
            <div className="bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto p-6 shadow-2xl space-y-4">
              <div className="flex justify-center -mt-2 mb-2">
                <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-black text-[#0B2D5B] text-base">
                  Filtros de Análisis
                </span>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-[#0B2D5B]"
                >
                  <ChevronDown className="w-6 h-6" />
                </button>
              </div>

              {content}

              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="w-full mt-3 py-3 bg-[#F4F6F9] text-[#0B2D5B] rounded-xl font-bold text-xs text-center hover:bg-slate-200"
              >
                Cerrar filtros
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
