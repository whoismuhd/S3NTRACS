import React from 'react'

export default function SimpleChart({ data, type = 'bar', height = 200, color = 'blue' }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        No data available
      </div>
    )
  }

  const maxValue = Math.max(...data.map(d => d.value))
  const minValue = Math.min(...data.map(d => d.value))
  const range = maxValue - minValue || 1

  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    indigo: 'bg-indigo-500',
  }

  if (type === 'bar') {
    return (
      <div className="w-full h-full">
        <div className="flex items-end justify-between h-full space-x-2">
          {data.map((item, index) => {
            const percentage = ((item.value - minValue) / range) * 100
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full flex flex-col items-center justify-end" style={{ height: `${height}px` }}>
                  <div
                    className={`w-full ${colors[color]} rounded-t transition-all hover:opacity-80 cursor-pointer`}
                    style={{ height: `${percentage}%`, minHeight: item.value > 0 ? '4px' : '0' }}
                    title={`${item.label}: ${item.value}`}
                  />
                </div>
                {item.label && (
                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 text-center truncate w-full">
                    {item.label}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (type === 'line') {
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1 || 1)) * 100
      const y = 100 - ((item.value - minValue) / range) * 100
      return `${x},${y}`
    }).join(' ')

    return (
      <div className="w-full h-full relative">
        <svg width="100%" height={height} className="overflow-visible">
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            points={points}
            className="text-blue-500"
          />
          {data.map((item, index) => {
            const x = (index / (data.length - 1 || 1)) * 100
            const y = 100 - ((item.value - minValue) / range) * 100
            return (
              <circle
                key={index}
                cx={`${x}%`}
                cy={`${y}%`}
                r="4"
                fill="currentColor"
                className="text-blue-500"
              />
            )
          })}
        </svg>
        <div className="flex justify-between mt-2 text-xs text-gray-600 dark:text-gray-400">
          {data.map((item, index) => (
            <span key={index} className="truncate" style={{ flex: 1, textAlign: index === 0 ? 'left' : index === data.length - 1 ? 'right' : 'center' }}>
              {item.label}
            </span>
          ))}
        </div>
      </div>
    )
  }

  return null
}







