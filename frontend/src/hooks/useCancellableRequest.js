import { useEffect, useRef } from 'react'

/**
 * Hook to create cancellable requests for cleanup
 * Useful for polling or component unmount scenarios
 */
export function useCancellableRequest() {
  const abortControllerRef = useRef(null)

  useEffect(() => {
    return () => {
      // Cancel any pending requests on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort('Component unmounted')
      }
    }
  }, [])

  const createAbortController = () => {
    // Create a new AbortController for each request
    const controller = new AbortController()
    abortControllerRef.current = controller
    return controller
  }

  return { createAbortController }
}

