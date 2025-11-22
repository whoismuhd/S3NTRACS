import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { track } from '../utils/analytics'

const OnboardingContext = createContext(null)

const createDefaultState = () => ({
  modalSeen: false,
  checklistDismissed: false,
  tasks: {
    connectTenant: { completed: false, completedAt: null },
    runScan: { completed: false, completedAt: null },
    reviewFindings: { completed: false, completedAt: null },
  },
})

export function OnboardingProvider({ children }) {
  const { user } = useAuth()
  const storageKey = useMemo(() => (user?.id ? `s3ntracs_onboarding_${user.id}` : 's3ntracs_onboarding_guest'), [user?.id])
  const hasLoadedFromStorage = useRef(false)
  const [state, setState] = useState(() => createDefaultState())

  useEffect(() => {
    const loadFromStorage = () => {
      try {
        const raw = localStorage.getItem(storageKey)
        if (raw) {
          const parsed = JSON.parse(raw)
          const defaults = createDefaultState()
          hasLoadedFromStorage.current = true
          return {
            ...defaults,
            ...parsed,
            tasks: {
              ...defaults.tasks,
              ...(parsed.tasks || {}),
            },
          }
        }
      } catch (err) {
        console.error('Failed to load onboarding state:', err)
      }
      hasLoadedFromStorage.current = true
      return createDefaultState()
    }

    setState(loadFromStorage())
  }, [storageKey])

  useEffect(() => {
    if (!hasLoadedFromStorage.current) return
    try {
      localStorage.setItem(storageKey, JSON.stringify(state))
    } catch (err) {
      console.error('Failed to persist onboarding state:', err)
    }
  }, [state, storageKey])

  const completeTask = useCallback((taskId) => {
    setState((prev) => {
      if (!prev.tasks[taskId] || prev.tasks[taskId].completed) {
        return prev
      }
      return {
        ...prev,
        tasks: {
          ...prev.tasks,
          [taskId]: {
            completed: true,
            completedAt: new Date().toISOString(),
          },
        },
      }
    })
    track('onboarding.task_completed', { taskId })
  }, [])

  const resetTask = useCallback((taskId) => {
    setState((prev) => {
      if (!prev.tasks[taskId]) {
        return prev
      }
      return {
        ...prev,
        tasks: {
          ...prev.tasks,
          [taskId]: {
            completed: false,
            completedAt: null,
          },
        },
      }
    })
  }, [])

  const markModalSeen = useCallback(() => {
    setState((prev) => {
      if (prev.modalSeen) return prev
      track('onboarding.modal_seen')
      return { ...prev, modalSeen: true }
    })
  }, [])

  const reopenModal = useCallback(() => {
    setState((prev) => {
      track('onboarding.modal_reopened')
      return { ...prev, modalSeen: false }
    })
  }, [])

  const dismissChecklist = useCallback(() => {
    setState((prev) => {
      if (prev.checklistDismissed) return prev
      track('onboarding.checklist_dismissed')
      return { ...prev, checklistDismissed: true }
    })
  }, [])

  const reopenChecklist = useCallback(() => {
    setState((prev) => {
      track('onboarding.checklist_reopened')
      return { ...prev, checklistDismissed: false }
    })
  }, [])

  const resetOnboarding = useCallback(() => {
    setState(createDefaultState())
    track('onboarding.reset')
  }, [])

  const completedTasks = useMemo(
    () => Object.values(state.tasks).filter((task) => task.completed).length,
    [state.tasks],
  )

  const totalTasks = useMemo(() => Object.keys(state.tasks).length, [state.tasks])

  const value = useMemo(
    () => ({
      state,
      completedTasks,
      totalTasks,
      progress: totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100),
      completeTask,
      resetTask,
      markModalSeen,
      reopenModal,
      dismissChecklist,
      reopenChecklist,
      resetOnboarding,
      shouldShowModal: !state.modalSeen,
      shouldShowChecklist: !state.checklistDismissed && completedTasks < totalTasks,
    }),
    [state, completedTasks, totalTasks, completeTask, resetTask, markModalSeen, reopenModal, dismissChecklist, reopenChecklist, resetOnboarding],
  )

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }
  return context
}
