import React from 'react'
import { Link } from 'react-router-dom'
import { Flame, ArrowUpRight, Gauge, Activity, AlertCircle, CheckCircle2 } from 'lucide-react'
import type { CurrentStatusResponse, ClimatologyResponse } from '../types'
import { formatWeekFriendly } from '../utils/dateUtils'

interface WeeklyFeatureCardProps {
  currentStatus: CurrentStatusResponse | null
  climatology: ClimatologyResponse | null
  selectedYear: number
}

export const WeeklyFeatureCard: React.FC<WeeklyFeatureCardProps> = ({
  currentStatus,
  climatology,
  selectedYear,
}) => {
  if (!currentStatus) return null

  const climWeek = climatology?.weeks.find((w) => w.week === currentStatus.week)
  const meanVal = climWeek?.mean || 10
  const ratioPercent = Math.round(((currentStatus.value - meanVal) / meanVal) * 100)

  const levelStyles = {
    normal: {
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
      accentColor: '#10B981',
      label: 'Normal',
      icon: CheckCircle2,
    },
    elevado: {
      badge: 'bg-[#FFC107]/20 text-[#FFC107] border-[#FFC107]/40',
      accentColor: '#FFC107',
      label: 'Elevado',
      icon: AlertCircle,
    },
    inusual: {
      badge: 'bg-[#E53935]/25 text-[#FF7900] border-[#E53935]/50',
      accentColor: '#FF7900',
      label: 'Inusual',
      icon: Flame,
    },
  }[currentStatus.level]

  const LevelIcon = levelStyles.icon

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#0B2D5B] via-[#0E356A] to-[#082245] text-white rounded-2xl p-5 shadow-lg border border-[#16437E] space-y-4">
      {/* Glow decorativo de fondo */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-[#FF7900]/15 rounded-full blur-2xl pointer-events-none" />

      {/* Encabezado */}
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block">
            Diagnóstico Situacional
          </span>
          <h3 className="text-sm font-extrabold text-white mt-0.5">
            {formatWeekFriendly(selectedYear, currentStatus.week)}
          </h3>
        </div>

        <Link
          to="/alertas"
          className="flex items-center gap-1 text-[11px] font-bold text-[#FF7900] hover:text-[#FFC107] transition-colors bg-white/10 hover:bg-white/15 px-2.5 py-1 rounded-lg"
          title="Ver diagnóstico detallado en Alertas"
        >
          <span>Detalle</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Métrica principal y Semáforo */}
      <div className="relative z-10 flex items-center justify-between pt-1">
        <div>
          <div className="text-3xl font-black tracking-tight text-white flex items-baseline gap-1">
            <span>{currentStatus.value}</span>
            <span className="text-xs font-semibold text-slate-300">fire_cell_days</span>
          </div>
          <p className="text-[11px] text-slate-300 mt-0.5">
            Actividad satelital acumulada semanal
          </p>
        </div>

        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border ${levelStyles.badge}`}>
          <LevelIcon className="w-4 h-4 fill-current" />
          <span>{levelStyles.label}</span>
        </div>
      </div>

      {/* Barra de progreso de severidad */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-slate-300 font-medium">
          <span>Severidad del régimen</span>
          <span className="font-bold text-[#FFC107]">Percentil P{currentStatus.percentile}</span>
        </div>
        <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden p-0.5">
          <div
            className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-[#FFC107] via-[#FF7900] to-[#E53935]"
            style={{ width: `${Math.min(100, Math.max(10, currentStatus.percentile))}%` }}
          />
        </div>
      </div>

      {/* 3 Métricas en barra inferior (Idéntico al estilo del card de la plantilla) */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10 text-center">
        <div>
          <span className="text-[10px] text-slate-300 block uppercase font-medium">Percentil</span>
          <span className="text-sm font-black text-white">P{currentStatus.percentile}</span>
        </div>
        <div className="border-x border-white/10">
          <span className="text-[10px] text-slate-300 block uppercase font-medium">Z-Score</span>
          <span className="text-sm font-black text-[#FF7900]">
            {currentStatus.zscore > 0 ? `+${currentStatus.zscore}` : currentStatus.zscore}&sigma;
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-300 block uppercase font-medium">vs Media</span>
          <span className="text-sm font-black text-[#FFC107]">
            {ratioPercent > 0 ? `+${ratioPercent}%` : `${ratioPercent}%`}
          </span>
        </div>
      </div>
    </div>
  )
}
