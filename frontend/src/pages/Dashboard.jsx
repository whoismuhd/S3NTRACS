import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import LoadingSpinner from '../components/LoadingSpinner'
import TenantForm from '../components/TenantForm'
import StatCard from '../components/StatCard'
import Badge from '../components/Badge'

export default function Dashboard() {
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [stats, setStats] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const { user } = useAuth()
  const { showToast } = useToast()

  useEffect(() => {
    loadTenants()
    loadStats()
    // Refresh stats every 30 seconds
    const interval = setInterval(loadStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadTenants = async () => {
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
  }

  const loadStats = async () => {
    try {
      const response = await api.get('/statistics/dashboard')
      setStats(response.data)
    } catch (err) {
      // Stats are optional, don't show error
      console.error('Failed to load stats:', err)
    }
  }

  const handleTenantCreated = (newTenant) => {
    setTenants([...tenants, newTenant])
    setShowForm(false)
    showToast('Tenant created successfully', 'success')
    loadStats()
  }

  const filteredTenants = tenants.filter((tenant) =>
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.aws_account_id?.includes(searchTerm)
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            {user?.role === 'superadmin'
              ? 'Manage and monitor all tenant security postures'
              : 'View your tenant security posture'}
          </p>
        </div>
        {user?.role === 'superadmin' && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {showForm ? 'Cancel' : 'New Tenant'}
          </button>
        )}
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      )}

      {/* Tenant Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-fade-in">
          <TenantForm
            onSuccess={handleTenantCreated}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Tenants Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Tenants</h2>
              <p className="mt-1 text-sm text-gray-600">
                {tenants.length} {tenants.length === 1 ? 'tenant' : 'tenants'} total
              </p>
            </div>
            {tenants.length > 0 && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search tenants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            )}
          </div>
        </div>

        {tenants.length === 0 ? (
          <div className="text-center py-16">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No tenants</h3>
            <p className="mt-1 text-sm text-gray-500">
              {user?.role === 'superadmin'
                ? 'Get started by creating a new tenant.'
                : 'No tenants assigned to your account.'}
            </p>
            {user?.role === 'superadmin' && (
              <div className="mt-6">
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Tenant
                </button>
              </div>
            )}
          </div>
        ) : filteredTenants.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">No tenants found matching "{searchTerm}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {filteredTenants.map((tenant) => (
              <TenantCard key={tenant.id} tenant={tenant} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TenantCard({ tenant }) {
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'green'
      case 'running':
        return 'blue'
      case 'failed':
        return 'red'
      case 'pending':
        return 'yellow'
      default:
        return 'default'
    }
  }

  const calculateScore = () => {
    if (!latestScan?.summary) return null
    const total = latestScan.summary.total_findings || 0
    const critical = latestScan.summary.by_severity?.CRITICAL || 0
    const high = latestScan.summary.by_severity?.HIGH || 0
    if (total === 0) return 100
    const score = 100 - (critical * 20 + high * 10 + (total - critical - high) * 5)
    return Math.max(0, Math.min(100, score))
  }

  const score = calculateScore()

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{tenant.name}</h3>
            <p className="text-sm text-gray-500">
              {tenant.aws_account_id || 'No AWS Account ID'}
            </p>
          </div>
          {latestScan && (
            <Badge variant={getStatusColor(latestScan.status)} size="sm">
              {latestScan.status}
            </Badge>
          )}
        </div>

        {loading ? (
          <div className="mt-4 flex items-center justify-center py-4">
            <LoadingSpinner size="sm" />
          </div>
        ) : latestScan ? (
          <div className="mt-4 space-y-3">
            {score !== null && (
              <div>
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>Security Score</span>
                  <span className="font-semibold">{score}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${score}%` }}
                  ></div>
                </div>
              </div>
            )}
            <div className="text-xs text-gray-500">
              Last scan: {new Date(latestScan.started_at).toLocaleString()}
            </div>
            {latestScan.summary && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
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
          <div className="mt-4 text-center py-4 border border-dashed border-gray-300 rounded-lg">
            <p className="text-sm text-gray-500">No scans yet</p>
            <p className="text-xs text-gray-400 mt-1">Run your first scan to get started</p>
          </div>
        )}
      </div>
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <Link
          to={`/tenants/${tenant.id}`}
          className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          View details
          <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  )
}
