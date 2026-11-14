import React from 'react'
import { Award, Heart, Code2, ExternalLink, ShieldCheck } from 'lucide-react'

export const AboutTeam: React.FC = () => {
  return (
    <div className="space-y-8 py-8 px-4 max-w-5xl mx-auto text-slate-800">
      {/* Encabezado */}
      <div className="border-b border-slate-200 pb-4 space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FDE8E8] text-[#E53935] text-xs font-bold border border-[#E53935]/30">
          <Award className="w-3.5 h-3.5" />
          <span>NASA Space Apps Challenge 2026</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-[#0B2D5B] flex items-center gap-3">
          <span>Equipo CODE RED</span>
        </h1>
        <p className="text-sm text-slate-500 font-medium">
          Comprometidos con la conservación de los ecosistemas andinos y el monitoreo satelital en Ecuador.
        </p>
      </div>

      {/* Misión */}
      <section className="bg-gradient-to-br from-[#0B2D5B] to-[#071D3B] text-white rounded-3xl p-8 sm:p-10 shadow-xl border border-[#16437E] space-y-4">
        <div className="flex items-center gap-3">
          <img src="/logo-brasa.jpg" alt="Logo BRASA" className="h-10 bg-white p-1 rounded-xl" />
          <h2 className="text-xl font-extrabold text-white">
            Nuestra Misión con BRASA
          </h2>
        </div>
        <p className="text-sm text-slate-200 leading-relaxed font-normal">
          Los Andes ecuatorianos albergan páramos y bosques de neblina esenciales para la regulación hídrica de millones de personas. Sequías extremas y el cambio climático han provocado temporadas de incendios devastadoras, como las vividas en 2012 y 2024.
        </p>
        <p className="text-sm text-slate-200 leading-relaxed font-normal">
          El equipo <strong>CODE RED</strong> desarrolló <strong>BRASA (Bitácora Regional de Actividad Satelital Armonizada)</strong> para cerrar la brecha entre los datos satelitales de NASA FIRMS y las herramientas de análisis accesibles para comunidades y planificadores locales.
        </p>
      </section>

      {/* Arquitectura del Proyecto */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5 text-base font-extrabold text-[#0B2D5B]">
            <div className="w-8 h-8 rounded-xl bg-[#E8EEF5] text-[#0B2D5B] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3>Frontend Modular & Desacoplado</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Construido con React 19, TypeScript, Tailwind CSS, Leaflet y ECharts. Diseñado con una capa de abstracción estricta (`api/client.ts`) para conectarse sin modificaciones a cualquier backend REST o ejecutarse en modo mock determinista fuera de línea.
          </p>
        </div>

        <div className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5 text-base font-extrabold text-[#0B2D5B]">
            <div className="w-8 h-8 rounded-xl bg-[#FDE8E8] text-[#E53935] flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </div>
            <h3>Impacto Social y Territorial</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Priorizando el enfoque cantonal y provincial con Chimborazo y Riobamba como caso de estudio inicial, BRASA democratiza el acceso a 25 años de observaciones de la Tierra para la gestión preventiva de incendios.
          </p>
        </div>
      </section>

      {/* Enlaces */}
      <section className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div>
          <span className="font-extrabold text-[#0B2D5B] block text-sm">
            NASA Space Apps Challenge 2026
          </span>
          <span className="text-slate-500 font-medium">
            Desarrollado bajo licencia abierta para la comunidad global por CODE RED.
          </span>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#0B2D5B] hover:bg-[#16437E] text-white rounded-xl transition-colors font-bold shadow-xs"
          >
            <Code2 className="w-4 h-4 text-[#FF7900]" />
            <span>Repositorio del Proyecto</span>
            <ExternalLink className="w-3 h-3 text-slate-300 ml-0.5" />
          </a>
        </div>
      </section>
    </div>
  )
}
