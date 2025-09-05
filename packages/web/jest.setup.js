// Import jest-dom if available
try {
  require('@testing-library/jest-dom')
} catch (e) {
  console.warn('jest-dom not available, some assertions may not work')
}

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: '',
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    }
  },
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock environment variables
process.env.NEXT_PUBLIC_AUTH_URL = 'http://localhost:3000'
process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = 'test-site-key'
process.env.RECAPTCHA_SECRET_KEY = 'test-secret-key'

// Mock BroadcastChannel for cross-tab sync tests
global.BroadcastChannel = jest.fn().mockImplementation(() => ({
  postMessage: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  close: jest.fn(),
}))

// Mock window.grecaptcha for reCAPTCHA tests
global.grecaptcha = {
  ready: jest.fn((callback) => callback()),
  execute: jest.fn().mockResolvedValue('mock-recaptcha-token'),
}

// Suppress console errors during tests unless we're specifically testing them
const originalConsoleError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      args[0]?.includes?.('Warning: ReactDOM.render is no longer supported') ||
      args[0]?.includes?.('Warning: An invalid form control')
    ) {
      return
    }
    originalConsoleError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalConsoleError
})