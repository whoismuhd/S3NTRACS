import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useTheme } from '../contexts/ThemeContext'
import LoadingSpinner from '../components/LoadingSpinner'
import TenantForm from '../components/TenantForm'
import StatCard from '../components/StatCard'
import Badge from '../components/Badge'
import ScanProgress from '../components/ScanProgress'
import Tooltip from '../components/Tooltip'
import Onboarding from '../components/Onboarding'
import OnboardingChecklist from '../components/OnboardingChecklist'
import { useOnboarding } from '../contexts/OnboardingContext'
import { track } from '../utils/analytics'
import { useDebounce } from '../hooks/useDebounce'
import { SkeletonCard } from '../components/SkeletonLoader'

export default function Dashboard() {
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [stats, setStats] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const { user } = useAuth()
  const { showToast } = useToast()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const {
    state: onboardingState,
    markModalSeen,
    dismissChecklist,
    completeTask,
    shouldShowModal,
    shouldShowChecklist,
  } = useOnboarding()

  useEffect(() => {
    loadTenants()
    loadStats()
    // Refresh stats every 30 seconds
    const interval = setInterval(loadStats, 30000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  useEffect(() => {
    if (tenants.length > 0) {
      completeTask('connectTenant')
      track('onboarding.tenant_connected', { count: tenants.length })
    }
  }, [tenants.length, completeTask])

  useEffect(() => {
    if (stats?.total_scans > 0) {
      completeTask('runScan')
      track('onboarding.scan_recorded', { totalScans: stats.total_scans })
    }
    if (stats?.total_findings > 0) {
      completeTask('reviewFindings')
      track('onboarding.findings_recorded', { totalFindings: stats.total_findings })
    }
  }, [stats?.total_scans, stats?.total_findings, completeTask])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const intent = params.get('intent')
    if (intent === 'new-tenant') {
      setShowForm(true)
      navigate(location.pathname, { replace: true })
    }
  }, [location, navigate])

  const loadTenants = useCallback(async () => {
    try {
      const response = await api.get('/tenants/')
      setTenants(response.data)
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to load tenants'
      setError(errorMsg)
      showToast(errorMsg, 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  const loadStats = useCallback(async () => {
    try {
      const response = await api.get('/statistics/dashboard')
      setStats(response.data)
    } catch (err) {
      // Stats are optional, don't show error
      console.error('Failed to load stats:', err)
    }
  }, [])

  const handleTenantCreated = (newTenant) => {
    setTenants([...tenants, newTenant])
    setShowForm(false)
    showToast('Tenant created successfully', 'success')
    loadStats()
  }

  const filteredTenants = useMemo(() => {
    if (!debouncedSearchTerm) return tenants
    const term = debouncedSearchTerm.toLowerCase()
    return tenants.filter((tenant) =>
      tenant.name.toLowerCase().includes(term) ||
      tenant.aws_account_id?.toLowerCase().includes(term)
    )
  }, [tenants, debouncedSearchTerm])

  const primaryTenant = tenants[0]

  const isViewer = user?.role === 'viewer'

  const quickActions = useMemo(() => {
    if (isViewer) {
      return []
    }
    return [
    {
      title: tenants.length === 0 ? 'Connect your first AWS account' : 'Add another AWS account',
      description: 'Securely connect via IAM role to begin monitoring.',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      onClick: () => {
        track('dashboard.quick_action_clicked', { action: 'add_tenant' })
        setShowForm(true)
      },
      disabled: false,
    },
    {
      title: 'Run a security scan',
      description: tenants.length === 0 ? 'Connect an account first to launch a scan.' : 'Baseline your posture in real time.',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      onClick: () => {
        if (!primaryTenant) {
          showToast('Connect an AWS account first to run your first scan.', 'info')
          track('dashboard.quick_action_clicked', { action: 'run_scan', blocked: true })
          return
        }
        track('dashboard.quick_action_clicked', { action: 'run_scan', tenantId: primaryTenant.id })
        navigate(`/tenants/${primaryTenant.id}?intent=run-scan`)
      },
      disabled: !primaryTenant,
    },
    {
      title: 'Share compliance reports',
      description: 'Track remediation progress and export for auditors.',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16h8m-8-4h8m-5-4h5a2 2 0 012 2v8a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2h5l4 4z" />
        </svg>
      ),
      onClick: () => {
        track('dashboard.quick_action_clicked', { action: 'view_reports' })
        navigate('/reports')
      },
      disabled: false,
    },
  ]
  }, [isViewer, tenants.length, primaryTenant, navigate, showToast])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-700 dark:text-gray-200 font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const allowOnboarding = !isViewer
  const showOnboardingModal = allowOnboarding && shouldShowModal && tenants.length === 0
  const showChecklist = allowOnboarding && shouldShowChecklist && tenants.length >= 0

  return (
    <div className="space-y-8 pb-8">
      {showOnboardingModal && <Onboarding onComplete={markModalSeen} />}
      
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Dashboard
              </h1>
              {user?.role === 'superadmin' && (
                <span className="px-2.5 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-semibold rounded-md">
                  ADMIN
                </span>
              )}
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              {user?.role === 'superadmin'
                ? 'Manage and monitor all tenant security postures'
                : 'View your tenant security posture'}
            </p>
          </div>
          {user?.role === 'superadmin' && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {showForm ? 'Cancel' : 'New Tenant'}
            </button>
          )}
        </div>

          {!isViewer && quickActions.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.title}
                onClick={action.onClick}
                disabled={action.disabled}
                className={`group relative flex items-start gap-3 rounded-lg border px-4 py-3 text-left transition-all ${
                  action.disabled
                    ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-400 cursor-not-allowed'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm'
                }`}
              >
                <div
                  className={`flex-shrink-0 p-2 rounded-lg ${
                    action.disabled
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                      : 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}
                >
                  {action.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${action.disabled ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>
                    {action.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{action.description}</p>
                </div>
                {!action.disabled && (
                  <svg className="w-4 h-4 text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
          )}
      </div>

      {showChecklist && (
        <OnboardingChecklist
          onDismiss={dismissChecklist}
          onRequestAddTenant={() => setShowForm(true)}
          primaryTenantId={primaryTenant?.id}
        />
      )}

      {/* Stats Overview */}
      {stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Tooltip content="Total number of AWS accounts being monitored">
            <div className="group">
              <StatCard
                title="Total Tenants"
                value={stats.total_tenants}
                color="indigo"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                }
              />
            </div>
          </Tooltip>
          <Tooltip content={`${stats.findings_by_severity.CRITICAL} critical and ${stats.findings_by_severity.HIGH} high severity findings requiring immediate attention`}>
            <div className="group">
              <StatCard
                title="High Priority"
                value={stats.findings_by_severity.CRITICAL + stats.findings_by_severity.HIGH}
                color="red"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                }
                subtitle={`${stats.findings_by_severity.CRITICAL} critical, ${stats.findings_by_severity.HIGH} high`}
              />
            </div>
          </Tooltip>
          <Tooltip content="Total security findings across all tenants">
            <div className="group">
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
            </div>
          </Tooltip>
          <Tooltip content="Total number of security scans performed">
            <div className="group">
              <StatCard
                title="Total Scans"
                value={stats.total_scans}
                color="green"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                }
              />
            </div>
          </Tooltip>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, idx) => (
            <SkeletonCard key={idx} />
          ))}
        </div>
      )}

      {/* Tenant Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 animate-fade-in">
          <TenantForm
            onSuccess={handleTenantCreated}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Tenants Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tenants</h2>
              <p className="mt-1.5 text-sm text-gray-700 dark:text-gray-200 font-medium">
                {tenants.length} {tenants.length === 1 ? 'tenant' : 'tenants'} total
              </p>
            </div>
            {tenants.length > 0 && (
              <div className="max-w-md w-full">
                <input
                  type="text"
                  placeholder="Search tenants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                />
              </div>
            )}
          </div>
        </div>

        {tenants.length === 0 ? (
          <div className="text-center py-20 px-8">
            <div className="max-w-md mx-auto">
              <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full blur-2xl opacity-50"></div>
                </div>
                <div className="relative">
                  <svg className="mx-auto h-24 w-24 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">No tenants yet</h3>
              <p className="text-base text-gray-700 dark:text-gray-200 mb-8 font-medium leading-relaxed">
                {user?.role === 'superadmin'
                  ? 'Get started by creating your first tenant to begin monitoring AWS security posture.'
                  : 'No tenants assigned to your account. Contact your administrator for access.'}
              </p>
              {user?.role === 'superadmin' && (
                <button
                  onClick={() => setShowForm(true)}
                  className="group inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="w-5 h-5 mr-2 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create First Tenant
                </button>
              )}
            </div>
          </div>
        ) : filteredTenants.length === 0 ? (
          <div className="text-center py-16 px-8">
            <svg className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No tenants found</h3>
            <p className="text-sm text-gray-700 dark:text-gray-200 font-medium">No tenants match "{searchTerm}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {filteredTenants.map((tenant, index) => (
              <TenantCard key={tenant.id} tenant={tenant} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TenantCard({ tenant, index }) {
  const [latestScan, setLatestScan] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLatestScan()
    // Poll for scan updates every 10 seconds
    const interval = setInterval(loadLatestScan, 10000)
    return () => clearInterval(interval)
  }, [tenant.id])

  const loadLatestScan = async () => {
    try {
      const response = await api.get(`/scans/${tenant.id}/latest`)
      setLatestScan(response.data)
    } catch (err) {
      setLatestScan(null)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return { text: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', badge: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300', gradient: 'from-green-400 to-green-600' }
    if (score >= 60) return { text: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20', badge: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300', gradient: 'from-yellow-400 to-yellow-600' }
    return { text: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', badge: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300', gradient: 'from-red-400 to-red-600' }
  }

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Poor'
  }

  const calculateScore = () => {
    if (!latestScan?.summary) return null
    const by_severity = latestScan.summary.by_severity || {}
    const critical = by_severity.CRITICAL || 0
    const high = by_severity.HIGH || 0
    const medium = by_severity.MEDIUM || 0
    const low = by_severity.LOW || 0
    if (critical + high + medium + low === 0) return 100
    // More realistic scoring: CRITICAL=-35, HIGH=-20, MEDIUM=-8, LOW=-2
    const score = 100 - (critical * 35 + high * 20 + medium * 8 + low * 2)
    return Math.max(0, Math.min(100, score))
  }

  const score = calculateScore()
  const scoreColors = score !== null ? getScoreColor(score) : null

  return (
    <Link
      to={`/tenants/${tenant.id}`}
      className="group block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden hover:border-blue-300 dark:hover:border-blue-600"
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {tenant.name}
              </h3>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs font-mono text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded-md">
                {tenant.aws_account_id || 'No AWS Account ID'}
              </p>
              {tenant.aws_account_id && (
                <Tooltip content="AWS Account ID">
                  <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </Tooltip>
              )}
              {tenant.enabled_scanners && tenant.enabled_scanners.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Scanners:</span>
                  {tenant.enabled_scanners.map((scanner) => (
                    <span
                      key={scanner}
                      className="text-xs font-medium px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    >
                      {scanner}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          {latestScan && (
            <div className="flex-shrink-0 ml-2">
              <ScanProgress status={latestScan.status} />
            </div>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="sm" />
          </div>
        ) : latestScan ? (
          <div className="space-y-4">
            {score !== null && (
              <div className={`${scoreColors.bg} p-4 rounded-xl border border-gray-200 dark:border-gray-700`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Security Score</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${scoreColors.text}`}>{score}/100</span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${scoreColors.badge}`}>
                      {getScoreLabel(score)}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${scoreColors.gradient} transition-all duration-1000 ease-out shadow-sm`}
                    style={{ width: `${score}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            <Tooltip content={`Scan started at ${new Date(latestScan.started_at).toLocaleString()}`}>
              <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-200 font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Last scan: {new Date(latestScan.started_at).toLocaleDateString()}</span>
              </div>
            </Tooltip>
            
            {latestScan.summary && (
              <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                {latestScan.summary.by_severity?.CRITICAL > 0 && (
                  <Badge variant="danger" size="sm">
                    {latestScan.summary.by_severity.CRITICAL} Critical
                  </Badge>
                )}
                {latestScan.summary.by_severity?.HIGH > 0 && (
                  <Badge variant="danger" size="sm">
                    {latestScan.summary.by_severity.HIGH} High
                  </Badge>
                )}
                {latestScan.summary.by_severity?.MEDIUM > 0 && (
                  <Badge variant="warning" size="sm">
                    {latestScan.summary.by_severity.MEDIUM} Medium
                  </Badge>
                )}
                {latestScan.summary.by_severity?.LOW > 0 && (
                  <Badge variant="info" size="sm">
                    {latestScan.summary.by_severity.LOW} Low
                  </Badge>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/30">
            <svg className="mx-auto h-10 w-10 text-gray-500 dark:text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">No scans yet</p>
            <p className="text-xs text-gray-600 dark:text-gray-300">Run your first scan to get started</p>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300">
          View Details
          <svg className="ml-1.5 w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  )
}
