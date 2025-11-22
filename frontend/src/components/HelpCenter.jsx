import React, { useState } from 'react'
import { Link } from 'react-router-dom'

const helpSections = [
  {
    title: 'Getting Started',
    icon: null,
    items: [
      { question: 'How do I add my first AWS account?', answer: 'Go to Dashboard → Click "New Tenant" → Enter your AWS Role ARN and External ID. Check Settings for detailed AWS setup instructions.' },
      { question: 'What is an External ID?', answer: 'External ID is a unique identifier used for additional security when assuming AWS roles. It must match the ExternalId in your IAM role\'s trust policy.' },
      { question: 'How do I run my first scan?', answer: 'Navigate to your tenant detail page and click "Run Scan". You can select which scanners to enable (8 available: IAM, S3, Logging, EC2, EBS, RDS, Lambda, CloudWatch) in the "Scanners" tab before running a scan.' },
    ]
  },
  {
    title: 'Understanding Findings',
    icon: null,
    items: [
      { question: 'What do severity levels mean?', answer: 'CRITICAL: Immediate action required. HIGH: Important security issues. MEDIUM: Should be addressed. LOW: Best practice recommendations.' },
      { question: 'How is the security score calculated?', answer: 'The score is based on the number and severity of findings. Critical findings reduce the score more than low-severity ones.' },
      { question: 'What is compliance mapping?', answer: 'Each finding is mapped to compliance frameworks like ISO 27001, GDPR, SOC 2, and NIST CSF to help with audits.' },
    ]
  },
  {
    title: 'AWS Setup',
    icon: null,
    items: [
      { question: 'What permissions does the IAM role need?', answer: 'The role needs read-only access based on which scanners you enable. Available policies: IAMReadOnlyAccess, AmazonS3ReadOnlyAccess, CloudTrailReadOnlyAccess, AmazonEC2ReadOnlyAccess, AmazonRDSReadOnlyAccess, AWSLambda_ReadOnlyAccess, and CloudWatchReadOnlyAccess. Attach only the policies for scanners you plan to use.' },
      { question: 'How do I create the IAM role?', answer: 'Go to AWS IAM Console → Roles → Create Role. Use the trust policy template shown in Settings → Add Your AWS Account section.' },
      { question: 'Is it secure?', answer: 'Yes! S3ntraCS never stores AWS credentials. It uses temporary tokens via STS AssumeRole that expire after 1 hour.' },
    ]
  },
  {
    title: 'Reports & Exports',
    icon: null,
    items: [
      { question: 'How do I export findings?', answer: 'Go to Tenant Detail page → Click "Export CSV" or "Export JSON" to download all findings.' },
      { question: 'What formats are available?', answer: 'Findings can be exported as CSV or JSON. Compliance reports are available as JSON.' },
      { question: 'Can I schedule reports?', answer: 'Scheduled reports are coming soon. Currently, you can generate reports on-demand from the Reports page.' },
    ]
  },
]

export default function HelpCenter({ onClose }) {
  const [openSection, setOpenSection] = useState(null)
  const [openItem, setOpenItem] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredSections = helpSections.map(section => ({
    ...section,
    items: section.items.filter(item =>
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(section => section.items.length > 0)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Help Center</h2>
            <p className="text-blue-100 text-sm mt-1">Find answers to common questions</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-blue-200 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <input
            type="text"
            placeholder="Search help articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {filteredSections.map((section, sectionIndex) => (
              <div
                key={sectionIndex}
                className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setOpenSection(openSection === sectionIndex ? null : sectionIndex)}
                  className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {section.title}
                    </h3>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${
                      openSection === sectionIndex ? 'transform rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {openSection === sectionIndex && (
                  <div className="px-6 py-4 space-y-3">
                    {section.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="border-l-4 border-blue-500 pl-4">
                        <button
                          onClick={() => setOpenItem(openItem === `${sectionIndex}-${itemIndex}` ? null : `${sectionIndex}-${itemIndex}`)}
                          className="w-full text-left"
                        >
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                            {item.question}
                          </h4>
                        </button>
                        {openItem === `${sectionIndex}-${itemIndex}` && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                            {item.answer}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredSections.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="mt-4 text-gray-500 dark:text-gray-400">No results found</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Need more help? <Link to="/settings" className="text-blue-600 dark:text-blue-400 hover:underline" onClick={onClose}>Contact Support</Link>
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}



