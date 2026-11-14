import { useEffect, type RefObject } from 'react'

type ElRef = RefObject<HTMLElement | null>

interface PointerEffectsOptions {
  /** Resplandor radial que sigue al cursor */
  glowRef?: ElRef
  /** Elemento con parallax (se mueve en sentido opuesto al cursor) */
  parallaxRef?: ElRef
  /** Desplazamiento máximo del parallax en px */
  parallax?: { x: number; y: number }
  /** Elemento que se acerca sutilmente al cursor cuando está cerca (logo) */
  magnetRef?: ElRef
  /** Halo que se ilumina con la cercanía del cursor al elemento magnético */
  magnetGlowRef?: ElRef
  /** Radio de influencia del efecto magnético en px */
  magnetRadius?: number
}

/** Efectos solo con puntero fino (mouse) y sin preferencia de movimiento reducido. */
export const canUsePointerEffects = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches

const MAGNET_MAX_PX = 5

/**
 * Efectos interactivos ligeros para secciones hero: resplandor que sigue al cursor,
 * parallax e imán sutil sobre el logo. Escribe estilos directamente (transform/opacity)
 * dentro de un bucle requestAnimationFrame que se detiene cuando todo está en reposo,
 * sin provocar renders de React.
 */
export function usePointerEffects(sectionRef: ElRef, options: PointerEffectsOptions): void {
  const { glowRef, parallaxRef, magnetRef, magnetGlowRef } = options
  const px = options.parallax?.x ?? 12
  const py = options.parallax?.y ?? 8
  const magnetRadius = options.magnetRadius ?? 240

  useEffect(() => {
    const section = sectionRef.current
    if (!section || !canUsePointerEffects()) return

    const target = { x: 0, y: 0, nx: 0, ny: 0, glow: 0, mx: 0, my: 0, mg: 0 }
    const cur = { ...target }
    const keys = Object.keys(cur) as (keyof typeof cur)[]
    let raf = 0
    let hasPosition = false

    const apply = () => {
      const glow = glowRef?.current
      if (glow) {
        glow.style.transform = `translate3d(${cur.x}px, ${cur.y}px, 0) translate(-50%, -50%)`
        glow.style.opacity = String(cur.glow)
      }
      const par = parallaxRef?.current
      if (par) par.style.transform = `translate3d(${-cur.nx * px}px, ${-cur.ny * py}px, 0)`
      const mag = magnetRef?.current
      if (mag) mag.style.transform = `translate3d(${cur.mx}px, ${cur.my}px, 0) scale(${1 + cur.mg * 0.04})`
      const magGlow = magnetGlowRef?.current
      if (magGlow) magGlow.style.opacity = String(cur.mg)
    }

    const tick = () => {
      let moving = false
      for (const k of keys) {
        // El resplandor sigue más rápido; parallax/opacidad regresan lentamente
        const t = k === 'x' || k === 'y' ? 0.18 : 0.07
        const next = cur[k] + (target[k] - cur[k]) * t
        if (Math.abs(target[k] - next) > 0.002) {
          cur[k] = next
          moving = true
        } else {
          cur[k] = target[k]
        }
      }
      apply()
      raf = moving ? requestAnimationFrame(tick) : 0
    }

    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      const rect = section.getBoundingClientRect()
      target.x = e.clientX - rect.left
      target.y = e.clientY - rect.top
      if (!hasPosition) {
        cur.x = target.x
        cur.y = target.y
        hasPosition = true
      }
      target.nx = (target.x / rect.width) * 2 - 1
      target.ny = (target.y / rect.height) * 2 - 1
      target.glow = 1

      const mag = magnetRef?.current
      if (mag) {
        const r = mag.getBoundingClientRect()
        const dx = e.clientX - (r.left + r.width / 2)
        const dy = e.clientY - (r.top + r.height / 2)
        const dist = Math.hypot(dx, dy) || 1
        const k = Math.max(0, 1 - dist / magnetRadius)
        target.mx = (dx / dist) * MAGNET_MAX_PX * k
        target.my = (dy / dist) * MAGNET_MAX_PX * k
        target.mg = k
      }
      start()
    }

    const onLeave = () => {
      target.nx = target.ny = target.glow = target.mx = target.my = target.mg = 0
      start()
    }

    section.addEventListener('pointermove', onMove, { passive: true })
    section.addEventListener('pointerleave', onLeave)

    return () => {
      section.removeEventListener('pointermove', onMove)
      section.removeEventListener('pointerleave', onLeave)
      cancelAnimationFrame(raf)
      for (const r of [glowRef, parallaxRef, magnetRef, magnetGlowRef]) {
        if (r?.current) {
          r.current.style.transform = ''
          r.current.style.opacity = ''
        }
      }
    }
  }, [sectionRef, glowRef, parallaxRef, magnetRef, magnetGlowRef, px, py, magnetRadius])
}
