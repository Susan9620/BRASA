// Cliente de API para BRASA - Conexión Backend / Modo Mock
// NASA Space Apps Challenge 2026 - Equipo CODE RED

import type {
  AnomaliesResponse,
  BaseFilterParams,
  CalendarResponse,
  ClimatologyResponse,
  CurrentStatusResponse,
  EvacuationRequestParams,
  EvacuationResponse,
  FireCastRequestParams,
  FireCastResponse,
  HotspotRequestParams,
  HotspotsResponse,
  RegionsResponse,
  SeasonResponse,
} from '../types'
import {
  mockGetAnomalies,
  mockGetCalendar,
  mockGetClimatology,
  mockGetCurrentStatus,
  mockGetEvacuationRoute,
  mockGetFireCast,
  mockGetHotspots,
  mockGetRegions,
  mockGetSeason,
} from './mock'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
// Por defecto SIEMPRE se usa la API real; el modo mock es opt-in explícito para desarrollo
// local sin backend (VITE_USE_MOCK=true), nunca el comportamiento implícito en producción.
export const IS_MOCK_MODE = String(import.meta.env.VITE_USE_MOCK).toLowerCase() === 'true'

// Utilidad para simular latencia de red mínima en modo mock (120ms)
function mockDelay<T>(data: T, delayMs: number = 120, signal?: AbortSignal): Promise<T> {
  if (delayMs <= 0) {
    if (signal?.aborted) {
      return Promise.reject(new DOMException('Aborted', 'AbortError'))
    }
    return Promise.resolve(data)
  }

  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      return reject(new DOMException('Aborted', 'AbortError'))
    }

    const timer = setTimeout(() => {
      if (signal?.aborted) {
        reject(new DOMException('Aborted', 'AbortError'))
      } else {
        resolve(data)
      }
    }, delayMs)

    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    })
  })
}

/**
 * Petición genérica al backend REST
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    throw new Error(
      `Error ${response.status} en ${endpoint}: ${response.statusText || errorBody || 'Fallo de red'}`
    )
  }

  return response.json()
}

/**
 * GET /api/regions
 */
export async function fetchRegions(signal?: AbortSignal): Promise<RegionsResponse> {
  if (IS_MOCK_MODE) {
    return mockDelay(mockGetRegions(), 80, signal)
  }
  return request<RegionsResponse>('/api/regions', { method: 'GET', signal })
}

/**
 * POST /api/calendar
 */
export async function fetchCalendar(
  params: BaseFilterParams,
  signal?: AbortSignal
): Promise<CalendarResponse> {
  if (IS_MOCK_MODE) {
    return mockDelay(mockGetCalendar(params), 180, signal)
  }
  return request<CalendarResponse>('/api/calendar', {
    method: 'POST',
    body: JSON.stringify(params),
    signal,
  })
}

/**
 * POST /api/climatology
 */
export async function fetchClimatology(
  params: BaseFilterParams,
  signal?: AbortSignal
): Promise<ClimatologyResponse> {
  if (IS_MOCK_MODE) {
    return mockDelay(mockGetClimatology(params), 150, signal)
  }
  return request<ClimatologyResponse>('/api/climatology', {
    method: 'POST',
    body: JSON.stringify(params),
    signal,
  })
}

/**
 * POST /api/season
 */
export async function fetchSeason(
  params: BaseFilterParams,
  signal?: AbortSignal
): Promise<SeasonResponse> {
  if (IS_MOCK_MODE) {
    return mockDelay(mockGetSeason(params), 140, signal)
  }
  return request<SeasonResponse>('/api/season', {
    method: 'POST',
    body: JSON.stringify(params),
    signal,
  })
}

/**
 * POST /api/anomalies
 */
export async function fetchAnomalies(
  params: BaseFilterParams,
  signal?: AbortSignal
): Promise<AnomaliesResponse> {
  if (IS_MOCK_MODE) {
    return mockDelay(mockGetAnomalies(params), 160, signal)
  }
  return request<AnomaliesResponse>('/api/anomalies', {
    method: 'POST',
    body: JSON.stringify(params),
    signal,
  })
}

/**
 * POST /api/hotspots
 */
export async function fetchHotspots(
  params: HotspotRequestParams,
  signal?: AbortSignal
): Promise<HotspotsResponse> {
  if (IS_MOCK_MODE) {
    return mockDelay(mockGetHotspots(params), 0, signal)
  }
  return request<HotspotsResponse>('/api/hotspots', {
    method: 'POST',
    body: JSON.stringify(params),
    signal,
  })
}

/**
 * POST /api/firecast
 * Simulación de propagación de incendio (6h/12h/24h) desde un punto de ignición.
 * No depende de brasa.db: usa viento/elevación en vivo. En modo mock, devuelve
 * un polígono de demostración (no corre el autómata celular real).
 */
export async function fetchFireCast(
  params: FireCastRequestParams,
  signal?: AbortSignal
): Promise<FireCastResponse> {
  if (IS_MOCK_MODE) {
    return mockDelay(mockGetFireCast(params), 900, signal)
  }
  return request<FireCastResponse>('/api/firecast', {
    method: 'POST',
    body: JSON.stringify(params),
    signal,
  })
}

/**
 * POST /api/evacuation-route
 * Ruta segura de evacuación (prototipo) desde la posición de un brigadista,
 * evitando la zona de propagación y el cono de humo del punto de ignición dado.
 */
export async function fetchEvacuationRoute(
  params: EvacuationRequestParams,
  signal?: AbortSignal
): Promise<EvacuationResponse> {
  if (IS_MOCK_MODE) {
    return mockDelay(mockGetEvacuationRoute(params), 700, signal)
  }
  return request<EvacuationResponse>('/api/evacuation-route', {
    method: 'POST',
    body: JSON.stringify(params),
    signal,
  })
}

/**
 * POST /api/current-status
 */
export async function fetchCurrentStatus(
  params: BaseFilterParams,
  signal?: AbortSignal
): Promise<CurrentStatusResponse> {
  if (IS_MOCK_MODE) {
    return mockDelay(mockGetCurrentStatus(params), 100, signal)
  }
  return request<CurrentStatusResponse>('/api/current-status', {
    method: 'POST',
    body: JSON.stringify(params),
    signal,
  })
}
