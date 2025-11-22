import React, { useState, useEffect } from 'react'
import api from '../api'
import { useToast } from '../contexts/ToastContext'

export default function ScanSchedule({ tenantId }) {
  const [schedule, setSchedule] = useState({
    enabled: false,
    frequency: 'daily',
    time: '00:00',
    day_of_week: 0,
    day_of_month: 1,
    timezone: 'UTC',
  })
  const [nextRunTime, setNextRunTime] = useState(null)
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    loadSchedule()
  }, [tenantId])

  const loadSchedule = async () => {
    try {
      const response = await api.get(`/schedules/${tenantId}`)
      if (response.data.schedule) {
        setSchedule({
          ...schedule,
          ...response.data.schedule,
        })
      }
      if (response.data.next_run_time) {
        setNextRunTime(response.data.next_run_time)
      }
    } catch (err) {
      console.error('Failed to load schedule:', err)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await api.put(`/schedules/${tenantId}`, schedule)
      setNextRunTime(response.data.next_run_time)
      showToast('Scan schedule saved successfully', 'success')
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to save schedule', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDisable = async () => {
    setLoading(true)
    try {
      await api.delete(`/schedules/${tenantId}`)
      setSchedule({ ...schedule, enabled: false })
      setNextRunTime(null)
      showToast('Scan schedule disabled', 'success')
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to disable schedule', 'error')
    } finally {
      setLoading(false)
    }
  }

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Scheduled Scans</h3>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={schedule.enabled}
              onChange={(e) => setSchedule({ ...schedule, enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {schedule.enabled && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Frequency
              </label>
              <select
                value={schedule.frequency}
                onChange={(e) => setSchedule({ ...schedule, frequency: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            {schedule.frequency === 'weekly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Day of Week
                </label>
                <select
                  value={schedule.day_of_week}
                  onChange={(e) => setSchedule({ ...schedule, day_of_week: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {dayNames.map((day, index) => (
                    <option key={index} value={index}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {schedule.frequency === 'monthly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Day of Month
                </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={schedule.day_of_month}
                    onChange={(e) => setSchedule({ ...schedule, day_of_month: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Time (24-hour format)
              </label>
              <input
                type="time"
                value={schedule.time}
                onChange={(e) => setSchedule({ ...schedule, time: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {nextRunTime && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">Next Scheduled Scan</p>
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  {new Date(nextRunTime).toLocaleString()}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Schedule'}
              </button>
              <button
                onClick={handleDisable}
                disabled={loading}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Disable
              </button>
            </div>
          </div>
        )}

        {!schedule.enabled && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">Enable scheduled scans to automatically run security scans at specified intervals.</p>
          </div>
        )}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <h4 className="text-sm font-bold text-blue-900 dark:text-blue-200 mb-2">How Scheduled Scans Work</h4>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-2 list-disc list-inside">
          <li>Scheduled scans run automatically at the specified time</li>
          <li>Scans are skipped if a scan is already running for the tenant</li>
          <li>You'll receive notifications when scheduled scans complete (if configured)</li>
          <li>The scheduler checks for due scans every minute</li>
        </ul>
      </div>
    </div>
  )
}

