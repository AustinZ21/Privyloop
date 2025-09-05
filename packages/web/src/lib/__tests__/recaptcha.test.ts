import { RecaptchaService, isRecaptchaEnabled } from '../recaptcha'

// Mock fetch globally
global.fetch = jest.fn()

describe('reCAPTCHA Service', () => {
  let service: RecaptchaService
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    service = RecaptchaService.getInstance()
    mockFetch.mockClear()
    
    // Mock successful reCAPTCHA execution
    global.grecaptcha = {
      ready: jest.fn((callback) => callback()),
      execute: jest.fn().mockResolvedValue('mock-recaptcha-token'),
    }
  })

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const instance1 = RecaptchaService.getInstance()
      const instance2 = RecaptchaService.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('Configuration', () => {
    it('should detect if reCAPTCHA is enabled', () => {
      const originalEnv = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
      
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = 'test-key'
      expect(isRecaptchaEnabled()).toBe(true)
      
      delete process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
      expect(isRecaptchaEnabled()).toBe(false)
      
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = originalEnv
    })
  })

  describe('Script Loading', () => {
    it('should load reCAPTCHA script when not present', async () => {
      // Mock document manipulation
      const mockScript = {
        onload: null,
        src: '',
        async: false,
      }
      
      jest.spyOn(document, 'createElement').mockReturnValue(mockScript as any)
      jest.spyOn(document.head, 'appendChild').mockImplementation(() => mockScript as any)
      
      const loadPromise = service.loadRecaptcha()
      
      // Simulate script load
      if (mockScript.onload) {
        mockScript.onload({} as any)
      }
      
      await expect(loadPromise).resolves.toBe(true)
      
      expect(document.createElement).toHaveBeenCalledWith('script')
      expect(document.head.appendChild).toHaveBeenCalled()
    })

    it('should not load script if grecaptcha already exists', async () => {
      jest.spyOn(document, 'createElement')
      
      const result = await service.loadRecaptcha()
      
      expect(result).toBe(true)
      expect(document.createElement).not.toHaveBeenCalled()
    })
  })

  describe('Token Execution', () => {
    it('should execute reCAPTCHA successfully', async () => {
      const result = await service.executeRecaptcha('login')
      
      expect(result).toEqual({
        success: true,
        token: 'mock-recaptcha-token',
        action: 'login'
      })
      
      expect(global.grecaptcha.execute).toHaveBeenCalledWith(
        'test-site-key',
        { action: 'login' }
      )
    })

    it('should handle reCAPTCHA execution failure', async () => {
      global.grecaptcha.execute = jest.fn().mockRejectedValue(new Error('reCAPTCHA failed'))
      
      const result = await service.executeRecaptcha('signup')
      
      expect(result).toEqual({
        success: false,
        error: 'reCAPTCHA execution failed: reCAPTCHA failed',
        action: 'signup'
      })
    })

    it('should handle missing grecaptcha', async () => {
      delete (global as any).grecaptcha
      
      const result = await service.executeRecaptcha('login')
      
      expect(result).toEqual({
        success: false,
        error: 'reCAPTCHA not loaded',
        action: 'login'
      })
    })

    it('should validate action types', async () => {
      const validActions = ['login', 'signup', 'forgotPassword', 'resetPassword']
      
      for (const action of validActions) {
        const result = await service.executeRecaptcha(action as any)
        expect(result?.success).toBe(true)
        expect(result?.action).toBe(action)
      }
    })
  })

  describe('Server Verification', () => {
    it('should verify token with server successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          score: 0.8,
          action: 'login'
        })
      } as Response)

      const result = await service.verifyWithServer('mock-token', 'login')
      
      expect(result).toEqual({
        success: true,
        score: 0.8,
        action: 'login'
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/verify-recaptcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'mock-token',
          action: 'login'
        })
      })
    })

    it('should handle server verification failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid token' })
      } as Response)

      const result = await service.verifyWithServer('invalid-token', 'login')
      
      expect(result).toEqual({
        success: false,
        error: 'Server verification failed'
      })
    })

    it('should handle network errors during verification', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await service.verifyWithServer('mock-token', 'login')
      
      expect(result).toEqual({
        success: false,
        error: 'Network error during verification: Network error'
      })
    })
  })

  describe('Full Workflow', () => {
    it('should complete full reCAPTCHA workflow', async () => {
      // Mock successful server verification
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          score: 0.9,
          action: 'login'
        })
      } as Response)

      // Execute reCAPTCHA
      const executeResult = await service.executeRecaptcha('login')
      expect(executeResult?.success).toBe(true)

      // Verify with server
      if (executeResult?.success && executeResult.token) {
        const verifyResult = await service.verifyWithServer(executeResult.token, 'login')
        expect(verifyResult?.success).toBe(true)
        expect(verifyResult?.score).toBe(0.9)
      }
    })
  })

  describe('Error Recovery', () => {
    it('should handle grecaptcha ready timeout', async () => {
      global.grecaptcha = {
        ready: jest.fn(), // Don't call callback
        execute: jest.fn(),
      }

      const result = await service.executeRecaptcha('login')
      
      expect(result).toEqual({
        success: false,
        error: 'reCAPTCHA not loaded',
        action: 'login'
      })
    })
  })

  describe('Configuration Validation', () => {
    it('should handle missing site key', () => {
      const originalKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
      delete process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
      
      expect(isRecaptchaEnabled()).toBe(false)
      
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = originalKey
    })

    it('should handle empty site key', () => {
      const originalKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = ''
      
      expect(isRecaptchaEnabled()).toBe(false)
      
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = originalKey
    })
  })
})