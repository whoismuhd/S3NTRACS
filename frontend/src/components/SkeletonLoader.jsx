import React from 'react'

export default function SkeletonLoader({ variant = 'default', count = 1 }) {
  const variants = {
    card: 'h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse',
    text: 'h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse',
    avatar: 'w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse',
    button: 'h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse',
    table: 'h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse',
    default: 'h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse',
  }

  const className = variants[variant] || variants.default

  if (count === 1) {
    return <div className={className} />
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className={className} />
      ))}
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
      </div>
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse" />
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  const safeCols = Math.max(1, cols) // Ensure at least 1 column
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${safeCols}, 1fr)` }}>
        {Array.from({ length: safeCols }).map((_, idx) => (
          <div key={idx} className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${safeCols}, 1fr)` }}>
          {Array.from({ length: safeCols }).map((_, colIdx) => (
            <div key={colIdx} className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  )
}

