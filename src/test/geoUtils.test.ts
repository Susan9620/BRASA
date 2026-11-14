import { describe, it, expect } from 'vitest'
import { circleToPolygonGeoJSON, computeBoundingBox, formatCoordinates, latLngsToPolygonGeoJSON } from '../utils/geoUtils'

describe('geoUtils', () => {
  it('convierte un círculo a GeoJSON Polygon con coordenadas cerradas', () => {
    const polygon = circleToPolygonGeoJSON(-1.6709, -78.6545, 10000)
    expect(polygon.type).toBe('Polygon')
    expect(polygon.coordinates[0].length).toBeGreaterThan(10)
    // El primer punto debe ser idéntico al último para cerrar el polígono
    const first = polygon.coordinates[0][0]
    const last = polygon.coordinates[0][polygon.coordinates[0].length - 1]
    expect(first[0]).toBeCloseTo(last[0], 5)
    expect(first[1]).toBeCloseTo(last[1], 5)
  })

  it('calcula un BoundingBox a partir de coordenadas', () => {
    const coords: [number, number][] = [
      [-1.6, -78.6],
      [-1.7, -78.5],
      [-1.5, -78.7],
    ]
    const [minLon, minLat, maxLon, maxLat] = computeBoundingBox(coords)
    expect(minLat).toBe(-1.7)
    expect(maxLat).toBe(-1.5)
    expect(minLon).toBe(-78.7)
    expect(maxLon).toBe(-78.5)
  })

  it('formatea coordenadas con indicadores cardinales', () => {
    const text = formatCoordinates(-1.6709, -78.6545)
    expect(text).toContain('S')
    expect(text).toContain('O')
    expect(text).toContain('1.6709')
  })

  it('convierte lista de puntos latLng a GeoJSON Polygon', () => {
    const ring: [number, number][] = [
      [-1.6, -78.6],
      [-1.7, -78.5],
      [-1.5, -78.7],
    ]
    const geo = latLngsToPolygonGeoJSON(ring)
    expect(geo.type).toBe('Polygon')
    expect(geo.coordinates[0].length).toBe(4) // 3 puntos + cierre
  })
})
