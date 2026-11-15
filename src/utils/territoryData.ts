// Catálogo de Territorios Jerárquicos: País -> Provincia -> Ciudad / Cantón
// Para BRASA - NASA Space Apps Challenge 2026
import type { Canton, CountryItem, Region } from '../types'
import { MOCK_REGIONS } from '../api/mock'

export const COUNTRIES: CountryItem[] = [
  { code: 'ECU', name: 'Ecuador 🇪🇨', lat: -1.8312, lon: -78.1834, zoom: 7 },
  { code: 'COL', name: 'Colombia 🇨🇴', lat: 4.5709, lon: -74.2973, zoom: 6 },
  { code: 'PER', name: 'Perú 🇵🇪', lat: -9.19, lon: -75.0152, zoom: 6 },
  { code: 'BRA', name: 'Brasil 🇧🇷', lat: -14.235, lon: -51.9253, zoom: 5 },
  { code: 'BOL', name: 'Bolivia 🇧🇴', lat: -16.2902, lon: -63.5887, zoom: 6 },
  { code: 'CHL', name: 'Chile 🇨🇱', lat: -35.6751, lon: -71.543, zoom: 5 },
  { code: 'ARG', name: 'Argentina 🇦🇷', lat: -38.4161, lon: -63.6167, zoom: 5 },
  { code: 'MEX', name: 'México 🇲🇽', lat: 23.6345, lon: -102.5528, zoom: 5 },
  { code: 'USA', name: 'Estados Unidos 🇺🇸', lat: 37.0902, lon: -95.7129, zoom: 4 },
  { code: 'ESP', name: 'España 🇪🇸', lat: 40.4637, lon: -3.7492, zoom: 6 },
  { code: 'CAN', name: 'Canadá 🇨🇦', lat: 56.1304, lon: -106.3468, zoom: 4 },
]

// Provincias adicionales de Ecuador para completar cobertura nacional
const ECUADOR_PROVINCES_EXTRA: Region[] = [
  {
    id: 'tungurahua',
    name: 'Tungurahua',
    center: [-1.2491, -78.6268],
    zoom: 10,
    cantons: [
      { id: 'ambato', name: 'Ambato', lat: -1.2491, lon: -78.6268 },
      { id: 'banos', name: 'Baños de Agua Santa', lat: -1.3964, lon: -78.4247 },
      { id: 'pelileo', name: 'Pelileo', lat: -1.3308, lon: -78.5442 },
      { id: 'pillaro', name: 'Píllaro', lat: -1.1736, lon: -78.5375 },
    ],
    geojson: { type: 'Polygon', coordinates: [[[-78.8, -1.1], [-78.3, -1.2], [-78.3, -1.5], [-78.8, -1.4], [-78.8, -1.1]]] },
  },
  {
    id: 'cotopaxi',
    name: 'Cotopaxi',
    center: [-0.9333, -78.6167],
    zoom: 10,
    cantons: [
      { id: 'latacunga', name: 'Latacunga', lat: -0.9333, lon: -78.6167 },
      { id: 'salcedo', name: 'Salcedo', lat: -1.0456, lon: -78.5906 },
      { id: 'pujili', name: 'Pujilí', lat: -0.9575, lon: -78.6967 },
      { id: 'saquisili', name: 'Saquisilí', lat: -0.8383, lon: -78.6664 },
    ],
    geojson: { type: 'Polygon', coordinates: [[[-78.9, -0.6], [-78.3, -0.7], [-78.4, -1.2], [-79.0, -1.1], [-78.9, -0.6]]] },
  },
  {
    id: 'manabi',
    name: 'Manabí',
    center: [-1.0546, -80.4545],
    zoom: 9,
    cantons: [
      { id: 'portoviejo', name: 'Portoviejo', lat: -1.0546, lon: -80.4545 },
      { id: 'manta', name: 'Manta', lat: -0.9677, lon: -80.7089 },
      { id: 'chone', name: 'Chone', lat: -0.6981, lon: -80.0936 },
      { id: 'montecristi', name: 'Montecristi', lat: -1.0456, lon: -80.6589 },
    ],
    geojson: { type: 'Polygon', coordinates: [[[-80.8, -0.1], [-80.0, -0.2], [-80.0, -1.7], [-80.8, -1.6], [-80.8, -0.1]]] },
  },
  {
    id: 'carchi',
    name: 'Carchi',
    center: [0.8122, -77.7173],
    zoom: 10,
    cantons: [
      { id: 'tulcan', name: 'Tulcán', lat: 0.8122, lon: -77.7173 },
      { id: 'montufar', name: 'Montúfar (San Gabriel)', lat: 0.6019, lon: -77.8286 },
      { id: 'espejo', name: 'Espejo (El Ángel)', lat: 0.6247, lon: -77.9392 },
      { id: 'mira', name: 'Mira', lat: 0.5514, lon: -78.0408 },
    ],
    geojson: { type: 'Polygon', coordinates: [[[-78.3, 1.2], [-77.5, 0.9], [-77.6, 0.4], [-78.3, 0.5], [-78.3, 1.2]]] },
  },
  {
    id: 'loja',
    name: 'Loja',
    center: [-3.9931, -79.2042],
    zoom: 9,
    cantons: [
      { id: 'loja', name: 'Loja', lat: -3.9931, lon: -79.2042 },
      { id: 'catamayo', name: 'Catamayo', lat: -3.98, lon: -79.35 },
      { id: 'calvas', name: 'Calvas (Cariamanga)', lat: -4.32, lon: -79.55 },
    ],
    geojson: { type: 'Polygon', coordinates: [[[-79.8, -3.4], [-79.0, -3.5], [-79.1, -4.6], [-79.9, -4.5], [-79.8, -3.4]]] },
  },
  {
    id: 'el_oro',
    name: 'El Oro',
    center: [-3.2586, -79.9554],
    zoom: 10,
    cantons: [
      { id: 'machala', name: 'Machala', lat: -3.2586, lon: -79.9554 },
      { id: 'pasaje', name: 'Pasaje', lat: -3.3256, lon: -79.8067 },
      { id: 'santa_rosa', name: 'Santa Rosa', lat: -3.4486, lon: -79.9594 },
    ],
    geojson: { type: 'Polygon', coordinates: [[[-80.2, -3.1], [-79.5, -3.2], [-79.6, -3.9], [-80.2, -3.7], [-80.2, -3.1]]] },
  },
  {
    id: 'napo',
    name: 'Napo',
    center: [-0.9938, -77.8129],
    zoom: 9,
    cantons: [
      { id: 'tena', name: 'Tena', lat: -0.9938, lon: -77.8129 },
      { id: 'archidona', name: 'Archidona', lat: -0.9103, lon: -77.8081 },
      { id: 'quijos', name: 'Quijos (Baeza)', lat: -0.4636, lon: -77.8906 },
    ],
    geojson: { type: 'Polygon', coordinates: [[[-78.4, -0.2], [-77.4, -0.4], [-77.5, -1.5], [-78.4, -1.2], [-78.4, -0.2]]] },
  },
  {
    id: 'galapagos',
    name: 'Galápagos',
    center: [-0.7402, -90.3138],
    zoom: 8,
    cantons: [
      { id: 'san_cristobal', name: 'San Cristóbal', lat: -0.9022, lon: -89.6097 },
      { id: 'santa_cruz', name: 'Santa Cruz (Pto. Ayora)', lat: -0.7402, lon: -90.3138 },
      { id: 'isabela', name: 'Isabela (Pto. Villamil)', lat: -0.9556, lon: -90.9667 },
    ],
    geojson: { type: 'Polygon', coordinates: [[[-91.5, 0.5], [-89.2, 0.4], [-89.3, -1.6], [-91.6, -1.4], [-91.5, 0.5]]] },
  },
]

// Fusión de todas las provincias de Ecuador sin duplicar IDs
export const ECUADOR_PROVINCES: Region[] = (() => {
  const map = new Map<string, Region>()
  MOCK_REGIONS.forEach((r) => map.set(r.id, r))
  ECUADOR_PROVINCES_EXTRA.forEach((r) => {
    if (!map.has(r.id)) map.set(r.id, r)
  })
  return Array.from(map.values())
})()

// Provincias / Regiones sintéticas para países internacionales
const INTERNATIONAL_REGIONS: Record<string, Region[]> = {
  COL: [
    {
      id: 'bogota_dc',
      name: 'Bogotá D.C.',
      center: [4.711, -74.0721],
      zoom: 11,
      cantons: [
        { id: 'bogota', name: 'Bogotá', lat: 4.711, lon: -74.0721 },
        { id: 'soacha', name: 'Soacha', lat: 4.5806, lon: -74.2181 },
      ],
      geojson: { type: 'Polygon', coordinates: [[[-74.3, 4.4], [-73.9, 4.4], [-73.9, 4.9], [-74.3, 4.9], [-74.3, 4.4]]] },
    },
    {
      id: 'antioquia',
      name: 'Antioquia',
      center: [6.2442, -75.5812],
      zoom: 10,
      cantons: [
        { id: 'medellin', name: 'Medellín', lat: 6.2442, lon: -75.5812 },
        { id: 'bello', name: 'Bello', lat: 6.3333, lon: -75.5667 },
      ],
      geojson: { type: 'Polygon', coordinates: [[[-76.5, 5.5], [-74.5, 5.5], [-74.5, 8.5], [-76.5, 8.5], [-76.5, 5.5]]] },
    },
    {
      id: 'valle_cauca',
      name: 'Valle del Cauca',
      center: [3.4516, -76.532],
      zoom: 10,
      cantons: [
        { id: 'cali', name: 'Cali', lat: 3.4516, lon: -76.532 },
        { id: 'palmira', name: 'Palmira', lat: 3.5394, lon: -76.3036 },
      ],
      geojson: { type: 'Polygon', coordinates: [[[-77.5, 3.0], [-75.8, 3.0], [-75.8, 5.0], [-77.5, 5.0], [-77.5, 3.0]]] },
    },
  ],
  PER: [
    {
      id: 'lima',
      name: 'Lima',
      center: [-12.0464, -77.0428],
      zoom: 10,
      cantons: [
        { id: 'lima_centro', name: 'Lima Centro', lat: -12.0464, lon: -77.0428 },
        { id: 'callao', name: 'Callao', lat: -12.0566, lon: -77.1181 },
      ],
      geojson: { type: 'Polygon', coordinates: [[[-77.5, -11.5], [-76.5, -11.5], [-76.5, -12.6], [-77.5, -12.6], [-77.5, -11.5]]] },
    },
    {
      id: 'cusco',
      name: 'Cusco',
      center: [-13.5319, -71.9675],
      zoom: 10,
      cantons: [
        { id: 'cusco_ciudad', name: 'Cusco', lat: -13.5319, lon: -71.9675 },
        { id: 'urubamba', name: 'Urubamba', lat: -13.3056, lon: -72.1167 },
      ],
      geojson: { type: 'Polygon', coordinates: [[[-73.5, -12.5], [-70.5, -12.5], [-70.5, -15.0], [-73.5, -15.0], [-73.5, -12.5]]] },
    },
  ],
}

/**
 * Obtiene las provincias / subdivisiones disponibles para un país
 */
export function getProvincesForCountry(countryCode: string): Region[] {
  if (countryCode === 'ECU') {
    return ECUADOR_PROVINCES
  }
  if (INTERNATIONAL_REGIONS[countryCode]) {
    return INTERNATIONAL_REGIONS[countryCode]
  }

  // Fallback genérico para cualquier otro país internacional
  const country = COUNTRIES.find((c) => c.code === countryCode)
  const center: [number, number] = country ? [country.lat, country.lon] : [0, 0]
  return [
    {
      id: `${countryCode.toLowerCase()}_general`,
      name: `(Todo el país - ${country?.name.split(' ')[0] || countryCode})`,
      center,
      zoom: country?.zoom || 5,
      cantons: [
        {
          id: `${countryCode.toLowerCase()}_capital`,
          name: `Territorio Nacional (${country?.name.split(' ')[0] || countryCode})`,
          lat: center[0],
          lon: center[1],
        },
      ],
      geojson: {
        type: 'Polygon',
        coordinates: [
          [
            [center[1] - 1.5, center[0] - 1.5],
            [center[1] + 1.5, center[0] - 1.5],
            [center[1] + 1.5, center[0] + 1.5],
            [center[1] - 1.5, center[0] + 1.5],
            [center[1] - 1.5, center[0] - 1.5],
          ],
        ],
      },
    },
  ]
}

/**
 * Obtiene los cantones o ciudades de una provincia
 */
export function getCantonsForProvince(countryCode: string, provinceId: string): Canton[] {
  const provinces = getProvincesForCountry(countryCode)
  const match = provinces.find((p) => p.id === provinceId)
  return match?.cantons || []
}
