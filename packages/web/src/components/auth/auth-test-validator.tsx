/**
 * Authentication Flow Test Validator
 * Comprehensive test suite for auth system validation
 */

"use client";

import React, { useState } from 'react';
import { Button } from 'src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card';
import { CheckCircle, XCircle, AlertCircle, Loader2, Play, Shield } from 'lucide-react';
import { useAuthState } from 'src/lib/auth-client';
import { useDialogManager } from 'src/lib/dialog-manager';
import { isRecaptchaEnabled } from 'src/lib/recaptcha';
import { cn } from 'src/lib/utils';

interface TestCase {
  id: string;
  name: string;
  description: string;
  category: 'modal' | 'navigation' | 'protection' | 'recaptcha' | 'flow';
  status: 'pending' | 'running' | 'passed' | 'failed';
  error?: string;
  autoTest?: () => Promise<boolean>;
  manualSteps?: string[];
}

const testCases: TestCase[] = [
  // Modal System Tests
  {
    id: 'modal-login-open',
    name: 'Login Modal Opens',
    description: 'Login modal opens when triggered from navigation',
    category: 'modal',
    status: 'pending',
    manualSteps: [
      'Click "Sign In" button in header',
      'Verify login modal appears',
      'Check form fields are present and functional'
    ]
  },
  {
    id: 'modal-signup-open',
    name: 'Signup Modal Opens',
    description: 'Signup modal opens when triggered from navigation',
    category: 'modal',
    status: 'pending',
    manualSteps: [
      'Click "Get Started" button',
      'Verify signup modal appears',
      'Check plan selection (if enterprise deployment)'
    ]
  },
  {
    id: 'modal-switch',
    name: 'Modal Transitions',
    description: 'Switch between login and signup modals',
    category: 'modal',
    status: 'pending',
    manualSteps: [
      'Open login modal',
      'Click "Sign up" link',
      'Verify switches to signup modal',
      'Click "Sign in" link',
      'Verify switches back to login modal'
    ]
  },

  // Navigation Tests
  {
    id: 'nav-authenticated',
    name: 'Authenticated Navigation',
    description: 'Navigation shows user profile when authenticated',
    category: 'navigation',
    status: 'pending',
    manualSteps: [
      'Log in successfully',
      'Check sidebar shows user profile',
      'Verify logout button is present',
      'Check header shows welcome message'
    ]
  },
  {
    id: 'nav-unauthenticated',
    name: 'Unauthenticated Navigation',
    description: 'Navigation shows auth buttons when not authenticated',
    category: 'navigation',
    status: 'pending',
    manualSteps: [
      'Ensure logged out state',
      'Check sidebar shows login/signup buttons',
      'Verify header shows auth controls'
    ]
  },

  // Protection Tests
  {
    id: 'protect-dashboard',
    name: 'Dashboard Protection',
    description: 'Dashboard requires authentication',
    category: 'protection',
    status: 'pending',
    manualSteps: [
      'Log out if authenticated',
      'Navigate to /dashboard',
      'Verify redirected to home with login modal',
      'Or see authentication required message'
    ]
  },
  {
    id: 'protect-auth-pages',
    name: 'Auth Page Protection',
    description: 'Auth pages redirect when authenticated',
    category: 'protection',
    status: 'pending',
    manualSteps: [
      'Log in successfully',
      'Navigate to /forgot-password',
      'Verify redirected to dashboard',
      'Try /reset-password with token',
      'Verify redirected to dashboard'
    ]
  },

  // reCAPTCHA Tests
  {
    id: 'recaptcha-enabled',
    name: 'reCAPTCHA Status Check',
    description: 'Check if reCAPTCHA is properly configured',
    category: 'recaptcha',
    status: 'pending',
    autoTest: async () => {
      return isRecaptchaEnabled();
    }
  },
  {
    id: 'recaptcha-badge',
    name: 'reCAPTCHA Badge Display',
    description: 'Privacy badge shows when reCAPTCHA is enabled',
    category: 'recaptcha',
    status: 'pending',
    manualSteps: [
      'Open login modal',
      'Check for "Protected by reCAPTCHA" text at bottom',
      'Verify Google policy links are present'
    ]
  },

  // Flow Tests
  {
    id: 'flow-password-reset',
    name: 'Password Reset Flow',
    description: 'Complete password reset workflow',
    category: 'flow',
    status: 'pending',
    manualSteps: [
      'Go to /forgot-password',
      'Enter valid email address',
      'Click "Send reset link"',
      'Check for success message',
      'Verify cooldown timer works'
    ]
  },
  {
    id: 'flow-email-verification',
    name: 'Email Verification Flow',
    description: 'Email verification modal workflow',
    category: 'flow',
    status: 'pending',
    manualSteps: [
      'Sign up with new account',
      'Check if email verification modal appears',
      'Test resend verification button',
      'Test change email functionality'
    ]
  }
];

export function AuthTestValidator() {
  const [tests, setTests] = useState<TestCase[]>(testCases);
  const [isRunning, setIsRunning] = useState(false);
  const { isAuthenticated, user } = useAuthState();
  const { open } = useDialogManager();

  const updateTestStatus = (testId: string, status: TestCase['status'], error?: string) => {
    setTests(prev => prev.map(test => 
      test.id === testId 
        ? { ...test, status, error }
        : test
    ));
  };

  const runAutoTests = async () => {
    setIsRunning(true);
    
    for (const test of tests) {
      if (test.autoTest) {
        updateTestStatus(test.id, 'running');
        
        try {
          const result = await test.autoTest();
          updateTestStatus(test.id, result ? 'passed' : 'failed', 
            result ? undefined : 'Auto-test failed');
        } catch (error) {
          updateTestStatus(test.id, 'failed', 
            error instanceof Error ? error.message : 'Unknown error');
        }
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    setIsRunning(false);
  };

  const markTestStatus = (testId: string, status: 'passed' | 'failed') => {
    updateTestStatus(testId, status);
  };

  const resetTests = () => {
    setTests(testCases.map(test => ({ ...test, status: 'pending', error: undefined })));
  };

  const getStatusIcon = (status: TestCase['status']) => {
    switch (status) {
      case 'passed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running': return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getCategoryStats = () => {
    const categories = ['modal', 'navigation', 'protection', 'recaptcha', 'flow'] as const;
    return categories.map(category => {
      const categoryTests = tests.filter(test => test.category === category);
      const passed = categoryTests.filter(test => test.status === 'passed').length;
      const failed = categoryTests.filter(test => test.status === 'failed').length;
      const total = categoryTests.length;
      
      return {
        category,
        passed,
        failed,
        total,
        percentage: total > 0 ? Math.round((passed / total) * 100) : 0
      };
    });
  };

  const overallStats = {
    passed: tests.filter(test => test.status === 'passed').length,
    failed: tests.filter(test => test.status === 'failed').length,
    total: tests.length
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-white">Authentication System Test Suite</h1>
        <p className="text-gray-400">Comprehensive validation of the PrivyLoop authentication flow</p>
      </div>

      {/* System Status */}
      <Card className="bg-[#141A1E] border-[#233037]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#34D3A6]" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Authentication Status:</span>
              <span className={cn(
                "ml-2 font-medium",
                isAuthenticated ? "text-green-400" : "text-yellow-400"
              )}>
                {isAuthenticated ? `Authenticated (${user?.email})` : 'Not Authenticated'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">reCAPTCHA:</span>
              <span className={cn(
                "ml-2 font-medium",
                isRecaptchaEnabled() ? "text-green-400" : "text-gray-400"
              )}>
                {isRecaptchaEnabled() ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex gap-4">
        <Button
          onClick={runAutoTests}
          disabled={isRunning}
          className="bg-[#34D3A6] hover:bg-[#34D3A6]/90 text-black"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Running Tests...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Run Auto Tests
            </>
          )}
        </Button>
        
        <Button
          onClick={resetTests}
          variant="outline"
          className="border-[#233037] text-white hover:bg-[#1A2126]"
        >
          Reset Tests
        </Button>

        <Button
          onClick={() => open('login')}
          variant="outline"
          className="border-[#233037] text-white hover:bg-[#1A2126]"
        >
          Test Login Modal
        </Button>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-[#141A1E] border-[#233037]">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{overallStats.passed}</div>
            <div className="text-sm text-gray-400">Passed</div>
          </CardContent>
        </Card>
        <Card className="bg-[#141A1E] border-[#233037]">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{overallStats.failed}</div>
            <div className="text-sm text-gray-400">Failed</div>
          </CardContent>
        </Card>
        <Card className="bg-[#141A1E] border-[#233037]">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-white">{overallStats.total}</div>
            <div className="text-sm text-gray-400">Total</div>
          </CardContent>
        </Card>
      </div>

      {/* Category Statistics */}
      <div className="grid grid-cols-5 gap-4">
        {getCategoryStats().map(stat => (
          <Card key={stat.category} className="bg-[#141A1E] border-[#233037]">
            <CardContent className="p-3 text-center">
              <div className="text-lg font-bold text-[#34D3A6]">{stat.percentage}%</div>
              <div className="text-xs text-gray-400 capitalize">{stat.category}</div>
              <div className="text-xs text-gray-500">{stat.passed}/{stat.total}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Test Cases */}
      <div className="space-y-4">
        {['modal', 'navigation', 'protection', 'recaptcha', 'flow'].map(category => (
          <Card key={category} className="bg-[#141A1E] border-[#233037]">
            <CardHeader>
              <CardTitle className="text-white capitalize">{category} Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tests.filter(test => test.category === category).map(test => (
                  <div key={test.id} className="p-4 bg-[#0F1419] rounded-lg border border-[#233037]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(test.status)}
                        <div>
                          <h3 className="font-medium text-white">{test.name}</h3>
                          <p className="text-sm text-gray-400">{test.description}</p>
                        </div>
                      </div>
                      
                      {!test.autoTest && test.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => markTestStatus(test.id, 'passed')}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Pass
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => markTestStatus(test.id, 'failed')}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            Fail
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {test.error && (
                      <div className="text-sm text-red-400 mb-2">Error: {test.error}</div>
                    )}
                    
                    {test.manualSteps && (
                      <div className="text-sm text-gray-400">
                        <strong>Manual Steps:</strong>
                        <ol className="list-decimal list-inside mt-1 space-y-1">
                          {test.manualSteps.map((step, index) => (
                            <li key={index}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}