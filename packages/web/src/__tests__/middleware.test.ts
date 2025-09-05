import { NextRequest } from 'next/server'
import { middleware } from '../middleware'

// Mock the auth client
jest.mock('../lib/auth-client', () => ({
  authClient: {
    getSession: jest.fn(),
  },
}))

describe('Middleware', () => {
  const createRequest = (url: string, headers: Record<string, string> = {}) => {
    return new NextRequest(new URL(url, 'http://localhost:3000'), {
      headers: new Headers(headers),
    })
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Protected Routes', () => {
    const protectedPaths = ['/dashboard', '/settings']

    protectedPaths.forEach(path => {
      it(`should redirect unauthenticated users from ${path}`, async () => {
        const mockGetSession = require('../lib/auth-client').authClient.getSession
        mockGetSession.mockResolvedValue({ data: null })

        const request = createRequest(path)
        const response = await middleware(request)

        expect(response?.status).toBe(302)
        expect(response?.headers.get('location')).toBe('/?redirect=' + encodeURIComponent(path))
      })

      it(`should allow authenticated users to access ${path}`, async () => {
        const mockGetSession = require('../lib/auth-client').authClient.getSession
        mockGetSession.mockResolvedValue({
          data: {
            session: { id: 'session-id' },
            user: { id: 'user-id', emailVerified: true }
          }
        })

        const request = createRequest(path)
        const response = await middleware(request)

        expect(response).toBeUndefined() // No redirect
      })

      it(`should redirect to email verification if user not verified`, async () => {
        const mockGetSession = require('../lib/auth-client').authClient.getSession
        mockGetSession.mockResolvedValue({
          data: {
            session: { id: 'session-id' },
            user: { id: 'user-id', emailVerified: false }
          }
        })

        const request = createRequest(path)
        const response = await middleware(request)

        expect(response?.status).toBe(302)
        expect(response?.headers.get('location')).toBe('/?verify-email=true')
      })
    })
  })

  describe('Auth Routes', () => {
    const authPaths = ['/forgot-password', '/reset-password']

    authPaths.forEach(path => {
      it(`should redirect authenticated users from ${path} to dashboard`, async () => {
        const mockGetSession = require('../lib/auth-client').authClient.getSession
        mockGetSession.mockResolvedValue({
          data: {
            session: { id: 'session-id' },
            user: { id: 'user-id', emailVerified: true }
          }
        })

        const request = createRequest(path)
        const response = await middleware(request)

        expect(response?.status).toBe(302)
        expect(response?.headers.get('location')).toBe('/dashboard')
      })

      it(`should allow unauthenticated users to access ${path}`, async () => {
        const mockGetSession = require('../lib/auth-client').authClient.getSession
        mockGetSession.mockResolvedValue({ data: null })

        const request = createRequest(path)
        const response = await middleware(request)

        expect(response).toBeUndefined() // No redirect
      })
    })
  })

  describe('Reset Password with Token', () => {
    it('should allow access to reset password with valid token', async () => {
      const mockGetSession = require('../lib/auth-client').authClient.getSession
      mockGetSession.mockResolvedValue({ data: null })

      const request = createRequest('/reset-password?token=valid-token')
      const response = await middleware(request)

      expect(response).toBeUndefined() // No redirect
    })

    it('should redirect authenticated users even with token', async () => {
      const mockGetSession = require('../lib/auth-client').authClient.getSession
      mockGetSession.mockResolvedValue({
        data: {
          session: { id: 'session-id' },
          user: { id: 'user-id', emailVerified: true }
        }
      })

      const request = createRequest('/reset-password?token=valid-token')
      const response = await middleware(request)

      expect(response?.status).toBe(302)
      expect(response?.headers.get('location')).toBe('/dashboard')
    })
  })

  describe('Public Routes', () => {
    const publicPaths = ['/', '/about', '/privacy', '/terms']

    publicPaths.forEach(path => {
      it(`should allow access to public route ${path}`, async () => {
        const mockGetSession = require('../lib/auth-client').authClient.getSession
        mockGetSession.mockResolvedValue({ data: null })

        const request = createRequest(path)
        const response = await middleware(request)

        expect(response).toBeUndefined() // No redirect
      })
    })
  })

  describe('API Routes', () => {
    it('should skip middleware for API routes', async () => {
      const request = createRequest('/api/auth/login')
      const response = await middleware(request)

      expect(response).toBeUndefined() // No processing
    })

    it('should skip middleware for Next.js internal routes', async () => {
      const internalRoutes = ['/_next/static/test.js', '/_next/image']
      
      for (const route of internalRoutes) {
        const request = createRequest(route)
        const response = await middleware(request)
        
        expect(response).toBeUndefined()
      }
    })
  })

  describe('Error Handling', () => {
    it('should handle auth service errors gracefully', async () => {
      const mockGetSession = require('../lib/auth-client').authClient.getSession
      mockGetSession.mockRejectedValue(new Error('Auth service unavailable'))

      const request = createRequest('/dashboard')
      const response = await middleware(request)

      // Should redirect to home as if unauthenticated
      expect(response?.status).toBe(302)
      expect(response?.headers.get('location')).toBe('/?redirect=' + encodeURIComponent('/dashboard'))
    })

    it('should handle malformed auth responses', async () => {
      const mockGetSession = require('../lib/auth-client').authClient.getSession
      mockGetSession.mockResolvedValue({ data: { invalid: 'response' } })

      const request = createRequest('/dashboard')
      const response = await middleware(request)

      // Should redirect to home as if unauthenticated
      expect(response?.status).toBe(302)
      expect(response?.headers.get('location')).toBe('/?redirect=' + encodeURIComponent('/dashboard'))
    })
  })

  describe('Route Matching', () => {
    it('should match exact protected routes', async () => {
      const mockGetSession = require('../lib/auth-client').authClient.getSession
      mockGetSession.mockResolvedValue({ data: null })

      // Should protect
      let request = createRequest('/dashboard')
      let response = await middleware(request)
      expect(response?.status).toBe(302)

      // Should not protect similar routes
      request = createRequest('/dashboard-public')
      response = await middleware(request)
      expect(response).toBeUndefined()
    })

    it('should match nested protected routes', async () => {
      const mockGetSession = require('../lib/auth-client').authClient.getSession
      mockGetSession.mockResolvedValue({ data: null })

      const nestedRoutes = ['/dashboard/profile', '/settings/account']
      
      for (const route of nestedRoutes) {
        const request = createRequest(route)
        const response = await middleware(request)
        
        expect(response?.status).toBe(302)
      }
    })
  })

  describe('Redirect URL Handling', () => {
    it('should preserve query parameters in redirect URL', async () => {
      const mockGetSession = require('../lib/auth-client').authClient.getSession
      mockGetSession.mockResolvedValue({ data: null })

      const request = createRequest('/dashboard?tab=profile&setting=advanced')
      const response = await middleware(request)

      const location = response?.headers.get('location')
      const expectedRedirect = encodeURIComponent('/dashboard?tab=profile&setting=advanced')
      expect(location).toBe(`/?redirect=${expectedRedirect}`)
    })

    it('should handle special characters in URLs', async () => {
      const mockGetSession = require('../lib/auth-client').authClient.getSession
      mockGetSession.mockResolvedValue({ data: null })

      const request = createRequest('/dashboard?search=test%20query&filter=all')
      const response = await middleware(request)

      expect(response?.status).toBe(302)
      expect(response?.headers.get('location')).toContain('redirect=')
    })
  })

  describe('Session Validation', () => {
    it('should handle sessions without user data', async () => {
      const mockGetSession = require('../lib/auth-client').authClient.getSession
      mockGetSession.mockResolvedValue({
        data: { session: { id: 'session-id' } } // No user data
      })

      const request = createRequest('/dashboard')
      const response = await middleware(request)

      expect(response?.status).toBe(302)
    })

    it('should handle null session data', async () => {
      const mockGetSession = require('../lib/auth-client').authClient.getSession
      mockGetSession.mockResolvedValue({ data: { session: null, user: null } })

      const request = createRequest('/dashboard')
      const response = await middleware(request)

      expect(response?.status).toBe(302)
    })
  })
})