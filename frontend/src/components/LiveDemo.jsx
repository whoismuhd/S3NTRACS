import React, { useState, useEffect } from 'react'

export default function LiveDemo() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [activeScanner, setActiveScanner] = useState(0)

  const demoSteps = [
    {
      title: 'Dashboard Overview',
      description: 'Monitor all your AWS accounts from a single unified dashboard',
      view: 'dashboard',
    },
    {
      title: 'Add AWS Account',
      description: 'Connect your AWS account securely using STS AssumeRole',
      view: 'add-account',
    },
    {
      title: 'Select Scanners',
      description: 'Choose which AWS services to scan - enable only what you need',
      view: 'scanners',
    },
    {
      title: 'Run Security Scan',
      description: 'Real-time scanning across multiple AWS services',
      view: 'scanning',
    },
    {
      title: 'Review Findings',
      description: 'Detailed security findings with severity levels and compliance mapping',
      view: 'findings',
    },
    {
      title: 'Export & Reports',
      description: 'Generate compliance reports and export findings in JSON/CSV',
      view: 'reports',
    },
  ]

  // Simulate scan progress
  useEffect(() => {
    if (currentStep === 3 && isPlaying) {
      const interval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 100) {
            return 0
          }
          return prev + 2
        })
      }, 100)
      return () => clearInterval(interval)
    } else {
      setScanProgress(0)
    }
  }, [currentStep, isPlaying])

  // Auto-advance steps
  useEffect(() => {
    if (isPlaying && currentStep < demoSteps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep((prev) => (prev + 1) % demoSteps.length)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [currentStep, isPlaying, demoSteps.length])

  // Rotate active scanner during scan
  useEffect(() => {
    if (currentStep === 3 && isPlaying) {
      const scannerNames = ['IAM', 'S3', 'Logging', 'EC2', 'EBS', 'RDS', 'Lambda', 'CloudWatch']
      const interval = setInterval(() => {
        setActiveScanner((prev) => (prev + 1) % scannerNames.length)
      }, 600)
      return () => clearInterval(interval)
    }
  }, [currentStep, isPlaying])

  const handlePlay = () => {
    setIsPlaying(true)
    if (currentStep === demoSteps.length - 1) {
      setCurrentStep(0)
    }
  }

  const handlePause = () => {
    setIsPlaying(false)
  }

  const handleStepClick = (index) => {
    setCurrentStep(index)
    setIsPlaying(false)
  }

  const renderDashboardView = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-bold text-gray-900 dark:text-white">Security Dashboard</h4>
          <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-semibold rounded-full">
            All Systems Operational
          </span>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Tenants', value: '3', color: 'blue' },
            { label: 'Critical', value: '12', color: 'red' },
            { label: 'Findings', value: '47', color: 'orange' },
            { label: 'Scans', value: '156', color: 'green' },
          ].map((stat, idx) => (
            <div key={idx} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className={`text-2xl font-extrabold text-${stat.color}-600 dark:text-${stat.color}-400 mb-1`}>
                {stat.value}
              </div>
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-300">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-3">
          {[
            { name: 'Production AWS', account: '123456789012', score: 85, status: 'healthy' },
            { name: 'Staging AWS', account: '987654321098', score: 72, status: 'warning' },
            { name: 'Development AWS', account: '555555555555', score: 91, status: 'healthy' },
          ].map((tenant, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">{tenant.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-300 font-mono">{tenant.account}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{tenant.score}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-300">Security Score</div>
                </div>
                <div className={`w-3 h-3 rounded-full ${
                  tenant.status === 'healthy' ? 'bg-green-500' : 'bg-yellow-500'
                }`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderAddAccountView = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-6 space-y-4">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Account Name</label>
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
              <span className="text-gray-900 dark:text-white font-medium">Production AWS</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">AWS Role ARN</label>
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
              <span className="text-gray-900 dark:text-white font-mono text-sm">arn:aws:iam::123456789012:role/S3ntraCS-ScanRole</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">External ID</label>
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
              <span className="text-gray-900 dark:text-white font-mono text-sm">s3ntracs-2024-unique-123</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-semibold text-green-800 dark:text-green-200">Account connected successfully</span>
        </div>
      </div>
    </div>
  )

  const renderScannersView = () => {
    const scanners = ['IAM', 'S3', 'Logging', 'EC2', 'EBS', 'RDS', 'Lambda', 'CloudWatch']
    const enabled = [0, 1, 2, 3, 4] // First 5 enabled
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6">
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Select Scanners to Enable</h4>
            <p className="text-xs text-gray-500 dark:text-gray-300">Choose which AWS services to scan for this account</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {scanners.map((scanner, idx) => {
              const isEnabled = enabled.includes(idx)
              return (
                <div
                  key={scanner}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    isEnabled
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-sm'
                      : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{scanner}</span>
                    {isEnabled && (
                      <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-300">
                    {isEnabled ? 'Enabled' : 'Disabled'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const renderScanningView = () => {
    const scannerNames = ['IAM', 'S3', 'Logging', 'EC2', 'EBS', 'RDS', 'Lambda', 'CloudWatch']
    const completed = Math.floor(scanProgress / 12.5)
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Scan Progress</span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{Math.round(scanProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
          </div>
          
          <div className="space-y-3">
            {scannerNames.map((scanner, idx) => {
              const isActive = idx === activeScanner && scanProgress < 100
              const isCompleted = idx < completed
              const isPending = idx > completed
              
              return (
                <div
                  key={scanner}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isActive
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
                      : isCompleted
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isActive && (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
                      )}
                      {isCompleted && (
                        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      {isPending && (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                      )}
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{scanner} Scanner</span>
                    </div>
                    <div className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      {isActive && 'Scanning...'}
                      {isCompleted && `${Math.floor(Math.random() * 5) + 1} findings`}
                      {isPending && 'Pending'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          {scanProgress >= 100 && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-semibold text-green-800 dark:text-green-200">Scan completed successfully</span>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderFindingsView = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-bold text-gray-900 dark:text-white">Security Findings</h4>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
              Critical: 3
            </button>
            <button className="px-3 py-1 text-xs font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-lg">
              High: 8
            </button>
          </div>
        </div>
        
        <div className="space-y-3">
          {[
            {
              severity: 'CRITICAL',
              title: 'S3 Bucket Publicly Accessible',
              category: 'S3',
              resource: 'my-production-bucket',
              compliance: ['ISO 27001', 'SOC 2'],
              description: 'Bucket allows public read access via bucket policy',
            },
            {
              severity: 'HIGH',
              title: 'IAM User Without MFA',
              category: 'IAM',
              resource: 'admin-user',
              compliance: ['NIST CSF', 'GDPR'],
              description: 'User does not have multi-factor authentication enabled',
            },
            {
              severity: 'MEDIUM',
              title: 'CloudTrail Not Enabled',
              category: 'Logging',
              resource: 'us-east-1',
              compliance: ['ISO 27001'],
              description: 'CloudTrail logging is not enabled for this region',
            },
            {
              severity: 'HIGH',
              title: 'EC2 Instance Without Encryption',
              category: 'EC2',
              resource: 'i-1234567890abcdef0',
              compliance: ['SOC 2', 'NIST CSF'],
              description: 'EBS volume attached to instance is not encrypted',
            },
          ].map((finding, idx) => {
            const severityColors = {
              CRITICAL: 'bg-red-500 border-red-500 text-red-700 dark:text-red-300',
              HIGH: 'bg-orange-500 border-orange-500 text-orange-700 dark:text-orange-300',
              MEDIUM: 'bg-yellow-500 border-yellow-500 text-yellow-700 dark:text-yellow-300',
              LOW: 'bg-blue-500 border-blue-500 text-blue-700 dark:text-blue-300',
            }
            
            const bgColors = {
              CRITICAL: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
              HIGH: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
              MEDIUM: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
              LOW: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
            }
            
            return (
              <div
                key={idx}
                className={`p-4 rounded-lg border-l-4 ${bgColors[finding.severity]} border ${bgColors[finding.severity].replace('bg-', 'border-').replace('/20', '/30')}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 text-xs font-bold rounded ${severityColors[finding.severity]}`}>
                        {finding.severity}
                      </span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{finding.title}</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">{finding.description}</p>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-gray-500 dark:text-gray-300">
                        <span className="font-semibold">Category:</span> {finding.category}
                      </span>
                      <span className="text-gray-500 dark:text-gray-300">
                        <span className="font-semibold">Resource:</span> {finding.resource}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {finding.compliance.map((framework, fIdx) => (
                        <span
                          key={fIdx}
                          className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded"
                        >
                          {framework}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  const renderReportsView = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-6">
        <div className="mb-6">
          <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Compliance Reports</h4>
          <p className="text-sm text-gray-600 dark:text-gray-300">Generate and export compliance reports for audits</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {[
            { name: 'ISO 27001', findings: 12, status: 'compliant', color: 'blue' },
            { name: 'SOC 2', findings: 8, status: 'partial', color: 'orange' },
            { name: 'NIST CSF', findings: 15, status: 'compliant', color: 'green' },
            { name: 'GDPR', findings: 5, status: 'compliant', color: 'purple' },
          ].map((report, idx) => (
            <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-900 dark:text-white">{report.name}</span>
                <span className={`px-2 py-1 text-xs font-semibold rounded ${
                  report.status === 'compliant' 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                }`}>
                  {report.status === 'compliant' ? 'Compliant' : 'Partial'}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {report.findings} mapped findings
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex gap-3">
          <button className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export JSON
          </button>
          <button className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>
    </div>
  )

  const renderView = () => {
    switch (demoSteps[currentStep].view) {
      case 'dashboard':
        return renderDashboardView()
      case 'add-account':
        return renderAddAccountView()
      case 'scanners':
        return renderScannersView()
      case 'scanning':
        return renderScanningView()
      case 'findings':
        return renderFindingsView()
      case 'reports':
        return renderReportsView()
      default:
        return renderDashboardView()
    }
  }

  return (
    <div className="w-full">
      {/* Step Indicators */}
      <div className="flex items-center justify-center mb-8 gap-2 flex-wrap">
        {demoSteps.map((step, index) => (
          <button
            key={index}
            onClick={() => handleStepClick(index)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all font-semibold text-sm ${
              currentStep === index
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
            }`}
          >
            <span className={`w-6 h-6 rounded-full flex items-center justify-center ${
              currentStep === index ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'
            }`}>
              {index + 1}
            </span>
            <span className="hidden sm:inline">{step.title}</span>
          </button>
        ))}
      </div>

      {/* Demo Content */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {demoSteps[currentStep].view === 'dashboard' && (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  )}
                  {demoSteps[currentStep].view === 'add-account' && (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  )}
                  {demoSteps[currentStep].view === 'scanners' && (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  )}
                  {demoSteps[currentStep].view === 'scanning' && (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  )}
                  {demoSteps[currentStep].view === 'findings' && (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  )}
                  {demoSteps[currentStep].view === 'reports' && (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  )}
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{demoSteps[currentStep].title}</h3>
                <p className="text-sm text-blue-100">{demoSteps[currentStep].description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isPlaying ? (
                <button
                  onClick={handlePlay}
                  className="p-3 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all backdrop-blur-sm"
                  title="Play Demo"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  className="p-3 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all backdrop-blur-sm"
                  title="Pause Demo"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div className="p-8 animate-fade-in">
          {renderView()}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-4 overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out shadow-sm"
          style={{ width: `${((currentStep + 1) / demoSteps.length) * 100}%` }}
        />
      </div>
      <div className="text-center">
        <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
          Step {currentStep + 1} of {demoSteps.length}
        </span>
      </div>
    </div>
  )
}
