import React from 'react'
import type { CurrentStatusResponse, SeasonResponse } from '../types'
import { formatWeekFriendly } from '../utils/dateUtils'
import { KpiCardSkeleton } from './SkeletonLoader'

interface KpiCardsProps {
  season: SeasonResponse | null
  currentStatus: CurrentStatusResponse | null
  selectedYear: number
  isLoading: boolean
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  season,
  currentStatus,
  selectedYear,
  isLoading,
}) => {
  if (isLoading || !season || !currentStatus) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCardSkeleton />
        <KpiCardSkeleton />
        <KpiCardSkeleton />
        <KpiCardSkeleton />
      </div>
    )
  }

  // 1. Pico de temporada del año seleccionado
  const currentSeason = season.years.find((y) => y.year === selectedYear)
  const peakWeekText = currentSeason
    ? formatWeekFriendly(selectedYear, currentSeason.peak_week)
    : 'Semana 36 (2 - 8 Sep)'

  // 2. Año más activo de la serie histórica
  const mostActiveYear = [...season.years].sort((a, b) => b.total - a.total)[0]

  // 3. Tendencia histórica
  const midpoint = Math.floor(season.years.length / 2)
  const firstHalf = season.years.slice(0, midpoint)
  const secondHalf = season.years.slice(midpoint)
  const avgFirst = firstHalf.reduce((acc, y) => acc + y.total, 0) / (firstHalf.length || 1)
  const avgSecond = secondHalf.reduce((acc, y) => acc + y.total, 0) / (secondHalf.length || 1)
  const trendPercent = Math.round(((avgSecond - avgFirst) / avgFirst) * 100)

  // 4. Configuración del estado de esta semana
  const statusConfig = {
    normal: {
      label: 'NORMAL',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    elevado: {
      label: 'ELEVADO',
      badgeClass: 'bg-[#FFF9E6] text-[#B45309] border-[#FFC107]/50',
    },
    inusual: {
      label: 'INUSUAL',
      badgeClass: 'bg-[#FDE8E8] text-[#E53935] border-[#E53935]/30',
    },
  }[currentStatus.level]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* KPI 1: Pico de temporada */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
          PICO DE TEMPORADA ({selectedYear})
        </span>
        <div>
          <div className="text-xl font-black text-[#0B2D5B] tracking-tight">
            {peakWeekText}
          </div>
          <p className="text-xs font-bold text-[#FF7900] mt-1">
            Ventana crítica
          </p>
        </div>
      </div>

      {/* KPI 2: Año más activo */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
          AÑO MÁS ACTIVO HISTÓRICO
        </span>
        <div>
          <div className="text-2xl font-black text-[#0B2D5B] tracking-tight">
            {mostActiveYear ? mostActiveYear.year : '2024'}
          </div>
          <p className="text-xs font-bold text-[#FF7900] mt-1">
            Total: {mostActiveYear ? mostActiveYear.total.toLocaleString('es-EC', { minimumFractionDigits: 1 }) : '3.082,5'} fire_cell_days
          </p>
        </div>
      </div>

      {/* KPI 3: Tendencia histórica */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
          TENDENCIA HISTÓRICA
        </span>
        <div>
          <div className="text-2xl font-black text-[#0B2D5B] tracking-tight">
            {trendPercent > 0 ? `+${trendPercent}%` : `${trendPercent}%`}
          </div>
          <p className="text-xs font-bold text-[#FF7900] mt-1">
            2001–2012 vs 2013–2025
          </p>
        </div>
      </div>

      {/* KPI 4: Estado de esta semana (con acento superior en naranja como el screenshot) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 border-t-2 border-t-[#FF7900] shadow-xs flex flex-col justify-between">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
          ESTADO DE ESTA SEMANA
        </span>
        <div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-black tracking-wider border ${statusConfig.badgeClass}`}>
              {statusConfig.label}
            </span>
            <span className="text-xl font-black text-[#0B2D5B]">
              {currentStatus.value} <span className="text-xs font-semibold text-slate-400">fcd</span>
            </span>
          </div>
          <p className="text-xs font-bold text-[#FF7900] mt-1">
            Percentil P{currentStatus.percentile} • Z-Score: {currentStatus.zscore > 0 ? `+${currentStatus.zscore}` : currentStatus.zscore}σ
          </p>
        </div>
      </div>
    </div>
  )
}
