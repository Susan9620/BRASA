import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  Flame,
  Compass,
  GitCompare,
  AlertTriangle,
  Users,
} from 'lucide-react'

export const Sidebar: React.FC = () => {
  const navItems = [
    { to: '/', label: 'Inicio', icon: Flame, end: true },
    { to: '/explorar', label: 'Explorar', icon: Compass },
    { to: '/comparar', label: 'Comparar', icon: GitCompare },
    { to: '/alertas', label: 'Alertas', icon: AlertTriangle },
    { to: '/equipo', label: 'CODE RED', icon: Users },
  ]

  return (
    <aside className="w-56 bg-[#071C3A] text-slate-300 min-h-[calc(100vh-72px)] flex flex-col py-6 px-3 shrink-0 border-r border-[#0B2D5B]/60 shadow-xl hidden lg:flex">
      <nav className="space-y-1.5 flex-1" aria-label="Navegación lateral">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#16437E] text-white shadow-md border border-[#1E57A4]/50 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-[#0B2D5B]/70'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-[#FF7900]' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="pt-6 border-t border-[#0B2D5B] px-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5 font-bold text-white mb-1">
          <span className="w-2 h-2 rounded-full bg-[#FF7900] animate-pulse" />
          <span>BRASA Online</span>
        </div>
        <p className="text-[10px] text-slate-400">NASA Space Apps 2026</p>
      </div>
    </aside>
  )
}
