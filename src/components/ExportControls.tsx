import React, { useEffect, useRef, useState } from 'react'
import { Download, ChevronDown } from 'lucide-react'
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
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Cerrar el menú al hacer clic fuera o con Escape
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

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
    exportToCSV('brasa_climatologia_historica', climatology.weeks)
  }

  const handleExportAnomaliesCSV = () => {
    if (!anomalies || anomalies.items.length === 0) {
      alert('No hay anomalías disponibles para exportar.')
      return
    }
    exportToCSV('brasa_anomalias_historicas', anomalies.items)
  }

  const options = [
    { label: `Focos · semana ${selectedWeek} de ${selectedYear}`, onClick: handleExportHotspotsCSV },
    { label: 'Calendario fire_cell_days', onClick: handleExportCalendarCSV },
    { label: 'Climatología P10–P90', onClick: handleExportClimatologyCSV },
    { label: 'Anomalías z-score', onClick: handleExportAnomaliesCSV },
  ]

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-[#0B1B3D] bg-white rounded-full border border-slate-200 transition-colors duration-250 hover:bg-[#FFF8F2] hover:border-[#FF7900]/35"
      >
        <Download className="w-4 h-4 text-[#FF7900]" />
        <span>Descargar datos</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-64 rounded-2xl bg-white border border-slate-200/70 shadow-xl shadow-[#0B1B3D]/10 p-2"
        >
          <p className="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">CSV</p>
          {options.map((o) => (
            <button
              key={o.label}
              type="button"
              role="menuitem"
              onClick={() => {
                o.onClick()
                setOpen(false)
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-[#0B1B3D] hover:bg-[#FFF8F2] transition-colors"
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
