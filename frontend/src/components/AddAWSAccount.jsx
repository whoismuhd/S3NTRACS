import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function AddAWSAccount() {
  const { user } = useAuth()

  if (user?.role === 'superadmin') {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
              Ready to add your AWS account?
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
              Click the "New Tenant" button above to add your AWS account. You'll need your AWS IAM Role ARN and External ID.
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              Go to Dashboard
              <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (user?.role === 'tenant_admin') {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-green-900 dark:text-green-200 mb-2">
              Tenant Admin Access
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300">
              You're assigned to a tenant. Go to Dashboard to view and manage your tenant's AWS account.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Viewer role
  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-900 dark:text-yellow-200 mb-2">
            Viewer Role - Limited Access
          </h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
            As a viewer, you cannot add AWS accounts. You need to be a <strong>superadmin</strong> to add accounts, or a <strong>tenant_admin</strong> to manage a specific tenant.
          </p>
          <div className="mt-3 text-sm">
            <p className="text-yellow-800 dark:text-yellow-200 font-medium mb-2">To add your AWS account, you need:</p>
            <ol className="list-decimal list-inside space-y-1 text-yellow-700 dark:text-yellow-300">
              <li>A superadmin to upgrade your role, OR</li>
              <li>A superadmin to create a tenant and assign you as tenant_admin</li>
            </ol>
          </div>
          <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded border border-yellow-300 dark:border-yellow-700">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              <strong>Note:</strong> If you were the first user to register, you should be superadmin. Contact support if you believe your role is incorrect.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}





