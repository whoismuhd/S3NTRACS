import React, { useState, useEffect } from 'react'
import api from '../api'
import { useToast } from '../contexts/ToastContext'

export default function NotificationSettings({ tenantId }) {
  const [preferences, setPreferences] = useState({
    email_enabled: false,
    email_recipients: [],
    slack_enabled: false,
    slack_webhook_url: '',
    min_severity: 'MEDIUM',
    notify_on_scan_complete: true,
    notify_on_critical_only: false,
  })
  const [newEmail, setNewEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState({ email: false, slack: false })
  const { showToast } = useToast()

  useEffect(() => {
    loadPreferences()
  }, [tenantId])

  const loadPreferences = async () => {
    try {
      const response = await api.get(`/notifications/preferences/${tenantId}`)
      if (response.data.preferences) {
        setPreferences({
          email_enabled: response.data.preferences.email_enabled || false,
          email_recipients: response.data.preferences.email_recipients || [],
          slack_enabled: response.data.preferences.slack_enabled || false,
          slack_webhook_url: response.data.preferences.slack_webhook_url || '',
          min_severity: response.data.preferences.min_severity || 'MEDIUM',
          notify_on_scan_complete: response.data.preferences.notify_on_scan_complete !== false,
          notify_on_critical_only: response.data.preferences.notify_on_critical_only || false,
        })
      }
    } catch (err) {
      console.error('Failed to load preferences:', err)
      showToast('Failed to load notification preferences', 'error')
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await api.put(`/notifications/preferences/${tenantId}`, preferences)
      showToast('Notification preferences saved successfully', 'success')
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to save preferences', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAddEmail = () => {
    if (newEmail && !preferences.email_recipients.includes(newEmail)) {
      setPreferences({
        ...preferences,
        email_recipients: [...preferences.email_recipients, newEmail],
      })
      setNewEmail('')
    }
  }

  const handleRemoveEmail = (email) => {
    setPreferences({
      ...preferences,
      email_recipients: preferences.email_recipients.filter((e) => e !== email),
    })
  }

  const handleTestEmail = async () => {
    if (preferences.email_recipients.length === 0) {
      showToast('Please add at least one email recipient', 'error')
      return
    }

    setTesting({ ...testing, email: true })
    try {
      await api.post(`/notifications/test/email/${tenantId}`, preferences.email_recipients)
      showToast('Test email sent successfully!', 'success')
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to send test email', 'error')
    } finally {
      setTesting({ ...testing, email: false })
    }
  }

  const handleTestSlack = async () => {
    if (!preferences.slack_webhook_url) {
      showToast('Please enter a Slack webhook URL', 'error')
      return
    }

    setTesting({ ...testing, slack: true })
    try {
      await api.post(`/notifications/test/slack/${tenantId}`, preferences.slack_webhook_url)
      showToast('Test Slack message sent successfully!', 'success')
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to send test Slack message', 'error')
    } finally {
      setTesting({ ...testing, slack: false })
    }
  }

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Email Notifications</h3>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.email_enabled}
              onChange={(e) => setPreferences({ ...preferences, email_enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {preferences.email_enabled && (
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Recipients
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddEmail()}
                  placeholder="email@example.com"
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddEmail}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Add
                </button>
              </div>
              {preferences.email_recipients.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {preferences.email_recipients.map((email) => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm"
                    >
                      {email}
                      <button
                        onClick={() => handleRemoveEmail(email)}
                        className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={handleTestEmail}
              disabled={testing.email || preferences.email_recipients.length === 0}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testing.email ? 'Sending...' : 'Send Test Email'}
            </button>
          </div>
        )}
      </div>

      {/* Slack Notifications */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 5.042a2.528 2.528 0 0 1-2.52-2.52A2.528 2.528 0 0 1 18.956 0a2.528 2.528 0 0 1 2.523 2.522v2.52h-2.523zM18.956 6.313a2.528 2.528 0 0 1 2.523 2.521 2.528 2.528 0 0 1-2.523 2.521h-2.52a2.528 2.528 0 0 1-2.521-2.521 2.528 2.528 0 0 1 2.521-2.521h2.52zM15.165 8.834a2.528 2.528 0 0 1 2.522-2.521 2.528 2.528 0 0 1 2.521 2.521v6.313A2.528 2.528 0 0 1 17.687 24a2.528 2.528 0 0 1-2.522-2.522V8.834zM15.165 18.956a2.528 2.528 0 0 1 2.522 2.523 2.528 2.528 0 0 1-2.522 2.52 2.528 2.528 0 0 1-2.521-2.52v-2.523h2.521z" />
            </svg>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Slack Notifications</h3>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.slack_enabled}
              onChange={(e) => setPreferences({ ...preferences, slack_enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
          </label>
        </div>

        {preferences.slack_enabled && (
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Slack Webhook URL
              </label>
              <input
                type="url"
                value={preferences.slack_webhook_url}
                onChange={(e) => setPreferences({ ...preferences, slack_webhook_url: e.target.value })}
                placeholder="https://hooks.slack.com/services/..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Create a webhook at{' '}
                <a href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                  api.slack.com/messaging/webhooks
                </a>
              </p>
            </div>
            <button
              onClick={handleTestSlack}
              disabled={testing.slack || !preferences.slack_webhook_url}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testing.slack ? 'Sending...' : 'Send Test Message'}
            </button>
          </div>
        )}
      </div>

      {/* Notification Rules */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Notification Rules</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Minimum Severity
            </label>
            <select
              value={preferences.min_severity}
              onChange={(e) => setPreferences({ ...preferences, min_severity: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="CRITICAL">Critical Only</option>
              <option value="HIGH">High and Above</option>
              <option value="MEDIUM">Medium and Above</option>
              <option value="LOW">All Findings</option>
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Only findings with this severity or higher will trigger notifications
            </p>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Notify on Scan Complete</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Send notification when a scan finishes
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.notify_on_scan_complete}
                onChange={(e) => setPreferences({ ...preferences, notify_on_scan_complete: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Critical Findings Only</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Only notify for critical findings (overrides minimum severity)
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.notify_on_critical_only}
                onChange={(e) => setPreferences({ ...preferences, notify_on_critical_only: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  )
}

