import { DialogManager } from '../dialog-manager'

describe('DialogManager', () => {
  let manager: DialogManager
  let mockListener: jest.Mock

  beforeEach(() => {
    manager = DialogManager.getInstance()
    manager.reset() // Reset state between tests
    mockListener = jest.fn()
  })

  afterEach(() => {
    manager.removeAllListeners()
  })

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const instance1 = DialogManager.getInstance()
      const instance2 = DialogManager.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('State Management', () => {
    it('should initialize with closed state', () => {
      const state = manager.getState()
      expect(state.type).toBe(null)
      expect(state.isOpen).toBe(false)
    })

    it('should open dialog correctly', () => {
      manager.open('login')
      const state = manager.getState()
      expect(state.type).toBe('login')
      expect(state.isOpen).toBe(true)
    })

    it('should close dialog correctly', () => {
      manager.open('login')
      manager.close()
      const state = manager.getState()
      expect(state.type).toBe(null)
      expect(state.isOpen).toBe(false)
    })

    it('should switch between dialogs', () => {
      manager.open('login')
      manager.switch('signup')
      const state = manager.getState()
      expect(state.type).toBe('signup')
      expect(state.isOpen).toBe(true)
    })
  })

  describe('Event Listeners', () => {
    it('should notify listeners on state change', () => {
      manager.subscribe(mockListener)
      manager.open('login')
      
      expect(mockListener).toHaveBeenCalledWith({
        type: 'login',
        isOpen: true,
        data: undefined
      })
    })

    it('should notify multiple listeners', () => {
      const listener2 = jest.fn()
      manager.subscribe(mockListener)
      manager.subscribe(listener2)
      
      manager.open('signup')
      
      expect(mockListener).toHaveBeenCalled()
      expect(listener2).toHaveBeenCalled()
    })

    it('should unsubscribe listeners', () => {
      const unsubscribe = manager.subscribe(mockListener)
      unsubscribe()
      
      manager.open('login')
      expect(mockListener).not.toHaveBeenCalled()
    })
  })

  describe('History Management', () => {
    it('should track dialog history', () => {
      manager.open('login')
      manager.switch('signup')
      manager.switch('email-verification')
      
      const history = manager.getHistory()
      expect(history).toEqual(['login', 'signup', 'email-verification'])
    })

    it('should support back navigation', () => {
      manager.open('login')
      manager.switch('signup')
      
      const canGoBack = manager.canGoBack()
      expect(canGoBack).toBe(true)
      
      manager.back()
      const state = manager.getState()
      expect(state.type).toBe('login')
    })

    it('should handle back navigation when no history', () => {
      manager.open('login')
      
      const canGoBack = manager.canGoBack()
      expect(canGoBack).toBe(false)
      
      manager.back() // Should close dialog
      const state = manager.getState()
      expect(state.isOpen).toBe(false)
    })
  })

  describe('Data Passing', () => {
    it('should pass data when opening dialog', () => {
      const testData = { email: 'test@example.com' }
      manager.open('email-verification', { data: testData })
      
      const state = manager.getState()
      expect(state.data).toEqual(testData)
    })

    it('should pass data when switching dialogs', () => {
      const testData = { plan: 'pro' }
      manager.open('login')
      manager.switch('signup', { data: testData })
      
      const state = manager.getState()
      expect(state.data).toEqual(testData)
    })
  })

  describe('Dialog Type Validation', () => {
    it('should accept valid dialog types', () => {
      const validTypes = ['login', 'signup', 'email-verification']
      
      validTypes.forEach(type => {
        expect(() => manager.open(type as any)).not.toThrow()
      })
    })

    it('should handle invalid dialog types gracefully', () => {
      // TypeScript would prevent this, but test runtime behavior
      expect(() => manager.open('invalid' as any)).not.toThrow()
    })
  })

  describe('Concurrent Access', () => {
    it('should handle rapid state changes', () => {
      manager.subscribe(mockListener)
      
      manager.open('login')
      manager.switch('signup')
      manager.close()
      manager.open('email-verification')
      
      expect(mockListener).toHaveBeenCalledTimes(4)
      
      const finalState = manager.getState()
      expect(finalState.type).toBe('email-verification')
      expect(finalState.isOpen).toBe(true)
    })
  })

  describe('Reset Functionality', () => {
    it('should reset state completely', () => {
      manager.open('login')
      manager.switch('signup')
      manager.reset()
      
      const state = manager.getState()
      expect(state.type).toBe(null)
      expect(state.isOpen).toBe(false)
      expect(manager.getHistory()).toEqual([])
    })
  })
})