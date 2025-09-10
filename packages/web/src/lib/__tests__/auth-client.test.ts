import { 
  validateEmail, 
  validatePasswordStrength, 
  getAuthRedirectUrl, 
  setAuthRedirectUrl, 
  clearAuthRedirectUrl 
} from '../auth-client'

describe('Auth Client Utilities', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  describe('validateEmail', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.email+tag@domain.co.uk',
        'user123@test-domain.org',
        'firstname.lastname@company.com',
      ]

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true)
      })
    })

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        '',
        'invalid',
        'user@',
        '@domain.com',
        'user..name@domain.com',
        'user@domain',
        'user space@domain.com',
      ]

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false)
      })
    })

    it('should handle edge cases', () => {
      expect(validateEmail('a@b.co')).toBe(true)
      expect(validateEmail('test@localhost')).toBe(false)
      expect(validateEmail('user@domain.c')).toBe(false)
    })
  })

  describe('validatePasswordStrength', () => {
    it('should validate weak passwords', () => {
      const result = validatePasswordStrength('weak')
      expect(result.score).toBe(1)
      expect(result.requirements.length).toBe(false)
      expect(result.requirements.uppercase).toBe(false)
      expect(result.requirements.lowercase).toBe(true)
      expect(result.requirements.number).toBe(false)
      expect(result.requirements.special).toBe(false)
    })

    it('should validate medium strength passwords', () => {
      const result = validatePasswordStrength('Password1')
      expect(result.score).toBe(3)
      expect(result.requirements.length).toBe(true)
      expect(result.requirements.uppercase).toBe(true)
      expect(result.requirements.lowercase).toBe(true)
      expect(result.requirements.number).toBe(true)
      expect(result.requirements.special).toBe(false)
    })

    it('should validate strong passwords', () => {
      const result = validatePasswordStrength('StrongPass123!')
      expect(result.score).toBe(5)
      expect(result.requirements.length).toBe(true)
      expect(result.requirements.uppercase).toBe(true)
      expect(result.requirements.lowercase).toBe(true)
      expect(result.requirements.number).toBe(true)
      expect(result.requirements.special).toBe(true)
    })

    it('should handle empty password', () => {
      const result = validatePasswordStrength('')
      expect(result.score).toBe(0)
      expect(Object.values(result.requirements).every(req => req === false)).toBe(true)
    })

    it('should correctly identify password strength levels', () => {
      expect(validatePasswordStrength('ab').score).toBe(0) // Too short
      expect(validatePasswordStrength('password').score).toBe(1) // Only lowercase
      expect(validatePasswordStrength('Password').score).toBe(2) // Lowercase + uppercase
      expect(validatePasswordStrength('Password1').score).toBe(3) // + number
      expect(validatePasswordStrength('Password1!').score).toBe(5) // + special
    })
  })

  describe('Auth Redirect Management', () => {
    it('should store and retrieve redirect URL', () => {
      const testUrl = '/dashboard'
      setAuthRedirectUrl(testUrl)
      expect(getAuthRedirectUrl()).toBe(testUrl)
    })

    it('should clear redirect URL', () => {
      setAuthRedirectUrl('/dashboard')
      clearAuthRedirectUrl()
      expect(getAuthRedirectUrl()).toBe(null)
    })

    it('should handle empty redirect URL', () => {
      expect(getAuthRedirectUrl()).toBe(null)
    })

    it('should not store invalid URLs', () => {
      setAuthRedirectUrl('javascript:alert("xss")')
      expect(getAuthRedirectUrl()).toBe(null)
    })

    it('should store only relative URLs', () => {
      setAuthRedirectUrl('/valid/path')
      expect(getAuthRedirectUrl()).toBe('/valid/path')

      setAuthRedirectUrl('https://external.com')
      expect(getAuthRedirectUrl()).toBe(null)
    })
  })
})