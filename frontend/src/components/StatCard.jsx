import React from 'react'

export default function StatCard({ title, value, icon, trend, trendValue, color = 'blue', subtitle }) {
  const colorConfig = {
    blue: {
      text: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      gradient: 'from-blue-500 to-blue-600',
    },
    green: {
      text: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/20',
      iconBg: 'bg-green-100 dark:bg-green-900/30',
      gradient: 'from-green-500 to-green-600',
    },
    red: {
      text: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20',
      iconBg: 'bg-red-100 dark:bg-red-900/30',
      gradient: 'from-red-500 to-red-600',
    },
    yellow: {
      text: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
      gradient: 'from-yellow-500 to-yellow-600',
    },
    purple: {
      text: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
      gradient: 'from-purple-500 to-purple-600',
    },
    indigo: {
      text: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
      iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
      gradient: 'from-indigo-500 to-indigo-600',
    },
  }

  const config = colorConfig[color] || colorConfig.blue

  return (
    <div className="group relative bg-white dark:bg-gray-800 overflow-hidden rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200">
      {/* Subtle gradient accent */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.gradient}`}></div>
      
      <div className="relative p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider mb-3">{title}</p>
            <div className="flex items-baseline gap-2 mb-1">
              <p className={`text-3xl font-bold ${config.text} leading-tight`}>
                {value}
              </p>
              {trend && (
                <span
                  className={`text-xs font-semibold flex items-center gap-0.5 ${
                    trend === 'up' ? 'text-green-600 dark:text-green-400' : 
                    trend === 'down' ? 'text-red-600 dark:text-red-400' : 
                    'text-gray-500 dark:text-gray-300'
                  }`}
                >
                  {trend === 'up' && (
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {trend === 'down' && (
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {trendValue}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-300 mt-2 leading-relaxed">{subtitle}</p>
            )}
          </div>
          {icon && (
            <div className={`ml-4 flex-shrink-0 p-3 rounded-lg ${config.iconBg} transition-colors duration-200`}>
              <div className={config.text}>{icon}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
