import React from 'react'
import { Download, FileSpreadsheet, MapPin } from 'lucide-react'
import { exportToCSV } from '../utils/exportUtils'
import type {
  CalendarResponse,
  ClimatologyResponse,
  HotspotsResponse,
  AnomaliesResponse,
} from '../types'

interface ExportControlsProps {
  calendar: CalendarResponse | null
  hotspots: HotspotsResponse | null
  climatology: ClimatologyResponse | null
  anomalies: AnomaliesResponse | null
  selectedYear: number
  selectedWeek: number
}

export const ExportControls: React.FC<ExportControlsProps> = ({
  calendar,
  hotspots,
  climatology,
  anomalies,
  selectedYear,
  selectedWeek,
}) => {
  const handleExportCalendarCSV = () => {
    if (!calendar) return
    exportToCSV(`brasa_actividad_historica_${selectedYear}`, calendar.weeks)
  }

  const handleExportHotspotsCSV = () => {
    if (!hotspots || hotspots.points.length === 0) {
      alert('No hay focos registrados para la semana seleccionada.')
      return
    }
    exportToCSV(
      `brasa_focos_semana_${selectedWeek}_ano_${selectedYear}`,
      hotspots.points
    )
  }

  const handleExportClimatologyCSV = () => {
    if (!climatology) return
    exportToCSV('brasa_climatologia_historica_ecuador', climatology.weeks)
  }

  const handleExportAnomaliesCSV = () => {
    if (!anomalies || anomalies.items.length === 0) {
      alert('No hay anomalías disponibles para exportar.')
      return
    }
    exportToCSV('brasa_anomalias_historicas', anomalies.items)
  }

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2 text-slate-700 font-bold">
        <Download className="w-4 h-4 text-[#FF7900]" />
        <span>Exportar Datos Científicos (CSV):</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 font-bold">
        <button
          type="button"
          onClick={handleExportHotspotsCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFF2E6] hover:bg-[#FFE6D1] text-[#E53935] rounded-xl transition-colors border border-[#E53935]/20 shadow-2xs"
          title="Descargar focos satelitales de esta semana"
        >
          <MapPin className="w-3.5 h-3.5 text-[#E53935]" />
          <span>Focos S{selectedWeek} ({selectedYear})</span>
        </button>

        <button
          type="button"
          onClick={handleExportCalendarCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F4F6F9] hover:bg-slate-200 text-[#0B2D5B] rounded-xl transition-colors border border-slate-200 shadow-2xs"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-[#FF7900]" />
          <span>Matriz fire_cell_days</span>
        </button>

        <button
          type="button"
          onClick={handleExportClimatologyCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F4F6F9] hover:bg-slate-200 text-[#0B2D5B] rounded-xl transition-colors border border-slate-200 shadow-2xs"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-[#0B2D5B]" />
          <span>Climatología (P10-P90)</span>
        </button>

        <button
          type="button"
          onClick={handleExportAnomaliesCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F4F6F9] hover:bg-slate-200 text-[#0B2D5B] rounded-xl transition-colors border border-slate-200 shadow-2xs"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-[#FFC107]" />
          <span>Anomalías Z-Score</span>
        </button>
      </div>
    </div>
  )
}
