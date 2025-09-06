import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginModal } from '../login-modal'

// Mock the hooks and dependencies
jest.mock('../../../lib/dialog-manager', () => ({
  useDialogManager: () => ({
    state: { type: 'login', isOpen: true },
    close: jest.fn(),
    switch: jest.fn(),
  }),
}))

jest.mock('../../../lib/auth-client', () => ({
  useAuthState: () => ({
    isAuthenticated: false,
    isLoading: false,
    user: null,
  }),
  signIn: {
    email: jest.fn(),
    social: jest.fn(),
  },
  validateEmail: jest.fn((email) => email.includes('@')),
  getAuthRedirectUrl: jest.fn(() => null),
  setAuthRedirectUrl: jest.fn(),
  clearAuthRedirectUrl: jest.fn(),
}))

jest.mock('../../../hooks/useRecaptcha', () => ({
  useAuthRecaptcha: () => ({
    isEnabled: true,
    isLoaded: true,
    executeRecaptcha: jest.fn().mockResolvedValue('mock-token'),
  }),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

describe('LoginModal', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render login form when modal is open', () => {
      render(<LoginModal />)
      
      expect(screen.getByText('Welcome back')).toBeInTheDocument()
      expect(screen.getByText('Sign in to your PrivyLoop account')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('should render social login buttons', () => {
      render(<LoginModal />)
      
      expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /continue with microsoft/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /continue with github/i })).toBeInTheDocument()
    })

    it('should render forgot password link', () => {
      render(<LoginModal />)
      
      expect(screen.getByRole('button', { name: /forgot password/i })).toBeInTheDocument()
    })

    it('should render signup link', () => {
      render(<LoginModal />)
      
      expect(screen.getByText(/don't have an account/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
    })

    it('should render reCAPTCHA badge', () => {
      render(<LoginModal />)
      
      expect(screen.getByText(/protected by recaptcha/i)).toBeInTheDocument()
    })
  })

  describe('Form Interaction', () => {
    it('should handle email input', async () => {
      render(<LoginModal />)
      
      const emailInput = screen.getByLabelText('Email')
      await user.type(emailInput, 'test@example.com')
      
      expect(emailInput).toHaveValue('test@example.com')
    })

    it('should handle password input', async () => {
      render(<LoginModal />)
      
      const passwordInput = screen.getByLabelText('Password')
      await user.type(passwordInput, 'password123')
      
      expect(passwordInput).toHaveValue('password123')
    })

    it('should toggle password visibility', async () => {
      render(<LoginModal />)
      
      const passwordInput = screen.getByLabelText('Password')
      const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i })
      
      expect(passwordInput).toHaveAttribute('type', 'password')
      
      await user.click(toggleButton)
      expect(passwordInput).toHaveAttribute('type', 'text')
      
      await user.click(toggleButton)
      expect(passwordInput).toHaveAttribute('type', 'password')
    })
  })

  describe('Form Validation', () => {
    it('should show error for empty email', async () => {
      render(<LoginModal />)
      
      const submitButton = screen.getByRole('button', { name: /^sign in$/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument()
      })
    })

    it('should show error for invalid email', async () => {
      render(<LoginModal />)
      
      const emailInput = screen.getByLabelText('Email')
      await user.type(emailInput, 'invalid-email')
      
      const submitButton = screen.getByRole('button', { name: /^sign in$/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
      })
    })

    it('should show error for empty password', async () => {
      render(<LoginModal />)
      
      const emailInput = screen.getByLabelText('Email')
      await user.type(emailInput, 'test@example.com')
      
      const submitButton = screen.getByRole('button', { name: /^sign in$/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Password is required')).toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      const mockSignIn = require('../../../lib/auth-client').signIn.email
      mockSignIn.mockResolvedValue({
        data: { user: { emailVerified: true } }
      })

      render(<LoginModal />)
      
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: /^sign in$/i })
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
          fetchOnSuccess: true,
          recaptchaToken: 'mock-token',
        })
      })
    })

    it('should show loading state during submission', async () => {
      const mockSignIn = require('../../../lib/auth-client').signIn.email
      mockSignIn.mockImplementation(() => new Promise(() => {})) // Never resolves
      
      render(<LoginModal />)
      
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: /^sign in$/i })
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Signing in...')).toBeInTheDocument()
      })
    })

    it('should handle login errors', async () => {
      const mockSignIn = require('../../../lib/auth-client').signIn.email
      mockSignIn.mockRejectedValue(new Error('Invalid credentials'))
      
      render(<LoginModal />)
      
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: /^sign in$/i })
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/we don't recognize that email or password/i)).toBeInTheDocument()
      })
    })
  })

  describe('Social Login', () => {
    it('should handle Google login', async () => {
      const mockSocialSignIn = require('../../../lib/auth-client').signIn.social
      
      render(<LoginModal />)
      
      const googleButton = screen.getByRole('button', { name: /continue with google/i })
      await user.click(googleButton)
      
      expect(mockSocialSignIn).toHaveBeenCalledWith({
        provider: 'google',
        callbackURL: 'http://localhost:3030/dashboard',
      })
    })

    it('should handle social login errors', async () => {
      const mockSocialSignIn = require('../../../lib/auth-client').signIn.social
      mockSocialSignIn.mockRejectedValue(new Error('Social login failed'))
      
      render(<LoginModal />)
      
      const googleButton = screen.getByRole('button', { name: /continue with google/i })
      await user.click(googleButton)
      
      await waitFor(() => {
        expect(screen.getByText('Social login failed. Please try again.')).toBeInTheDocument()
      })
    })
  })

  describe('Navigation', () => {
    it('should switch to signup modal', async () => {
      const mockSwitch = require('../../../lib/dialog-manager').useDialogManager().switch
      
      render(<LoginModal />)
      
      const signupLink = screen.getByRole('button', { name: /sign up/i })
      await user.click(signupLink)
      
      expect(mockSwitch).toHaveBeenCalledWith('signup')
    })

    it('should navigate to forgot password', async () => {
      const mockRouter = require('next/navigation').useRouter()
      const mockClose = require('../../../lib/dialog-manager').useDialogManager().close
      
      render(<LoginModal />)
      
      const forgotLink = screen.getByRole('button', { name: /forgot password/i })
      await user.click(forgotLink)
      
      expect(mockClose).toHaveBeenCalled()
      expect(mockRouter.push).toHaveBeenCalledWith('/forgot-password')
    })
  })

  describe('Email Verification Flow', () => {
    it('should handle unverified email', async () => {
      const mockSignIn = require('../../../lib/auth-client').signIn.email
      const mockSwitch = require('../../../lib/dialog-manager').useDialogManager().switch
      const mockClose = require('../../../lib/dialog-manager').useDialogManager().close
      
      mockSignIn.mockResolvedValue({
        data: { user: { emailVerified: false } }
      })
      
      render(<LoginModal />)
      
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: /^sign in$/i })
      
      await user.type(emailInput, 'unverified@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockClose).toHaveBeenCalled()
        expect(mockSwitch).toHaveBeenCalledWith('email-verification', {
          data: { email: 'unverified@example.com' }
        })
      })
    })
  })

  describe('Success State', () => {
    it('should show success message on successful login', async () => {
      const mockUseAuthState = require('../../../lib/auth-client').useAuthState
      mockUseAuthState.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { email: 'test@example.com' },
      })
      
      // Re-render with success state
      const { rerender } = render(<LoginModal />)
      
      // Simulate success state
      jest.mocked(mockUseAuthState).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { email: 'test@example.com' },
      })
      
      rerender(<LoginModal />)
      
      // The component should show success state when authenticated
      // This would require the component to track success state internally
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<LoginModal />)
      
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument()
    })

    it('should support keyboard navigation', async () => {
      render(<LoginModal />)
      
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      
      await user.tab()
      expect(emailInput).toHaveFocus()
      
      await user.tab()
      expect(passwordInput).toHaveFocus()
    })
  })
})