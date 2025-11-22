import axios from 'axios'

const getBaseUrl = () => {
  // Explicit override (used in Docker/production builds)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '')
  }

  // When running the Vite dev server locally, go through its proxy to avoid CORS
  if (import.meta.env.DEV) {
    return '/api'
  }

  // Fallback to same origin in static builds
  return window.location.origin.replace(/\/$/, '')
}

const API_URL = getBaseUrl()

if (import.meta.env.DEV) {
  console.log('API URL:', API_URL)
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

const isPublicRoute = (pathname) => {
  return pathname.includes('/login') ||
         pathname.includes('/register') ||
         pathname === '/' ||
         pathname.includes('/features') ||
         pathname.includes('/documentation') ||
         pathname.includes('/terms') ||
         pathname.includes('/privacy')
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname

      if (isPublicRoute(currentPath)) {
        localStorage.removeItem('token')
        return Promise.reject(error)
      }

      localStorage.removeItem('token')
      window.dispatchEvent(new CustomEvent('auth:logout'))

      setTimeout(() => {
        const stillOnPublicRoute = isPublicRoute(window.location.pathname)
        if (!stillOnPublicRoute) {
          window.location.href = '/login?expired=true'
        }
      }, 100)
    }
    return Promise.reject(error)
  }
)

export default api
