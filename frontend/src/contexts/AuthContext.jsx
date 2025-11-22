import React, { createContext, useState, useContext, useEffect, useCallback } from 'react'
import api from '../api'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Helper function to check if current route is public
  const isPublicRoute = useCallback((pathname) => {
    return pathname.includes('/login') || 
           pathname.includes('/register') || 
           pathname === '/' ||
           pathname.includes('/features') ||
           pathname.includes('/documentation') ||
           pathname.includes('/terms') ||
           pathname.includes('/privacy')
  }, [])

  useEffect(() => {
    // Check authentication status
    const checkAuth = () => {
      const token = localStorage.getItem('token')
      const currentPath = window.location.pathname
      const isPublic = isPublicRoute(currentPath)
      
      if (token) {
        // Always verify token, even on public routes, to set auth state correctly
        api
          .get('/auth/me')
          .then((response) => {
            setUser(response.data)
            setIsAuthenticated(true)
            setLoading(false)
          })
          .catch((error) => {
            // Only clear token if it's a 401 (unauthorized), not other errors
            if (error.response?.status === 401) {
              localStorage.removeItem('token')
              setIsAuthenticated(false)
              setUser(null)
              // Only dispatch logout event if not on a public route
              // This prevents redirects on public pages
              if (!isPublic) {
                window.dispatchEvent(new CustomEvent('auth:logout'))
              }
            }
            setLoading(false)
          })
      } else {
        // No token - user is not authenticated
        setIsAuthenticated(false)
        setUser(null)
        setLoading(false)
      }
    }

    // Initial auth check
    checkAuth()

    // Listen for logout events from API interceptor
    const handleLogout = () => {
      // Always clear auth state on logout, regardless of route
      localStorage.removeItem('token')
      setUser(null)
      setIsAuthenticated(false)
    }

    window.addEventListener('auth:logout', handleLogout)
    
    return () => {
      window.removeEventListener('auth:logout', handleLogout)
    }
  }, [isPublicRoute])

  const login = async (email, password) => {
    try {
      if (import.meta.env.DEV) {
        console.log('Attempting login to:', (api.defaults?.baseURL || 'http://localhost:8000') + '/auth/login')
      }
      const response = await api.post('/auth/login', { email, password })
      localStorage.setItem('token', response.data.access_token)
      const userResponse = await api.get('/auth/me')
      setUser(userResponse.data)
      setIsAuthenticated(true)
      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        code: error.code,
      })
      
      // Handle network errors
      if (!error.response) {
        const errorMsg = error.code === 'ECONNREFUSED' 
          ? 'Unable to connect to server. Please check if the backend is running on port 8000.'
          : error.message || 'Unable to connect to server. Please check if the backend is running.'
        return {
          success: false,
          error: errorMsg,
        }
      }
      
      // Handle specific HTTP errors
      if (error.response.status === 401) {
        return {
          success: false,
          error: error.response?.data?.detail || 'Incorrect email or password',
        }
      }
      
      if (error.response.status === 500) {
        return {
          success: false,
          error: 'Server error. Please try again later.',
        }
      }
      
      // Generic error
      return {
        success: false,
        error: error.response?.data?.detail || error.message || 'Login failed. Please try again.',
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    setIsAuthenticated(false)
  }

  const updateUser = (userData) => {
    setUser(userData)
  }

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    updateUser,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

