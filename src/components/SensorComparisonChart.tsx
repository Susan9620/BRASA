import React, { useEffect, useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import type { BaseFilterParams, CalendarResponse } from '../types'
import { fetchCalendar } from '../api/client'
import { useFilters } from '../hooks/useFilters'
import { ChartSkeleton } from './SkeletonLoader'

const annualTotals = (calendar: CalendarResponse | null): Map<number, number> => {
  const totals = new Map<number, number>()
  calendar?.weeks.forEach((w) => totals.set(w.year, (totals.get(w.year) ?? 0) + w.value))
  return totals
}

/**
 * MODIS y VIIRS lado a lado (totales anuales). No se suman ni se presentan como una
 * serie armonizada: la API no aplica armonización y los sensores tienen resoluciones distintas.
 */
export const SensorComparisonChart: React.FC = () => {
  const { filters } = useFilters()
  const [data, setData] = useState<{ modis: CalendarResponse | null; viirs: CalendarResponse | null }>({
    modis: null,
    viirs: null,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const ac = new AbortController()
    const base: Omit<BaseFilterParams, 'sensor'> = {
      year_from: filters.yearRange[0],
      year_to: filters.yearRange[1],
      confidence: filters.confidence,
      daynight: filters.daynight,
      country_code: filters.countryCode,
      geojson: filters.customGeometry?.geojson,
    }

    setIsLoading(true)
    setError(false)
    Promise.all([fetchCalendar({ ...base, sensor: 'modis' }, ac.signal), fetchCalendar({ ...base, sensor: 'viirs' }, ac.signal)])
      .then(([modis, viirs]) => {
        setData({ modis, viirs })
        setIsLoading(false)
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return
        setError(true)
        setIsLoading(false)
      })

    return () => ac.abort()
  }, [filters.yearRange, filters.confidence, filters.daynight, filters.countryCode, filters.customGeometry?.geojson])

  const { years, modis, viirs, ratio, overlapLabel } = useMemo(() => {
    const m = annualTotals(data.modis)
    const v = annualTotals(data.viirs)
    const yrs = Array.from(new Set([...m.keys(), ...v.keys()])).sort((a, b) => a - b)
    const round = (n: number | undefined) => (n === undefined ? null : Math.round(n))

    // Años en que ambos sensores registran actividad: referencia de cuánto difieren
    const overlap = yrs.filter((y) => (m.get(y) ?? 0) > 0 && (v.get(y) ?? 0) > 0)
    const sumM = overlap.reduce((acc, y) => acc + (m.get(y) ?? 0), 0)
    const sumV = overlap.reduce((acc, y) => acc + (v.get(y) ?? 0), 0)

    return {
      years: yrs,
      modis: yrs.map((y) => round(m.get(y))),
      // Sin actividad VIIRS registrada = sin línea (aún no había datos del sensor)
      viirs: yrs.map((y) => ((v.get(y) ?? 0) > 0 ? round(v.get(y)) : null)),
      ratio: sumM > 0 && overlap.length ? sumV / sumM : null,
      overlapLabel: overlap.length ? `${overlap[0]}–${overlap[overlap.length - 1]}` : '',
    }
  }, [data])

  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(11, 27, 61, 0.96)',
      borderWidth: 0,
      textStyle: { color: '#ffffff', fontSize: 12 },
      valueFormatter: (v: number | null) => (v === null || v === undefined ? '—' : `${v.toLocaleString('es-EC')} fcd`),
    },
    legend: {
      data: ['MODIS (1 km)', 'VIIRS (375 m)'],
      bottom: 0,
      icon: 'roundRect',
      itemWidth: 14,
      itemHeight: 4,
      textStyle: { color: '#475569', fontSize: 12 },
    },
    grid: { top: 30, left: 56, right: 20, bottom: 48 },
    xAxis: {
      type: 'category',
      data: years.map(String),
      boundaryGap: false,
      axisLabel: { color: '#64748b', fontSize: 11, interval: 2 },
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      name: 'fcd / año',
      nameTextStyle: { color: '#94a3b8', fontSize: 11 },
      axisLabel: { color: '#64748b', fontSize: 11 },
      splitLine: { lineStyle: { color: '#f1f5f9' } },
    },
    series: [
      {
        name: 'MODIS (1 km)',
        type: 'line',
        data: modis,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { color: '#FF7900', width: 2.5 },
        itemStyle: { color: '#FF7900' },
      },
      {
        name: 'VIIRS (375 m)',
        type: 'line',
        data: viirs,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { color: '#3B82F6', width: 2.5 },
        itemStyle: { color: '#3B82F6' },
      },
    ],
  }

  return (
    <div className="bg-white rounded-[28px] p-6 sm:p-7 border border-slate-200/70">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#FF7900]">Sensores</p>
          <h3 className="mt-2 text-xl sm:text-2xl font-black tracking-tight text-[#0B1B3D]">MODIS y VIIRS, por separado</h3>
          <p className="mt-1 max-w-xl text-sm text-slate-500">
            Por su mayor resolución, VIIRS detecta más celdas activas. Sus series no se suman ni se comparan
            directamente: muestran tendencias, no cifras equivalentes.
          </p>
        </div>
        {ratio !== null && (
          <div className="sm:text-right">
            <p className="text-xs text-slate-400">VIIRS / MODIS {overlapLabel}</p>
            <p className="text-2xl font-black tracking-tight text-[#0B1B3D]">×{ratio.toFixed(1)}</p>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="mt-5">
          <ChartSkeleton height="h-72" />
        </div>
      ) : error ? (
        <p className="mt-8 py-10 text-center text-sm text-slate-400">No se pudo cargar la comparación por sensor.</p>
      ) : (
        <div className="mt-5 w-full h-[320px]">
          <ReactECharts option={option} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'canvas' }} />
        </div>
      )}
    </div>
  )
}
