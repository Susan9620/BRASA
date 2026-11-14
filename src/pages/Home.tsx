import React from 'react'
import { Link } from 'react-router-dom'
import { Users } from 'lucide-react'

const BarChartFilled = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <rect x="3" y="11" width="4" height="10" rx="1.5" />
    <rect x="10" y="4" width="4" height="17" rx="1.5" />
    <rect x="17" y="8" width="4" height="13" rx="1.5" />
  </svg>
)

export const Home: React.FC = () => {
  return (
    <div className="relative min-h-[calc(100vh-73px)] flex flex-col justify-between bg-white overflow-hidden select-none">
      {/* Contenido Central Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-8 pb-4 sm:py-8 max-w-4xl mx-auto text-center z-10 w-full">
        {/* Ícono de Llama de BRASA con punta completa intacta */}
        <div className="mb-3 sm:mb-4 transition-transform hover:scale-105 duration-300">
          <img
            src="/brasa-flame.png"
            alt="BRASA Logo"
            className="h-20 sm:h-24 md:h-28 w-auto mx-auto object-contain drop-shadow-xs"
          />
        </div>

        {/* Título Principal */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-[#0B1B3D] tracking-tight leading-none">
          BRASA
        </h1>

        {/* Subtítulo Institucional */}
        <h2 className="text-lg sm:text-2xl md:text-[25px] text-[#0B1B3D] font-normal tracking-tight mt-2.5 sm:mt-3 px-2">
          Bitácora Regional de Actividad Satelital Armonizada
        </h2>

        {/* Divisor Naranja */}
        <div className="w-12 h-1 bg-[#FF7900] rounded-full mx-auto my-4 sm:my-5" />

        {/* Descripción de alcance y satélites */}
        <div className="text-slate-600 text-sm sm:text-base md:text-lg leading-relaxed space-y-0.5 max-w-xl mx-auto font-normal px-4">
          <p>Análisis de la actividad de quema en Ecuador (2001 – 2025)</p>
          <p>con datos satelitales MODIS y VIIRS.</p>
        </div>

        {/* Botones de Acción Principales */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 sm:gap-4 pt-6 sm:pt-7">
          <Link
            to="/explorar"
            className="inline-flex items-center gap-2.5 px-6 sm:px-8 py-3 sm:py-3.5 bg-gradient-to-r from-[#FF7900] to-[#FF5500] hover:from-[#E66D00] hover:to-[#E04800] text-white font-bold rounded-full shadow-lg shadow-[#FF7900]/25 hover:shadow-xl hover:shadow-[#FF7900]/35 transition-all transform hover:-translate-y-0.5 text-sm sm:text-base group"
          >
            <BarChartFilled className="w-4 h-4 sm:w-4.5 sm:h-4.5 transition-transform group-hover:scale-110" />
            <span>Explorar Dashboard</span>
            <span className="text-base sm:text-lg leading-none font-normal transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>

          <Link
            to="/equipo"
            className="inline-flex items-center gap-2.5 px-6 sm:px-8 py-3 sm:py-3.5 bg-white hover:bg-slate-50 text-[#0B1B3D] font-bold rounded-full border border-slate-200 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all transform hover:-translate-y-0.5 text-sm sm:text-base"
          >
            <Users className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#0B1B3D]" />
            <span>Acerca de nosotros</span>
          </Link>
        </div>
      </div>

      {/* Gráfico Curvo del Planeta Tierra con Ecuador iluminado en el horizonte */}
      <div className="w-full relative mt-auto flex justify-center items-end overflow-hidden pointer-events-none select-none">
        <picture className="w-full flex justify-center">
          <source srcSet="/earth-ecuador.webp" type="image/webp" />
          <img
            src="/earth-ecuador.png"
            alt="Ecuador iluminado desde el espacio con actividad satelital de quemas"
            className="w-full max-w-[1500px] 2xl:max-w-[1850px] h-auto object-contain object-bottom pointer-events-none"
          />
        </picture>
      </div>
    </div>
  )
}
