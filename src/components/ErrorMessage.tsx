import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface ErrorMessageProps {
  message?: string
  onRetry?: () => void
  title?: string
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message = 'Ocurrió un error al procesar la solicitud satelital.',
  onRetry,
  title = 'No fue posible cargar los datos',
}) => {
  return (
    <div
      role="alert"
      className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl p-6 text-center max-w-lg mx-auto my-6 space-y-4"
    >
      <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto">
        <AlertCircle className="w-6 h-6" />
      </div>
      <div>
        <h3 className="font-semibold text-red-900 dark:text-red-200 text-base">{title}</h3>
        <p className="text-sm text-red-700 dark:text-red-300/80 mt-1">{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors shadow-xs focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Reintentar</span>
        </button>
      )}
    </div>
  )
}
