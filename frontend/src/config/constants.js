/**
 * Centralized application constants
 * Update these values to sync across the entire application
 */

export const APP_CONFIG = {
  // Application Info
  name: 'S3ntraCS',
  fullName: 'S3ntraCS - Cloud Security Posture Management',
  description: 'Automated AWS security scanning and compliance monitoring',
  version: '0.1.0',
  
  // Repository & Links
  github: {
    owner: 'whoismuhd',
    repo: 'S3NTRACS',
    url: 'https://github.com/whoismuhd/S3NTRACS',
    issuesUrl: 'https://github.com/whoismuhd/S3NTRACS/issues',
  },
  
  // Contact & Support
  support: {
    email: 'support@s3ntracs.com',
    website: 'https://s3ntracs.com',
  },
  
  // Social Media
  social: {
  },
  
  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  },
  
  // Application URLs
  urls: {
    documentation: '/documentation',
    support: '/support',
    privacy: '/privacy',
    terms: '/terms',
  },
}

// Export individual constants for convenience
export const APP_NAME = APP_CONFIG.name
export const APP_VERSION = APP_CONFIG.version
export const GITHUB_URL = APP_CONFIG.github.url
export const GITHUB_ISSUES_URL = APP_CONFIG.github.issuesUrl
export const SUPPORT_EMAIL = APP_CONFIG.support.email
export const WEBSITE_URL = APP_CONFIG.support.website

