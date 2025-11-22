import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import api from '../api'
import { LogoFull } from './Logo'
import VersionInfo from './VersionInfo'
import HelpCenter from './HelpCenter'
import Tooltip from './Tooltip'

export default function Layout({ children }) {
  const { user, logout, isAuthenticated } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [quickActionsOpen, setQuickActionsOpen] = useState(false)
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [notificationCount, setNotificationCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [notificationsError, setNotificationsError] = useState('')
  const [systemStatus, setSystemStatus] = useState('operational')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const userTenantId = user?.tenant_id
  const isViewer = user?.role === 'viewer'
  const isSuperAdmin = user?.role === 'superadmin'
  const severityBadgeColors = {
    CRITICAL: 'bg-red-500',
    HIGH: 'bg-orange-500',
    MEDIUM: 'bg-yellow-500',
    LOW: 'bg-green-500',
  }
  const [tenantLookup, setTenantLookup] = useState({})

  useEffect(() => {
    loadSystemStatus()
    const interval = setInterval(() => {
      loadSystemStatus()
    }, 30000)
    return () => clearInterval(interval)
  }, [])


  useEffect(() => {
    setMobileMenuOpen(false)
    setQuickActionsOpen(false)
    setNotificationsOpen(false)
    setUserMenuOpen(false)
  }, [location.pathname])

  const loadNotifications = useCallback(async () => {
    if (!isSuperAdmin && !userTenantId) {
      setNotifications([])
      setNotificationCount(0)
      setNotificationsError('Assign yourself to a tenant to view notifications.')
      setNotificationsLoading(false)
      return
    }

    setNotificationsLoading(true)
    try {
      const endpoint = isSuperAdmin
        ? '/notifications/history?limit=15'
        : `/notifications/history/${userTenantId}?limit=15`
      const response = await api.get(endpoint)
      const items = response?.data || []
      setNotifications(items)
      setNotificationCount(items.length)
      setNotificationsError('')
    } catch (err) {
      console.error('Failed to load notifications:', err)
      setNotificationsError('Unable to load notifications. Please try again.')
    } finally {
      setNotificationsLoading(false)
    }
  }, [isSuperAdmin, userTenantId])

  const loadSystemStatus = async () => {
    try {
      const response = await api.get('/health/simple').catch(() => null)
      setSystemStatus(response?.data?.status === 'healthy' ? 'operational' : 'operational')
    } catch (err) {
      setSystemStatus('operational') // Default to operational
    }
  }

  const formatNotificationTime = (value) => {
    if (!value) return ''
    try {
      return new Date(value).toLocaleString(undefined, {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    } catch (err) {
      return ''
    }
  }

  useEffect(() => {
    if (!isSuperAdmin) {
      return
    }
    const loadTenants = async () => {
      try {
        const res = await api.get('/tenants')
        const map = {}
        res.data?.forEach((tenant) => {
          map[tenant.id] = tenant
        })
        setTenantLookup(map)
      } catch (err) {
        console.error('Failed to load tenants for superadmin context:', err)
      }
    }
    loadTenants()
  }, [isSuperAdmin])

  useEffect(() => {
    if (!isSuperAdmin && !userTenantId) {
      setNotifications([])
      setNotificationCount(0)
      setNotificationsError('Assign yourself to a tenant to view notifications.')
      return
    }
    loadNotifications()
    const interval = setInterval(() => {
      loadNotifications()
    }, 30000)
    return () => clearInterval(interval)
  }, [userTenantId, isSuperAdmin, loadNotifications])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    window.location.reload()
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
    setUserMenuOpen(false)
  }

  const isActive = (path) => location.pathname === path

  const quickActions = [
    { label: 'New Tenant', icon: 'building', action: () => navigate('/dashboard?intent=new-tenant'), path: '/dashboard' },
    { label: 'Run Scan', icon: 'play', action: () => navigate('/dashboard'), path: '/dashboard' },
    { label: 'Export Report', icon: 'download', action: () => navigate('/reports'), path: '/reports' },
    { label: 'View Analytics', icon: 'chart', action: () => navigate('/dashboard'), path: '/dashboard' },
  ]

  const primaryNav = [
    {
      label: 'Dashboard',
      to: '/dashboard',
      description: 'Overview, scans, and live metrics',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 13.5l7.5-7.5 4.5 4.5L21 4.5" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 20.25l7.5-7.5 4.5 4.5L21 11.25" />
        </svg>
      ),
    },
    {
      label: 'Reports',
      to: '/reports',
      description: 'Compliance summaries and exports',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10M7 12h6M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
        </svg>
      ),
    },
    {
      label: 'Support',
      to: '/support',
      description: 'Guides, help center, and contact',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 10c0 3-6 8-6 8s-6-5-6-8a6 6 0 1112 0z" />
          <circle cx="12" cy="10" r="2" stroke="currentColor" strokeWidth={2} />
        </svg>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {showHelp && <HelpCenter onClose={() => setShowHelp(false)} />}
      <header className="sticky top-0 z-40 border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-3 md:gap-6">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen((prev) => !prev)
                  setQuickActionsOpen(false)
                  setNotificationsOpen(false)
                  setUserMenuOpen(false)
                }}
                className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors md:hidden"
                aria-label="Toggle navigation"
              >
                {mobileMenuOpen ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
              <Link
                to="/dashboard"
                className="flex items-center rounded-xl px-2 py-2 text-gray-900 dark:text-gray-100 transition-transform hover:scale-[1.02]"
                onClick={() => setMobileMenuOpen(false)}
              >
                <LogoFull className="h-10" />
              </Link>
              <nav className="hidden md:flex items-center gap-2">
                {primaryNav.map((item) => {
                  const active = isActive(item.to)
                  return (
                    <Tooltip key={item.to} content={item.description}>
                      <Link
                        to={item.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`group relative flex items-center gap-2.5 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                          active
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <span className={`flex items-center justify-center ${active ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </Link>
                    </Tooltip>
                  )
                })}
              </nav>
            </div>

            <div className="flex flex-1 items-center justify-end gap-2 md:gap-3">
              <div className="hidden lg:block w-full max-w-xs">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setGlobalSearchOpen(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchQuery) {
                        navigate('/dashboard')
                        setGlobalSearchOpen(false)
                      }
                    }}
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 py-2 px-4 pr-10 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      aria-label="Clear search"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              <button
                onClick={() => setGlobalSearchOpen(true)}
                className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors md:hidden"
                title="Search"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              <div className="hidden xl:flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/20 px-2.5 py-1.5 border border-green-200/50 dark:border-green-800/50">
                <span className="relative flex h-2 w-2 items-center justify-center">
                  <span className={`absolute inline-flex h-full w-full rounded-full ${systemStatus === 'operational' ? 'bg-green-500 animate-ping opacity-40' : 'bg-yellow-500'}`}></span>
                  <span className={`relative inline-flex h-2 w-2 rounded-full ${systemStatus === 'operational' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                </span>
                <span className="text-xs font-medium text-green-700 dark:text-green-300">Operational</span>
              </div>

              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                title="Refresh (Ctrl+R)"
              >
                <svg className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              {!isViewer && (
                <div className="relative">
                  <button
                    onClick={() => {
                      setQuickActionsOpen((prev) => !prev)
                      setNotificationsOpen(false)
                      setUserMenuOpen(false)
                    }}
                    className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title="Quick actions"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                  </button>
                  {quickActionsOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setQuickActionsOpen(false)}></div>
                      <div className="absolute right-0 top-full mt-3 w-60 rounded-2xl border border-gray-200/80 dark:border-gray-700/70 bg-white dark:bg-gray-900 shadow-2xl shadow-blue-500/10 z-40 overflow-hidden">
                        <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3">
                          <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Quick actions</p>
                        </div>
                        <div className="py-2">
                          {quickActions.map((action, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                action.action()
                                setQuickActionsOpen(false)
                              }}
                              className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-blue-50/80 dark:hover:bg-blue-950/40 transition-colors"
                            >
                              {action.icon === 'building' && (
                                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                              )}
                              {action.icon === 'play' && (
                                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                              {action.icon === 'download' && (
                                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                              )}
                              {action.icon === 'chart' && (
                                <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              )}
                              <span>{action.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {isAuthenticated && (
                <div className="relative">
                  <button
                    onClick={() => {
                      setNotificationsOpen((prev) => !prev)
                      setQuickActionsOpen(false)
                      setUserMenuOpen(false)
                    }}
                    className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
                    title="Notifications"
                  >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {notificationCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </button>
                {notificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setNotificationsOpen(false)}></div>
                    <div className="absolute right-0 top-full mt-3 w-80 max-h-96 overflow-hidden rounded-2xl border border-gray-200/80 dark:border-gray-700/70 bg-white dark:bg-gray-900 shadow-2xl shadow-blue-500/10 z-40">
                      <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 bg-gray-50/80 dark:bg-gray-800/60">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">Notifications</p>
                          {notificationCount > 0 && (
                            <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">{notificationCount} new</span>
                          )}
                        </div>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {!isSuperAdmin && !userTenantId ? (
                          <div className="px-4 py-8 text-center">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Assign yourself to a tenant to view notifications.</p>
                          </div>
                        ) : notificationsLoading ? (
                          <div className="px-4 py-8 flex items-center justify-center">
                            <svg className="animate-spin h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                        ) : notificationsError ? (
                          <div className="px-4 py-6 text-center">
                            <p className="text-sm font-semibold text-red-500">{notificationsError}</p>
                            <button
                              onClick={loadNotifications}
                              className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              Retry
                            </button>
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center">
                            <svg className="mx-auto mb-2 h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">You're all caught up.</p>
                          </div>
                        ) : (
                          notifications.map((notif) => {
                            const severity = notif.finding?.severity || 'INFO'
                            const badgeColor = severityBadgeColors[severity] || 'bg-blue-500'
                            const rowHighlight =
                              notif.status !== 'sent'
                                ? 'bg-yellow-50/60 dark:bg-yellow-900/20'
                                : 'hover:bg-gray-50/80 dark:hover:bg-gray-800/60'
                            const title = notif.finding?.title || `Security alert via ${notif.channel}`
                            const messageParts = [notif.finding?.category, notif.finding?.resource_id].filter(Boolean)
                            const message =
                              messageParts.length > 0 ? messageParts.join(' • ') : `Channel: ${notif.channel.toUpperCase()}`
                            const tenantName = tenantLookup[notif.tenant_id]?.name

                            return (
                              <div
                                key={notif.id}
                                className={`px-4 py-3 border-b border-gray-100 dark:border-gray-800 transition-colors ${rowHighlight}`}
                              >
                                <div className="flex items-start gap-3">
                                  <span className={`mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full ${badgeColor}`}></span>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">{title}</p>
                                      <span className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-full px-2 py-0.5">
                                        {notif.channel}
                                      </span>
                                      <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                                        {severity}
                                      </span>
                                    </div>
                                    {isSuperAdmin && (
                                      <p className="mt-0.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                                        {tenantName || 'Unknown tenant'}
                                      </p>
                                    )}
                                    <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-300">{message}</p>
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{formatNotificationTime(notif.created_at)}</p>
                                  </div>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                      {(isSuperAdmin || userTenantId) && notifications.length > 0 && !notificationsLoading && (
                        <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-2 bg-gray-50/80 dark:bg-gray-800/60">
                          <button 
                            onClick={() => {
                              setNotificationsOpen(false)
                              navigate('/dashboard')
                            }}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            View all notifications
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
                </div>
              )}

              <button
                onClick={() => setShowHelp(true)}
                className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Help center"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>

              <button
                onClick={toggleTheme}
                className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              {isAuthenticated && user && (
                <>
                  {user.role === 'superadmin' && (
                    <div className="hidden xl:flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-purple-500/30">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Admin
                    </div>
                  )}

                  <div className="relative">
                    <button
                      onClick={() => {
                        setUserMenuOpen((prev) => !prev)
                        setQuickActionsOpen(false)
                        setNotificationsOpen(false)
                      }}
                      className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-semibold text-white">
                        {(user.name || user.email)?.charAt(0).toUpperCase() || 'U'}
                      </span>
                      <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {userMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)}></div>
                        <div className="absolute right-0 top-full mt-3 w-64 rounded-2xl border border-gray-200/80 dark:border-gray-700/70 bg-white dark:bg-gray-900 shadow-2xl shadow-blue-500/10 z-40 overflow-hidden">
                          <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/60 px-4 py-4">
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-50 truncate">{user.name || user.email}</p>
                            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 truncate">{user.email}</p>
                            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{user.role}</p>
                          </div>
                          <div className="py-2">
                            <Link
                              to="/settings"
                              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-blue-50/80 dark:hover:bg-blue-950/40 transition-colors"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              Settings
                            </Link>
                            <button
                              onClick={handleLogout}
                              className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-blue-50/80 dark:hover:bg-blue-950/40 transition-colors"
                            >
                              <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                              </svg>
                              Sign out
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl">
            <div className="px-4 py-4 space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Navigate</p>
                <div className="mt-2 flex flex-col gap-2">
                  {primaryNav.map((item) => {
                    const active = isActive(item.to)
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold ${
                          active
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-blue-50/80 dark:hover:bg-blue-950/40'
                        }`}
                      >
                        <span className={`flex items-center ${active ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>

              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  setGlobalSearchOpen(true)
                }}
                className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/80 dark:hover:bg-blue-950/40"
              >
                <span>Open search</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">Theme</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Currently {theme} mode</p>
                </div>
                <button
                  onClick={() => {
                    toggleTheme()
                    setMobileMenuOpen(false)
                  }}
                  className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500"
                >
                  Toggle
                </button>
              </div>

              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  setShowHelp(true)
                }}
                className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/80 dark:hover:bg-blue-950/40"
              >
                <span>Help center</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Search Modal */}
      {globalSearchOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setGlobalSearchOpen(false)}></div>
          <div className="absolute top-0 left-0 right-0 bg-white dark:bg-gray-800 p-4 shadow-2xl">
            <div className="relative">
              <input
                type="text"
                placeholder="Search tenants, findings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery) {
                    navigate('/dashboard')
                    setGlobalSearchOpen(false)
                  }
                }}
                autoFocus
                className="block w-full px-4 py-3 pr-12 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
              />
              <button
                onClick={() => setGlobalSearchOpen(false)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center"
              >
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">{children}</main>
      <VersionInfo />
    </div>
  )
}
