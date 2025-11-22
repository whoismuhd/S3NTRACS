import React, { useState, useEffect } from 'react'
import api from '../api'
import { useToast } from '../contexts/ToastContext'
import LoadingSpinner from './LoadingSpinner'

const AVAILABLE_SCANNERS = [
  { id: 'IAM', name: 'IAM', description: 'Scan IAM users, roles, and policies for security issues' },
  { id: 'S3', name: 'S3', description: 'Scan S3 buckets for public access, encryption, and security misconfigurations' },
  { id: 'LOGGING', name: 'Logging', description: 'Scan CloudTrail and GuardDuty configuration for logging and monitoring' },
  { id: 'EC2', name: 'EC2', description: 'Scan EC2 Security Groups for open ports and overly permissive rules' },
  { id: 'EBS', name: 'EBS', description: 'Scan EBS volumes and snapshots for encryption status' },
  { id: 'RDS', name: 'RDS', description: 'Scan RDS instances and snapshots for public access and encryption' },
  { id: 'LAMBDA', name: 'Lambda', description: 'Scan Lambda functions for overly permissive roles and VPC configuration' },
  { id: 'CLOUDWATCH', name: 'CloudWatch', description: 'Scan CloudWatch Log Groups for retention and encryption settings' },
]

export default function ScannerSelection({ tenantId, enabledScanners: initialEnabledScanners, onUpdate }) {
  const [enabledScanners, setEnabledScanners] = useState(initialEnabledScanners || AVAILABLE_SCANNERS.map(s => s.id))
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    if (initialEnabledScanners) {
      setEnabledScanners(initialEnabledScanners)
    } else {
      // Default to all scanners if not set
      setEnabledScanners(AVAILABLE_SCANNERS.map(s => s.id))
    }
  }, [initialEnabledScanners])

  const handleToggleScanner = (scannerId) => {
    const newEnabled = enabledScanners.includes(scannerId)
      ? enabledScanners.filter(id => id !== scannerId)
      : [...enabledScanners, scannerId]
    setEnabledScanners(newEnabled)
  }

  const handleSave = async () => {
    if (enabledScanners.length === 0) {
      showToast('Please select at least one scanner', 'error')
      return
    }

    setSaving(true)
    try {
      await api.put(`/tenants/${tenantId}/scanners`, enabledScanners)
      showToast('Scanner preferences updated successfully', 'success')
      if (onUpdate) {
        onUpdate(enabledScanners)
      }
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to update scanner preferences', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner size="md" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Select Scanners</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Choose which AWS services you want to scan for security issues. Only selected scanners will run during scans.
        </p>
      </div>

      <div className="space-y-3">
        {AVAILABLE_SCANNERS.map((scanner) => {
          const isEnabled = enabledScanners.includes(scanner.id)
          return (
            <label
              key={scanner.id}
              className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                isEnabled
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={() => handleToggleScanner(scanner.id)}
                className="mt-1 h-5 w-5 text-blue-600 rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:bg-gray-700"
              />
              <div className="ml-3 flex-1">
                <div className="flex items-center">
                  <span className={`text-base font-medium ${isEnabled ? 'text-blue-900 dark:text-blue-200' : 'text-gray-900 dark:text-white'}`}>
                    {scanner.name}
                  </span>
                  {isEnabled && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200">
                      Enabled
                    </span>
                  )}
                </div>
                <p className={`text-sm mt-1 ${isEnabled ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}>
                  {scanner.description}
                </p>
              </div>
            </label>
          )
        })}
      </div>

      {enabledScanners.length === 0 && (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Warning:</strong> At least one scanner must be enabled to run scans.
          </p>
        </div>
      )}

      <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <p className="text-sm text-green-800 dark:text-green-200">
          <strong>Coming Soon:</strong> More AWS service scanners will be added in future updates to expand security coverage.
        </p>
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleSave}
          disabled={saving || enabledScanners.length === 0}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {saving ? (
            <>
              <LoadingSpinner size="sm" />
              <span className="ml-2">Saving...</span>
            </>
          ) : (
            'Save Scanner Preferences'
          )}
        </button>
      </div>
    </div>
  )
}

