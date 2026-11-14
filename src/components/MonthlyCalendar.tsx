import React, { useMemo } from 'react'
import type { AnomaliesResponse, CalendarResponse } from '../types'
import { ChartSkeleton } from './SkeletonLoader'
import {
  MONTHS_LONG,
  MONTHS_SHORT,
  anomaliesByMonth,
  firstWeekOfMonth,
  formatPercent,
  monthlyHistoricalMean,
  monthlyTotals,
  percentDiff,
  weekToMonth,
} from '../utils/monthly'

interface MonthlyCalendarProps {
  calendar: CalendarResponse | null
  anomalies: AnomaliesResponse | null
  selectedYear: number
  selectedWeek: number
  isLoading: boolean
  onSelectWeek: (year: number, week: number) => void
}

/* Tono de la celda según la relación con el promedio histórico del mes */
const LEVELS = [
  { max: 0.75, bg: '#F8FAFC', label: 'Menor' },
  { max: 1.25, bg: '#FFF4EA', label: 'Similar' },
  { max: 2, bg: '#FFD9B8', label: 'Mayor' },
  { max: Infinity, bg: '#FFB3A7', label: 'Muy superior' },
]

const levelFor = (ratio: number | null) => (ratio === null ? null : LEVELS.find((l) => ratio < l.max) ?? LEVELS[3])

export const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({
  calendar,
  anomalies,
  selectedYear,
  selectedWeek,
  isLoading,
  onSelectWeek,
}) => {
  const { totals, means, anomalyCounts } = useMemo(
    () => ({
      totals: monthlyTotals(calendar, selectedYear),
      means: monthlyHistoricalMean(calendar),
      anomalyCounts: anomaliesByMonth(anomalies, selectedYear),
    }),
    [calendar, anomalies, selectedYear]
  )

  if (isLoading || !calendar) return <ChartSkeleton height="h-64" />

  const selectedMonth = weekToMonth(selectedYear, selectedWeek)
  const selTotal = totals[selectedMonth]
  const selMean = means[selectedMonth]
  const selAnomalies = anomalyCounts[selectedMonth]

  return (
    <div className="bg-white rounded-[28px] p-6 sm:p-7 border border-slate-200/70">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#FF7900]">Calendario {selectedYear}</p>
        <h3 className="mt-2 text-xl sm:text-2xl font-black tracking-tight text-[#0B1B3D]">Mes a mes</h3>
        <p className="mt-1 text-sm text-slate-500">Cada mes frente a su promedio 2001–2025. Clic para verlo en el mapa.</p>
      </div>

      {/* 12 meses */}
      <div className="mt-6 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
        {MONTHS_SHORT.map((label, m) => {
          const diff = percentDiff(totals[m], means[m])
          const level = levelFor(totals[m] !== null && means[m] ? totals[m]! / means[m]! : null)
          const isSelected = m === selectedMonth
          return (
            <button
              key={label}
              type="button"
              onClick={() => onSelectWeek(selectedYear, firstWeekOfMonth(selectedYear, m))}
              aria-pressed={isSelected}
              aria-label={`${MONTHS_LONG[m]} ${selectedYear}: ${totals[m] ?? 'sin datos'} fire_cell_days, ${formatPercent(diff)} respecto al promedio`}
              className={`relative text-left rounded-2xl px-3.5 py-3 transition-[box-shadow,translate] duration-200 hover:-translate-y-0.5 ${
                isSelected ? 'ring-2 ring-[#0B1B3D]' : 'ring-1 ring-slate-200/70'
              }`}
              style={{ backgroundColor: level?.bg ?? '#F8FAFC' }}
            >
              {anomalyCounts[m] > 0 && (
                <span
                  className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#E53935]"
                  title={`${anomalyCounts[m]} semana(s) inusual(es)`}
                />
              )}
              <span className="block text-xs font-bold text-slate-500">{label}</span>
              <span className="block mt-1 text-lg font-black tracking-tight text-[#0B1B3D]">
                {totals[m] === null ? '—' : Math.round(totals[m]!)}
              </span>
              <span
                className={`block text-xs font-bold ${
                  diff === null ? 'text-slate-400' : diff > 0 ? 'text-[#C2410C]' : 'text-slate-500'
                }`}
              >
                {formatPercent(diff)}
              </span>
            </button>
          )
        })}
      </div>

      {/* Detalle del mes seleccionado + leyenda */}
      <div className="mt-5 pt-5 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <p className="text-sm text-slate-600">
          <strong className="text-[#0B1B3D]">
            {MONTHS_LONG[selectedMonth]} {selectedYear}:
          </strong>{' '}
          {selTotal === null ? 'sin datos' : `${Math.round(selTotal)} fcd`} ·{' '}
          {formatPercent(percentDiff(selTotal, selMean))} vs promedio ({selMean === null ? '—' : Math.round(selMean)} fcd)
          {selAnomalies > 0 && (
            <span className="text-[#E53935] font-bold">
              {' '}
              · {selAnomalies} semana{selAnomalies > 1 ? 's' : ''} inusual{selAnomalies > 1 ? 'es' : ''}
            </span>
          )}
        </p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
          {LEVELS.map((l) => (
            <span key={l.label} className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded ring-1 ring-slate-200/70" style={{ backgroundColor: l.bg }} />
              {l.label}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#E53935]" />
            Inusual
          </span>
        </div>
      </div>
    </div>
  )
}
