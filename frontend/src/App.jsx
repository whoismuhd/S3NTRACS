import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { OnboardingProvider } from './contexts/OnboardingContext'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import TenantDetail from './pages/TenantDetail'
import Reports from './pages/Reports'
import ReportsOverview from './pages/ReportsOverview'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'
import Features from './pages/Features'
import Documentation from './pages/Documentation'
import Support from './pages/Support'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import KeyboardShortcuts from './components/KeyboardShortcuts'

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  
  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/features" element={<Features />} />
      <Route path="/documentation" element={<Documentation />} />
      <Route
        path="/privacy"
        element={
          <PrivateRoute>
            <Layout>
              <PrivacyPolicy />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route path="/terms" element={<TermsOfService />} />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/tenants/:tenantId"
        element={
          <PrivateRoute>
            <Layout>
              <TenantDetail />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/support"
        element={
          <PrivateRoute>
            <Layout>
              <Support />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <PrivateRoute>
            <Layout>
              <ReportsOverview />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/reports/:tenantId"
        element={
          <PrivateRoute>
            <Layout>
              <Reports />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <PrivateRoute>
            <Layout>
              <Settings />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <OnboardingProvider>
              <Router>
                <AppRoutes />
                <KeyboardShortcuts />
              </Router>
            </OnboardingProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App

