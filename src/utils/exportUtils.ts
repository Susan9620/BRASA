// Utilidades de exportación a CSV y PNG para BRASA

/**
 * Exporta un array de objetos a un archivo CSV descargable.
 */
export function exportToCSV(filename: string, data: unknown[]): void {
  if (!data || data.length === 0) {
    alert('No hay datos disponibles para exportar.')
    return
  }

  const sample = data[0] as Record<string, unknown>
  const headers = Object.keys(sample)
  const csvContent = [
    headers.join(','),
    ...data.map((item) => {
      const row = item as Record<string, unknown>
      return headers
        .map((header) => {
          const val = row[header]
          if (val === null || val === undefined) return '""'
          if (typeof val === 'string' && val.includes(',')) {
            return `"${val.replace(/"/g, '""')}"`
          }
          return `"${val}"`
        })
        .join(',')
    }),
  ].join('\r\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Exporta una instancia de ECharts a imagen PNG descargable.
 */
export function exportChartToPNG(
  chartInstance: { getDataURL?: (opts?: any) => string } | null,
  filename: string
): void {
  if (!chartInstance || typeof chartInstance.getDataURL !== 'function') {
    console.warn('Instancia de gráfico no disponible para exportar.')
    return
  }

  try {
    const url = chartInstance.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: '#ffffff',
    })

    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (err) {
    console.error('Error al exportar gráfico a PNG:', err)
  }
}
