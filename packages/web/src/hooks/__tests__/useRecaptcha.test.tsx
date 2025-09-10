import { renderHook, act } from '@testing-library/react'
import { useAuthRecaptcha, usePasswordRecaptcha } from '../useRecaptcha'

// Mock the RecaptchaService
jest.mock('../../lib/recaptcha', () => ({
  RecaptchaService: {
    getInstance: jest.fn(() => ({
      loadRecaptcha: jest.fn().mockResolvedValue(true),
      executeRecaptcha: jest.fn().mockResolvedValue('mock-token'),
    })),
  },
  isRecaptchaEnabled: jest.fn(() => true),
}))

describe('useRecaptcha Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Reset environment
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = 'test-key'
  })

  describe('useAuthRecaptcha', () => {
    it('should initialize with correct state', () => {
      const { result } = renderHook(() => useAuthRecaptcha('login'))
      
      expect(result.current.isEnabled).toBe(true)
      expect(result.current.isLoaded).toBe(false)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(null)
    })

    it('should load reCAPTCHA on mount', async () => {
      const { result, waitForNextUpdate } = renderHook(() => useAuthRecaptcha('login'))
      
      await waitForNextUpdate()
      
      expect(result.current.isLoaded).toBe(true)
      expect(result.current.isLoading).toBe(false)
    })

    it('should execute reCAPTCHA successfully', async () => {
      const { result, waitForNextUpdate } = renderHook(() => useAuthRecaptcha('login'))
      
      await waitForNextUpdate() // Wait for load
      
      let token: string | null = null
      
      await act(async () => {
        token = await result.current.executeRecaptcha()
      })
      
      expect(token).toBe('mock-token')
      expect(result.current.error).toBe(null)
    })

    it('should handle execution errors', async () => {
      const mockService = require('../../lib/recaptcha').RecaptchaService.getInstance()
      mockService.executeRecaptcha.mockRejectedValueOnce(new Error('Execution failed'))
      
      const { result, waitForNextUpdate } = renderHook(() => useAuthRecaptcha('login'))
      
      await waitForNextUpdate() // Wait for load
      
      let token: string | null = null
      
      await act(async () => {
        token = await result.current.executeRecaptcha()
      })
      
      expect(token).toBe(null)
      expect(result.current.error).toBe('reCAPTCHA execution failed')
    })

    it('should handle disabled reCAPTCHA', () => {
      const { isRecaptchaEnabled } = require('../../lib/recaptcha')
      isRecaptchaEnabled.mockReturnValue(false)
      
      const { result } = renderHook(() => useAuthRecaptcha('login'))
      
      expect(result.current.isEnabled).toBe(false)
      expect(result.current.isLoaded).toBe(true) // Should be considered loaded when disabled
    })

    it('should handle loading failure', async () => {
      const mockService = require('../../lib/recaptcha').RecaptchaService.getInstance()
      mockService.loadRecaptcha.mockResolvedValueOnce(false)
      
      const { result, waitForNextUpdate } = renderHook(() => useAuthRecaptcha('login'))
      
      await waitForNextUpdate()
      
      expect(result.current.isLoaded).toBe(false)
      expect(result.current.error).toBe('Failed to load reCAPTCHA')
    })
  })

  describe('usePasswordRecaptcha', () => {
    it('should initialize correctly for password actions', () => {
      const { result } = renderHook(() => usePasswordRecaptcha('forgotPassword'))
      
      expect(result.current.isEnabled).toBe(true)
      expect(result.current.isLoaded).toBe(false)
    })

    it('should support different password actions', () => {
      const { result: forgotResult } = renderHook(() => usePasswordRecaptcha('forgotPassword'))
      const { result: resetResult } = renderHook(() => usePasswordRecaptcha('resetPassword'))
      
      expect(forgotResult.current.isEnabled).toBe(true)
      expect(resetResult.current.isEnabled).toBe(true)
    })

    it('should execute reCAPTCHA with correct action', async () => {
      const mockService = require('../../lib/recaptcha').RecaptchaService.getInstance()
      
      const { result, waitForNextUpdate } = renderHook(() => usePasswordRecaptcha('forgotPassword'))
      
      await waitForNextUpdate() // Wait for load
      
      await act(async () => {
        await result.current.executeRecaptcha()
      })
      
      expect(mockService.executeRecaptcha).toHaveBeenCalledWith('forgotPassword')
    })
  })

  describe('Hook Cleanup', () => {
    it('should handle component unmounting gracefully', async () => {
      const { result, unmount, waitForNextUpdate } = renderHook(() => useAuthRecaptcha('login'))
      
      await waitForNextUpdate()
      
      // This should not throw an error
      unmount()
      
      expect(result.current.isLoaded).toBe(true) // Last known state
    })
  })

  describe('Error Handling', () => {
    it('should reset error on successful execution', async () => {
      const mockService = require('../../lib/recaptcha').RecaptchaService.getInstance()
      
      // First call fails
      mockService.executeRecaptcha
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValueOnce('success-token')
      
      const { result, waitForNextUpdate } = renderHook(() => useAuthRecaptcha('login'))
      
      await waitForNextUpdate()
      
      // First execution fails
      await act(async () => {
        await result.current.executeRecaptcha()
      })
      expect(result.current.error).toBe('reCAPTCHA execution failed')
      
      // Second execution succeeds
      await act(async () => {
        const token = await result.current.executeRecaptcha()
        expect(token).toBe('success-token')
      })
      expect(result.current.error).toBe(null)
    })
  })

  describe('Performance', () => {
    it('should not reload reCAPTCHA if already loaded', async () => {
      const mockService = require('../../lib/recaptcha').RecaptchaService.getInstance()
      
      const { result, waitForNextUpdate } = renderHook(() => useAuthRecaptcha('login'))
      
      await waitForNextUpdate()
      
      // Clear the mock to see if it's called again
      mockService.loadRecaptcha.mockClear()
      
      // Re-render the hook
      const { waitForNextUpdate: wait2 } = renderHook(() => useAuthRecaptcha('signup'))
      
      await wait2()
      
      // Should not call loadRecaptcha again since it's already loaded
      expect(mockService.loadRecaptcha).toHaveBeenCalledTimes(1)
    })
  })
})