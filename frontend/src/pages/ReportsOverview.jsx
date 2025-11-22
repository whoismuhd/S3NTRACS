import React from 'react'
import { Link } from 'react-router-dom'

export default function ReportsOverview() {
  const quickLinks = [
    {
      title: 'Latest Compliance Report',
      description: 'Review your most recent scan results and download full findings.',
      to: '/dashboard',
      action: 'View dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      ),
    },
    {
      title: 'Tenant Directory',
      description: 'Choose a tenant to open its detailed compliance report.',
      to: '/dashboard?tab=tenants',
      action: 'Browse tenants',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5V4H2v16h5" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9l6 6 6-6" />
        </svg>
      ),
    },
    {
      title: 'Generate Export',
      description: 'Export the latest compliance summary for auditors and stakeholders.',
      to: '/dashboard?tab=exports',
      action: 'Go to exports',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12v8m0 0l-3-3m3 3l3-3M12 4v8m0 0l3-3m-3 3L9 9" />
        </svg>
      ),
    },
  ]

  return (
    <div className="space-y-8">
      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Compliance Reports</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 max-w-2xl">
              View and download cloud compliance reports for each tenant. Select a tenant below to open its full
              report, or jump back to the dashboard to run a new scan.
            </p>
          </div>
          <Link
            to="/dashboard"
            className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-lg shadow-sm transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Back to dashboard
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {quickLinks.map((link) => (
          <Link
            key={link.title}
            to={link.to}
            className="group flex flex-col justify-between bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-6 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-blue-100 dark:hover:shadow-blue-900/20 transition-all"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {link.title}
              </h2>
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                {link.icon}
              </span>
            </div>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 flex-1">{link.description}</p>
            <span className="mt-5 inline-flex items-center text-sm font-semibold text-blue-600 dark:text-blue-400 group-hover:text-blue-500 dark:group-hover:text-blue-300">
              {link.action}
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </Link>
        ))}
      </section>

      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">How to access tenant reports</h2>
        <ol className="mt-4 space-y-3 list-decimal list-inside text-sm text-gray-600 dark:text-gray-400">
          <li>Go to the dashboard and pick a tenant that has completed scans.</li>
          <li>Select "View reports" from the tenant actions menu.</li>
          <li>On the report page, download JSON exports or review compliance mappings.</li>
        </ol>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Need a report right now? Navigate to a tenant from the dashboard and use the "Reports" quick action. Each
          tenant route follows the pattern <code className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-1.5 py-0.5 rounded">/reports/&lt;tenant-id&gt;</code>.
        </p>
      </section>
    </div>
  )
}
