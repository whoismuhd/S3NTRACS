import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnboarding } from '../contexts/OnboardingContext'
import { useToast } from '../contexts/ToastContext'
import { track } from '../utils/analytics'

export default function OnboardingChecklist({ onDismiss, onRequestAddTenant, primaryTenantId }) {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { state, completeTask, completedTasks, totalTasks } = useOnboarding()

  const tasks = useMemo(() => ([
    {
      id: 'connectTenant',
      title: 'Connect an AWS account',
      description: 'Add your first tenant to start collecting findings and compliance data.',
      actionLabel: state.tasks.connectTenant.completed ? 'Completed' : 'Add tenant',
      onAction: () => {
        if (state.tasks.connectTenant.completed) return
        track('onboarding.task_action_clicked', { taskId: 'connectTenant' })
        if (onRequestAddTenant) {
          onRequestAddTenant()
        }
      },
      completed: state.tasks.connectTenant.completed,
    },
    {
      id: 'runScan',
      title: 'Run your first scan',
      description: 'Kick off a scan to baseline your posture and watch live progress.',
      actionLabel: state.tasks.runScan.completed ? 'Completed' : 'Go to tenant',
      onAction: () => {
        if (state.tasks.runScan.completed) return
        if (primaryTenantId) {
          track('onboarding.task_action_clicked', { taskId: 'runScan', target: 'tenant_detail', tenantId: primaryTenantId })
          navigate(`/tenants/${primaryTenantId}?intent=run-scan`)
        } else {
          track('onboarding.task_action_clicked', { taskId: 'runScan', blocked: true })
          showToast('Connect an AWS account first to run your first scan.', 'info')
        }
      },
      completed: state.tasks.runScan.completed,
    },
    {
      id: 'reviewFindings',
      title: 'Review findings & reports',
      description: 'Inspect your compliance report and share it with stakeholders.',
      actionLabel: state.tasks.reviewFindings.completed ? 'Completed' : 'View reports',
      onAction: () => {
        if (state.tasks.reviewFindings.completed) return
        track('onboarding.task_action_clicked', { taskId: 'reviewFindings' })
        navigate('/reports')
        completeTask('reviewFindings')
      },
      completed: state.tasks.reviewFindings.completed,
    },
  ]), [state.tasks, onRequestAddTenant, primaryTenantId, navigate, showToast, completeTask])

  const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100)

  return (
    <aside className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Getting started checklist</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Complete these steps to unlock the full platform.</p>
        </div>
        <button
          onClick={() => {
            track('onboarding.checklist_dismiss_clicked')
            onDismiss()
          }}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          aria-label="Dismiss onboarding checklist"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div>
        <div className="flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          <span>{completedTasks} of {totalTasks} completed</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <ul className="space-y-4">
        {tasks.map((task) => (
          <li
            key={task.id}
            className={`flex items-start gap-4 rounded-xl border px-4 py-3 transition-all ${
              task.completed
                ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
            }`}
          >
            <div
              className={`mt-1 w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold ${
                task.completed
                  ? 'bg-green-500 text-white'
                  : 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300'
              }`}
            >
              {task.completed ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span>•</span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{task.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{task.description}</p>
                </div>
                <div>
                  <button
                    onClick={() => {
                      if (!task.completed) {
                        track('onboarding.checklist_action_clicked', { taskId: task.id })
                      }
                      task.onAction()
                    }}
                    disabled={task.completed}
                    className={`inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      task.completed
                        ? 'bg-green-500/10 text-green-700 dark:text-green-300 cursor-default'
                        : 'bg-blue-600 text-white hover:bg-blue-500'
                    }`}
                  >
                    {task.actionLabel}
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  )
}
