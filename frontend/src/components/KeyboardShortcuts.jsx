import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const shortcuts = [
  { key: '?', description: 'Show keyboard shortcuts', action: 'toggle' },
  { key: 'g d', description: 'Go to Dashboard', action: '/dashboard' },
  { key: 'g s', description: 'Go to Settings', action: '/settings' },
  { key: 'n', description: 'New Tenant (if admin)', action: 'new-tenant' },
  { key: '/', description: 'Focus search', action: 'focus-search' },
  { key: 'esc', description: 'Close modals/dialogs', action: 'close' },
  { key: 'ctrl+k', description: 'Command palette (coming soon)', action: 'command-palette' },
]

export default function KeyboardShortcuts({ onClose }) {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Toggle shortcuts modal with ?
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Don't trigger if typing in input/textarea
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          e.preventDefault()
          setIsOpen(prev => !prev)
        }
      }

      // Close with Escape
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
        onClose?.()
      }

      // Global shortcuts (only when not typing)
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      // g + d = Dashboard
      if (e.key === 'g' && !e.repeat) {
        const handleG = (e2) => {
          if (e2.key === 'd') {
            navigate('/dashboard')
            document.removeEventListener('keydown', handleG)
          } else if (e2.key !== 'g') {
            document.removeEventListener('keydown', handleG)
          }
        }
        document.addEventListener('keydown', handleG)
        setTimeout(() => document.removeEventListener('keydown', handleG), 1000)
      }

      // g + s = Settings
      if (e.key === 'g' && !e.repeat) {
        const handleG = (e2) => {
          if (e2.key === 's') {
            navigate('/settings')
            document.removeEventListener('keydown', handleG)
          } else if (e2.key !== 'g') {
            document.removeEventListener('keydown', handleG)
          }
        }
        document.addEventListener('keydown', handleG)
        setTimeout(() => document.removeEventListener('keydown', handleG), 1000)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, navigate, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 px-6 py-4 rounded-t-xl flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Keyboard Shortcuts</h2>
            <p className="text-blue-100 text-sm mt-1">Press <kbd className="px-2 py-1 bg-blue-500 rounded text-xs">?</kbd> to toggle this menu</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white hover:text-blue-200 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {shortcuts.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {shortcut.description}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {shortcut.key.split(' ').map((k, i) => (
                    <React.Fragment key={i}>
                      <kbd className="px-3 py-1.5 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg shadow-sm">
                        {k}
                      </kbd>
                      {i < shortcut.key.split(' ').length - 1 && (
                        <span className="text-gray-400">+</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Keyboard shortcuts work globally when not typing in input fields
            </p>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 rounded-b-xl border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={() => setIsOpen(false)}
            className="w-full px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}







