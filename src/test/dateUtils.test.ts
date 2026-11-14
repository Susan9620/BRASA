import { describe, it, expect } from 'vitest'
import { getIsoWeekDateRange, formatWeekFriendly, getMonthForWeek, formatDateISO } from '../utils/dateUtils'

describe('dateUtils', () => {
  it('obtiene el rango de fechas para una semana ISO', () => {
    const range = getIsoWeekDateRange(2024, 36)
    expect(range.start).toBeInstanceOf(Date)
    expect(range.end).toBeInstanceOf(Date)
    expect(range.label).toBeDefined()
    expect(typeof range.label).toBe('string')
  })

  it('formatea texto amigable de semana', () => {
    const text = formatWeekFriendly(2024, 36)
    expect(text).toContain('Semana 36')
  })

  it('retorna mes correspondiente a la semana', () => {
    const month = getMonthForWeek(36)
    expect(typeof month).toBe('string')
    expect(month.length).toBeGreaterThan(0)
  })

  it('formatea fecha a string ISO', () => {
    const d = new Date(Date.UTC(2024, 8, 4))
    const formatted = formatDateISO(d)
    expect(formatted).toBe('2024-09-04')
  })
})
