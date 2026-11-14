import React, { type Ref } from 'react'

/** Resplandor naranja muy tenue que sigue al cursor (posicionado por usePointerEffects). */
export const CursorGlow: React.FC<{ ref: Ref<HTMLDivElement> }> = ({ ref }) => (
  <div
    ref={ref}
    aria-hidden="true"
    className="pointer-events-none absolute left-0 top-0 z-0 w-[560px] h-[560px] rounded-full opacity-0 will-change-transform bg-[radial-gradient(circle,rgba(255,121,0,0.11)_0%,rgba(255,121,0,0.05)_30%,rgba(255,121,0,0)_65%)]"
  />
)
