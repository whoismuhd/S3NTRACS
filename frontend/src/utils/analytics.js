export function track(eventName, payload = {}) {
  try {
    if (typeof window !== 'undefined' && window.analytics && typeof window.analytics.track === 'function') {
      window.analytics.track(eventName, payload)
      return
    }
    const timestamp = new Date().toISOString()
    // eslint-disable-next-line no-console
    console.debug(`[analytics] ${timestamp} ${eventName}`, payload)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Analytics tracking failed', err)
  }
}

export function identify(userId, traits = {}) {
  try {
    if (typeof window !== 'undefined' && window.analytics && typeof window.analytics.identify === 'function') {
      window.analytics.identify(userId, traits)
      return
    }
    const timestamp = new Date().toISOString()
    // eslint-disable-next-line no-console
    console.debug(`[analytics] ${timestamp} identify`, { userId, traits })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Analytics identify failed', err)
  }
}





