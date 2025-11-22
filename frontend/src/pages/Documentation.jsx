import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { LogoFull } from '../components/Logo'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

export default function Documentation() {
  const { isAuthenticated, user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [activeSection, setActiveSection] = useState('getting-started')

  const sections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Quick Start Guide</h3>
            <ol className="list-decimal list-inside space-y-3 text-gray-700 dark:text-gray-300">
              <li>Create your account at <Link to="/register" className="text-blue-600 dark:text-blue-400 hover:underline">/register</Link></li>
              <li>Set up an IAM role in your AWS account (see AWS Setup below)</li>
              <li>Add your AWS account as a tenant in S3ntraCS</li>
              <li>Select which scanners to enable (8 available: IAM, S3, Logging, EC2, EBS, RDS, Lambda, CloudWatch) in the tenant's Scanners tab. More scanners will be added in future updates.</li>
              <li>Run your first security scan</li>
              <li>Review findings and start remediation</li>
            </ol>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">System Requirements</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>Modern web browser (Chrome, Firefox, Safari, Edge)</li>
              <li>AWS account with IAM permissions</li>
              <li>Internet connection for API access</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'aws-setup',
      title: 'AWS Setup',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Creating the IAM Role</h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Step 1: Create IAM Role</h4>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 text-sm">
                <li>Log in to AWS Console</li>
                <li>Navigate to IAM → Roles → Create Role</li>
                <li>Select "Another AWS account" as trusted entity</li>
                <li>Enter your S3ntraCS account ID (contact support for this)</li>
                <li>Enable "Require external ID" and enter a unique identifier</li>
              </ol>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Step 2: Trust Policy</h4>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded text-xs overflow-x-auto">
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
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Step 3: Attach Permissions</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">Attach the following read-only policies based on which scanners you want to enable:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <li><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">IAMReadOnlyAccess</code> - Required for IAM scanning</li>
                <li><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">AmazonS3ReadOnlyAccess</code> - Required for S3 scanning</li>
                <li><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">CloudTrailReadOnlyAccess</code> - Required for Logging scanning</li>
                <li><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">AmazonEC2ReadOnlyAccess</code> - Required for EC2 and EBS scanning</li>
                <li><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">AmazonRDSReadOnlyAccess</code> - Required for RDS scanning</li>
                <li><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">AWSLambda_ReadOnlyAccess</code> - Required for Lambda scanning</li>
                <li><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">CloudWatchReadOnlyAccess</code> - Required for CloudWatch scanning</li>
              </ul>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 italic">Note: You can select which scanners to enable per tenant in S3ntraCS, so you only need to attach the policies for scanners you plan to use.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'api',
      title: 'API Documentation',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">API Endpoints</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              S3ntraCS provides a RESTful API for programmatic access. All API endpoints require authentication via JWT tokens.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>API Base URL:</strong> <code>http://localhost:8000</code> (development)
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-2">
                <strong>Interactive API Docs:</strong> <a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer" className="underline">http://localhost:8000/docs</a>
              </p>
            </div>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold text-gray-900 dark:text-white">Authentication</h4>
                <ul className="text-sm text-gray-700 dark:text-gray-300 mt-2 space-y-1">
                  <li><code>POST /auth/register</code> - Register new user</li>
                  <li><code>POST /auth/login</code> - Login and get JWT token</li>
                  <li><code>GET /auth/me</code> - Get current user info</li>
                </ul>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-semibold text-gray-900 dark:text-white">Tenants</h4>
                <ul className="text-sm text-gray-700 dark:text-gray-300 mt-2 space-y-1">
                  <li><code>GET /tenants/</code> - List tenants</li>
                  <li><code>POST /tenants/</code> - Create tenant</li>
                  <li><code>GET /tenants/{'{id}'}</code> - Get tenant details</li>
                </ul>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <h4 className="font-semibold text-gray-900 dark:text-white">Scans</h4>
                <ul className="text-sm text-gray-700 dark:text-gray-300 mt-2 space-y-1">
                  <li><code>POST /scans/run/{'{tenant_id}'}</code> - Start scan</li>
                  <li><code>GET /scans/{'{tenant_id}'}</code> - List scans</li>
                  <li><code>GET /scans/{'{tenant_id}'}/latest</code> - Get latest scan</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Common Issues</h3>
            <div className="space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">Scan Fails with "Access Denied"</h4>
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  Ensure your IAM role has the required read-only permissions and the trust policy is correctly configured with the External ID.
                </p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">Cannot Connect to AWS</h4>
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  Verify the Role ARN and External ID are correct. Check that the IAM role exists and is in the correct AWS account.
                </p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">No Findings Detected</h4>
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  This could mean your AWS account is secure! However, verify that the IAM role has permissions to read resources for all enabled scanners (IAM, S3, Logging, EC2, EBS, RDS, Lambda, CloudWatch).
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center">
              <LogoFull className="h-10" />
            </Link>
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleTheme}
                className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                  >
                    Dashboard
                  </Link>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-medium">
                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                      {(user?.name || user?.email)?.charAt(0).toUpperCase() || 'U'}
                    </span>
                    <span className="hidden sm:inline">{user?.name || user?.email}</span>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all transform hover:scale-105"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sticky top-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Documentation</h2>
              <nav className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {section.title}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              {sections.find(s => s.id === activeSection)?.content}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



