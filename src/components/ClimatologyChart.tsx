import React, { useRef, useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { Activity, Download } from 'lucide-react'
import type { CalendarResponse, ClimatologyResponse } from '../types'
import { ChartSkeleton } from './SkeletonLoader'
import { exportChartToPNG } from '../utils/exportUtils'
import { formatWeekFriendly } from '../utils/dateUtils'

interface ClimatologyChartProps {
  climatology: ClimatologyResponse | null
  calendar: CalendarResponse | null
  selectedYear: number
  selectedWeek: number
  isLoading: boolean
  onSelectWeek?: (week: number) => void
}

export const ClimatologyChart: React.FC<ClimatologyChartProps> = ({
  climatology,
  calendar,
  selectedYear,
  selectedWeek,
  isLoading,
  onSelectWeek,
}) => {
  const chartRef = useRef<ReactECharts>(null)

  const { weeksData, selectedYearData } = useMemo(() => {
    if (!climatology || !calendar) {
      return { weeksData: [], selectedYearData: [] }
    }

    const yearWeeks = calendar.weeks.filter((w) => w.year === selectedYear)
    const yearMap = new Map(yearWeeks.map((item) => [item.week, item.value]))

    const yearSeries: (number | null)[] = []
    for (let w = 1; w <= 52; w++) {
      yearSeries.push(yearMap.has(w) ? yearMap.get(w)! : null)
    }

    return {
      weeksData: climatology.weeks,
      selectedYearData: yearSeries,
    }
  }, [climatology, calendar, selectedYear])

  if (isLoading || !climatology) {
    return <ChartSkeleton height="h-80" />
  }

  const xAxisData = Array.from({ length: 52 }, (_, i) => `S${i + 1}`)
  const p10Data = weeksData.map((w) => w.p10)
  const p50Data = weeksData.map((w) => w.p50)
  const p90Data = weeksData.map((w) => w.p90)
  const meanData = weeksData.map((w) => w.mean)

  // Banda de dispersión P10 - P90
  const bandDiff = p90Data.map((p90, idx) => Math.max(0, p90 - p10Data[idx]))

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
        const wClim = weeksData[params[0].dataIndex]
        const currentYearVal = selectedYearData[params[0].dataIndex]

        return `
          <div style="font-family: inherit; line-height: 1.5; padding: 3px;">
            <div style="font-weight: 800; color: #FF7900; margin-bottom: 4px; font-size: 13px;">
              ${formatWeekFriendly(selectedYear, week)}
            </div>
            <div style="color: #ffffff; font-weight: 700;">
              Año ${selectedYear}: <span style="color: #FFC107;">${currentYearVal !== null ? currentYearVal : '—'}</span> fire_cell_days
            </div>
            <div style="border-top: 1px solid rgba(255,255,255,0.2); margin-top: 4px; padding-top: 4px; font-size: 11px; color: #cbd5e1;">
              <div>Media histórica: <b>${wClim?.mean ?? '—'}</b></div>
              <div>Mediana (P50): <b>${wClim?.p50 ?? '—'}</b></div>
              <div>Rango típico (P10–P90): <b>${wClim?.p10 ?? '—'} – ${wClim?.p90 ?? '—'}</b></div>
            </div>
          </div>
        `
      },
    },
    legend: {
      data: [`Año ${selectedYear}`, 'Media histórica', 'Mediana (P50)', 'Rango percentil (P10–P90)'],
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
      data: xAxisData,
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
        name: 'P10',
        type: 'line',
        data: p10Data,
        lineStyle: { opacity: 0 },
        stack: 'confidence-band',
        symbol: 'none',
      },
      {
        name: 'Rango percentil (P10–P90)',
        type: 'line',
        data: bandDiff,
        lineStyle: { opacity: 0 },
        areaStyle: {
          color: 'rgba(255, 121, 0, 0.14)',
        },
        stack: 'confidence-band',
        symbol: 'none',
      },
      {
        name: 'Mediana (P50)',
        type: 'line',
        data: p50Data,
        lineStyle: { color: '#94a3b8', width: 1.5, type: 'dashed' },
        symbol: 'none',
      },
      {
        name: 'Media histórica',
        type: 'line',
        data: meanData,
        lineStyle: { color: '#0B2D5B', width: 2.5 },
        itemStyle: { color: '#0B2D5B' },
        symbol: 'none',
      },
      {
        name: `Año ${selectedYear}`,
        type: 'line',
        data: selectedYearData,
        lineStyle: { color: '#E53935', width: 3 },
        itemStyle: { color: '#E53935' },
        symbolSize: 6,
        markPoint: {
          data: [
            {
              type: 'max',
              name: 'Pico del año',
              itemStyle: { color: '#E53935' },
            },
          ],
        },
        markLine: {
          silent: true,
          symbol: 'none',
          data: [
            {
              xAxis: `S${selectedWeek}`,
              lineStyle: { color: '#FF7900', width: 2, type: 'dotted' },
              label: {
                formatter: `S${selectedWeek}`,
                position: 'end',
                fontSize: 10,
                color: '#FF7900',
                fontWeight: 'bold',
              },
            },
          ],
        },
      },
    ],
  }

  const handleExportPNG = () => {
    if (chartRef.current) {
      const instance = chartRef.current.getEchartsInstance()
      exportChartToPNG(instance, `brasa_climatologia_${selectedYear}`)
    }
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#FFF2E6] text-[#FF7900] flex items-center justify-center shadow-2xs">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-[#0B2D5B] text-base tracking-tight">
              Climatología Semanal vs Año {selectedYear}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Banda percentil P10–P90, media en azul marino y año {selectedYear} en rojo.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleExportPNG}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#0B2D5B] bg-[#F4F6F9] hover:bg-slate-200 rounded-xl transition-colors border border-slate-200/80 shadow-2xs"
          title="Exportar gráfico de climatología a PNG"
        >
          <Download className="w-3.5 h-3.5 text-[#FF7900]" />
          <span>Descargar PNG</span>
        </button>
      </div>

      <div className="w-full h-[320px]">
        <ReactECharts
          ref={chartRef}
          option={option}
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'canvas' }}
          onEvents={{
            click: (params: { dataIndex: number }) => {
              if (onSelectWeek && typeof params.dataIndex === 'number') {
                onSelectWeek(params.dataIndex + 1)
              }
            },
          }}
        />
      </div>
    </div>
  )
}
