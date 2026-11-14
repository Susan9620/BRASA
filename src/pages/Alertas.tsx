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
  Sparkles,
} from 'lucide-react'
import { useBrasaData } from '../hooks/useBrasaData'
import { useFilters } from '../hooks/useFilters'
import { formatWeekFriendly } from '../utils/dateUtils'
import { KpiCardSkeleton, ChartSkeleton } from '../components/SkeletonLoader'
import { ClimatologyChart } from '../components/ClimatologyChart'
import { AnomalyList } from '../components/AnomalyList'

export const Alertas: React.FC = () => {
  const { filters, selectedWeek, setSelectedWeek, setSelectedYear } = useFilters()
  const { currentStatus, climatology, calendar, anomalies, regions, isLoading } = useBrasaData()

  const selectedRegion = regions?.find((r) => r.id === filters.provinceId) || regions?.[0]
  const selectedCanton = selectedRegion?.cantons?.find((c) => c.id === filters.cantonId)

  const handleSelectAnomaly = (year: number, week: number) => {
    setSelectedYear(year)
    setSelectedWeek(week)
  }

  if (isLoading || !currentStatus) {
    return (
      <div className="space-y-6 py-6 px-4 sm:px-6 lg:px-8 max-w-[1680px] mx-auto">
        <div className="h-48 bg-slate-200 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCardSkeleton />
          <KpiCardSkeleton />
          <KpiCardSkeleton />
          <KpiCardSkeleton />
        </div>
        <ChartSkeleton height="h-80" />
      </div>
    )
  }

  const climWeek = climatology?.weeks.find((w) => w.week === currentStatus.week)

  const trafficLightConfig = {
    normal: {
      colorName: 'Verde — Normal',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-300',
      heroBg: 'from-emerald-900 to-[#071C3A]',
      heroBorder: 'border-emerald-500/30',
      heroAccent: 'text-emerald-400',
      heroPill: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      barColor: 'bg-emerald-500',
      Icon: CheckCircle2,
      title: 'Actividad Dentro de Rangos Climatológicos Típicos',
      explanation: `La actividad detectada de ${currentStatus.value} fire_cell_days se encuentra alineada con el promedio histórico (${climWeek?.mean ?? '—'}) para la semana ${currentStatus.week} en ${selectedRegion?.name ?? 'la región'}. El valor se mantiene dentro de los límites esperados (P10–P90) y no muestra desviación estadística anómala.`,
    },
    elevado: {
      colorName: 'Ámbar — Elevado',
      badgeClass: 'bg-[#FFF9E6] text-[#B45309] border-[#FFC107]/50',
      heroBg: 'from-amber-900 to-[#071C3A]',
      heroBorder: 'border-amber-500/30',
      heroAccent: 'text-amber-400',
      heroPill: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      barColor: 'bg-[#FF7900]',
      Icon: AlertTriangle,
      title: 'Actividad Térmica Moderadamente Superior al Promedio',
      explanation: `Se observa un nivel de actividad de ${currentStatus.value} fire_cell_days, superando el percentil P70 respecto a la serie histórica 2001–2025 para la semana ${currentStatus.week} en ${selectedRegion?.name ?? 'la región'}. La densidad de pixeles térmicos activos excede la media climatológica (${climWeek?.mean ?? '—'}), sugiriendo condiciones secas persistentes o focos de quema concentrados.`,
    },
    inusual: {
      colorName: 'Rojo — Inusual',
      badgeClass: 'bg-[#FDE8E8] text-[#E53935] border-[#E53935]/40',
      heroBg: 'from-red-900 to-[#071C3A]',
      heroBorder: 'border-red-500/30',
      heroAccent: 'text-red-400',
      heroPill: 'bg-red-500/20 text-red-300 border-red-500/40',
      barColor: 'bg-[#E53935]',
      Icon: Flame,
      title: 'Anomalía Térmica Satelital Significativa — Extremo Histórico',
      explanation: `La actividad registrada de ${currentStatus.value} fire_cell_days se posiciona en el percentil P${currentStatus.percentile} con una desviación de z-score de +${currentStatus.zscore}σ sobre la climatología regional para la semana ${currentStatus.week} en ${selectedRegion?.name ?? 'la región'}. Este nivel supera ampliamente el percentil P90 (${climWeek?.p90 ?? '—'}), reflejando una densidad de focos satelitales equiparable a las temporadas críticas de 2012 y 2024.`,
    },
  }[currentStatus.level]

  const StatusIcon = trafficLightConfig.Icon

  return (
    <div className="space-y-6 py-6 px-4 sm:px-6 lg:px-8 max-w-[1680px] mx-auto">

      {/* ══════════════════════════════════════════════
          HERO BANNER — estado actual prominente
          Mismo estilo que la sección "Misión" de AboutTeam
          ══════════════════════════════════════════════ */}
      <section className={`bg-gradient-to-br ${trafficLightConfig.heroBg} rounded-3xl p-7 sm:p-10 shadow-xl border ${trafficLightConfig.heroBorder}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">

          {/* Izquierda: identidad + título */}
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold ${trafficLightConfig.heroPill}`}>
                <Sparkles className="w-3.5 h-3.5" />
                Semáforo Estadístico BRASA
              </span>
              <span className="text-slate-400 text-xs font-medium">
                {selectedCanton ? selectedCanton.name : 'Riobamba'} · {selectedRegion?.name ?? 'Chimborazo'} · {formatWeekFriendly(2024, currentStatus.week)}
              </span>
            </div>

            <div className="flex items-start gap-4">
              {/* Semáforo LED */}
              <div className="bg-[#040D1F] p-3 rounded-2xl border border-white/10 shadow-lg flex flex-col items-center gap-2 shrink-0">
                <div className={`w-5 h-5 rounded-full transition-all duration-300 ${currentStatus.level === 'normal' ? 'bg-emerald-400 shadow-lg shadow-emerald-400/80 ring-2 ring-white/60' : 'bg-emerald-950/60 opacity-25'}`} />
                <div className={`w-5 h-5 rounded-full transition-all duration-300 ${currentStatus.level === 'elevado' ? 'bg-[#FFC107] shadow-lg shadow-amber-400/80 ring-2 ring-white/60' : 'bg-amber-950/60 opacity-25'}`} />
                <div className={`w-5 h-5 rounded-full transition-all duration-300 ${currentStatus.level === 'inusual' ? 'bg-[#E53935] shadow-lg shadow-red-500/80 ring-2 ring-white/60' : 'bg-red-950/60 opacity-25'}`} />
              </div>

              <div>
                <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${trafficLightConfig.heroAccent}`}>
                  {trafficLightConfig.colorName}
                </p>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight">
                  {trafficLightConfig.title}
                </h1>
                <p className="text-slate-300 text-sm font-medium mt-2 leading-relaxed max-w-xl">
                  {trafficLightConfig.explanation}
                </p>
              </div>
            </div>
          </div>

          {/* Derecha: métricas clave en grande */}
          <div className="flex flex-row lg:flex-col gap-4 lg:gap-3 lg:items-end shrink-0">
            <div className="text-center bg-white/5 border border-white/10 rounded-2xl px-6 py-4 backdrop-blur-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">Actividad</span>
              <span className="text-4xl font-black text-white leading-none">{currentStatus.value}</span>
              <span className={`text-xs font-bold block mt-1 ${trafficLightConfig.heroAccent}`}>fire_cell_days</span>
            </div>
            <div className="text-center bg-white/5 border border-white/10 rounded-2xl px-6 py-4 backdrop-blur-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">Percentil</span>
              <span className="text-4xl font-black text-white leading-none">P{currentStatus.percentile}</span>
              <span className={`text-xs font-bold font-mono block mt-1 ${trafficLightConfig.heroAccent}`}>
                Z = {currentStatus.zscore > 0 ? `+${currentStatus.zscore.toFixed(2)}` : currentStatus.zscore.toFixed(2)}σ
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          4 KPI CARDS — mismo patrón que KpiCards.tsx
          ══════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* KPI 1 — acento naranja como en KpiCards.tsx */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 border-t-2 border-t-[#FF7900] shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">ESTADO SEMANA ACTUAL</span>
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-md text-[11px] font-black tracking-wider border ${trafficLightConfig.badgeClass}`}>
                {currentStatus.level.toUpperCase()}
              </span>
              <span className="text-xl font-black text-[#0B2D5B]">
                {currentStatus.value} <span className="text-xs font-semibold text-slate-400">fcd</span>
              </span>
            </div>
            <p className="text-xs font-bold text-[#FF7900] mt-1">
              Percentil P{currentStatus.percentile} · Z-Score: {currentStatus.zscore > 0 ? `+${currentStatus.zscore}` : currentStatus.zscore}σ
            </p>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">PERCENTIL HISTÓRICO (2001–2025)</span>
          <div>
            <div className="text-2xl font-black text-[#0B2D5B] tracking-tight">P{currentStatus.percentile}</div>
            <p className="text-xs font-bold text-[#FF7900] mt-1">
              {currentStatus.percentile >= 90 ? 'Supera umbral P90 — Crítico' : currentStatus.percentile >= 70 ? 'Supera P70 — Elevado' : 'Rango normal P10–P70'}
            </p>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">DESVIACIÓN Z-SCORE</span>
          <div>
            <div className="text-2xl font-black text-[#0B2D5B] tracking-tight font-mono">
              {currentStatus.zscore > 0 ? `+${currentStatus.zscore.toFixed(2)}` : currentStatus.zscore.toFixed(2)}σ
            </div>
            <p className="text-xs font-bold text-[#FF7900] mt-1">
              {currentStatus.zscore >= 2.0 ? 'Anomalía extrema (> +2.0σ)' : currentStatus.zscore >= 1.0 ? 'Desviación moderada (+1.0–2.0σ)' : 'Variabilidad típica (< +1.0σ)'}
            </p>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">MEDIA CLIMATOLÓGICA (SEM {currentStatus.week})</span>
          <div>
            <div className="text-2xl font-black text-[#0B2D5B] tracking-tight">
              {climWeek?.mean ?? '24.3'} <span className="text-xs font-semibold text-slate-400">fcd</span>
            </div>
            <p className="text-xs font-bold text-[#FF7900] mt-1">Umbral P90: {climWeek?.p90 ?? '68.2'} fire_cell_days</p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          GRID PRINCIPAL 8+4 cols — igual que Explorar
          ══════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* ── Columna izquierda (8 cols) ── */}
        <div className="lg:col-span-8 space-y-5">

          {/* Gráfico de Climatología — el mismo componente que usa Explorar */}
          <ClimatologyChart
            climatology={climatology}
            calendar={calendar}
            selectedYear={filters.selectedYear}
            selectedWeek={selectedWeek}
            isLoading={isLoading}
          />

          {/* Medidores Cuantitativos del Semáforo */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-[#FFF2E6] text-[#FF7900] flex items-center justify-center shrink-0">
                <Gauge className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-[#0B2D5B] text-base tracking-tight">Indicadores Estadísticos del Semáforo</h3>
                <p className="text-xs text-slate-500 font-medium">Percentil histórico y desviación normalizada Z-Score para la semana {currentStatus.week}.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Barra de Percentil */}
              <div className="bg-[#F4F6F9] p-4 rounded-xl border border-slate-200/70 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-[#FF7900]" />
                    Percentil Histórico
                  </span>
                  <span className="font-black text-[#0B2D5B]">{currentStatus.percentile}%</span>
                </div>
                <div className="relative w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${trafficLightConfig.barColor}`}
                    style={{ width: `${Math.min(100, currentStatus.percentile)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                  <span>P0</span>
                  <span>P50</span>
                  <span className="text-[#FF7900]">P70</span>
                  <span className="text-[#E53935]">P90</span>
                  <span>P100</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  El {currentStatus.percentile}% de los registros históricos (2001–2025) para la semana {currentStatus.week} registraron menor o igual densidad de fuego.
                </p>
              </div>

              {/* Escala Z-Score */}
              <div className="bg-[#F4F6F9] p-4 rounded-xl border border-slate-200/70 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-[#0B2D5B]" />
                    Puntaje Z-Score
                  </span>
                  <span className="font-black text-[#E53935] font-mono text-sm">
                    {currentStatus.zscore > 0 ? `+${currentStatus.zscore.toFixed(2)}` : currentStatus.zscore.toFixed(2)}σ
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-[10px] font-mono font-bold text-center">
                  <div className={`p-1.5 rounded-lg ${currentStatus.zscore < 1.0 ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-400' : 'bg-slate-200 text-slate-500'}`}>&lt; +1σ</div>
                  <div className={`p-1.5 rounded-lg ${currentStatus.zscore >= 1.0 && currentStatus.zscore < 1.5 ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-400' : 'bg-slate-200 text-slate-500'}`}>+1.0σ</div>
                  <div className={`p-1.5 rounded-lg ${currentStatus.zscore >= 1.5 && currentStatus.zscore < 2.0 ? 'bg-orange-100 text-orange-800 ring-1 ring-orange-400' : 'bg-slate-200 text-slate-500'}`}>+1.5σ</div>
                  <div className={`p-1.5 rounded-lg ${currentStatus.zscore >= 2.0 ? 'bg-red-100 text-red-800 ring-1 ring-red-400' : 'bg-slate-200 text-slate-500'}`}>&ge; +2σ</div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>0σ — Media climatológica</span>
                  <span className="font-bold text-[#E53935]">+3.35σ — Crítico</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">Desviación expresada en múltiplos de σ frente al régimen climatológico semanal.</p>
              </div>
            </div>
          </div>

          {/* Tabla de Anomalías Históricas — el mismo componente que usa Explorar */}
          <AnomalyList
            anomalies={anomalies}
            isLoading={isLoading}
            selectedYear={filters.selectedYear}
            selectedWeek={selectedWeek}
            onSelectAnomaly={handleSelectAnomaly}
          />

          {/* Criterios de Clasificación */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-[#E8EEF5] text-[#0B2D5B] flex items-center justify-center shrink-0">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-[#0B2D5B] text-base tracking-tight">Criterios de Clasificación del Semáforo BRASA</h3>
                <p className="text-xs text-slate-500 font-medium">Umbrales estadísticos definidos sobre la serie 2001–2025.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/80 space-y-1.5">
                <div className="flex items-center gap-1.5 font-black text-emerald-800 text-sm">
                  <CheckCircle2 className="w-4 h-4" /><span>Normal</span>
                </div>
                <p className="text-[11px] text-emerald-900 font-medium leading-relaxed">
                  Z-score &lt; 1.0σ y percentil &lt; P70. Actividad dentro de la variabilidad estacional esperada.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#FFF9E6] border border-[#FFC107]/50 space-y-1.5">
                <div className="flex items-center gap-1.5 font-black text-[#B45309] text-sm">
                  <AlertTriangle className="w-4 h-4" /><span>Elevado</span>
                </div>
                <p className="text-[11px] text-slate-700 font-medium leading-relaxed">
                  Z-score entre 1.0σ y 2.0σ, o percentil entre P70 y P90. Incremento perceptible en recurrencia térmica.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#FDE8E8] border border-[#E53935]/40 space-y-1.5">
                <div className="flex items-center gap-1.5 font-black text-[#E53935] text-sm">
                  <Flame className="w-4 h-4" /><span>Inusual</span>
                </div>
                <p className="text-[11px] text-slate-700 font-medium leading-relaxed">
                  Z-score &ge; 2.0σ o percentil &ge; P90. Desviación extrema equiparable a temporadas críticas (2012 / 2024).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Columna derecha (4 cols) ── */}
        <div className="lg:col-span-4 space-y-4">

          {/* Aviso institucional NASA */}
          <div role="alert" className="bg-[#FFF9E6] border border-[#FFC107]/60 rounded-2xl p-5 shadow-xs space-y-2.5 text-xs">
            <div className="flex items-center gap-2 font-black text-[#B45309] uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 shrink-0 text-[#FF7900]" />
              <span>Aviso Científico y Limitación</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-700 font-medium">
              BRASA es una herramienta analítica del <strong>NASA Space Apps Challenge 2026</strong> con propósitos científicos, estadísticos y de exploración de datos satelitales.
            </p>
            <div className="p-2.5 rounded-xl bg-white/80 border border-[#FFC107]/40 text-[11px] font-bold text-[#0B2D5B] leading-snug">
              Los estados y semáforos presentados <u>NO</u> constituyen alertas oficiales ni pronósticos de protección civil.
            </div>
          </div>

          {/* Diagnóstico automático */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-[#FFF2E6] text-[#FF7900] flex items-center justify-center shrink-0">
                <Info className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-[#0B2D5B] text-sm tracking-tight">Diagnóstico Científico</h3>
            </div>
            <div className="flex items-start gap-2.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                currentStatus.level === 'normal' ? 'bg-emerald-100 text-emerald-700' :
                currentStatus.level === 'elevado' ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              }`}>
                <StatusIcon className="w-5 h-5" />
              </div>
              <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                {trafficLightConfig.explanation}
              </p>
            </div>
          </div>

          {/* Contexto territorial */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 font-black text-[#0B2D5B]">
                <MapPin className="w-4 h-4 text-[#FF7900]" />
                <span>Ubicación de Referencia</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8EEF5] text-[#0B2D5B]">Ecuador</span>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Provincia:</span>
                <span className="font-bold text-[#0B2D5B]">{selectedRegion?.name ?? 'Chimborazo'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Ciudad / Cantón:</span>
                <span className="font-bold text-[#0B2D5B]">{selectedCanton ? selectedCanton.name : 'Riobamba'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Semana ISO:</span>
                <span className="font-bold text-[#FF7900]">Semana {currentStatus.week} · 2024</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 font-medium">Sensores:</span>
                <span className="font-bold text-[#0B2D5B]">MODIS + VIIRS</span>
              </div>
            </div>

            {/* Parámetros estadísticos */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PARÁMETROS ESTADÍSTICOS</span>
              <div className="bg-[#F4F6F9] rounded-xl p-3 space-y-1.5 text-[11px] font-mono">
                <div className="flex justify-between"><span className="text-slate-600">Media (Mean):</span><span className="font-bold text-[#0B2D5B]">{climWeek?.mean ?? '24.3'}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">P10:</span><span className="font-bold text-[#0B2D5B]">{climWeek?.p10 ?? '4.2'}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Mediana (P50):</span><span className="font-bold text-[#0B2D5B]">{climWeek?.p50 ?? '18.7'}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">P90:</span><span className="font-bold text-[#E53935]">{climWeek?.p90 ?? '68.2'}</span></div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-600 font-bold">Valor actual:</span>
                  <span className="font-black text-[#FF7900]">{currentStatus.value} fcd</span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <Link
              to="/explorar"
              className="w-full bg-[#FF7900] hover:bg-[#E66D00] text-white font-black py-3 rounded-xl shadow-md shadow-[#FF7900]/30 transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-2 group mt-1"
            >
              <Compass className="w-4 h-4" />
              <span>Ver en el Mapa Interactivo</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
