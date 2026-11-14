// Utilidades geoespaciales para BRASA

/**
 * Convierte un centro [lat, lon] y radio en metros a un GeoJSON Polygon (aproximación en 32 vértices).
 */
export function circleToPolygonGeoJSON(
  centerLat: number,
  centerLon: number,
  radiusMeters: number,
  points: number = 32
): GeoJSON.Polygon {
  const coords: [number, number][] = []
  const earthRadius = 6378137 // Radio terrestre en metros

  const latRad = (centerLat * Math.PI) / 180
  const lonRad = (centerLon * Math.PI) / 180

  for (let i = 0; i <= points; i++) {
    const angle = (i * 2 * Math.PI) / points
    const dLat = (radiusMeters / earthRadius) * Math.cos(angle)
    const dLon = (radiusMeters / (earthRadius * Math.cos(latRad))) * Math.sin(angle)

    const pointLat = ((latRad + dLat) * 180) / Math.PI
    const pointLon = ((lonRad + dLon) * 180) / Math.PI

    coords.push([pointLon, pointLat]) // GeoJSON utiliza [lon, lat]
  }

  return {
    type: 'Polygon',
    coordinates: [coords],
  }
}

/**
 * Convierte una lista de coordenadas Leaflet [lat, lon] a un GeoJSON Polygon
 */
export function latLngsToPolygonGeoJSON(latLngs: [number, number][]): GeoJSON.Polygon {
  const ring = latLngs.map(([lat, lon]) => [lon, lat] as [number, number])
  if (ring.length > 0) {
    // Cerrar el polígono si no está cerrado
    const first = ring[0]
    const last = ring[ring.length - 1]
    if (first[0] !== last[0] || first[1] !== last[1]) {
      ring.push([first[0], first[1]])
    }
  }
  return {
    type: 'Polygon',
    coordinates: [ring],
  }
}

/**
 * Calcula un BoundingBox simplificado [minLon, minLat, maxLon, maxLat] a partir de coordenadas.
 */
export function computeBoundingBox(coords: [number, number][]): [number, number, number, number] {
  let minLat = Infinity
  let maxLat = -Infinity
  let minLon = Infinity
  let maxLon = -Infinity

  coords.forEach(([lat, lon]) => {
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
    if (lon < minLon) minLon = lon
    if (lon > maxLon) maxLon = lon
  })

  return [minLon, minLat, maxLon, maxLat]
}

/**
 * Formatea coordenadas para visualización en popups.
 */
export function formatCoordinates(lat: number, lon: number): string {
  const latStr = `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}`
  const lonStr = `${Math.abs(lon).toFixed(4)}° ${lon >= 0 ? 'E' : 'O'}`
  return `${latStr}, ${lonStr}`
}
