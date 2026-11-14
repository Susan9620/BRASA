/** Rutas informativas con diseño de landing (fondo blanco, menú superior, sin sidebar). */
export const LANDING_PATHS = ['/', '/equipo', '/metodologia']

export const isLandingPath = (pathname: string): boolean => LANDING_PATHS.includes(pathname)
