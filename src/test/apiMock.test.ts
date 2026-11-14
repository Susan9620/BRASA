import { describe, it, expect } from 'vitest'
import {
  mockGetRegions,
  mockGetCalendar,
  mockGetClimatology,
  mockGetSeason,
  mockGetAnomalies,
  mockGetHotspots,
  mockGetCurrentStatus,
} from '../api/mock'
import type { BaseFilterParams } from '../types'

describe('API Mock determinista de BRASA', () => {
  const defaultParams: BaseFilterParams = {
    year_from: 2001,
    year_to: 2025,
    sensor: 'harmonized',
    confidence: 'nominal_high',
    daynight: 'all',
    province_id: 'chimborazo',
    canton_id: 'riobamba',
  }

  it('retorna las regiones de Ecuador incluyendo Chimborazo y Riobamba', () => {
    const regions = mockGetRegions()
    expect(regions.length).toBeGreaterThan(0)
    const chimborazo = regions.find((r) => r.id === 'chimborazo')
    expect(chimborazo).toBeDefined()
    expect(chimborazo?.cantons?.some((c) => c.id === 'riobamba')).toBe(true)
  })

  it('genera calendario histórico en unidad fire_cell_days con pico semanas 32-40', () => {
    const cal = mockGetCalendar(defaultParams)
    expect(cal.unit).toBe('fire_cell_days')
    expect(cal.weeks.length).toBe(25 * 52) // 2001 a 2025

    // Verificar que en 2024 la actividad en semana 36 sea mayor que en semana 15
    const week36 = cal.weeks.find((w) => w.year === 2024 && w.week === 36)?.value || 0
    const week15 = cal.weeks.find((w) => w.year === 2024 && w.week === 15)?.value || 0
    expect(week36).toBeGreaterThan(week15)
  })

  it('los años 2012 y 2024 registran mayor actividad que años típicos', () => {
    const season = mockGetSeason(defaultParams)
    const year2024 = season.years.find((y) => y.year === 2024)?.total || 0
    const year2012 = season.years.find((y) => y.year === 2012)?.total || 0
    const year2008 = season.years.find((y) => y.year === 2008)?.total || 0

    expect(year2024).toBeGreaterThan(year2008)
    expect(year2012).toBeGreaterThan(year2008)
  })

  it('calcula climatología con 52 semanas y percentiles consistentes', () => {
    const clim = mockGetClimatology(defaultParams)
    expect(clim.weeks.length).toBe(52)
    clim.weeks.forEach((w) => {
      expect(w.p10).toBeLessThanOrEqual(w.p50)
      expect(w.p50).toBeLessThanOrEqual(w.p90)
      expect(w.mean).toBeGreaterThan(0)
    })
  })

  it('retorna anomalías ordenadas por z-score descendente', () => {
    const anom = mockGetAnomalies(defaultParams)
    expect(anom.items.length).toBeGreaterThan(0)
    for (let i = 1; i < anom.items.length; i++) {
      expect(anom.items[i - 1].zscore).toBeGreaterThanOrEqual(anom.items[i].zscore)
    }
  })

  it('genera focos de calor proporcionales por FRP para la semana indicada', () => {
    const hotspots = mockGetHotspots({
      ...defaultParams,
      year: 2024,
      week: 36,
    })
    expect(hotspots.points.length).toBeGreaterThan(0)
    hotspots.points.forEach((pt) => {
      expect(pt.frp).toBeGreaterThan(0)
      expect(['MODIS', 'VIIRS']).toContain(pt.sensor)
      expect(pt.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(pt.lat).toBeLessThan(0) // Ecuador hemisferio sur para Chimborazo
    })
  })

  it('calcula el estado actual evaluando nivel normal, elevado o inusual', () => {
    const status = mockGetCurrentStatus(defaultParams)
    expect(['normal', 'elevado', 'inusual']).toContain(status.level)
    expect(status.percentile).toBeGreaterThan(0)
    expect(status.value).toBeGreaterThan(0)
  })
})
