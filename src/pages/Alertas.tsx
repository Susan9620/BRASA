import React from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ShieldAlert,
  Info,
  CheckCircle2,
  Flame,
  Activity,
  Gauge,
  HelpCircle,
  Compass,
  ArrowRight,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react'
import { useBrasaData } from '../hooks/useBrasaData'
import { useFilters } from '../hooks/useFilters'
import { formatWeekFriendly } from '../utils/dateUtils'
import { KpiCardSkeleton, ChartSkeleton } from '../components/SkeletonLoader'

export const Alertas: React.FC = () => {
  const { filters } = useFilters()
  const { currentStatus, climatology, regions, isLoading } = useBrasaData()

  const selectedRegion = regions?.find((r) => r.id === filters.provinceId) || regions?.[0]
  const selectedCanton = selectedRegion?.cantons?.find((c) => c.id === filters.cantonId)

  if (isLoading || !currentStatus) {
    return (
      <div className="space-y-6 py-6 px-4 sm:px-6 lg:px-8 max-w-[1680px] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCardSkeleton />
          <KpiCardSkeleton />
          <KpiCardSkeleton />
          <KpiCardSkeleton />
        </div>
        <ChartSkeleton height="h-96" />
      </div>
    )
  }

  const climWeek = climatology?.weeks.find((w) => w.week === currentStatus.week)

  // Configuración del Semáforo con paleta oficial de BRASA
  const trafficLightConfig = {
    normal: {
      colorName: 'Verde (Normal)',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-300',
      pillClass: 'bg-emerald-500',
      accentColor: '#10B981',
      title: 'Actividad Dentro de Rangos Climatológicos Típicos',
      explanation: `La actividad detectada de ${currentStatus.value} fire_cell_days se encuentra alineada con el promedio histórico (${climWeek?.mean || '—'}) para la semana ${currentStatus.week} en ${selectedRegion?.name}. El valor se mantiene dentro de los límites esperados (P10–P90) y no muestra desviación estadística anómala.`,
    },
    elevado: {
      colorName: 'Ámbar (Elevado)',
      badgeClass: 'bg-[#FFF9E6] text-[#B45309] border-[#FFC107]/50',
      pillClass: 'bg-[#FF7900]',
      accentColor: '#FF7900',
      title: 'Actividad Térmica Moderadamente Superior al Promedio',
      explanation: `Se observa un nivel de actividad de ${currentStatus.value} fire_cell_days, superando el percentil P70 respecto a la serie histórica 2001–2025 para la semana ${currentStatus.week} en ${selectedRegion?.name}. La densidad de pixeles térmicos activos excede la media climatológica (${climWeek?.mean || '—'}), sugiriendo condiciones secas persistentes o focos de quema concentrados.`,
    },
    inusual: {
      colorName: 'Rojo (Inusual)',
      badgeClass: 'bg-[#FDE8E8] text-[#E53935] border-[#E53935]/40',
      pillClass: 'bg-[#E53935]',
      accentColor: '#E53935',
      title: 'Anomalía Térmica Satelital Significativa (Extremo Histórico)',
      explanation: `La actividad registrada de ${currentStatus.value} fire_cell_days se posiciona en el percentil P${currentStatus.percentile} con una desviación de z-score de +${currentStatus.zscore}σ sobre la climatología regional para la semana ${currentStatus.week} en ${selectedRegion?.name}. Este nivel supera ampliamente el percentil P90 (${climWeek?.p90 || '—'}), reflejando una densidad de focos satelitales equiparable a las temporadas críticas de 2012 y 2024.`,
    },
  }[currentStatus.level]

  return (
    <div className="space-y-5 py-6 px-4 sm:px-6 lg:px-8 max-w-[1680px] mx-auto">
      {/* 1. Encabezado institucional idéntico a Explorar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#0B2D5B] tracking-tight">
            Alertas y Diagnóstico
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Área analizada:{' '}
            <strong className="text-slate-800 font-bold">
              {selectedCanton ? selectedCanton.name : 'Riobamba'} - {selectedRegion?.name || 'Chimborazo'}
            </strong>{' '}
            • {formatWeekFriendly(2024, currentStatus.week)}
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E8EEF5] text-[#0B2D5B] text-xs font-bold border border-slate-200 shadow-2xs self-start sm:self-auto">
          <Sparkles className="w-3.5 h-3.5 text-[#FF7900]" />
          <span>Semáforo Estadístico BRASA</span>
        </div>
      </div>

      {/* 2. Fila de 4 KPI Cards (idéntica a Explorar, con subtítulos en naranja de la marca) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Estado de esta semana */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 border-t-2 border-t-[#FF7900] shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            ESTADO DE ESTA SEMANA
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-black tracking-wider border ${trafficLightConfig.badgeClass}`}>
                {currentStatus.level.toUpperCase()}
              </span>
              <span className="text-xl font-black text-[#0B2D5B]">
                {currentStatus.value} <span className="text-xs font-semibold text-slate-400">fcd</span>
              </span>
            </div>
            <p className="text-xs font-bold text-[#FF7900] mt-1">
              Percentil P{currentStatus.percentile} • Z-Score: {currentStatus.zscore > 0 ? `+${currentStatus.zscore}` : currentStatus.zscore}σ
            </p>
          </div>
        </div>

        {/* KPI 2: Percentil histórico */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            PERCENTIL HISTÓRICO (2001–2025)
          </span>
          <div>
            <div className="text-2xl font-black text-[#0B2D5B] tracking-tight">
              P{currentStatus.percentile}
            </div>
            <p className="text-xs font-bold text-[#FF7900] mt-1">
              {currentStatus.percentile >= 90
                ? 'Supera el umbral P90 (Crítico)'
                : currentStatus.percentile >= 70
                ? 'Supera el percentil P70 (Elevado)'
                : 'Dentro del rango normal (P10–P70)'}
            </p>
          </div>
        </div>

        {/* KPI 3: Desviación Z-Score */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            DESVIACIÓN Z-SCORE
          </span>
          <div>
            <div className="text-2xl font-black text-[#0B2D5B] tracking-tight font-mono">
              {currentStatus.zscore > 0 ? `+${currentStatus.zscore.toFixed(2)}` : currentStatus.zscore.toFixed(2)}σ
            </div>
            <p className="text-xs font-bold text-[#FF7900] mt-1">
              {currentStatus.zscore >= 2.0
                ? 'Anomalía extrema (> +2.0σ)'
                : currentStatus.zscore >= 1.0
                ? 'Desviación moderada (+1.0σ a +2.0σ)'
                : 'Variabilidad típica (< +1.0σ)'}
            </p>
          </div>
        </div>

        {/* KPI 4: Climatología de referencia */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            MEDIA CLIMATOLÓGICA (SEM {currentStatus.week})
          </span>
          <div>
            <div className="text-2xl font-black text-[#0B2D5B] tracking-tight">
              {climWeek?.mean ?? '24.3'} <span className="text-xs font-semibold text-slate-400">fcd</span>
            </div>
            <p className="text-xs font-bold text-[#FF7900] mt-1">
              Umbral P90: {climWeek?.p90 ?? '68.2'} fire_cell_days
            </p>
          </div>
        </div>
      </div>

      {/* 3. Grid Principal de 2 Columnas (8 cols / 4 cols, igual que Explorar) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Columna Izquierda (8 cols): Semáforo Visual, Barras de distribución y Explicación automática */}
        <div className="lg:col-span-8 space-y-4">
          {/* Tarjeta Principal del Semáforo */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
            {/* Cabecera del Semáforo */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-4">
                {/* Caja de Semáforo físico con luces LED */}
                <div className="bg-[#071C3A] p-2.5 rounded-2xl border border-slate-700 shadow-md flex items-center gap-2.5 shrink-0">
                  {/* Luz Verde */}
                  <div
                    className={`w-5 h-5 rounded-full transition-all duration-300 ${
                      currentStatus.level === 'normal'
                        ? 'bg-emerald-400 shadow-lg shadow-emerald-400/80 ring-2 ring-white/70'
                        : 'bg-emerald-950/60 opacity-30'
                    }`}
                    title="Normal (Verde)"
                  />
                  {/* Luz Amarilla / Ámbar */}
                  <div
                    className={`w-5 h-5 rounded-full transition-all duration-300 ${
                      currentStatus.level === 'elevado'
                        ? 'bg-[#FFC107] shadow-lg shadow-[#FFC107]/80 ring-2 ring-white/70'
                        : 'bg-amber-950/60 opacity-30'
                    }`}
                    title="Elevado (Ámbar)"
                  />
                  {/* Luz Roja */}
                  <div
                    className={`w-5 h-5 rounded-full transition-all duration-300 ${
                      currentStatus.level === 'inusual'
                        ? 'bg-[#E53935] shadow-lg shadow-[#E53935]/80 ring-2 ring-white/70'
                        : 'bg-red-950/60 opacity-30'
                    }`}
                    title="Inusual (Rojo)"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider border ${trafficLightConfig.badgeClass}`}>
                      Nivel {currentStatus.level.toUpperCase()}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {trafficLightConfig.colorName}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-[#0B2D5B] mt-1">
                    {trafficLightConfig.title}
                  </h2>
                </div>
              </div>

              {/* Detección total */}
              <div className="sm:text-right sm:border-l sm:pl-6 border-slate-200">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Actividad Observada
                </span>
                <span className="text-2xl sm:text-3xl font-black text-[#0B2D5B]">
                  {currentStatus.value}
                </span>
                <span className="text-xs font-bold text-[#FF7900] block">
                  fire_cell_days
                </span>
              </div>
            </div>

            {/* Medidores Gráficos Cuantitativos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Medidor 1: Barra de Percentil */}
              <div className="bg-[#F4F6F9] p-4 rounded-xl border border-slate-200/70 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Gauge className="w-4 h-4 text-[#FF7900]" />
                    <span>Percentil Histórico (P{currentStatus.percentile})</span>
                  </span>
                  <span className="font-black text-[#0B2D5B]">
                    {currentStatus.percentile}%
                  </span>
                </div>

                {/* Barra de progreso con gradiente y marcador */}
                <div className="relative w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      currentStatus.percentile >= 90
                        ? 'bg-[#E53935]'
                        : currentStatus.percentile >= 70
                        ? 'bg-[#FF7900]'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, currentStatus.percentile)}%` }}
                  />
                </div>

                <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                  <span>P0 (Mínimo)</span>
                  <span>P50 (Mediana)</span>
                  <span className="text-[#FF7900]">P70</span>
                  <span className="text-[#E53935]">P90</span>
                  <span>P100</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  El {currentStatus.percentile}% de los registros históricos (2001–2025) para la semana {currentStatus.week} registraron menor o igual densidad de fuego.
                </p>
              </div>

              {/* Medidor 2: Espectro de Z-Score */}
              <div className="bg-[#F4F6F9] p-4 rounded-xl border border-slate-200/70 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-[#0B2D5B]" />
                    <span>Puntaje Normalizado (Z-Score)</span>
                  </span>
                  <span className="font-black text-[#E53935] font-mono text-sm">
                    {currentStatus.zscore > 0 ? `+${currentStatus.zscore.toFixed(2)}` : currentStatus.zscore.toFixed(2)}σ
                  </span>
                </div>

                {/* Escala graduada de Z-Score */}
                <div className="grid grid-cols-4 gap-1 text-[10px] font-mono font-bold text-center">
                  <div className={`p-1 rounded ${currentStatus.zscore < 1.0 ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-400' : 'bg-slate-200 text-slate-500'}`}>
                    &lt; +1.0σ
                  </div>
                  <div className={`p-1 rounded ${currentStatus.zscore >= 1.0 && currentStatus.zscore < 1.5 ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-400' : 'bg-slate-200 text-slate-500'}`}>
                    +1.0σ
                  </div>
                  <div className={`p-1 rounded ${currentStatus.zscore >= 1.5 && currentStatus.zscore < 2.0 ? 'bg-orange-100 text-orange-800 ring-1 ring-orange-400' : 'bg-slate-200 text-slate-500'}`}>
                    +1.5σ
                  </div>
                  <div className={`p-1 rounded ${currentStatus.zscore >= 2.0 ? 'bg-red-100 text-red-800 ring-1 ring-red-400 font-black' : 'bg-slate-200 text-slate-500'}`}>
                    &ge; +2.0σ
                  </div>
                </div>

                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>0σ (Media climatológica)</span>
                  <span className="font-bold text-[#E53935]">+3.35σ (Anomalía crítica)</span>
                </div>

                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Desviación expresada en múltiplos de desviación estándar frente al régimen climatológico semanal.
                </p>
              </div>
            </div>
          </div>

          {/* Diagnóstico Científico Automático (Explicación Contextual) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2.5">
            <div className="flex items-center gap-2 font-black text-[#0B2D5B] text-sm">
              <Info className="w-4 h-4 text-[#FF7900]" />
              <span>Diagnóstico Científico Automático</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-medium bg-[#F4F6F9] p-4 rounded-xl border border-slate-200/70">
              {trafficLightConfig.explanation}
            </p>
          </div>

          {/* Criterios Metodológicos de Clasificación */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="font-black text-[#0B2D5B] text-xs uppercase tracking-wider flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#FF7900]" />
              <span>Criterios de Clasificación del Semáforo BRASA</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/80 space-y-1.5">
                <div className="flex items-center gap-1.5 font-black text-emerald-800 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Normal</span>
                </div>
                <p className="text-[11px] text-emerald-900 font-medium leading-relaxed">
                  Z-score &lt; 1.0σ y percentil &lt; P70. Actividad dentro de la variabilidad estacional esperada.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#FFF9E6] border border-[#FFC107]/50 space-y-1.5">
                <div className="flex items-center gap-1.5 font-black text-[#B45309] text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Elevado</span>
                </div>
                <p className="text-[11px] text-slate-700 font-medium leading-relaxed">
                  Z-score entre 1.0σ y 2.0σ, o percentil entre P70 y P90. Incremento perceptible en recurrencia térmica.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#FDE8E8] border border-[#E53935]/40 space-y-1.5">
                <div className="flex items-center gap-1.5 font-black text-[#E53935] text-sm">
                  <Flame className="w-4 h-4" />
                  <span>Inusual</span>
                </div>
                <p className="text-[11px] text-slate-700 font-medium leading-relaxed">
                  Z-score &ge; 2.0σ o percentil &ge; P90. Desviación extrema equiparable a temporadas críticas (2012 / 2024).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha (4 cols): Aviso institucional, Contexto Territorial y Parámetros */}
        <div className="lg:col-span-4 space-y-4">
          {/* Aviso institucional obligatorio de la NASA */}
          <div
            role="alert"
            className="bg-[#FFF9E6] border border-[#FFC107]/60 rounded-2xl p-5 shadow-xs space-y-2 text-xs"
          >
            <div className="flex items-center gap-2 font-black text-[#FF7900] text-xs uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Aviso Científico y Limitación</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-700 font-medium">
              BRASA es una herramienta analítica desarrollada para el <strong>NASA Space Apps Challenge 2026</strong> con propósitos científicos, estadísticos y de exploración de datos satelitales.
            </p>
            <div className="p-2.5 rounded-xl bg-white/80 border border-[#FFC107]/40 text-[11px] font-bold text-[#0B2D5B] leading-snug">
              Los estados, percentiles y semáforos presentados <u>NO</u> constituyen alertas oficiales ni pronósticos de protección civil.
            </div>
          </div>

          {/* Contexto territorial de la consulta */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3 text-xs font-sans">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 font-black text-[#0B2D5B]">
                <MapPin className="w-4 h-4 text-[#FF7900]" />
                <span>Ubicación de Referencia</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8EEF5] text-[#0B2D5B]">
                Ecuador
              </span>
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Provincia:</span>
                <span className="font-bold text-[#0B2D5B]">{selectedRegion?.name || 'Chimborazo'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Ciudad / Cantón:</span>
                <span className="font-bold text-[#0B2D5B]">{selectedCanton ? selectedCanton.name : 'Riobamba'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Semana ISO:</span>
                <span className="font-bold text-[#FF7900]">Semana {currentStatus.week} (Año 2024)</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 font-medium">Sensores:</span>
                <span className="font-bold text-[#0B2D5B]">MODIS (1km) + VIIRS (375m)</span>
              </div>
            </div>

            {/* Parámetros estadísticos calculados */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                PARÁMETROS ESTADÍSTICOS
              </span>
              <div className="bg-[#F4F6F9] rounded-xl p-3 space-y-1.5 text-[11px] font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Media (Mean):</span>
                  <span className="font-bold text-[#0B2D5B]">{climWeek?.mean ?? '24.3'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Percentil 10 (P10):</span>
                  <span className="font-bold text-[#0B2D5B]">{climWeek?.p10 ?? '4.2'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Mediana (P50):</span>
                  <span className="font-bold text-[#0B2D5B]">{climWeek?.p50 ?? '18.7'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Percentil 90 (P90):</span>
                  <span className="font-bold text-[#E53935]">{climWeek?.p90 ?? '68.2'}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                  <span className="text-slate-600 font-bold">Valor actual:</span>
                  <span className="font-black text-[#FF7900]">{currentStatus.value} fcd</span>
                </div>
              </div>
            </div>

            {/* Botón de acceso directo a Explorar (idéntico al estilo de ANALIZAR ÁREA) */}
            <Link
              to="/explorar"
              className="w-full bg-[#FF7900] hover:bg-[#e06a00] text-white font-black py-3 rounded-xl shadow-md transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-2 group mt-2"
            >
              <Compass className="w-4 h-4" />
              <span>VER EN EL MAPA INTERACTIVO</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}