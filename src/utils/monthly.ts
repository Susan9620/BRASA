// Agregación mensual a partir de la serie semanal.
// Aproximación: cada semana ISO se asigna al mes de su jueves (regla ISO 8601).
// Cuando el backend entregue un endpoint mensual, reemplazar estas funciones por esa respuesta.

import type { AnomaliesResponse, CalendarResponse } from '../types'
import { getIsoWeekDateRange } from './dateUtils'

export const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
export const MONTHS_LONG = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

/** Mes (0–11) al que pertenece una semana ISO: el mes de su jueves. */
export function weekToMonth(year: number, week: number): number {
  const thursday = new Date(getIsoWeekDateRange(year, week).start)
  thursday.setUTCDate(thursday.getUTCDate() + 3)
  // Semanas cuyo jueves cae en el año siguiente/anterior se acotan al rango del año
  if (thursday.getUTCFullYear() > year) return 11
  if (thursday.getUTCFullYear() < year) return 0
  return thursday.getUTCMonth()
}

/** Primera semana ISO del año que pertenece al mes indicado. */
export function firstWeekOfMonth(year: number, month: number): number {
  for (let w = 1; w <= 52; w++) {
    if (weekToMonth(year, w) === month) return w
  }
  return 1
}

/** Totales mensuales de un año (null si el mes no tiene datos). */
export function monthlyTotals(calendar: CalendarResponse | null, year: number): (number | null)[] {
  const totals: (number | null)[] = Array(12).fill(null)
  calendar?.weeks
    .filter((w) => w.year === year)
    .forEach((w) => {
      const m = weekToMonth(year, w.week)
      totals[m] = (totals[m] ?? 0) + w.value
    })
  return totals.map((t) => (t === null ? null : Math.round(t * 10) / 10))
}

/** Promedio histórico de cada mes: media de los totales mensuales de todos los años con datos. */
export function monthlyHistoricalMean(calendar: CalendarResponse | null): (number | null)[] {
  if (!calendar) return Array(12).fill(null)
  const years = Array.from(new Set(calendar.weeks.map((w) => w.year)))
  const sums = Array(12).fill(0)
  const counts = Array(12).fill(0)
  years.forEach((y) => {
    monthlyTotals(calendar, y).forEach((t, m) => {
      if (t !== null) {
        sums[m] += t
        counts[m] += 1
      }
    })
  })
  return sums.map((s, m) => (counts[m] ? Math.round((s / counts[m]) * 10) / 10 : null))
}

/** Número de semanas marcadas como inusuales por el backend en cada mes de un año. */
export function anomaliesByMonth(anomalies: AnomaliesResponse | null, year: number): number[] {
  const counts = Array(12).fill(0)
  anomalies?.items.filter((a) => a.year === year).forEach((a) => (counts[weekToMonth(year, a.week)] += 1))
  return counts
}

/** Variación porcentual simple respecto a una referencia (null si no aplica). */
export function percentDiff(value: number | null, reference: number | null): number | null {
  if (value === null || reference === null || reference <= 0) return null
  return Math.round(((value - reference) / reference) * 100)
}

export const formatPercent = (p: number | null) => (p === null ? '—' : `${p > 0 ? '+' : ''}${p}%`)
