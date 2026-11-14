import React, { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import {
  Flame,
  Compass,
  GitCompare,
  AlertTriangle,
  Users,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react'

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
        </Link>

        {/* Navegación de Escritorio: Inicio, Dashboard, Acerca de nosotros */}
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

        {/* Botón menú móvil */}
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
