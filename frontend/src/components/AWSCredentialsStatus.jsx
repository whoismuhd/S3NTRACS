import React, { useEffect, useState } from 'react'
import api from '../api'
import LoadingSpinner from './LoadingSpinner'

export default function AWSCredentialsStatus() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = async () => {
    try {
      setLoading(true)
      const response = await api.get('/aws-credentials/status')
      setStatus(response.data)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load credentials status')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="sm" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">Error Loading Status</h4>
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!status) {
    return null
  }

  const getStatusIcon = () => {
    if (status.valid) {
      if (status.source === 'iam_role') {
        return (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )
      } else {
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
      }
    } else {
      return (
        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      )
    }
  }

  const getStatusColor = () => {
    if (status.valid && status.source === 'iam_role') {
      return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
    } else if (status.valid) {
      return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
    } else {
      return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
    }
  }

  const getTextColor = () => {
    if (status.valid && status.source === 'iam_role') {
      return 'text-green-800 dark:text-green-200'
    } else if (status.valid) {
      return 'text-yellow-800 dark:text-yellow-200'
    } else {
      return 'text-red-800 dark:text-red-200'
    }
  }

  return (
    <div className={`border rounded-lg p-6 ${getStatusColor()}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start">
          {getStatusIcon()}
          <div className="ml-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              AWS Credentials Status
            </h3>
            <p className={`text-sm ${getTextColor()}`}>
              {status.message}
            </p>
          </div>
        </div>
        <button
          onClick={loadStatus}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          title="Refresh status"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {status.valid && (
        <div className="mb-4 space-y-2">
          {status.account_id && (
            <div className="text-sm">
              <span className="font-medium text-gray-700 dark:text-gray-300">AWS Account ID:</span>
              <span className="ml-2 font-mono text-gray-900 dark:text-white">{status.account_id}</span>
            </div>
          )}
          {status.arn && (
            <div className="text-sm">
              <span className="font-medium text-gray-700 dark:text-gray-300">ARN:</span>
              <span className="ml-2 font-mono text-xs text-gray-600 dark:text-gray-400 break-all">{status.arn}</span>
            </div>
          )}
          <div className="text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">Source:</span>
            <span className="ml-2 capitalize text-gray-900 dark:text-white">{status.source.replace('_', ' ')}</span>
          </div>
        </div>
      )}

      {status.recommendation && (
        <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Recommendation:</p>
        <p className="text-sm text-gray-700 dark:text-gray-300">{status.recommendation}</p>
      </div>
      )}

      {status.best_practices && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Security Best Practices:</h4>
          <ul className="space-y-2">
            {Object.entries(status.best_practices).map(([key, practice]) => (
              <li key={key} className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                <svg className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{practice}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <a
          href="/AWS_CREDENTIALS_SETUP.md"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          View detailed setup guide
        </a>
      </div>
    </div>
  )
}





