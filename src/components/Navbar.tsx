import React, { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import {
  Flame,
  Satellite,
  Compass,
  GitCompare,
  AlertTriangle,
  Users,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react'
import { IS_MOCK_MODE } from '../api/client'

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const isHomePage = location.pathname === '/'

  const navItems = [
    { to: '/', label: 'Inicio', icon: Flame, end: true },
    { to: '/explorar', label: 'Dashboard', icon: Compass },
    { to: '/comparar', label: 'Comparar', icon: GitCompare },
    { to: '/alertas', label: 'Alertas', icon: AlertTriangle },
    { to: '/equipo', label: 'Acerca de nosotros (CODE RED)', icon: Users },
  ]

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-100 transition-colors">
      <div className="w-full max-w-[1680px] mx-auto px-6 sm:px-10 lg:px-12 h-18 flex items-center justify-between">
        {/* Marca: Logo Llama + Texto BRASA */}
        <Link
          to="/"
          className="flex items-center gap-2.5 sm:gap-3 group focus:outline-hidden py-1"
        >
          <img
            src="/brasa-flame.png"
            alt="BRASA Logo"
            className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-105"
          />
          <span className="text-2xl sm:text-[26px] font-black tracking-wider text-[#0B1B3D]">
            BRASA
          </span>
          {!isHomePage && (
            <div className="hidden sm:block pl-3 ml-1 border-l border-slate-200">
              <div className="flex items-center gap-2">
                <span className="font-black text-xs uppercase tracking-wider text-[#0B2D5B]">
                  NASA SPACE APPS
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#FFF2E6] text-[#FF7900] border border-[#FF7900]/40">
                  2026
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-semibold tracking-tight">
                Bitácora Regional de Actividad Satelital Armonizada
              </p>
            </div>
          )}
        </Link>

        {/* Enlaces de Navegación de Escritorio: ÚNICAMENTE en la página de inicio */}
        {isHomePage ? (
          <nav className="hidden md:flex items-center gap-8 lg:gap-10">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `relative py-2 text-sm sm:text-base font-semibold transition-colors flex flex-col items-center ${
                  isActive ? 'text-[#FF7900]' : 'text-[#0B1B3D] hover:text-[#FF7900]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span>Inicio</span>
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 right-0 h-0.75 bg-[#FF7900] rounded-full" />
                  )}
                </>
              )}
            </NavLink>

            <NavLink
              to="/explorar"
              className={({ isActive }) =>
                `relative py-2 text-sm sm:text-base font-semibold transition-colors flex flex-col items-center ${
                  isActive ? 'text-[#FF7900]' : 'text-[#0B1B3D] hover:text-[#FF7900]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span>Dashboard</span>
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 right-0 h-0.75 bg-[#FF7900] rounded-full" />
                  )}
                </>
              )}
            </NavLink>

            <NavLink
              to="/equipo"
              className={({ isActive }) =>
                `relative py-2 text-sm sm:text-base font-semibold transition-colors flex flex-col items-center ${
                  isActive ? 'text-[#FF7900]' : 'text-[#0B1B3D] hover:text-[#FF7900]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span>Acerca de nosotros</span>
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 right-0 h-0.75 bg-[#FF7900] rounded-full" />
                  )}
                </>
              )}
            </NavLink>
          </nav>
        ) : (
          /* Estado del sistema en páginas interiores (el Sidebar izquierdo maneja la navegación) */
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0B2D5B] bg-[#F4F6F9] px-3.5 py-1.5 rounded-xl border border-slate-200">
              <Satellite className="w-4 h-4 text-[#FF7900]" />
              <span>MODIS & VIIRS</span>
            </div>

            {IS_MOCK_MODE && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FFF9E6] text-[#0B2D5B] border border-[#FFC107]/50 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#FF7900] animate-pulse" />
                <span>Modo Mock Activo</span>
              </span>
            )}
          </div>
        )}

        {/* Botón menú móvil (visible solo en pantallas pequeñas) */}
        <div className="flex md:hidden items-center">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-600 hover:text-[#0B1B3D] hover:bg-slate-50 focus:outline-hidden"
            aria-expanded={mobileMenuOpen}
            aria-label="Abrir menú de navegación"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Menú Desplegable Móvil */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-5 pt-3 pb-6 space-y-1 shadow-xl">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-[#0B1B3D] text-white font-bold'
                      : 'text-slate-600 hover:text-[#0B1B3D] hover:bg-slate-50'
                  }`
                }
              >
                <Icon className="w-5 h-5 text-[#FF7900]" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 px-3">
            <span>Equipo CODE RED</span>
            <span className="flex items-center gap-1 font-bold text-[#FF7900]">
              NASA Space Apps 2026 <ExternalLink className="w-3 h-3" />
            </span>
          </div>
        </div>
      )}
    </header>
  )
}
