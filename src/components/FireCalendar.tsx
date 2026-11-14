import React, { useMemo, useRef, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { Calendar as CalendarIcon, Download, Play, Pause } from 'lucide-react'
import type { CalendarResponse, SourceType } from '../types'
import { ChartSkeleton } from './SkeletonLoader'
import { exportChartToPNG } from '../utils/exportUtils'
import { formatWeekFriendly } from '../utils/dateUtils'

interface FireCalendarProps {
  calendar: CalendarResponse | null
  isLoading: boolean
  selectedYear: number
  selectedWeek: number
  onSelectWeek: (year: number, week: number) => void
}

export const FireCalendar: React.FC<FireCalendarProps> = ({
  calendar,
  isLoading,
  selectedYear,
  selectedWeek,
  onSelectWeek,
}) => {
  const chartRef = useRef<ReactECharts>(null)
  const [isPlayingLocal, setIsPlayingLocal] = useState(false)
  const [speedLocal, setSpeedLocal] = useState('1x')

  const { years, weeks, heatmapData, sourceLookup, maxValue } = useMemo(() => {
    if (!calendar || calendar.weeks.length === 0) {
      return { years: [], weeks: [], heatmapData: [], sourceLookup: new Map(), maxValue: 100 }
    }

    const yearsSet = new Set<number>()
    const sourceMap = new Map<string, SourceType>()
    let max = 10

    calendar.weeks.forEach((item) => {
      yearsSet.add(item.year)
      sourceMap.set(`${item.year}-${item.week}`, item.source)
      if (item.value > max) max = item.value
    })

    // Años de 2001 a 2025
    const sortedYears = Array.from(yearsSet).sort((a, b) => a - b)
    const weeksList = Array.from({ length: 52 }, (_, i) => i + 1)

    const data: [number, number, number][] = []

    calendar.weeks.forEach((item) => {
      const yIndex = sortedYears.indexOf(item.year)
      const xIndex = item.week - 1
      if (yIndex !== -1 && xIndex >= 0 && xIndex < 52) {
        data.push([xIndex, yIndex, item.value])
      }
    })

    return {
      years: sortedYears,
      weeks: weeksList,
      heatmapData: data,
      sourceLookup: sourceMap,
      maxValue: Math.ceil(max),
    }
  }, [calendar])

  if (isLoading || !calendar) {
    return <ChartSkeleton height="h-96" />
  }

  // Configuración del Heatmap idéntica a la captura
  const option = {
    tooltip: {
      position: 'top',
      backgroundColor: '#071C3A',
      borderColor: '#FF7900',
      borderWidth: 1.5,
      padding: [10, 14],
      textStyle: { color: '#ffffff', fontSize: 12 },
      formatter: (params: { data: [number, number, number] }) => {
        const [wIndex, yIndex, value] = params.data
        const year = years[yIndex]
        const week = wIndex + 1
        const source = sourceLookup.get(`${year}-${week}`) || 'MODIS'

        const sourceLabels: Record<string, string> = {
          MODIS: 'MODIS (Terra/Aqua 1km)',
          BOTH: 'Armonizado (MODIS + VIIRS)',
          VIIRS_CAL: 'VIIRS Calibrado (375m)',
        }
        const sourceLabel = sourceLabels[source] || source

        return `
          <div style="font-family: inherit; line-height: 1.5;">
            <div style="font-weight: 800; color: #FF7900; font-size: 13px; margin-bottom: 4px;">
              Año ${year} — ${formatWeekFriendly(year, week)}
            </div>
            <div style="font-size: 12px; margin-bottom: 2px;">
              Actividad: <b style="color: #ffffff;">${value}</b> <span style="font-size: 11px; color: #94a3b8;">fire_cell_days</span>
            </div>
            <div style="font-size: 11px; color: #FFC107; margin-bottom: 4px;">
              Sensor: <b>${sourceLabel}</b>
            </div>
            <div style="font-size: 10px; color: #cbd5e1; border-top: 1px solid rgba(255,255,255,0.15); padding-top: 3px;">
              Clic para enfocar focos en el mapa
            </div>
          </div>
        `
      },
    },
    grid: {
      top: '10px',
      bottom: '30px',
      left: '46px',
      right: '20px',
    },
    xAxis: {
      type: 'category',
      data: weeks.map((w) => `S${w}`),
      splitArea: { show: false },
      axisLabel: {
        interval: 3,
        fontSize: 10,
        color: '#64748b',
        fontWeight: 'bold',
      },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'category',
      data: years.map(String),
      inverse: true, // 2025 en la parte superior, 2001 en la base como en el screenshot
      splitArea: { show: false },
      axisLabel: {
        fontSize: 10,
        color: '#64748b',
        fontWeight: 'bold',
        interval: 1, // Muestra años alternados (2025, 2023, 2021...) como en el screenshot
      },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    visualMap: {
      min: 0,
      max: maxValue,
      show: false, // El heatmap se colorea suavemente sin barra fija estorbosa
      inRange: {
        color: ['#FFFFFF', '#FFF9E6', '#FFD54F', '#FF7900', '#E53935', '#071C3A'],
      },
    },
    series: [
      {
        name: 'Actividad Satelital',
        type: 'heatmap',
        data: heatmapData,
        label: { show: false },
        itemStyle: {
          borderWidth: 0.5,
          borderColor: '#ffffff',
        },
        emphasis: {
          itemStyle: {
            borderColor: '#071C3A',
            borderWidth: 2,
            shadowBlur: 8,
            shadowColor: 'rgba(7, 28, 58, 0.4)',
          },
        },
      },
    ],
  }

  const handleChartClick = (params: { data: [number, number, number] }) => {
    if (params && params.data) {
      const [wIndex, yIndex] = params.data
      const year = years[yIndex]
      const week = wIndex + 1
      if (year && week) {
        onSelectWeek(year, week)
      }
    }
  }

  const handleExportPNG = () => {
    if (chartRef.current) {
      const instance = chartRef.current.getEchartsInstance()
      exportChartToPNG(instance, `brasa_calendario_incendios_${selectedYear}`)
    }
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
      {/* 1. Header idéntico a la captura */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#FFF2E6] text-[#FF7900] flex items-center justify-center shadow-2xs">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-black text-[#0B2D5B] text-base tracking-tight">
              Calendario Histórico de Actividad Satelital (2001–2025)
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Matriz anual en semanas ISO expresada en{' '}
              <span className="font-bold text-[#FF7900]">fire_cell_days</span>.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleExportPNG}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-[#F4F6F9] hover:bg-slate-200 rounded-xl transition-colors border border-slate-200 shadow-2xs"
          title="Descargar gráfico en PNG"
        >
          <Download className="w-3.5 h-3.5 text-[#FF7900]" />
          <span>Descargar PNG</span>
        </button>
      </div>

      {/* 2. Matriz Heatmap */}
      <div className="w-full h-[400px]">
        <ReactECharts
          ref={chartRef}
          option={option}
          style={{ height: '100%', width: '100%' }}
          onEvents={{ click: handleChartClick }}
          opts={{ renderer: 'canvas' }}
        />
      </div>

      {/* 3. Barra de reproducción inferior idéntica a la captura */}
      <div className="pt-2 border-t border-slate-100 space-y-1">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsPlayingLocal(!isPlayingLocal)}
            className="w-8 h-8 rounded-full bg-[#071C3A] hover:bg-[#0B2D5B] text-white flex items-center justify-center shadow-md shrink-0 transition-colors"
          >
            {isPlayingLocal ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
          </button>

          <input
            type="range"
            min={1}
            max={52}
            value={selectedWeek}
            onChange={(e) => onSelectWeek(selectedYear, Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#071C3A]"
          />

          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 shrink-0">
            <span>Velocidad</span>
            <select
              value={speedLocal}
              onChange={(e) => setSpeedLocal(e.target.value)}
              className="bg-[#F4F6F9] border border-slate-200 rounded-lg px-2 py-0.5 text-xs font-bold text-slate-700"
            >
              <option value="0.5x">0.5x</option>
              <option value="1x">1x</option>
              <option value="2x">2x</option>
            </select>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 font-semibold pl-11">
          Semana {selectedWeek} • {selectedYear}
        </p>
      </div>
    </div>
  )
}
