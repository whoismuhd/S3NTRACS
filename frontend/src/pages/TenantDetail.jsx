import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom'
import api from '../api'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import Badge from '../components/Badge'
import StatCard from '../components/StatCard'
import ScanProgress from '../components/ScanProgress'
import Tooltip from '../components/Tooltip'
import RemediationAssistant from '../components/RemediationAssistant'
import NotificationSettings from '../components/NotificationSettings'
import ScanSchedule from '../components/ScanSchedule'
import ScannerSelection from '../components/ScannerSelection'
import { track } from '../utils/analytics'
import { useDebounce } from '../hooks/useDebounce'
import { SkeletonTable } from '../components/SkeletonLoader'

export default function TenantDetail() {
  const { tenantId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [tenant, setTenant] = useState(null)
  const [findings, setFindings] = useState([])
  const [scans, setScans] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const [activeTab, setActiveTab] = useState('findings') // 'findings', 'notifications', 'schedule', or 'scanners'
  const [selectedFindings, setSelectedFindings] = useState(new Set())
  const { showToast } = useToast()
  const { user } = useAuth()
  const runIntentHandledRef = useRef(false)
  const isViewer = user?.role === 'viewer'
  const canManageTenant = user && !isViewer

  const loadData = useCallback(async () => {
    try {
      const [tenantRes, findingsRes, scansRes, statsRes] = await Promise.all([
        api.get(`/tenants/${tenantId}`),
        api.get(`/findings/${tenantId}`),
        api.get(`/scans/${tenantId}`),
        api.get(`/statistics/tenant/${tenantId}`).catch(() => null),
      ])
      setTenant(tenantRes.data)
      setFindings(findingsRes.data)
      setScans(scansRes.data)
      setStats(statsRes?.data || null)
      setLoading(false)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load data')
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    loadData()
    // Poll for scan updates every 5 seconds
    const interval = setInterval(() => {
      loadData()
    }, 5000)
    return () => clearInterval(interval)
  }, [loadData])

  useEffect(() => {
    if (isViewer && activeTab !== 'findings') {
      setActiveTab('findings')
    }
  }, [isViewer, activeTab])

  const handleRunScan = async () => {
    setScanning(true)
    setError('')
    track('scan.start_requested', { tenantId, source: 'tenant_detail' })
    try {
      await api.post(`/scans/run/${tenantId}`)
      showToast('Scan started successfully', 'success')
      track('scan.started', { tenantId, source: 'tenant_detail' })
      setTimeout(() => {
        loadData()
      }, 2000)
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to start scan'
      setError(errorMsg)
      showToast(errorMsg, 'error')
      track('scan.start_failed', { tenantId, message: errorMsg })
    } finally {
      setScanning(false)
    }
  }

  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem('token')
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const url = `${apiUrl}/exports/findings/${tenantId}/csv`
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (!response.ok) throw new Error('Export failed')
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `findings-${tenantId}-${new Date().toISOString()}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(downloadUrl)
      document.body.removeChild(a)
      showToast('Findings exported successfully', 'success')
    } catch (err) {
      showToast('Failed to export findings', 'error')
      console.error(err)
    }
  }

  const handleCleanupDisabledScanners = async () => {
    if (!window.confirm('This will permanently delete all findings from disabled scanners (EC2, EBS, RDS, Lambda, CloudWatch). Continue?')) {
      return
    }
    
    try {
      const response = await api.delete(`/findings/${tenantId}/cleanup-disabled-scanners`)
      showToast(`Cleaned up ${response.data.deleted_count} old findings from disabled scanners`, 'success')
      loadData()
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to cleanup old findings', 'error')
    }
  }


  // Get enabled scanners from tenant, default to all if not set
  const enabledCategories = tenant?.enabled_scanners || ['IAM', 'S3', 'LOGGING', 'EC2', 'EBS', 'RDS', 'LAMBDA', 'CLOUDWATCH']
  
  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      // Filter out findings from disabled scanners
      if (!enabledCategories.includes(f.category)) return false
      
      if (severityFilter && f.severity !== severityFilter) return false
      if (categoryFilter && f.category !== categoryFilter) return false
      if (debouncedSearchTerm) {
        const term = debouncedSearchTerm.toLowerCase()
        const matchesTitle = f.title.toLowerCase().includes(term)
        const matchesDescription = f.description?.toLowerCase().includes(term)
        const matchesResourceId = f.resource_id?.toLowerCase().includes(term)
        if (!matchesTitle && !matchesDescription && !matchesResourceId) return false
      }
      return true
    })
  }, [findings, enabledCategories, severityFilter, categoryFilter, debouncedSearchTerm])

  const handleBulkMarkFixed = async () => {
    if (selectedFindings.size === 0) return
    
    try {
      const findingIds = Array.from(selectedFindings)
      await api.post(`/findings/${tenantId}/bulk-mark-fixed`, findingIds)
      showToast(`Marked ${findingIds.length} findings as fixed`, 'success')
      setSelectedFindings(new Set())
      loadData()
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to mark findings as fixed', 'error')
    }
  }

  const handleSelectFinding = (findingId) => {
    const newSelected = new Set(selectedFindings)
    if (newSelected.has(findingId)) {
      newSelected.delete(findingId)
    } else {
      newSelected.add(findingId)
    }
    setSelectedFindings(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedFindings.size === filteredFindings.length) {
      setSelectedFindings(new Set())
    } else {
      setSelectedFindings(new Set(filteredFindings.map(f => f.id)))
    }
  }

  const latestScan = scans[0]
  const runningScan = scans.find(s => s.status === 'running')
  // Only show failed scan error if it's the most recent scan and not a credentials/BotoCoreError
  const failedScan = scans.find(s => {
    if (s.status === 'failed' && s.summary?.error) {
      // Don't show credentials errors or BotoCoreError - they're likely fixed
      const errorText = s.summary.error.toLowerCase()
      const isCredentialsError = errorText.includes('credentials not found') || 
                                 errorText.includes('unable to locate credentials') ||
                                 errorText.includes('aws credentials not found') ||
                                 errorText.includes('botocoreerror')
      
      // Only show if it's the latest scan and not a credentials error
      const isLatest = latestScan && s.id === latestScan.id
      return isLatest && !isCredentialsError
    }
    return false
  })

  useEffect(() => {
    if (isViewer) {
      return
    }
    const params = new URLSearchParams(location.search)
    const intent = params.get('intent')
    if (intent === 'run-scan' && !runIntentHandledRef.current) {
      runIntentHandledRef.current = true
      track('onboarding.auto_run_scan_intent', { tenantId, runningScan: Boolean(runningScan) })
      if (!runningScan && !scanning) {
        handleRunScan()
      } else {
        showToast('A scan is already running for this tenant.', 'info')
      }
      params.delete('intent')
      const nextSearch = params.toString()
      const targetPath = nextSearch ? `${location.pathname}?${nextSearch}` : location.pathname
      navigate(targetPath, { replace: true })
    }
  }, [handleRunScan, location.pathname, location.search, navigate, runningScan, scanning, showToast, tenantId, isViewer])

  const getSeverityIcon = (severity) => {
    const icons = {
      CRITICAL: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      ),
      HIGH: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      ),
    }
    return icons[severity] || null
  }

  if (loading && !tenant) {
    return (
      <div className="flex justify-center items-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error && !tenant) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-400 dark:text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-red-800 dark:text-red-200">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{tenant?.name}</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                AWS Account ID: <span className="font-mono text-gray-900 dark:text-gray-100">{tenant?.aws_account_id || 'N/A'}</span>
              </p>
              {tenant?.enabled_scanners && tenant.enabled_scanners.length > 0 && (
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Enabled Scanners:</span>
                  {tenant.enabled_scanners.map((scanner) => (
                    <span
                      key={scanner}
                      className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                    >
                      {scanner}
                    </span>
                  ))}
                  {!isViewer && (
                    <button
                      onClick={() => setActiveTab('scanners')}
                      className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    >
                      Change
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="Total Findings"
            value={stats.total_findings}
            color="blue"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
          <StatCard
            title="Critical"
            value={stats.findings_by_severity.CRITICAL || 0}
            color="red"
            icon={
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            }
          />
          <StatCard
            title="High"
            value={stats.findings_by_severity.HIGH || 0}
            color="red"
            icon={
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            }
          />
          <StatCard
            title="Last Scan"
            value={latestScan ? new Date(latestScan.started_at).toLocaleDateString() : 'Never'}
            color="green"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            }
            subtitle={
              latestScan ? (
                <div className="mt-1">
                  <ScanProgress status={latestScan.status} className="text-xs" />
                </div>
              ) : (
                ''
              )
            }
          />
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('findings')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'findings'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Findings
            </button>
            {!isViewer && (
              <>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'notifications'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  Notifications
                </button>
                <button
                  onClick={() => setActiveTab('schedule')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'schedule'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  Schedule
                </button>
                <button
                  onClick={() => setActiveTab('scanners')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'scanners'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  Scanners
                </button>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {!isViewer && activeTab === 'notifications' ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <NotificationSettings tenantId={tenantId} />
        </div>
      ) : !isViewer && activeTab === 'schedule' ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <ScanSchedule tenantId={tenantId} />
        </div>
      ) : !isViewer && activeTab === 'scanners' ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <ScannerSelection 
            tenantId={tenantId} 
            enabledScanners={tenant?.enabled_scanners}
            onUpdate={(scanners) => {
              setTenant({ ...tenant, enabled_scanners: scanners })
            }}
          />
        </div>
      ) : (
        <>
          {/* Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            {failedScan && failedScan.summary?.error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-400 dark:text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">Last Scan Failed</h4>
                    <p className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap">{failedScan.summary.error}</p>
                  </div>
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-3 items-center">
          {!isViewer && (!tenant?.enabled_scanners || tenant.enabled_scanners.length === 0) && (
            <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>No scanners enabled.</strong> Go to the <button onClick={() => setActiveTab('scanners')} className="underline font-semibold">Scanners tab</button> to select which AWS services you want to scan.
                  </p>
                </div>
              </div>
            </div>
          )}
          {isViewer && (
            <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300">
              You have read-only access to this tenant. Contact an administrator to run scans or update schedules and scanners.
            </div>
          )}
          {!isViewer && (
            <Tooltip content={runningScan ? "A scan is currently running. Please wait for it to complete." : "Start a new security scan for this tenant (only enabled scanners will run)"}>
              <button
                onClick={handleRunScan}
                disabled={scanning || runningScan || !tenant?.enabled_scanners || tenant.enabled_scanners.length === 0}
                className="inline-flex items-center px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
              >
              {scanning || runningScan ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {runningScan ? 'Scan Running...' : 'Starting Scan...'}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Run Scan
                </>
              )}
            </button>
            </Tooltip>
          )}
          <Tooltip content="View compliance report with framework mappings">
            <Link
              to={`/reports/${tenantId}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all transform hover:scale-105 active:scale-95"
            >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
              View Report
            </Link>
          </Tooltip>
          <Tooltip content="Download findings as CSV file">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all transform hover:scale-105 active:scale-95"
            >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
              Export CSV
            </button>
          </Tooltip>
          {!isViewer && findings.some(f => !enabledCategories.includes(f.category)) && (
            <Tooltip content="Remove old findings from disabled scanners (EC2, EBS, RDS, Lambda, CloudWatch)">
              <button
                onClick={handleCleanupDisabledScanners}
                className="inline-flex items-center px-4 py-2 border border-orange-300 dark:border-orange-700 rounded-lg shadow-sm text-sm font-medium text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Cleanup Old Findings
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search findings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Severity</label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Categories</option>
              {enabledCategories.includes('IAM') && <option value="IAM">IAM</option>}
              {enabledCategories.includes('S3') && <option value="S3">S3</option>}
              {enabledCategories.includes('LOGGING') && <option value="LOGGING">Logging</option>}
              {enabledCategories.includes('EC2') && <option value="EC2">EC2</option>}
              {enabledCategories.includes('EBS') && <option value="EBS">EBS</option>}
              {enabledCategories.includes('RDS') && <option value="RDS">RDS</option>}
              {enabledCategories.includes('LAMBDA') && <option value="LAMBDA">Lambda</option>}
              {enabledCategories.includes('CLOUDWATCH') && <option value="CLOUDWATCH">CloudWatch</option>}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSeverityFilter('')
                setCategoryFilter('')
                setSearchTerm('')
              }}
              className="w-full px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Findings Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {canManageTenant && (
              <input
                type="checkbox"
                checked={selectedFindings.size > 0 && selectedFindings.size === filteredFindings.length}
                onChange={handleSelectAll}
                className="h-4 w-4 text-blue-600 rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500"
              />
            )}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Findings ({filteredFindings.length})
            </h3>
          </div>
          {canManageTenant && selectedFindings.size > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">{selectedFindings.size} selected</span>
              <button
                onClick={handleBulkMarkFixed}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Mark as Fixed
              </button>
              <button
                onClick={() => setSelectedFindings(new Set())}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
              >
                Clear
              </button>
            </div>
          )}
        </div>
        {loading && findings.length === 0 ? (
          <div className="p-6">
            <SkeletonTable rows={5} cols={1} />
          </div>
        ) : filteredFindings.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 mb-6">
              <svg className="h-10 w-10 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No findings found</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
              {findings.length === 0
                ? 'No findings have been discovered yet. Run a scan to identify security issues in your AWS account.'
                : 'No findings match your current filters. Try adjusting your search or filter criteria.'}
            </p>
            {!isViewer && findings.length === 0 && (
              <button
                onClick={handleRunScan}
                disabled={scanning || runningScan}
                className="inline-flex items-center px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Run First Scan
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredFindings.map((finding, idx) => (
              <div key={finding.id} className={`px-6 py-4 hover:bg-blue-50 dark:hover:bg-gray-700/50 transition-all duration-200 ${idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/50'} ${selectedFindings.has(finding.id) ? 'bg-blue-100 dark:bg-blue-900/30' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  {canManageTenant && (
                    <input
                      type="checkbox"
                      checked={selectedFindings.has(finding.id)}
                      onChange={() => handleSelectFinding(finding.id)}
                      className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <Tooltip content={`${finding.severity} severity security finding`}>
                        <Badge
                          variant={
                            finding.severity === 'CRITICAL' || finding.severity === 'HIGH'
                              ? 'danger'
                              : finding.severity === 'MEDIUM'
                              ? 'warning'
                              : 'info'
                          }
                          size="sm"
                        >
                          {getSeverityIcon(finding.severity)}
                          <span className="ml-1">{finding.severity}</span>
                        </Badge>
                      </Tooltip>
                      <Tooltip content={`${finding.category} category finding`}>
                        <Badge variant="default" size="sm">
                          {finding.category}
                        </Badge>
                      </Tooltip>
                      {finding.mapped_control && (
                        <Tooltip content={`Compliance framework control mapping`}>
                          <Badge variant="info" size="sm">
                            {finding.mapped_control}
                          </Badge>
                        </Tooltip>
                      )}
                      {finding.resource_id && (
                        <Tooltip content={`AWS Resource: ${finding.resource_id}`}>
                          <span className="text-xs font-mono text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded border border-gray-200 dark:border-gray-600">
                            {finding.resource_id}
                          </span>
                        </Tooltip>
                      )}
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                      {finding.title}
                    </h4>
                    {finding.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{finding.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                      {finding.resource_id && (
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          {finding.resource_id}
                        </span>
                      )}
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(finding.created_at).toLocaleString()}
                      </span>
                    </div>
                    {finding.remediation && (
                      <RemediationAssistant 
                        finding={finding}
                        onMarkAsFixed={
                          canManageTenant
                            ? async (findingId) => {
                                try {
                                  await api.post(`/findings/${tenantId}/${findingId}/mark-fixed`)
                                  showToast('Finding marked as fixed. It will be verified on the next scan.', 'success')
                                  track('finding_marked_as_fixed', { findingId, tenantId })
                                  loadData()
                                } catch (err) {
                                  showToast(err.response?.data?.detail || 'Failed to mark finding as fixed', 'error')
                                  track('finding_mark_fixed_failed', { findingId, tenantId, error: err.message })
                                }
                              }
                            : null
                        }
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
        </>
      )}
    </div>
  )
}
