import React from 'react'
import { Link } from 'react-router-dom'
import { LogoFull } from '../components/Logo'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

export default function Features() {
  const { isAuthenticated, user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const features = [
    {
      category: 'Security Scanning',
      icon: null,
      items: [
        {
          title: 'Customizable Scanner Selection',
          description: 'Choose which AWS services to scan for each account. Select from 8 available scanners: IAM, S3, Logging, EC2, EBS, RDS, Lambda, and CloudWatch based on your security needs. More scanners coming soon!',
          details: [
            'Select scanners per AWS account',
            '8 available scanners to choose from',
            'Enable/disable any combination of scanners',
            'IAM, S3, Logging, EC2, EBS, RDS, Lambda, CloudWatch',
            'Flexible configuration per tenant',
            'More AWS service scanners coming in future updates'
          ]
        },
        {
          title: 'IAM Security Checks',
          description: 'Comprehensive IAM policy analysis including MFA enforcement, administrator access monitoring, and overly permissive policy detection.',
          details: [
            'Users without MFA detection',
            'AdministratorAccess policy monitoring',
            'Overly permissive inline policies',
            'Policy attachment analysis',
            'Access key rotation tracking'
          ]
        },
        {
          title: 'S3 Bucket Security',
          description: 'Advanced S3 bucket security scanning to identify public access, encryption issues, and misconfigured access policies.',
          details: [
            'Public bucket detection (ACL & Policy)',
            'Encryption verification',
            'Bucket policy analysis',
            'Versioning status checks',
            'Lifecycle policy review'
          ]
        },
        {
          title: 'Logging & Monitoring',
          description: 'Ensure proper logging and monitoring services are configured for security and compliance.',
          details: [
            'CloudTrail configuration verification',
            'GuardDuty status checks',
            'Logging completeness analysis',
            'Event retention policies',
            'Multi-region logging verification'
          ]
        },
        {
          title: 'EC2 Security Groups',
          description: 'Scan EC2 Security Groups for open ports, overly permissive rules, and security misconfigurations.',
          details: [
            'Open port detection',
            'Overly permissive security group rules',
            'Publicly accessible instances',
            'Security group rule analysis',
            'Unrestricted CIDR blocks'
          ]
        },
        {
          title: 'EBS Volume Security',
          description: 'Verify EBS volumes and snapshots are properly encrypted and configured securely.',
          details: [
            'Volume encryption status',
            'Snapshot encryption verification',
            'Unencrypted volume detection',
            'Public snapshot identification',
            'Encryption key management'
          ]
        },
        {
          title: 'RDS Database Security',
          description: 'Scan RDS instances and snapshots for public access, encryption, and security best practices.',
          details: [
            'Public database access detection',
            'Encryption at rest verification',
            'Snapshot security analysis',
            'Public snapshot identification',
            'Database security group review'
          ]
        },
        {
          title: 'Lambda Function Security',
          description: 'Analyze Lambda functions for overly permissive roles, VPC configuration, and security issues.',
          details: [
            'Overly permissive IAM roles',
            'VPC configuration analysis',
            'Function environment variables',
            'Resource-based policy review',
            'Dead letter queue configuration'
          ]
        },
        {
          title: 'CloudWatch Log Groups',
          description: 'Monitor CloudWatch Log Groups for retention policies, encryption, and security settings.',
          details: [
            'Log retention policy verification',
            'Encryption settings analysis',
            'Log group access control',
            'Retention period compliance',
            'Log group security configuration'
          ]
        }
      ]
    },
    {
      category: 'Compliance & Reporting',
      icon: null,
      items: [
        {
          title: 'Framework Mapping',
          description: 'Automatic mapping of findings to major compliance frameworks including ISO 27001, GDPR, SOC 2, and NIST CSF.',
          details: [
            'ISO 27001 compliance mapping',
            'GDPR Article 32 compliance',
            'SOC 2 Type II controls',
            'NIST Cybersecurity Framework',
            'Custom framework support (coming soon)'
          ]
        },
        {
          title: 'Comprehensive Reports',
          description: 'Generate detailed compliance reports with executive summaries, finding breakdowns, and remediation guidance.',
          details: [
            'Executive summary reports',
            'Detailed finding reports',
            'Compliance status dashboards',
            'Historical trend analysis',
            'Export to JSON/CSV formats'
          ]
        },
        {
          title: 'Remediation Guidance',
          description: 'Each finding includes step-by-step remediation instructions to help teams fix issues quickly.',
          details: [
            'Step-by-step remediation steps',
            'AWS console direct links',
            'CLI command examples',
            'Best practice recommendations',
            'Priority-based guidance'
          ]
        }
      ]
    },
    {
      category: 'Multi-Tenant Management',
      icon: null,
      items: [
        {
          title: 'Centralized Dashboard',
          description: 'Manage multiple AWS accounts from a single, unified dashboard with tenant isolation and role-based access.',
          details: [
            'Multi-account management',
            'Tenant isolation',
            'Role-based access control',
            'Centralized security overview',
            'Bulk operations support'
          ]
        },
        {
          title: 'Security Scoring',
          description: 'Real-time security score calculation based on findings severity and quantity, helping prioritize remediation efforts.',
          details: [
            'Real-time score calculation',
            'Historical score tracking',
            'Score trend visualization',
            'Comparative analysis',
            'Goal setting and tracking'
          ]
        },
        {
          title: 'Advanced Filtering',
          description: 'Powerful filtering and search capabilities to quickly find and analyze specific security issues.',
          details: [
            'Filter by severity level',
            'Filter by category',
            'Search by resource ID',
            'Date range filtering',
            'Custom filter combinations'
          ]
        }
      ]
    },
    {
      category: 'Automation & Integration',
      icon: null,
      items: [
        {
          title: 'Automated Scanning',
          description: 'Schedule regular scans or trigger on-demand scans to continuously monitor your AWS security posture.',
          details: [
            'On-demand scanning',
            'Scheduled scans (coming soon)',
            'Event-driven scanning (coming soon)',
            'Background task processing',
            'Real-time status updates'
          ]
        },
        {
          title: 'Secure AWS Integration',
          description: 'Secure integration with AWS using IAM roles and temporary credentials - no long-lived keys stored.',
          details: [
            'STS AssumeRole integration',
            'External ID security',
            'Temporary credential usage',
            'No credential storage',
            'Multi-region support (coming soon)'
          ]
        },
        {
          title: 'Export & Integration',
          description: 'Export findings and reports in multiple formats for integration with other security tools.',
          details: [
            'CSV export',
            'JSON export',
            'API access',
            'Webhook support (coming soon)',
            'SIEM integration (coming soon)'
          ]
        }
      ]
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

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Powerful Features for <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Cloud Security</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            S3ntraCS provides customizable security scanning, compliance monitoring, and multi-tenant management 
            to help you secure your AWS infrastructure. Select which scanners to enable for each account based on your needs.
          </p>
        </div>

        {/* Features Grid */}
        <div className="space-y-16">
          {features.map((category, categoryIndex) => (
            <div key={categoryIndex} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{category.category}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {category.items.map((feature, featureIndex) => (
                  <div key={featureIndex} className="border-l-4 border-blue-500 pl-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {feature.description}
                    </p>
                    <ul className="space-y-2">
                      {feature.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="flex items-start text-sm text-gray-600 dark:text-gray-400">
                          <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Start securing your AWS infrastructure with customizable, professional security scanning today. Perfect for small companies and startups. Choose which scanners to enable for each account.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center px-8 py-4 border-2 border-white rounded-lg shadow-sm text-lg font-semibold text-blue-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all transform hover:scale-105"
          >
            Get Started
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}

