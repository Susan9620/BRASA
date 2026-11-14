// Utilidades de fechas ISO y formato para BRASA

/**
 * Obtiene el rango de fechas (inicio y fin) de una semana ISO en un año dado.
 */
export function getIsoWeekDateRange(year: number, week: number): { start: Date; end: Date; label: string } {
  // 4 de enero siempre está en la semana 1 según ISO 8601
  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7))
  const dow = simple.getUTCDay()
  const isoWeekStart = simple
  if (dow <= 4) {
    isoWeekStart.setUTCDate(simple.getUTCDate() - simple.getUTCDay() + 1)
  } else {
    isoWeekStart.setUTCDate(simple.getUTCDate() + 8 - simple.getUTCDay())
  }

  const isoWeekEnd = new Date(isoWeekStart)
  isoWeekEnd.setUTCDate(isoWeekStart.getUTCDate() + 6)

  const monthNames = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ]

  const startDay = isoWeekStart.getUTCDate()
  const startMonth = monthNames[isoWeekStart.getUTCMonth()]
  const endDay = isoWeekEnd.getUTCDate()
  const endMonth = monthNames[isoWeekEnd.getUTCMonth()]

  const label = startMonth === endMonth
    ? `${startDay} - ${endDay} ${startMonth}`
    : `${startDay} ${startMonth} - ${endDay} ${endMonth}`

  return { start: isoWeekStart, end: isoWeekEnd, label }
}

/**
 * Formatea un número de semana en texto amigable.
 * Ej: "Semana 35 (26 Ago - 01 Sep)"
 */
export function formatWeekFriendly(year: number, week: number): string {
  const { label } = getIsoWeekDateRange(year, week)
  return `Semana ${week} (${label})`
}

/**
 * Retorna el nombre del mes aproximado para una semana ISO.
 */
export function getMonthForWeek(week: number): string {
  const dayOfYear = (week - 1) * 7 + 3.5
  const date = new Date(2024, 0, dayOfYear)
  return date.toLocaleString('es-EC', { month: 'short' })
}

/**
 * Convierte un objeto Date a string YYYY-MM-DD
 */
export function formatDateISO(d: Date): string {
  return d.toISOString().split('T')[0]
}
