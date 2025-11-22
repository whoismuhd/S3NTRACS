import React, { useState, useEffect } from 'react'
import api from '../api'
import { useToast } from '../contexts/ToastContext'

// GitHub Actions workflow template
const GITHUB_WORKFLOW_TEMPLATE = 'name: Security Scan\n\n' +
  'on: [pull_request, push]\n\n' +
  'jobs:\n' +
  '  security-scan:\n' +
  '    runs-on: ubuntu-latest\n' +
  '    steps:\n' +
  '      - name: Trigger S3ntraCS Scan\n' +
  '        env:\n' +
  '          S3NTRACS_API_URL: ${{ secrets.S3NTRACS_API_URL }}\n' +
  '          S3NTRACS_API_TOKEN: ${{ secrets.S3NTRACS_API_TOKEN }}\n' +
  '          TENANT_ID: ${{ secrets.S3NTRACS_TENANT_ID }}\n' +
  '        run: |\n' +
  '          curl -X POST "${S3NTRACS_API_URL}/github/ci-scan" \\\n' +
  '            -H "Authorization: Bearer ${S3NTRACS_API_TOKEN}" \\\n' +
  '            -d \'{"tenant_id": "${TENANT_ID}", "repo": "${{ github.repository }}"}\'\n'

export default function GitHubIntegration({ tenantId }) {
  const [githubToken, setGithubToken] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    // Note: GitHub token is configured via GITHUB_TOKEN environment variable on the backend
    // The frontend can test the connection, but token management is server-side
  }, [])

  const handleTestConnection = async () => {
    setTesting(true)
    try {
      const response = await api.get('/github/repos')
      setRepos(response.data)
      showToast('GitHub connection successful!', 'success')
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to connect to GitHub', 'error')
    } finally {
      setTesting(false)
    }
  }

  const handlePostPRComment = async (repoOwner, repoName, prNumber) => {
    if (!prNumber) {
      showToast('Please enter a PR number', 'error')
      return
    }

    setLoading(true)
    try {
      await api.post(`/github/pr-comment/${tenantId}`, {
        repo_owner: repoOwner,
        repo_name: repoName,
        pr_number: parseInt(prNumber),
      })
      showToast('PR comment posted successfully!', 'success')
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to post PR comment', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
          </svg>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">GitHub Integration</h2>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Connect S3ntraCS with GitHub to post security findings in pull requests and enable CI/CD scanning.
        </p>

        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                  GitHub Token Configuration
                </p>
                <p className="text-xs text-blue-800 dark:text-blue-300">
                  The GitHub Personal Access Token must be configured on the backend via the <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">GITHUB_TOKEN</code> environment variable. 
                  Contact your administrator to set this up.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Webhook Secret (Optional)
            </label>
            <input
              type="password"
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              placeholder="Your webhook secret"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Secret for verifying GitHub webhook signatures. Configure via <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">GITHUB_WEBHOOK_SECRET</code> environment variable.
            </p>
          </div>

          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testing ? 'Testing...' : 'Test GitHub Connection'}
          </button>

          {repos.length > 0 && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                Connected! Found {repos.length} repositories
              </p>
              <div className="max-h-40 overflow-y-auto">
                {repos.slice(0, 5).map((repo, idx) => (
                  <div key={idx} className="text-xs text-green-700 dark:text-green-300">
                    {repo.full_name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Post Findings to PR</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Manually post security findings as a comment on a pull request.
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Repository Owner
              </label>
              <input
                type="text"
                id="repoOwner"
                placeholder="your-org"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Repository Name
              </label>
              <input
                type="text"
                id="repoName"
                placeholder="your-repo"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Pull Request Number
            </label>
            <input
              type="number"
              id="prNumber"
              placeholder="123"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => {
              const owner = document.getElementById('repoOwner').value
              const name = document.getElementById('repoName').value
              const pr = document.getElementById('prNumber').value
              handlePostPRComment(owner, name, pr)
            }}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Posting...' : 'Post to PR'}
          </button>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-blue-900 dark:text-blue-200 mb-2">GitHub Actions Setup</h3>
        <p className="text-sm text-blue-800 dark:text-blue-300 mb-4">
          Add security scanning to your CI/CD pipeline. Copy this workflow to <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">.github/workflows/security-scan.yml</code>
        </p>
        <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
          <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
            <code>{GITHUB_WORKFLOW_TEMPLATE}</code>
          </pre>
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(GITHUB_WORKFLOW_TEMPLATE)
            showToast('Workflow copied to clipboard!', 'success')
          }}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
        >
          Copy Workflow
        </button>
      </div>
    </div>
  )
}

