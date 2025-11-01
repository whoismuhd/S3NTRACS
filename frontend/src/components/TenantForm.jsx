import React, { useState } from 'react'
import api from '../api'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

export default function TenantForm({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    aws_account_id: '',
    aws_role_arn: '',
    aws_external_id: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const { showToast } = useToast()

  // Only superadmin can create tenants
  if (user?.role !== 'superadmin') {
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.post('/tenants/', formData)
      if (onSuccess) {
        onSuccess(response.data)
      }
      showToast('Tenant created successfully', 'success')
      // Reset form
      setFormData({
        name: '',
        description: '',
        aws_account_id: '',
        aws_role_arn: '',
        aws_external_id: '',
      })
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to create tenant'
      setError(errorMsg)
      showToast(errorMsg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-semibold text-gray-900">Create New Tenant</h3>
        <p className="mt-1 text-sm text-gray-500">
          Configure AWS account access for security scanning
        </p>
      </div>
      
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 animate-fade-in">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-red-800">{error}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Tenant Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Acme Corp"
          />
        </div>

        <div>
          <label htmlFor="aws_account_id" className="block text-sm font-medium text-gray-700 mb-2">
            AWS Account ID
          </label>
          <input
            type="text"
            id="aws_account_id"
            value={formData.aws_account_id}
            onChange={(e) => setFormData({ ...formData, aws_account_id: e.target.value })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm transition-colors"
            placeholder="123456789012"
            pattern="[0-9]{12}"
          />
          <p className="mt-1 text-xs text-gray-500">12-digit AWS account identifier</p>
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          id="description"
          rows={2}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          placeholder="Optional description or notes about this tenant"
        />
      </div>

      <div>
        <label htmlFor="aws_role_arn" className="block text-sm font-medium text-gray-700 mb-2">
          AWS Role ARN <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="aws_role_arn"
          required
          value={formData.aws_role_arn}
          onChange={(e) => setFormData({ ...formData, aws_role_arn: e.target.value })}
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm transition-colors"
          placeholder="arn:aws:iam::123456789012:role/S3ntraCSRole"
        />
        <p className="mt-1 text-xs text-gray-500">
          IAM role ARN that S3ntraCS will assume for scanning
        </p>
      </div>

      <div>
        <label htmlFor="aws_external_id" className="block text-sm font-medium text-gray-700 mb-2">
          External ID <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="aws_external_id"
          required
          value={formData.aws_external_id}
          onChange={(e) => setFormData({ ...formData, aws_external_id: e.target.value })}
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm transition-colors"
          placeholder="unique-external-id-here"
        />
        <p className="mt-1 text-xs text-gray-500">
          Unique identifier for secure cross-account access. This must match the ExternalId condition in the IAM role trust policy.
        </p>
      </div>

      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Tenant
            </>
          )}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
