// Parámetros de cobertura de datos de la API mundial de BRASA.

/** Primer y último año con series disponibles en la API. */
export const DATA_YEAR_MIN = 2005
export const DATA_YEAR_MAX = 2025

/** País por defecto (ISO 3166-1 alfa-3). */
export const DEFAULT_COUNTRY = 'ECU'

/** Años disponibles en orden ascendente. */
export const DATA_YEARS = Array.from({ length: DATA_YEAR_MAX - DATA_YEAR_MIN + 1 }, (_, i) => DATA_YEAR_MIN + i)

/**
 * Etiquetas de sensor. La opción 'harmonized' de la API es la SUMA de MODIS y VIIRS,
 * no una armonización: se presenta como referencia y no como serie comparable.
 */
export const SENSOR_LABELS: Record<'modis' | 'viirs' | 'harmonized', string> = {
  modis: 'MODIS',
  viirs: 'VIIRS',
  harmonized: 'Ambos (suma)',
}
