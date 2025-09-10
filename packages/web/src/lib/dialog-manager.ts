/**
 * DialogManager - Singleton Modal State Management
 * Prevents multiple auth modals, manages global dialog state
 * Military-grade modal conflict resolution
 */

export type DialogType = 'login' | 'signup' | 'email-verification' | 'plan-selection' | 'upgrade' | 'forgot-password';

export interface DialogState {
  type: DialogType | null;
  isOpen: boolean;
  data?: Record<string, any>;
  callback?: () => void;
  redirectTo?: string;
}

export interface DialogOptions {
  data?: Record<string, any>;
  callback?: () => void;
  redirectTo?: string;
  force?: boolean; // Override existing dialog
}

class DialogManagerClass {
  private state: DialogState = {
    type: null,
    isOpen: false,
  };

  private listeners: Set<(state: DialogState) => void> = new Set();
  private history: DialogType[] = []; // Track dialog history for back navigation

  /**
   * Subscribe to dialog state changes
   */
  subscribe(listener: (state: DialogState) => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get current dialog state
   */
  getState(): DialogState {
    return { ...this.state };
  }

  /**
   * Open a dialog (with conflict resolution)
   */
  open(type: DialogType, options: DialogOptions = {}): boolean {
    // Conflict resolution
    if (this.state.isOpen && !options.force) {
      // Allow certain dialog transitions
      const allowedTransitions: Record<DialogType, DialogType[]> = {
        'login': ['signup', 'forgot-password', 'email-verification'],
        'signup': ['login', 'plan-selection', 'email-verification'],
        'email-verification': ['login', 'signup'],
        'plan-selection': ['signup'],
        'upgrade': [], // Upgrade blocks all other dialogs
        'forgot-password': ['login'],
      };

      const currentType = this.state.type;
      if (currentType && !allowedTransitions[currentType]?.includes(type)) {
        console.warn(`DialogManager: Blocked transition from ${currentType} to ${type}`);
        return false;
      }
    }

    // Track history for back navigation
    if (this.state.type && this.state.type !== type) {
      this.history.push(this.state.type);
    }

    this.state = {
      type,
      isOpen: true,
      data: options.data,
      callback: options.callback,
      redirectTo: options.redirectTo,
    };

    this.notify();
    return true;
  }

  /**
   * Close current dialog
   */
  close(executeCallback = false): void {
    if (executeCallback && this.state.callback) {
      this.state.callback();
    }

    this.state = {
      type: null,
      isOpen: false,
    };

    this.history = []; // Clear history on close
    this.notify();
  }

  /**
   * Navigate back to previous dialog
   */
  back(): boolean {
    const previousType = this.history.pop();
    if (previousType) {
      this.state = {
        type: previousType,
        isOpen: true,
        data: undefined,
        callback: undefined,
        redirectTo: undefined,
      };
      this.notify();
      return true;
    }
    return false;
  }

  /**
   * Switch to different dialog (preserves state)
   */
  switch(type: DialogType, options: DialogOptions = {}): boolean {
    return this.open(type, { ...options, force: true });
  }

  /**
   * Emergency cleanup - force close all dialogs
   */
  emergency(): void {
    this.state = {
      type: null,
      isOpen: false,
    };
    this.history = [];
    this.notify();
  }

  /**
   * Check if specific dialog is open
   */
  isDialogOpen(type: DialogType): boolean {
    return this.state.isOpen && this.state.type === type;
  }

  /**
   * Check if any dialog is open
   */
  isAnyDialogOpen(): boolean {
    return this.state.isOpen;
  }

  /**
   * Notify all listeners of state change
   */
  private notify(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getState());
      } catch (error) {
        console.error('DialogManager: Listener error:', error);
      }
    });
  }
}

// Singleton instance
export const DialogManager = new DialogManagerClass();

// Development helpers
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).DialogManager = DialogManager;
}

// React hook for easy integration
export function useDialogManager() {
  const [state, setState] = React.useState<DialogState>(DialogManager.getState());

  React.useEffect(() => {
    const unsubscribe = DialogManager.subscribe(setState);
    return unsubscribe;
  }, []);

  return {
    state,
    open: DialogManager.open.bind(DialogManager),
    close: DialogManager.close.bind(DialogManager),
    back: DialogManager.back.bind(DialogManager),
    switch: DialogManager.switch.bind(DialogManager),
    emergency: DialogManager.emergency.bind(DialogManager),
    isDialogOpen: DialogManager.isDialogOpen.bind(DialogManager),
    isAnyDialogOpen: DialogManager.isAnyDialogOpen.bind(DialogManager),
  };
}

// Import React for the hook
import React from 'react';