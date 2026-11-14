import React from 'react'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  FastForward,
  Clock,
} from 'lucide-react'
import { useTimeline } from '../hooks/useTimeline'
import { formatWeekFriendly } from '../utils/dateUtils'

interface TimelinePlayerProps {
  currentWeek: number
  selectedYear: number
  onWeekChange: (week: number) => void
}

export const TimelinePlayer: React.FC<TimelinePlayerProps> = ({
  currentWeek,
  selectedYear,
  onWeekChange,
}) => {
  const {
    isPlaying,
    speed,
    togglePlay,
    nextWeek,
    prevWeek,
    setSpeed,
    setWeek,
  } = useTimeline(currentWeek, onWeekChange, 52)

  const speeds = [0.5, 1, 2, 4]

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3.5">
      {/* 1. Barra superior: Título, Año y Semana Activa */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#E8EEF5] text-[#0B2D5B] flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <span className="text-xs uppercase font-black text-[#0B2D5B] tracking-wider">
            LÍNEA TEMPORAL DE OBSERVACIÓN
          </span>
          <span className="text-xs font-black text-white bg-[#0B2D5B] px-3 py-0.5 rounded-full shadow-2xs">
            Año {selectedYear}
          </span>
        </div>

        <div className="text-xs font-black text-[#FF7900] bg-[#FFF2E6] px-3.5 py-1 rounded-xl border border-[#FF7900]/30">
          {formatWeekFriendly(selectedYear, currentWeek)}
        </div>
      </div>

      {/* 2. Control deslizante (Scrubber) y meses */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[11px] text-slate-400 font-bold px-1">
          <span>Ene (S1)</span>
          <span>Abr (S13)</span>
          <span>Jul (S26)</span>
          <span className="text-[#FF7900] font-black flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF7900] inline-block" />
            Sep (S36 - Pico!)
          </span>
          <span>Dic (S52)</span>
        </div>
        <div className="relative flex items-center">
          <input
            type="range"
            min={1}
            max={52}
            value={currentWeek}
            onChange={(e) => setWeek(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#FF7900] focus:outline-hidden"
            aria-label="Seleccionar semana del año"
          />
        </div>
      </div>

      {/* 3. Controles de reproducción y velocidad */}
      <div className="flex items-center justify-between pt-1">
        {/* Play/Pause y navegación de semanas */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={prevWeek}
            className="p-2 rounded-xl text-slate-400 hover:text-[#0B2D5B] hover:bg-[#F4F6F9] transition-colors"
            title="Semana anterior"
            aria-label="Semana anterior"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            className={`flex items-center justify-center w-10 h-10 rounded-full shadow-md transition-all ${
              isPlaying
                ? 'bg-[#FFC107] hover:bg-[#F59E0B] text-[#0B2D5B]'
                : 'bg-[#FF7900] hover:bg-[#E66D00] text-white shadow-[#FF7900]/30'
            }`}
            title={isPlaying ? 'Pausar animación' : 'Reproducir animación temporal'}
            aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={nextWeek}
            className="p-2 rounded-xl text-slate-400 hover:text-[#0B2D5B] hover:bg-[#F4F6F9] transition-colors"
            title="Semana siguiente"
            aria-label="Semana siguiente"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Selector de velocidad */}
        <div className="flex items-center gap-1 bg-[#F4F6F9] p-1 rounded-xl border border-slate-200/60">
          <FastForward className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5" />
          {speeds.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-black font-mono transition-all ${
                speed === s
                  ? 'bg-[#0B2D5B] text-white shadow-2xs'
                  : 'text-slate-500 hover:text-[#0B2D5B]'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
