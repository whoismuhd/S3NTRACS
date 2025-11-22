import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import HelpCenter from '../components/HelpCenter'

export default function Support() {
  const { user, isAuthenticated } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [showHelpCenter, setShowHelpCenter] = useState(false)
  const [faqExpanded, setFaqExpanded] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || ''
      }))
    }
  }, [user])

  const handleSubmit = (e) => {
    e.preventDefault()
    // In a real app, this would send to a backend API
    alert('Thank you for contacting us! We will get back to you soon.')
    setFormData({ ...formData, subject: '', message: '' })
  }

  const faqs = [
    {
      question: 'How do I set up my AWS account?',
      answer: 'Check our Documentation page for detailed AWS setup instructions. You\'ll need to: 1) Create an IAM role in your AWS account, 2) Configure the trust policy to allow S3ntraCS to assume the role, 3) Attach read-only IAM policies based on which scanners you want to enable, and 4) Add the role ARN and external ID when creating a tenant in S3ntraCS.'
    },
    {
      question: 'What permissions does S3ntraCS need?',
          answer: 'S3ntraCS requires read-only access based on which scanners you enable. We currently offer 8 scanners: IAM (IAMReadOnlyAccess), S3 (AmazonS3ReadOnlyAccess), Logging (CloudTrailReadOnlyAccess), EC2 (AmazonEC2ReadOnlyAccess), EBS (AmazonEC2ReadOnlyAccess), RDS (AmazonRDSReadOnlyAccess), Lambda (AWSLambda_ReadOnlyAccess), and CloudWatch (CloudWatchReadOnlyAccess). You can select which scanners to enable per account in the tenant\'s Scanners tab. More scanners will be added in future updates. We never modify your AWS resources.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes! We use temporary AWS credentials via STS AssumeRole. No long-lived credentials are stored. All data is encrypted in transit and at rest.'
    },
    {
      question: 'Can I use S3ntraCS for multiple AWS accounts?',
      answer: 'Absolutely! S3ntraCS supports multi-tenant architecture, allowing you to manage multiple AWS accounts from a single dashboard.'
    },
    {
      question: 'How often should I run scans?',
      answer: 'We recommend running scans weekly or after significant infrastructure changes. You can schedule automatic scans (daily, weekly, or monthly) from the Schedule tab in each tenant\'s detail page. You can also customize which scanners run for each account.'
    },
    {
      question: 'What compliance frameworks are supported?',
      answer: 'S3ntraCS currently supports ISO 27001, GDPR, SOC 2, and NIST CSF. Findings are automatically mapped to these frameworks in compliance reports. Custom frameworks may be added in future updates.'
    },
    {
      question: 'How do I configure scanners for my AWS account?',
          answer: 'After adding a tenant, go to the tenant detail page and click on the "Scanners" tab. You can select which of the 8 available scanners (IAM, S3, Logging, EC2, EBS, RDS, Lambda, CloudWatch) to enable for that account. Only enabled scanners will run during scans. More scanners will be added in future updates.'
    },
    {
      question: 'Can I get notified about new findings?',
      answer: 'Yes! S3ntraCS supports email and Slack notifications. Configure your notification preferences in the tenant\'s "Notifications" tab. You can set minimum severity levels, choose which events trigger notifications, and add multiple email recipients or Slack webhooks.'
    }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            We're Here to Help
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Get support, find answers, or contact our team
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Contact Form */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Contact Us</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={6}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all transform hover:scale-105"
              >
                Send Message
              </button>
            </form>
          </div>

          {/* Support Options */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Support Channels</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Documentation</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      Check our comprehensive documentation for setup guides and FAQs.
                    </p>
                    <Link to="/documentation" className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block">
                      View Documentation →
                    </Link>
                  </div>
                </div>
                <div className="flex items-start">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Help Center</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      Browse our help center for answers to common questions.
                    </p>
                    {isAuthenticated ? (
                      <button
                        onClick={() => setShowHelpCenter(true)}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block"
                      >
                        Open Help Center →
                      </button>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        (Available after login)
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-start">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Email Support</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      Send us an email and we'll respond within 24 hours.
                    </p>
                    <a href="mailto:support@s3ntracs.com" className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block">
                      support@s3ntracs.com
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Response Times</h2>
              <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                <div className="flex justify-between">
                  <span>General Inquiries</span>
                  <span className="font-medium">24-48 hours</span>
                </div>
                <div className="flex justify-between">
                  <span>Technical Support</span>
                  <span className="font-medium">12-24 hours</span>
                </div>
                <div className="flex justify-between">
                  <span>Critical Issues</span>
                  <span className="font-medium text-red-600 dark:text-red-400">4-8 hours</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            onClick={() => setFaqExpanded(!faqExpanded)}
            className="w-full px-8 py-6 text-left bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center justify-between"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Frequently Asked Questions</h2>
            <svg
              className={`w-6 h-6 text-gray-500 dark:text-gray-400 transition-transform ${
                faqExpanded ? 'transform rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {faqExpanded && (
            <div className="px-8 py-6 space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{faq.question}</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">{faq.answer}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      {showHelpCenter && <HelpCenter onClose={() => setShowHelpCenter(false)} />}
    </div>
  )
}


