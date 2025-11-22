import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import api from '../api'
import { useOnboarding } from '../contexts/OnboardingContext'
import { track } from '../utils/analytics'

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(1)
  const [tenants, setTenants] = useState([])
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const { markModalSeen } = useOnboarding()

  useEffect(() => {
    // Check if user has tenants
    loadTenants()
    track('onboarding.modal_opened')
  }, [])

  const loadTenants = async () => {
    try {
      const response = await api.get('/tenants/')
      setTenants(response.data)
      // If user already has tenants, skip onboarding
      if (response.data.length > 0 && step === 1) {
        onComplete?.()
      }
    } catch (err) {
      console.error('Failed to load tenants:', err)
    }
  }

  const handleSkip = () => {
    track('onboarding.modal_skipped', { step })
    markModalSeen()
    onComplete?.()
  }

  const handleNext = () => {
    if (step < 4) {
      track('onboarding.step_advanced', { from: step, to: step + 1 })
      setStep(step + 1)
    } else {
      markModalSeen()
      track('onboarding.completed')
      onComplete?.()
    }
  }

  const handleCreateTenant = () => {
    navigate('/dashboard')
    markModalSeen()
    track('onboarding.get_started_clicked')
    onComplete?.()
  }

  if (tenants.length > 0) {
    return null // User already has tenants, no onboarding needed
  }

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Welcome to S3ntraCS</h2>
              <p className="text-blue-100 mt-1">Let's get you started in 3 quick steps</p>
            </div>
            <button
              onClick={handleSkip}
              className="text-white hover:text-blue-200 transition-colors"
              aria-label="Skip onboarding"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex space-x-2">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`flex-1 h-2 rounded-full transition-all ${
                    s <= step ? 'bg-white' : 'bg-blue-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {step === 1 && (
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Secure Your AWS Infrastructure</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                S3ntraCS helps you continuously monitor your AWS accounts for security misconfigurations. Select which scanners to enable for each account from 8 available options,
                identify vulnerabilities, and maintain compliance with industry standards.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-transparent dark:border-blue-800/40 rounded-lg">
                  <div className="text-xl font-bold text-blue-600 dark:text-blue-300 mb-1">IAM</div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">User security</p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-transparent dark:border-green-800/40 rounded-lg">
                  <div className="text-xl font-bold text-green-600 dark:text-green-300 mb-1">S3</div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">Bucket security</p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-transparent dark:border-purple-800/40 rounded-lg">
                  <div className="text-xl font-bold text-purple-600 dark:text-purple-300 mb-1">Logging</div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">Monitoring</p>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-transparent dark:border-orange-800/40 rounded-lg">
                  <div className="text-xl font-bold text-orange-600 dark:text-orange-300 mb-1">EC2</div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">Security Groups</p>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-transparent dark:border-red-800/40 rounded-lg">
                  <div className="text-xl font-bold text-red-600 dark:text-red-300 mb-1">EBS</div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">Encryption</p>
                </div>
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-transparent dark:border-indigo-800/40 rounded-lg">
                  <div className="text-xl font-bold text-indigo-600 dark:text-indigo-300 mb-1">RDS</div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">Database</p>
                </div>
                <div className="p-3 bg-pink-50 dark:bg-pink-900/20 border border-transparent dark:border-pink-800/40 rounded-lg">
                  <div className="text-xl font-bold text-pink-600 dark:text-pink-300 mb-1">Lambda</div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">Functions</p>
                </div>
                <div className="p-3 bg-teal-50 dark:bg-teal-900/20 border border-transparent dark:border-teal-800/40 rounded-lg">
                  <div className="text-xl font-bold text-teal-600 dark:text-teal-300 mb-1">CloudWatch</div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">Logs</p>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 text-center">Add Your First AWS Account</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
                Connect your AWS account securely using IAM roles. No credentials are stored - we use temporary tokens.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">What You'll Need:</h4>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-200">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-300 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>AWS IAM Role ARN (e.g., arn:aws:iam::123456789012:role/S3ntraCSRole)</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>External ID (unique identifier for your account)</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>AWS Account ID (optional but recommended)</span>
                  </li>
                </ul>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-100">
                  <strong>Tip:</strong> Check the Settings page for detailed AWS setup instructions if you need help creating the IAM role.
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 text-center">Run Your First Scan</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
                Once you've added an AWS account, you can run security scans to identify misconfigurations and vulnerabilities.
              </p>
              <div className="space-y-4 mb-6">
                {[
                  { title: 'Navigate to Tenant', desc: 'Click on your tenant card from the dashboard' },
                  { title: 'Configure Scanners (Optional)', desc: 'Use the "Scanners" tab to choose which AWS services to scan (IAM, S3, Logging, EC2, EBS, RDS, Lambda, CloudWatch)' },
                  { title: 'Click "Run Scan"', desc: 'Start a scan of your AWS account (only enabled scanners will run)' },
                  { title: 'Review Findings', desc: 'View issues and remediation guidance' },
                ].map((item, index) => (
                  <div key={item.title} className="flex items-start p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-transparent dark:border-gray-700/60">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mr-4 font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{item.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">You're All Set</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                You're ready to start securing your AWS infrastructure. Add your first AWS account to get started!
              </p>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-lg p-6 mb-6 border border-blue-100 dark:border-gray-700/60">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Quick Tips:</h4>
                <ul className="text-left space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  {[
                    'Run scans regularly to stay on top of security issues',
                    'Export findings for compliance reporting',
                    'Check the Reports page for compliance framework mappings',
                  ].map((tip) => (
                    <li key={tip} className="flex items-start">
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-300 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={handleSkip}
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors font-medium"
            >
              Skip Tour
            </button>
            <div className="flex space-x-3">
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
                >
                  Previous
                </button>
              )}
              <button
                onClick={step === 4 ? handleCreateTenant : handleNext}
                className="px-6 py-2 border border-transparent rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all font-medium transform hover:scale-105"
              >
                {step === 4 ? 'Get Started' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


