import React, { useState } from 'react'
import { AlertTriangle, ChevronRight, Filter } from 'lucide-react'
import type { AnomaliesResponse } from '../types'
import { formatWeekFriendly } from '../utils/dateUtils'

interface AnomalyListProps {
  anomalies: AnomaliesResponse | null
  isLoading: boolean
  selectedYear: number
  selectedWeek: number
  onSelectAnomaly: (year: number, week: number) => void
}

export const AnomalyList: React.FC<AnomalyListProps> = ({
  anomalies,
  isLoading,
  selectedYear,
  selectedWeek,
  onSelectAnomaly,
}) => {
  const [filterCurrentYearOnly, setFilterCurrentYearOnly] = useState<boolean>(false)

  if (isLoading || !anomalies) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="h-5 w-48 bg-slate-200 rounded-md animate-pulse" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 w-full bg-[#F4F6F9] rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const allItems = anomalies.items || []
  const filteredItems = filterCurrentYearOnly
    ? allItems.filter((item) => item.year === selectedYear)
    : allItems.slice(0, 15)

  const getSeverityBadge = (zscore: number) => {
    if (zscore >= 3.5) {
      return {
        label: 'Crítica',
        bg: 'bg-[#FDE8E8] text-[#E53935] border-[#E53935]/30',
      }
    }
    if (zscore >= 2.5) {
      return {
        label: 'Alta',
        bg: 'bg-[#FFF2E6] text-[#FF7900] border-[#FF7900]/30',
      }
    }
    return {
      label: 'Moderada',
      bg: 'bg-[#FFF9E6] text-[#B45309] border-[#FFC107]/40',
    }
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#FDE8E8] text-[#E53935] flex items-center justify-center shadow-2xs">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-[#0B2D5B] text-base tracking-tight">
              Períodos Inusuales y Anomalías Térmicas
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Semanas ordenadas por desviación estadística Z-Score (&ge; 1.6&sigma;).
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setFilterCurrentYearOnly(!filterCurrentYearOnly)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
            filterCurrentYearOnly
              ? 'bg-[#0B2D5B] text-white border-[#0B2D5B]'
              : 'bg-[#F4F6F9] text-[#0B2D5B] border-slate-200 hover:bg-slate-200'
          }`}
        >
          <Filter className="w-3.5 h-3.5 text-[#FF7900]" />
          <span>{filterCurrentYearOnly ? `Solo año ${selectedYear}` : 'Toda la serie histórica'}</span>
        </button>
      </div>

      {/* Lista interactiva estilo tabla */}
      {filteredItems.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-xs font-medium">
          No se registraron anomalías críticas para los filtros seleccionados.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Período</th>
                <th className="py-2.5 px-3">Actividad</th>
                <th className="py-2.5 px-3">Z-Score</th>
                <th className="py-2.5 px-3">Percentil</th>
                <th className="py-2.5 px-3">Severidad</th>
                <th className="py-2.5 px-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => {
                const isSelected = item.year === selectedYear && item.week === selectedWeek
                const severity = getSeverityBadge(item.zscore)

                return (
                  <tr
                    key={`${item.year}-${item.week}`}
                    onClick={() => onSelectAnomaly(item.year, item.week)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#FFF2E6] font-bold text-[#0B2D5B]'
                        : 'hover:bg-[#F4F6F9] text-slate-700'
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-[#0B2D5B]">
                          {item.year}
                        </span>
                        <span className="text-slate-500 font-medium">— {formatWeekFriendly(item.year, item.week)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">
                      {item.value} <span className="text-[10px] text-slate-400 font-normal">fcd</span>
                    </td>
                    <td className="py-3 px-3 font-black font-mono text-[#E53935]">
                      +{item.zscore.toFixed(2)}&sigma;
                    </td>
                    <td className="py-3 px-3 font-bold font-mono text-slate-600">
                      P{item.percentile}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${severity.bg}`}>
                        {severity.label}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#FF7900] hover:underline">
                        <span>Ver en mapa</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
