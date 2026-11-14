import React from 'react'
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react'
import { useTimeline } from '../hooks/useTimeline'
import { formatWeekFriendly } from '../utils/dateUtils'

interface TimelinePlayerProps {
  currentWeek: number
  selectedYear: number
  onWeekChange: (week: number) => void
  /** Semana pico real del año seleccionado (si se conoce) */
  peakWeek?: number
}

const MONTH_MARKS = [
  { week: 1, label: 'Ene' },
  { week: 14, label: 'Abr' },
  { week: 27, label: 'Jul' },
  { week: 40, label: 'Oct' },
  { week: 52, label: 'Dic' },
]

const toPercent = (week: number) => ((week - 1) / 51) * 100

export const TimelinePlayer: React.FC<TimelinePlayerProps> = ({ currentWeek, selectedYear, onWeekChange, peakWeek }) => {
  const { isPlaying, speed, togglePlay, nextWeek, prevWeek, setSpeed, setWeek } = useTimeline(
    currentWeek,
    onWeekChange,
    52
  )

  const speeds = [0.5, 1, 2, 4]

  return (
    <div className="bg-white rounded-[28px] p-6 sm:p-7 border border-slate-200/70">
      {/* Encabezado */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Línea temporal · {selectedYear}</p>
          <p className="mt-1 text-lg font-black tracking-tight text-[#0B1B3D]">
            {formatWeekFriendly(selectedYear, currentWeek)}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={prevWeek}
            className="p-2 rounded-full text-slate-400 hover:text-[#0B1B3D] hover:bg-slate-100 transition-colors"
            aria-label="Semana anterior"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={togglePlay}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-[#FF7900] hover:bg-[#E66D00] text-white shadow-md shadow-[#FF7900]/30 transition-colors"
            aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>
          <button
            type="button"
            onClick={nextWeek}
            className="p-2 rounded-full text-slate-400 hover:text-[#0B1B3D] hover:bg-slate-100 transition-colors"
            aria-label="Semana siguiente"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <div className="ml-2 inline-flex p-1 rounded-full border border-slate-200">
            {speeds.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
                  speed === s ? 'bg-[#0B1B3D] text-white' : 'text-slate-500 hover:text-[#0B1B3D]'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Deslizador con meses y pico real */}
      <div className="mt-6">
        <input
          type="range"
          min={1}
          max={52}
          value={currentWeek}
          onChange={(e) => setWeek(Number(e.target.value))}
          className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#FF7900] focus:outline-hidden"
          aria-label="Seleccionar semana del año"
        />
        <div className="relative mt-2 h-5 text-xs text-slate-400">
          {MONTH_MARKS.map((m) => (
            <span
              key={m.week}
              className="absolute -translate-x-1/2 first:translate-x-0 last:-translate-x-full"
              style={{ left: `${toPercent(m.week)}%` }}
            >
              {m.label}
            </span>
          ))}
        </div>
        {peakWeek && (
          <button
            type="button"
            onClick={() => setWeek(peakWeek)}
            className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-[#FF7900] hover:text-[#E66D00]"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF7900]" />
            Pico de {selectedYear}: semana {peakWeek} · ir
          </button>
        )}
      </div>
    </div>
  )
}
