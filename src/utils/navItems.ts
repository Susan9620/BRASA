import { Flame, Compass, GitCompare, AlertTriangle, BookOpen, Users } from 'lucide-react'

/* Navegación completa (menú móvil y sidebar comparten los mismos nombres) */
export const NAV_ITEMS = [
  { to: '/', label: 'Inicio', icon: Flame, end: true },
  { to: '/explorar', label: 'Explorar', icon: Compass },
  { to: '/comparar', label: 'Análisis histórico', icon: GitCompare },
  { to: '/alertas', label: 'Alertas', icon: AlertTriangle },
  { to: '/metodologia', label: 'Metodología', icon: BookOpen },
  { to: '/equipo', label: 'Acerca de nosotros', icon: Users },
]
