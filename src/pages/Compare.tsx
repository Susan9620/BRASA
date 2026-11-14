import React, { useState, useRef, useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import {
  GitCompare,
  Download,
  Calendar,
  Flame,
  Clock,
  TrendingUp,
} from 'lucide-react'
import { useBrasaData } from '../hooks/useBrasaData'
import { useFilters } from '../hooks/useFilters'
import { exportChartToPNG } from '../utils/exportUtils'
import { formatWeekFriendly } from '../utils/dateUtils'
import { ChartSkeleton } from '../components/SkeletonLoader'

export const Compare: React.FC = () => {
  const { filters } = useFilters()
  const { calendar, climatology, season, isLoading, regions } = useBrasaData()

  const [yearA, setYearA] = useState<number>(2024)
  const [yearB, setYearB] = useState<number>(2012)
  const chartRef = useRef<ReactECharts>(null)

  const selectedRegion = regions?.find((r) => r.id === filters.provinceId) || regions?.[0]

  const availableYears = useMemo(() => {
    if (!season) return [2012, 2024]
    return season.years.map((y) => y.year).sort((a, b) => b - a)
  }, [season])

  const seasonA = season?.years.find((y) => y.year === yearA)
  const seasonB = season?.years.find((y) => y.year === yearB)

  const { curveA, curveB, meanCurve, p50Curve } = useMemo(() => {
    if (!calendar || !climatology) {
      return { curveA: [], curveB: [], meanCurve: [], p50Curve: [] }
    }

    const mapA = new Map(
      calendar.weeks.filter((w) => w.year === yearA).map((item) => [item.week, item.value])
    )
    const mapB = new Map(
      calendar.weeks.filter((w) => w.year === yearB).map((item) => [item.week, item.value])
    )

    const cA: number[] = []
    const cB: number[] = []
    const cMean: number[] = []
    const cP50: number[] = []

    for (let w = 1; w <= 52; w++) {
      cA.push(mapA.get(w) ?? 0)
      cB.push(mapB.get(w) ?? 0)
      const clim = climatology.weeks.find((cw) => cw.week === w)
      cMean.push(clim?.mean ?? 0)
      cP50.push(clim?.p50 ?? 0)
    }

    return { curveA: cA, curveB: cB, meanCurve: cMean, p50Curve: cP50 }
  }, [calendar, climatology, yearA, yearB])

  const totalA = seasonA?.total ?? 0
  const totalB = seasonB?.total ?? 0
  const diffPercent = totalB > 0 ? Math.round(((totalA - totalB) / totalB) * 100) : 0

  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(11, 45, 91, 0.96)',
      borderColor: '#FF7900',
      borderWidth: 1,
      textStyle: { color: '#ffffff', fontSize: 12 },
      formatter: (params: Array<{ seriesName: string; value: number; dataIndex: number }>) => {
        if (!params || params.length === 0) return ''
        const week = params[0].dataIndex + 1
        return `
          <div style="font-family: inherit; line-height: 1.5; padding: 3px;">
            <div style="font-weight: 800; color: #FF7900; margin-bottom: 4px; font-size: 13px;">
              ${formatWeekFriendly(yearA, week)}
            </div>
            <div style="color: #FFC107; font-weight: 700;">
              Año ${yearA}: <b>${curveA[week - 1]}</b> fire_cell_days
            </div>
            <div style="color: #60A5FA; font-weight: 700;">
              Año ${yearB}: <b>${curveB[week - 1]}</b> fire_cell_days
            </div>
            <div style="color: #cbd5e1; font-size: 11px; margin-top: 4px; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 2px;">
              Media Climatológica: <b>${meanCurve[week - 1]}</b>
            </div>
          </div>
        `
      },
    },
    legend: {
      data: [`Año ${yearA}`, `Año ${yearB}`, 'Media Climatológica', 'Mediana (P50)'],
      bottom: 0,
      textStyle: { color: '#0B2D5B', fontSize: 11, fontWeight: 'bold' },
    },
    grid: {
      top: '25px',
      left: '45px',
      right: '25px',
      bottom: '50px',
    },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 52 }, (_, i) => `S${i + 1}`),
      boundaryGap: false,
      axisLabel: { interval: 3, fontSize: 10, color: '#64748b', fontWeight: 'bold' },
      axisLine: { lineStyle: { color: '#e2e8f0' } },
    },
    yAxis: {
      type: 'value',
      name: 'fire_cell_days',
      nameTextStyle: { fontSize: 10, color: '#0B2D5B', fontWeight: 'bold' },
      axisLabel: { fontSize: 10, color: '#64748b' },
      splitLine: { lineStyle: { color: '#f1f5f9' } },
    },
    series: [
      {
        name: `Año ${yearA}`,
        type: 'line',
        data: curveA,
        lineStyle: { color: '#E53935', width: 3 },
        itemStyle: { color: '#E53935' },
        symbol: 'circle',
        symbolSize: 5,
      },
      {
        name: `Año ${yearB}`,
        type: 'line',
        data: curveB,
        lineStyle: { color: '#0B2D5B', width: 3 },
        itemStyle: { color: '#0B2D5B' },
        symbol: 'diamond',
        symbolSize: 5,
      },
      {
        name: 'Media Climatológica',
        type: 'line',
        data: meanCurve,
        lineStyle: { color: '#64748B', width: 1.8, type: 'dashed' },
        symbol: 'none',
      },
      {
        name: 'Mediana (P50)',
        type: 'line',
        data: p50Curve,
        lineStyle: { color: '#94A3B8', width: 1.2, type: 'dotted' },
        symbol: 'none',
      },
    ],
  }

  const handleExportPNG = () => {
    if (chartRef.current) {
      const instance = chartRef.current.getEchartsInstance()
      exportChartToPNG(instance, `brasa_comparativa_${yearA}_vs_${yearB}`)
    }
  }

  return (
    <div className="space-y-6 py-6 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0B2D5B] tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FFF2E6] text-[#FF7900] flex items-center justify-center">
              <GitCompare className="w-5 h-5" />
            </div>
            <span>Comparación Histórica Interanual</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Contraste de regímenes de fuego en {selectedRegion?.name || 'Ecuador'}.
          </p>
        </div>

        {/* Selectores de Años */}
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#E53935] inline-block" />
            <span className="text-xs font-bold text-slate-600">Año A:</span>
            <select
              value={yearA}
              onChange={(e) => setYearA(Number(e.target.value))}
              className="bg-[#F4F6F9] rounded-xl px-2.5 py-1.5 text-xs font-black text-[#0B2D5B] border-0 focus:ring-2 focus:ring-[#E53935]"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y} {y === 2024 || y === 2012 ? '🔥' : ''}
                </option>
              ))}
            </select>
          </div>

          <span className="text-slate-300 font-black text-xs">vs</span>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#0B2D5B] inline-block" />
            <span className="text-xs font-bold text-slate-600">Año B:</span>
            <select
              value={yearB}
              onChange={(e) => setYearB(Number(e.target.value))}
              className="bg-[#F4F6F9] rounded-xl px-2.5 py-1.5 text-xs font-black text-[#0B2D5B] border-0 focus:ring-2 focus:ring-[#0B2D5B]"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y} {y === 2024 || y === 2012 ? '🔥' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tarjetas comparativas rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total acumulado */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Actividad Total Acumulada</span>
            <Flame className="w-4 h-4 text-[#FF7900]" />
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <div>
              <span className="text-xl font-black text-[#E53935]">{yearA}:</span>
              <span className="text-lg font-black ml-1 text-[#0B2D5B]">{totalA.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-xl font-black text-[#0B2D5B]">{yearB}:</span>
              <span className="text-lg font-black ml-1 text-slate-700">{totalB.toLocaleString()}</span>
            </div>
          </div>
          <div className="text-xs text-slate-500 pt-1 border-t border-slate-100 font-medium">
            Diferencia: <b className={diffPercent >= 0 ? 'text-[#E53935]' : 'text-[#0B2D5B]'}>{diffPercent > 0 ? `+${diffPercent}%` : `${diffPercent}%`}</b> en {yearA} respecto a {yearB}
          </div>
        </div>

        {/* Pico de temporada */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Semana Pico</span>
            <Calendar className="w-4 h-4 text-[#E53935]" />
          </div>
          <div className="text-xs font-bold pt-1 space-y-1">
            <div className="text-[#E53935]">
              {yearA}: <span className="text-[#0B2D5B]">{formatWeekFriendly(yearA, seasonA?.peak_week || 36)}</span>
            </div>
            <div className="text-[#0B2D5B]">
              {yearB}: <span className="text-slate-700">{formatWeekFriendly(yearB, seasonB?.peak_week || 36)}</span>
            </div>
          </div>
        </div>

        {/* Duración de la temporada */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Ventana de Temporada</span>
            <Clock className="w-4 h-4 text-[#FF7900]" />
          </div>
          <div className="text-xs font-medium space-y-1 pt-1">
            <div>
              <span className="font-bold text-[#E53935]">{yearA}:</span> Semanas {seasonA?.start_week || 28} a {seasonA?.end_week || 44}
            </div>
            <div>
              <span className="font-bold text-[#0B2D5B]">{yearB}:</span> Semanas {seasonB?.start_week || 28} a {seasonB?.end_week || 44}
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico comparativo de curvas */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
          <div>
            <h3 className="font-extrabold text-[#0B2D5B] text-base tracking-tight">
              Curvas de Actividad Semanal: {yearA} vs {yearB}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Serie armonizada expresada en fire_cell_days con referencia a la media y mediana histórica.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportPNG}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#0B2D5B] bg-[#F4F6F9] hover:bg-slate-200 rounded-xl transition-colors border border-slate-200/80 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-[#FF7900]" />
            <span>Descargar PNG</span>
          </button>
        </div>

        {isLoading ? (
          <ChartSkeleton height="h-80" />
        ) : (
          <div className="w-full h-[380px]">
            <ReactECharts
              ref={chartRef}
              option={option}
              style={{ height: '100%', width: '100%' }}
              opts={{ renderer: 'canvas' }}
            />
          </div>
        )}
      </div>

      {/* Tabla comparativa de temporadas históricas */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <h3 className="font-extrabold text-[#0B2D5B] text-base tracking-tight">
          Tabla de Métricas Estacionales
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Parámetro</th>
                <th className="py-2.5 px-3 text-[#E53935] font-black">Año {yearA}</th>
                <th className="py-2.5 px-3 text-[#0B2D5B] font-black">Año {yearB}</th>
                <th className="py-2.5 px-3">Diferencia / Contraste</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3 px-3 font-bold text-[#0B2D5B]">Total Acumulado</td>
                <td className="py-3 px-3 font-mono font-black text-[#E53935]">{totalA.toLocaleString()} fire_cell_days</td>
                <td className="py-3 px-3 font-mono font-black text-[#0B2D5B]">{totalB.toLocaleString()} fire_cell_days</td>
                <td className="py-3 px-3 font-extrabold text-slate-800">{diffPercent > 0 ? `+${diffPercent}%` : `${diffPercent}%`}</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-bold text-[#0B2D5B]">Inicio de Temporada</td>
                <td className="py-3 px-3 font-medium">Semana {seasonA?.start_week}</td>
                <td className="py-3 px-3 font-medium">Semana {seasonB?.start_week}</td>
                <td className="py-3 px-3 text-slate-500">{(seasonA?.start_week || 0) < (seasonB?.start_week || 0) ? 'Inicio anticipado en A' : 'Inicio similar'}</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-bold text-[#0B2D5B]">Semana Pico</td>
                <td className="py-3 px-3 font-bold text-[#E53935]">Semana {seasonA?.peak_week}</td>
                <td className="py-3 px-3 font-bold text-[#0B2D5B]">Semana {seasonB?.peak_week}</td>
                <td className="py-3 px-3 text-slate-500">Pico estacional andino (Agosto–Septiembre)</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-bold text-[#0B2D5B]">Fin de Temporada</td>
                <td className="py-3 px-3 font-medium">Semana {seasonA?.end_week}</td>
                <td className="py-3 px-3 font-medium">Semana {seasonB?.end_week}</td>
                <td className="py-3 px-3 text-slate-500">Transición al régimen húmedo</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
