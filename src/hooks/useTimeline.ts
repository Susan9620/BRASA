// Hook de control temporal para la animación de semanas
import { useState, useEffect, useRef, useCallback } from 'react'

export interface TimelineControls {
  isPlaying: boolean
  speed: number
  togglePlay: () => void
  play: () => void
  pause: () => void
  setSpeed: (speed: number) => void
  nextWeek: () => void
  prevWeek: () => void
  setWeek: (week: number) => void
}

export function useTimeline(
  currentWeek: number,
  onWeekChange: (week: number) => void,
  maxWeeks: number = 52
): TimelineControls {
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [speed, setSpeed] = useState<number>(1) // 1x = 1000ms por semana
  const timerRef = useRef<number | null>(null)

  const stop = useCallback(() => {
    setIsPlaying(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const nextWeek = useCallback(() => {
    onWeekChange(currentWeek >= maxWeeks ? 1 : currentWeek + 1)
  }, [currentWeek, maxWeeks, onWeekChange])

  const prevWeek = useCallback(() => {
    onWeekChange(currentWeek <= 1 ? maxWeeks : currentWeek - 1)
  }, [currentWeek, maxWeeks, onWeekChange])

  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.max(200, 1000 / speed)
      timerRef.current = window.setInterval(() => {
        onWeekChange(currentWeek >= maxWeeks ? 1 : currentWeek + 1)
      }, intervalMs)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isPlaying, speed, currentWeek, maxWeeks, onWeekChange])

  return {
    isPlaying,
    speed,
    togglePlay: () => setIsPlaying((p) => !p),
    play: () => setIsPlaying(true),
    pause: stop,
    setSpeed,
    nextWeek,
    prevWeek,
    setWeek: onWeekChange,
  }
}
