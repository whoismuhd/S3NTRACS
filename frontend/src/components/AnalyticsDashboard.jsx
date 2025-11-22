import React, { useState, useEffect } from 'react'
import api from '../api'
import SimpleChart from './SimpleChart'
import LoadingSpinner from './LoadingSpinner'

export default function AnalyticsDashboard({ tenantId }) {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7d')

  useEffect(() => {
    loadAnalytics()
  }, [tenantId, timeRange])

  const loadAnalytics = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockData = {
        findings_trend: [
          { label: 'Mon', value: 12 },
          { label: 'Tue', value: 15 },
          { label: 'Wed', value: 8 },
          { label: 'Thu', value: 20 },
          { label: 'Fri', value: 18 },
          { label: 'Sat', value: 10 },
          { label: 'Sun', value: 14 },
        ],
        severity_distribution: [
          { label: 'Critical', value: 5 },
          { label: 'High', value: 12 },
          { label: 'Medium', value: 25 },
          { label: 'Low', value: 8 },
        ],
        category_distribution: [
          { label: 'IAM', value: 20 },
          { label: 'S3', value: 15 },
          { label: 'Logging', value: 15 },
        ],
        security_score_trend: [
          { label: 'Week 1', value: 65 },
          { label: 'Week 2', value: 70 },
          { label: 'Week 3', value: 75 },
          { label: 'Week 4', value: 80 },
        ],
      }
      setAnalytics(mockData)
    } catch (err) {
      console.error('Failed to load analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        No analytics data available
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Analytics</h3>
        <div className="flex space-x-2">
          {['7d', '30d', '90d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Findings Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Findings Trend
          </h4>
          <div style={{ height: '200px' }}>
            <SimpleChart data={analytics.findings_trend} type="line" height={200} color="blue" />
          </div>
        </div>

        {/* Severity Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Severity Distribution
          </h4>
          <div style={{ height: '200px' }}>
            <SimpleChart data={analytics.severity_distribution} type="bar" height={200} color="red" />
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Category Distribution
          </h4>
          <div style={{ height: '200px' }}>
            <SimpleChart data={analytics.category_distribution} type="bar" height={200} color="indigo" />
          </div>
        </div>

        {/* Security Score Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Security Score Trend
          </h4>
          <div style={{ height: '200px' }}>
            <SimpleChart data={analytics.security_score_trend} type="line" height={200} color="green" />
          </div>
        </div>
      </div>
    </div>
  )
}







