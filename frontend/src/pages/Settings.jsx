import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import api from '../api'
import LoadingSpinner from '../components/LoadingSpinner'
import Badge from '../components/Badge'
import GitHubIntegration from '../components/GitHubIntegration'
import AWSCredentialsStatus from '../components/AWSCredentialsStatus'

export default function Settings() {
  const { user, updateUser, loading: authLoading } = useAuth()
  const { showToast } = useToast()
  const [saving, setSaving] = useState(false)
  const [awsGuideExpanded, setAwsGuideExpanded] = useState(false)
  const [awsCredentialsExpanded, setAwsCredentialsExpanded] = useState(false)
  const [securityExpanded, setSecurityExpanded] = useState(false)
  const [userManagementExpanded, setUserManagementExpanded] = useState(false)
  const [githubExpanded, setGithubExpanded] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  })
  // Security settings
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [changingPassword, setChangingPassword] = useState(false)
  // 2FA settings
  const [twoFactorStatus, setTwoFactorStatus] = useState(false)
  const [twoFactorSetup, setTwoFactorSetup] = useState(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [settingUp2FA, setSettingUp2FA] = useState(false)
  const [verifying2FA, setVerifying2FA] = useState(false)
  const [disabling2FA, setDisabling2FA] = useState(false)
  // User Management (Admin)
  const [users, setUsers] = useState([])
  const [tenants, setTenants] = useState([])
  const [activities, setActivities] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [showUserForm, setShowUserForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [showActivities, setShowActivities] = useState(false)
  const [userFormData, setUserFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'viewer',
    tenant_id: '',
  })

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
      })
      setTwoFactorStatus(user.two_factor_enabled === 'true' || false)
      // Fetch 2FA status
      fetch2FAStatus()
    }
  }, [user])

  const fetch2FAStatus = async () => {
    try {
      const response = await api.get('/auth/me')
      setTwoFactorStatus(response.data.two_factor_enabled === 'true' || false)
    } catch (err) {
      console.error('Failed to fetch 2FA status:', err)
      setTwoFactorStatus(false)
    }
  }

  // User Management functions
  const loadUsers = async () => {
    if (user?.role !== 'superadmin') return
    setLoadingUsers(true)
    try {
      const [usersRes, tenantsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/tenants/'),
      ])
      setUsers(usersRes.data)
      setTenants(tenantsRes.data)
    } catch (err) {
      showToast('Failed to load admin data', 'error')
    } finally {
      setLoadingUsers(false)
    }
  }

  const loadActivities = async () => {
    try {
      const response = await api.get('/admin/activities?limit=50')
      setActivities(response.data)
      setShowActivities(true)
    } catch (err) {
      showToast('Failed to load activities', 'error')
    }
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        email: userFormData.email,
        password: userFormData.password,
        name: userFormData.name || null,
        role: userFormData.role,
        tenant_id: userFormData.tenant_id || null,
      }

      await api.post('/admin/users', payload)
      showToast('User created successfully', 'success')
      setShowUserForm(false)
      setUserFormData({
        email: '',
        password: '',
        name: '',
        role: 'viewer',
        tenant_id: '',
      })
      loadUsers()
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to create user'
      showToast(errorMsg, 'error')
    }
  }

  const handleUpdateUser = async (e) => {
    e.preventDefault()
    try {
      const payload = {}
      if (userFormData.name !== editingUser.name) payload.name = userFormData.name || null
      if (userFormData.role !== editingUser.role) payload.role = userFormData.role
      if (userFormData.tenant_id !== (editingUser.tenant_id || '')) {
        payload.tenant_id = userFormData.tenant_id || null
      }

      await api.put(`/admin/users/${editingUser.id}`, payload)
      showToast('User updated successfully', 'success')
      setEditingUser(null)
      setShowUserForm(false)
      setUserFormData({
        email: '',
        password: '',
        name: '',
        role: 'viewer',
        tenant_id: '',
      })
      loadUsers()
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to update user'
      showToast(errorMsg, 'error')
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return
    }

    try {
      await api.delete(`/admin/users/${userId}`)
      showToast('User deleted successfully', 'success')
      loadUsers()
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to delete user'
      showToast(errorMsg, 'error')
    }
  }

  const startEditUser = (userToEdit) => {
    setEditingUser(userToEdit)
    setUserFormData({
      email: userToEdit.email,
      password: '',
      name: userToEdit.name || '',
      role: userToEdit.role,
      tenant_id: userToEdit.tenant_id || '',
    })
    setShowUserForm(true)
  }

  const cancelEdit = () => {
    setEditingUser(null)
    setShowUserForm(false)
    setUserFormData({
      email: '',
      password: '',
      name: '',
      role: 'viewer',
      tenant_id: '',
    })
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'superadmin':
        return 'purple'
      case 'tenant_admin':
        return 'blue'
      case 'viewer':
        return 'gray'
      default:
        return 'default'
    }
  }

  useEffect(() => {
    if (user?.role === 'superadmin') {
      if (userManagementExpanded && !loadingUsers) {
        loadUsers()
      }
      if (githubExpanded && tenants.length === 0) {
        // Load tenants for GitHub integration
        api.get('/tenants/').then(res => setTenants(res.data)).catch(() => {})
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role, userManagementExpanded, githubExpanded])

  const handleChangePassword = async (e) => {
    e.preventDefault()
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      showToast('New passwords do not match', 'error')
      return
    }

    if (passwordData.new_password.length < 8) {
      showToast('Password must be at least 8 characters', 'error')
      return
    }

    setChangingPassword(true)

    try {
      await api.post('/auth/me/change-password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      })
      
      showToast('Password changed successfully', 'success')
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      })
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to change password'
      showToast(errorMsg, 'error')
    } finally {
      setChangingPassword(false)
    }
  }

  const handleSetup2FA = async () => {
    setSettingUp2FA(true)
    try {
      const response = await api.get('/auth/me/2fa/setup')
      setTwoFactorSetup(response.data)
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to setup 2FA'
      showToast(errorMsg, 'error')
    } finally {
      setSettingUp2FA(false)
    }
  }

  const handleVerify2FA = async (e) => {
    e.preventDefault()
    if (!verificationCode || verificationCode.length !== 6) {
      showToast('Please enter a valid 6-digit verification code', 'error')
      return
    }

    setVerifying2FA(true)
    try {
      await api.post('/auth/me/2fa/verify', {
        verification_code: verificationCode,
      })
      showToast('2FA enabled successfully', 'success')
      setTwoFactorStatus(true)
      setTwoFactorSetup(null)
      setVerificationCode('')
      await fetch2FAStatus()
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to verify 2FA code'
      showToast(errorMsg, 'error')
    } finally {
      setVerifying2FA(false)
    }
  }

  const handleDisable2FA = async (e) => {
    e.preventDefault()
    if (!passwordData.current_password) {
      showToast('Please enter your password to disable 2FA', 'error')
      return
    }

    setDisabling2FA(true)
    try {
      await api.post('/auth/me/2fa/disable', {
        current_password: passwordData.current_password,
      })
      showToast('2FA disabled successfully', 'success')
      setTwoFactorStatus(false)
      setPasswordData({
        ...passwordData,
        current_password: '',
      })
      await fetch2FAStatus()
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to disable 2FA'
      showToast(errorMsg, 'error')
    } finally {
      setDisabling2FA(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await api.put('/auth/me', {
        name: formData.name.trim() || null,
        // Email is not sent - it cannot be changed
      })
      
      updateUser(response.data)
      showToast('Profile updated successfully', 'success')
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to update profile'
      showToast(errorMsg, 'error')
    } finally {
      setSaving(false)
    }
  }

  // Show loading spinner while auth is initializing
  if (authLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Information</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Update your account name and email address
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Account Name
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors sm:text-sm"
              placeholder="Enter your display name"
              maxLength={100}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              This name will be displayed throughout the application
            </p>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              disabled
              className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed sm:text-sm"
              placeholder="your@email.com"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Email address cannot be changed after account creation
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Role:</span>{' '}
              <span className="capitalize font-semibold text-gray-900 dark:text-white">{user?.role || 'N/A'}</span>
              {user?.role === 'viewer' && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                  ⚠️ Viewers cannot add AWS accounts. Contact superadmin to upgrade your role.
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
            >
              {saving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Security Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <button
          onClick={() => setSecurityExpanded(!securityExpanded)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
        >
          <div className="flex items-center">
            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Security Settings</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                Manage your password and two-factor authentication
              </p>
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${securityExpanded ? 'transform rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {securityExpanded && (
          <div className="border-t border-gray-200 dark:border-gray-700">
            <div className="p-6 space-y-8">
          {/* Change Password */}
          <div>
            <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Change Password
            </h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  id="current_password"
                  value={passwordData.current_password}
                  onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                  className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors sm:text-sm"
                  placeholder="Enter current password"
                  required
                />
              </div>
              <div>
                <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  id="new_password"
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                  className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors sm:text-sm"
                  placeholder="Enter new password"
                  required
                  minLength={8}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Must be at least 8 characters with uppercase, lowercase, and number
                </p>
              </div>
              <div>
                <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirm_password"
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                  className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors sm:text-sm"
                  placeholder="Confirm new password"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={changingPassword}
                className="inline-flex items-center px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
              >
                {changingPassword ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Changing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Change Password
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-700"></div>

          {/* Two-Factor Authentication */}
          <div>
            <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Two-Factor Authentication (2FA)
            </h3>

            {twoFactorStatus ? (
              /* 2FA Enabled - Show Disable Option */
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-green-900 dark:text-green-200">2FA is Enabled</p>
                      <p className="text-xs text-green-700 dark:text-green-300 mt-1">Your account is protected with two-factor authentication</p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleDisable2FA} className="space-y-4">
                  <div>
                    <label htmlFor="disable_2fa_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Enter Password to Disable 2FA
                    </label>
                    <input
                      type="password"
                      id="disable_2fa_password"
                      value={passwordData.current_password}
                      onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                      className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors sm:text-sm"
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={disabling2FA}
                    className="inline-flex items-center px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {disabling2FA ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Disabling...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        Disable 2FA
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : twoFactorSetup ? (
              /* 2FA Setup - Show QR Code and Verification */
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">Scan QR Code with Authenticator App</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mb-4">
                    Use Google Authenticator, Authy, or any TOTP-compatible app
                  </p>
                  <div className="flex justify-center mb-4">
                    <img
                      src={twoFactorSetup.qr_code}
                      alt="2FA QR Code"
                      className="border-2 border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-800"
                    />
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded p-3 border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Or enter this key manually:</p>
                    <code className="text-xs font-mono text-gray-900 dark:text-gray-100 break-all">{twoFactorSetup.manual_entry_key}</code>
                  </div>
                </div>

                <form onSubmit={handleVerify2FA} className="space-y-4">
                  <div>
                    <label htmlFor="verification_code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Enter 6-Digit Verification Code
                    </label>
                    <input
                      type="text"
                      id="verification_code"
                      value={verificationCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                        setVerificationCode(value)
                      }}
                      className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors sm:text-sm text-center text-2xl tracking-widest font-mono"
                      placeholder="000000"
                      maxLength={6}
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Enter the code from your authenticator app
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      disabled={verifying2FA || verificationCode.length !== 6}
                      className="flex-1 inline-flex items-center justify-center px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {verifying2FA ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Verifying...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Verify & Enable
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTwoFactorSetup(null)
                        setVerificationCode('')
                      }}
                      className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* 2FA Not Enabled - Show Enable Button */
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200">2FA is Disabled</p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">Enable two-factor authentication for added security</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSetup2FA}
                  disabled={settingUp2FA}
                  className="inline-flex items-center px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
                >
                  {settingUp2FA ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Setting up...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Enable 2FA
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
          </div>
        </div>
          )}
      </div>

      {/* GitHub Integration */}
      {user?.role === 'superadmin' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            onClick={() => setGithubExpanded(!githubExpanded)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
          >
            <div className="flex items-center">
              <svg className="w-6 h-6 text-gray-700 dark:text-gray-300 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
              </svg>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">GitHub Integration</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  Connect with GitHub for PR comments and CI/CD scanning
                </p>
              </div>
            </div>
            <svg
              className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${githubExpanded ? 'transform rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {githubExpanded && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-6">
              {tenants.length > 0 ? (
                <GitHubIntegration tenantId={tenants[0].id} />
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>Please create a tenant first to use GitHub integration.</p>
                  <Link to="/dashboard" className="text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block">
                    Go to Dashboard
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* AWS Credentials Status */}
      {user?.role === 'superadmin' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            onClick={() => setAwsCredentialsExpanded(!awsCredentialsExpanded)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
          >
            <div className="flex items-center">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AWS Credentials Status</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  Check your AWS credentials configuration and get security recommendations
                </p>
              </div>
            </div>
            <svg
              className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${awsCredentialsExpanded ? 'transform rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {awsCredentialsExpanded && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-6">
              <AWSCredentialsStatus />
            </div>
          )}
        </div>
      )}

      {/* AWS Account Setup Guide */}
      {user?.role === 'superadmin' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            onClick={() => setAwsGuideExpanded(!awsGuideExpanded)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
          >
            <div className="flex items-center">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add Your AWS Account</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  Setup guide for connecting your AWS account to S3ntraCS
                </p>
              </div>
            </div>
            <svg
              className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${awsGuideExpanded ? 'transform rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {awsGuideExpanded && (
            <div className="border-t border-gray-200 dark:border-gray-700 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
              <div className="p-6 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Quick Start
              </h3>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li>Go to <Link to="/dashboard" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">Dashboard</Link> and click "New Tenant"</li>
                  <li>Set up an IAM role in AWS (see instructions below)</li>
                  <li>Enter your AWS Role ARN and External ID</li>
                  <li>Click "Create Tenant" to add your account</li>
                </ol>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                What You'll Need
              </h3>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-800 space-y-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">1</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">AWS Role ARN</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Format: <code className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-1 rounded">arn:aws:iam::123456789012:role/S3ntraCSRole</code></p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">The IAM role S3ntraCS will assume to scan your account</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">2</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">External ID</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">A unique identifier (e.g., <code className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-1 rounded">s3ntracs-2024-unique-123</code>)</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Must match the ExternalId in your IAM role's trust policy</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">3</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">AWS Account ID</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Your 12-digit AWS account identifier (optional but recommended)</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Setup AWS IAM Role
              </h3>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white mb-1">Step 1: Create IAM Role in AWS</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Go to AWS IAM Console → Roles → Create Role</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white mb-1">Step 2: Configure Trust Relationship</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Use this trust policy template:</p>
                    <pre className="bg-gray-900 dark:bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
{`{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "AWS": "arn:aws:iam::YOUR_S3NTRACS_ACCOUNT:root"
    },
    "Action": "sts:AssumeRole",
    "Condition": {
      "StringEquals": {
        "sts:ExternalId": "your-unique-external-id"
      }
    }
  }]
}`}
                    </pre>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Replace <code className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-1 rounded">YOUR_S3NTRACS_ACCOUNT</code> with your S3ntraCS AWS account ID</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white mb-1">Step 3: Attach Required Permissions</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Attach policies based on which scanners you want to enable (8 scanners available):</p>
                    <ul className="list-disc list-inside text-xs text-gray-600 dark:text-gray-400 space-y-1 ml-2">
                      <li><code className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-1 rounded">IAMReadOnlyAccess</code> - Required for IAM scanning</li>
                      <li><code className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-1 rounded">AmazonS3ReadOnlyAccess</code> - Required for S3 scanning</li>
                      <li><code className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-1 rounded">CloudTrailReadOnlyAccess</code> - Required for Logging scanning</li>
                      <li><code className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-1 rounded">AmazonEC2ReadOnlyAccess</code> - Required for EC2 and EBS scanning</li>
                      <li><code className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-1 rounded">AmazonRDSReadOnlyAccess</code> - Required for RDS scanning</li>
                      <li><code className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-1 rounded">AWSLambda_ReadOnlyAccess</code> - Required for Lambda scanning</li>
                      <li><code className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-1 rounded">CloudWatchReadOnlyAccess</code> - Required for CloudWatch scanning</li>
                    </ul>
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-2">Note: You can select which scanners to enable per tenant in S3ntraCS. Only attach the policies for scanners you plan to use.</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white mb-1">Step 4: Name and Copy ARN</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Name the role (e.g., "S3ntraCSRole") and copy the Role ARN</p>
                  </div>
                </div>
              </div>
            </div>

                <div className="bg-blue-600 dark:bg-blue-700 rounded-lg p-4 text-white">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold mb-1">Ready to add your account?</p>
                      <p className="text-xs text-blue-100 mb-3">Once you have your Role ARN and External ID, go to Dashboard to create a tenant.</p>
                      <Link
                        to="/dashboard"
                        className="inline-flex items-center px-3 py-1.5 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded text-xs font-medium hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Go to Dashboard
                        <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* User Management (Superadmin Only) */}
      {user?.role === 'superadmin' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            onClick={() => {
              setUserManagementExpanded(!userManagementExpanded)
              if (!userManagementExpanded) {
                loadUsers()
              }
            }}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
          >
            <div className="flex items-center">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">User Management</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  Create and manage users, assign roles and tenants
                </p>
              </div>
            </div>
            <svg
              className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${userManagementExpanded ? 'transform rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {userManagementExpanded && (
            <div className="border-t border-gray-200 dark:border-gray-700">
              <div className="p-6 space-y-6">
                {/* Action Buttons */}
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {loadingUsers ? 'Loading...' : `${users.length} user${users.length !== 1 ? 's' : ''} total`}
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={loadActivities}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      View Activity Logs
                    </button>
                    <button
                      onClick={() => {
                        cancelEdit()
                        setShowUserForm(!showUserForm)
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all transform hover:scale-105"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      {showUserForm ? 'Cancel' : 'New User'}
                    </button>
                  </div>
                </div>

                {/* User Form */}
                {showUserForm && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 p-6">
                    <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                      {editingUser ? 'Edit User' : 'Create New User'}
                    </h3>
                    <form
                      onSubmit={editingUser ? handleUpdateUser : handleCreateUser}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="admin-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Email Address {editingUser && <span className="text-gray-400 dark:text-gray-500">(read-only)</span>}
                          </label>
                          <input
                            type="email"
                            id="admin-email"
                            value={userFormData.email}
                            onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                            disabled={!!editingUser}
                            className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors sm:text-sm disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400"
                            placeholder="user@example.com"
                            required
                          />
                        </div>
                        {!editingUser && (
                          <div>
                            <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Password
                            </label>
                            <input
                              type="password"
                              id="admin-password"
                              value={userFormData.password}
                              onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                              className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors sm:text-sm"
                              placeholder="Enter password"
                              required
                              minLength={8}
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              Must be at least 8 characters with uppercase, lowercase, and number
                            </p>
                          </div>
                        )}
                        <div>
                          <label htmlFor="admin-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Display Name
                          </label>
                          <input
                            type="text"
                            id="admin-name"
                            value={userFormData.name}
                            onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                            className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors sm:text-sm"
                            placeholder="Optional display name"
                            maxLength={100}
                          />
                        </div>
                        <div>
                          <label htmlFor="admin-role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Role
                          </label>
                          <select
                            id="admin-role"
                            value={userFormData.role}
                            onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                            className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors sm:text-sm"
                            required
                          >
                            <option value="viewer">Viewer</option>
                            <option value="tenant_admin">Tenant Admin</option>
                            <option value="superadmin">Superadmin</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label htmlFor="admin-tenant" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Assign to Tenant (Optional)
                          </label>
                          <select
                            id="admin-tenant"
                            value={userFormData.tenant_id}
                            onChange={(e) => setUserFormData({ ...userFormData, tenant_id: e.target.value })}
                            className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors sm:text-sm disabled:bg-gray-50 dark:disabled:bg-gray-800"
                            disabled={userFormData.role === 'superadmin'}
                          >
                            <option value="">No Tenant Assignment</option>
                            {tenants.map((tenant) => (
                              <option key={tenant.id} value={tenant.id}>
                                {tenant.name} {tenant.aws_account_id && `(${tenant.aws_account_id})`}
                              </option>
                            ))}
                          </select>
                          {userFormData.role === 'superadmin' && (
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              Superadmins cannot be assigned to tenants
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all transform hover:scale-105"
                        >
                          {editingUser ? 'Update User' : 'Create User'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Users Table */}
                {loadingUsers ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Role
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Tenant
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            2FA
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {users.map((u) => (
                          <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {u.name || u.email}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">{u.email}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant={getRoleColor(u.role)} size="sm">
                                {u.role}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {tenants.find((t) => t.id === u.tenant_id)?.name || (
                                <span className="text-gray-400 dark:text-gray-500">No tenant</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {u.two_factor_enabled === 'true' ? (
                                <Badge variant="success" size="sm">
                                  Enabled
                                </Badge>
                              ) : (
                                <span className="text-sm text-gray-400 dark:text-gray-500">Disabled</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => startEditUser(u)}
                                  className="text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300 transition-colors"
                                >
                                  Edit
                                </button>
                                {u.id !== user?.id && (
                                  <button
                                    onClick={() => handleDeleteUser(u.id)}
                                    className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Activity Logs */}
                {showActivities && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between">
                      <h3 className="text-md font-semibold text-gray-900 dark:text-white">
                        Activity Logs ({activities.length})
                      </h3>
                      <button
                        onClick={() => setShowActivities(false)}
                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      >
                        Hide
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Time
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Action
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Details
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {activities.map((activity) => (
                            <tr key={activity.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {new Date(activity.created_at).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {activity.user_email || activity.user_id}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge variant="info" size="sm">
                                  {activity.action.replace('_', ' ')}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                {activity.details || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notification Preferences */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notification Preferences</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Configure how you want to be notified about security findings and scan updates
          </p>
        </div>
        <div className="p-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-blue-900 dark:text-blue-200 mb-2">
                  Notification Settings are Configured Per Tenant
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-300 mb-4">
                  Notification preferences (email, Slack, severity filters) are configured individually for each AWS account (tenant). 
                  This allows you to set different notification rules for different accounts.
                </p>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Go to Dashboard to Configure Notifications
                </Link>
              </div>
            </div>
          </div>
          <div className="mt-6 space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <p className="font-medium text-gray-900 dark:text-white">To configure notifications:</p>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>Go to your Dashboard and select a tenant</li>
              <li>Click on the "Notifications" tab in the tenant detail page</li>
              <li>Configure email recipients, Slack webhooks, and notification rules</li>
              <li>Save your preferences - they'll be applied to all future scans</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Account Info Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Account Information</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">User ID</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">{user?.id}</p>
            </div>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Account Role</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">{user?.role || 'N/A'}</p>
            </div>
          </div>
          {user?.tenant_id && (
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Tenant ID</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">{user?.tenant_id}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

