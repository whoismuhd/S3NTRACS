import React from 'react'

export default function ScanProgress({ status, className = '' }) {
  const getStatusConfig = () => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return {
          label: 'Pending',
          color: 'bg-gray-500',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        }
      case 'RUNNING':
        return {
          label: 'Scanning...',
          color: 'bg-blue-500',
          icon: (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ),
        }
      case 'COMPLETED':
        return {
          label: 'Completed',
          color: 'bg-green-500',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
        }
      case 'FAILED':
        return {
          label: 'Failed',
          color: 'bg-red-500',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ),
        }
      default:
        return {
          label: 'Unknown',
          color: 'bg-gray-400',
          icon: null,
        }
    }
  }

  const config = getStatusConfig()

  return (
    <div className={`inline-flex items-center space-x-2 ${className}`}>
      <div className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${config.color} text-white`}>
        {config.icon}
      </div>
      <span className="text-sm font-medium text-gray-700">{config.label}</span>
    </div>
  )
}









