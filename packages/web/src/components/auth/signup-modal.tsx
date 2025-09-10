/**
 * Signup Modal - Elite registration with plan selection
 * Dual deployment strategy: Open Source vs Enterprise
 * Password strength indicator, terms checkbox, social login
 */

"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, Github, Chrome, Building, Loader2, AlertCircle, CheckCircle, Check, Shield, Zap, Crown, ExternalLink } from 'lucide-react';
import { cn } from 'src/lib/utils';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from 'src/components/ui/dialog';
import { useDialogManager } from 'src/lib/dialog-manager';
import { 
  signUp, 
  signIn,
  useAuthState, 
  validateEmail,
  validatePasswordStrength,
  PasswordStrength,
  getAuthRedirectUrl
} from 'src/lib/auth-client';
import { getFeatureFlags, detectDeploymentMode } from '@privyloop/core/features';
import { useAuthRecaptcha } from 'src/hooks/useRecaptcha';

interface SignupForm {
  email: string;
  password: string;
  confirmPassword: string;
  selectedPlan: 'free' | 'pro' | null;
  agreeToTerms: boolean;
}

interface SignupError {
  field?: keyof SignupForm | 'general';
  message: string;
}

interface PlanOption {
  id: 'free' | 'pro';
  name: string;
  price: string;
  description: string;
  features: string[];
  badge?: string;
  popular?: boolean;
}

export function SignupModal() {
  const router = useRouter();
  const { state, close, switch: switchDialog } = useDialogManager();
  const { isAuthenticated } = useAuthState();
  const recaptcha = useAuthRecaptcha('signup');
  
  const [form, setForm] = useState<SignupForm>({ 
    email: '', 
    password: '', 
    confirmPassword: '',
    selectedPlan: null,
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState<SignupError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);
  const [success, setSuccess] = useState(false);

  const isOpen = state.type === 'signup' && state.isOpen;
  const isEnterprise = detectDeploymentMode() === 'cloud';

  // Auto-focus email field when modal opens
  const emailInputRef = React.useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (isOpen && emailInputRef.current) {
      setTimeout(() => emailInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Password strength validation
  useEffect(() => {
    if (form.password) {
      setPasswordStrength(validatePasswordStrength(form.password));
    } else {
      setPasswordStrength(null);
    }
  }, [form.password]);

  // Auto-redirect on authentication success
  useEffect(() => {
    if (isAuthenticated && isOpen && success) {
      const redirectUrl = getAuthRedirectUrl();
      const target = redirectUrl && redirectUrl !== '/' ? redirectUrl : '/dashboard';
      const doRedirect = () => {
        close();
        try {
          if (typeof window !== 'undefined' && window.top === window) {
            window.location.assign(target);
          } else {
            router.push(target);
          }
        } catch {
          router.push(target);
        }
      };
      const id = setTimeout(doRedirect, 300);
      return () => clearTimeout(id);
    }
  }, [isAuthenticated, isOpen, success, close, router]);

  // Plan options (Enterprise vs Open Source)
  const planOptions: PlanOption[] = isEnterprise ? [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      description: 'Perfect for getting started',
      features: [
        '3 connected platforms',
        'Basic privacy scanning',
        'Email notifications',
        'Privacy score tracking',
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$4.99/month',
      description: 'For privacy enthusiasts',
      features: [
        'Unlimited platforms',
        'Advanced analytics',
        'Real-time monitoring',
        'Priority support',
        'Export & backup',
      ],
      badge: 'Most Popular',
      popular: true,
    },
  ] : [
    {
      id: 'free',
      name: 'Open Source',
      price: 'Free Forever',
      description: 'Self-hosted with unlimited features',
      features: [
        'Unlimited platforms',
        'Full privacy scanning',
        'All features included',
        'Your own infrastructure',
        'Community support',
      ],
    },
  ];

  const validateForm = (): boolean => {
    const newErrors: SignupError[] = [];

    // Email validation
    if (!form.email.trim()) {
      newErrors.push({ field: 'email', message: 'Email is required' });
    } else if (!validateEmail(form.email)) {
      newErrors.push({ field: 'email', message: 'Please enter a valid email address' });
    }

    // Password validation
    if (!form.password.trim()) {
      newErrors.push({ field: 'password', message: 'Password is required' });
    } else if (!passwordStrength?.isValid) {
      newErrors.push({ field: 'password', message: 'Password does not meet requirements' });
    }

    // Confirm password validation
    if (!form.confirmPassword.trim()) {
      newErrors.push({ field: 'confirmPassword', message: 'Please confirm your password' });
    } else if (form.password !== form.confirmPassword) {
      newErrors.push({ field: 'confirmPassword', message: 'Passwords do not match' });
    }

    // Plan selection (Enterprise only)
    if (isEnterprise && !form.selectedPlan) {
      newErrors.push({ field: 'general', message: 'Please select a plan to continue' });
    }

    // Terms agreement
    if (!form.agreeToTerms) {
      newErrors.push({ field: 'general', message: 'Please agree to the terms and conditions' });
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || isSubmitting) return;

    // For Enterprise Pro plan, redirect to Stripe
    if (isEnterprise && form.selectedPlan === 'pro') {
      // TODO: Integrate with Stripe - for now, show coming soon
      setErrors([{ field: 'general', message: 'Pro plan integration coming soon!' }]);
      return;
    }

    setIsSubmitting(true);
    setErrors([]);

    try {
      // Execute reCAPTCHA if enabled
      let recaptchaToken: string | null = null;
      if (recaptcha.isEnabled) {
        recaptchaToken = await recaptcha.executeRecaptcha();
        if (!recaptchaToken) {
          setErrors([{ field: 'general', message: 'Security verification failed. Please try again.' }]);
          return;
        }
      }

      // Step 1: Create user account through Better Auth
      const result = await signUp.email({
        email: form.email.trim(),
        password: form.password,
        name: form.email.split('@')[0], // Use email prefix as initial name
        // Include reCAPTCHA token if available
        ...(recaptchaToken && { recaptchaToken }),
      });
      
      // Step 2: Handle successful registration response
      console.log('Signup result:', result); // Debug logging
      
      // Check for successful signup (user created)
      if (result.data?.user) {
        // Store subscription preference for post-auth handling
        localStorage.setItem('pendingSubscriptionTier', form.selectedPlan || 'free');
        localStorage.setItem('userAgreedToTerms', form.agreeToTerms.toString());
        
        setSuccess(true);
        
        // For email/password signup, show success page with email verification
        setTimeout(() => {
          close();
          router.push('/signup-success?email=' + encodeURIComponent(form.email));
        }, 1500);
      } else {
        // If signup completed but no user data, still redirect to success page
        // This handles cases where email verification is required
        console.log('Signup completed without user data - likely requires email verification');
        setSuccess(true);
        
        setTimeout(() => {
          close();
          router.push('/signup-success?email=' + encodeURIComponent(form.email));
        }, 1500);
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      
      if (error.message?.includes('already exists') || error.status === 400) {
        setErrors([{ field: 'email', message: 'An account with this email already exists' }]);
      } else {
        setErrors([{ field: 'general', message: 'Account creation failed. Please try again.' }]);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialSignup = async (provider: 'google' | 'github' | 'microsoft') => {
    try {
      setIsSubmitting(true);

      // For Enterprise, ensure plan is selected
      if (isEnterprise && !form.selectedPlan) {
        setErrors([{ field: 'general', message: 'Please select a plan before continuing' }]);
        setIsSubmitting(false);
        return;
      }

      // Store plan selection for after OAuth
      if (form.selectedPlan) {
        localStorage.setItem('privyloop-selected-plan', form.selectedPlan);
      }

      await signIn.social({ 
        provider,
        callbackURL: `${window.location.origin}/signup-success`
      });
    } catch (error) {
      console.error(`${provider} signup error:`, error);
      setErrors([{ field: 'general', message: 'Social signup failed. Please try again.' }]);
      setIsSubmitting(false);
    }
  };

  const handleSwitchToLogin = () => {
    switchDialog('login');
  };

  const getFieldError = (field: keyof SignupForm | 'general'): string | undefined => {
    return errors.find(error => error.field === field)?.message;
  };

  const getGeneralError = (): string | undefined => {
    return errors.find(error => error.field === 'general')?.message;
  };

  const getPasswordStrengthColor = (score: PasswordStrength['score']): string => {
    switch (score) {
      case 0:
      case 1: return 'bg-red-500';
      case 2: return 'bg-yellow-500';
      case 3: return 'bg-blue-500';
      case 4: return 'bg-[#34D3A6]';
      default: return 'bg-gray-500';
    }
  };

  const getPasswordStrengthText = (score: PasswordStrength['score']): string => {
    switch (score) {
      case 0:
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Strong';
      default: return '';
    }
  };

  if (success) {
    return (
      <Dialog open={isOpen} onOpenChange={() => close()}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-[#34D3A6] mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Account created!</h2>
            <p className="text-gray-400">Setting up your privacy dashboard...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => close()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-bold">Create your account</DialogTitle>
          <DialogDescription>
            Join PrivyLoop and take control of your digital privacy
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* General Error */}
          {getGeneralError() && (
            <div className="flex items-center gap-2 p-3 text-sm bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
              <AlertCircle className="w-4 h-4" />
              {getGeneralError()}
            </div>
          )}

          {/* Plan Selection (Enterprise Only) */}
          {isEnterprise && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Choose your plan</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {planOptions.map((plan) => (
                  <Card 
                    key={plan.id}
                    className={cn(
                      "relative cursor-pointer transition-all duration-200",
                      "bg-[#141A1E] border-[#233037] hover:border-[#34D3A6]/30",
                      form.selectedPlan === plan.id && "border-[#34D3A6] bg-[#34D3A6]/5",
                      plan.popular && "ring-2 ring-[#34D3A6]/20"
                    )}
                    onClick={() => setForm(prev => ({ ...prev, selectedPlan: plan.id }))}
                  >
                    {plan.badge && (
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                        <span className="bg-[#34D3A6] text-black text-xs font-medium px-2 py-1 rounded-full">
                          {plan.badge}
                        </span>
                      </div>
                    )}
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white">{plan.name}</CardTitle>
                        {form.selectedPlan === plan.id && (
                          <div className="w-5 h-5 bg-[#34D3A6] rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-black" />
                          </div>
                        )}
                      </div>
                      <div className="text-2xl font-bold text-[#34D3A6]">{plan.price}</div>
                      <p className="text-sm text-gray-400">{plan.description}</p>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center text-sm text-gray-300">
                            <Check className="w-4 h-4 text-[#34D3A6] mr-2 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  ref={emailInputRef}
                  id="signup-email"
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                  className={cn(
                    "pl-10 bg-[#141A1E] border-[#233037] text-white placeholder:text-gray-400",
                    "focus:border-[#34D3A6]/50 focus:ring-2 focus:ring-[#34D3A6]/20",
                    getFieldError('email') && "border-red-500/50"
                  )}
                  autoComplete="email"
                  disabled={isSubmitting}
                />
              </div>
              {getFieldError('email') && (
                <p className="text-sm text-red-400">{getFieldError('email')}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                  className={cn(
                    "pl-10 pr-10 bg-[#141A1E] border-[#233037] text-white placeholder:text-gray-400",
                    "focus:border-[#34D3A6]/50 focus:ring-2 focus:ring-[#34D3A6]/20",
                    getFieldError('password') && "border-red-500/50"
                  )}
                  autoComplete="new-password"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  disabled={isSubmitting}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {passwordStrength && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Password strength</span>
                    <span className={cn(
                      "text-xs font-medium",
                      passwordStrength.isValid ? "text-[#34D3A6]" : "text-yellow-400"
                    )}>
                      {getPasswordStrengthText(passwordStrength.score)}
                    </span>
                  </div>
                  <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full transition-all duration-300 rounded-full",
                        getPasswordStrengthColor(passwordStrength.score)
                      )}
                      style={{ width: `${(passwordStrength.score + 1) * 20}%` }}
                    />
                  </div>
                  {passwordStrength.feedback.length > 0 && (
                    <ul className="text-xs text-gray-400 space-y-1">
                      {passwordStrength.feedback.map((feedback, index) => (
                        <li key={index}>• {feedback}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              
              {getFieldError('password') && (
                <p className="text-sm text-red-400">{getFieldError('password')}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className={cn(
                    "pl-10 pr-10 bg-[#141A1E] border-[#233037] text-white placeholder:text-gray-400",
                    "focus:border-[#34D3A6]/50 focus:ring-2 focus:ring-[#34D3A6]/20",
                    getFieldError('confirmPassword') && "border-red-500/50",
                    form.confirmPassword && form.password === form.confirmPassword && "border-[#34D3A6]/50"
                  )}
                  autoComplete="new-password"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  disabled={isSubmitting}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {getFieldError('confirmPassword') && (
                <p className="text-sm text-red-400">{getFieldError('confirmPassword')}</p>
              )}
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="terms"
                checked={form.agreeToTerms}
                onChange={(e) => setForm(prev => ({ ...prev, agreeToTerms: e.target.checked }))}
                className="mt-1 h-4 w-4 rounded border-[#233037] bg-[#141A1E] text-[#34D3A6] focus:ring-[#34D3A6]/20 focus:ring-2"
                disabled={isSubmitting}
              />
              <label htmlFor="terms" className="text-sm text-gray-300">
                I agree to the{' '}
                <a 
                  href="/terms" 
                  target="_blank"
                  className="text-[#34D3A6] hover:text-[#34D3A6]/80 hover:underline"
                >
                  Terms of Service
                  <ExternalLink className="w-3 h-3 inline ml-1" />
                </a>
                {' '}and{' '}
                <a 
                  href="/privacy" 
                  target="_blank"
                  className="text-[#34D3A6] hover:text-[#34D3A6]/80 hover:underline"
                >
                  Privacy Policy
                  <ExternalLink className="w-3 h-3 inline ml-1" />
                </a>
              </label>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit"
              className={cn(
                "w-full bg-[#34D3A6] hover:bg-[#34D3A6]/90 text-black font-medium",
                "transition-all duration-200",
                isSubmitting && "opacity-50"
              )}
              disabled={isSubmitting || !form.agreeToTerms}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#233037]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#101518] px-2 text-gray-400">Or continue with</span>
              </div>
            </div>

            {/* Social Signup Buttons */}
            <div className="space-y-2">
              {/* Google */}
              <Button
                type="button"
                variant="outline"
                className="w-full bg-[#141A1E] border-[#233037] text-white hover:bg-[#1A2126] hover:border-[#34D3A6]/30"
                onClick={() => handleSocialSignup('google')}
                disabled={isSubmitting || (isEnterprise && !form.selectedPlan)}
              >
                <Chrome className="w-4 h-4 mr-2" />
                Continue with Google
              </Button>

              {/* Microsoft */}
              <Button
                type="button"
                variant="outline"
                className="w-full bg-[#141A1E] border-[#233037] text-white hover:bg-[#1A2126] hover:border-[#34D3A6]/30"
                onClick={() => handleSocialSignup('microsoft')}
                disabled={isSubmitting || (isEnterprise && !form.selectedPlan)}
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
                </svg>
                Continue with Microsoft
              </Button>

              {/* GitHub */}
              <Button
                type="button"
                variant="outline"
                className="w-full bg-[#141A1E] border-[#233037] text-white hover:bg-[#1A2126] hover:border-[#34D3A6]/30"
                onClick={() => handleSocialSignup('github')}
                disabled={isSubmitting || (isEnterprise && !form.selectedPlan)}
              >
                <Github className="w-4 h-4 mr-2" />
                Continue with GitHub
              </Button>
            </div>

            {/* Login Link */}
            <div className="text-center pt-4">
              <p className="text-sm text-gray-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={handleSwitchToLogin}
                  className="text-[#34D3A6] hover:text-[#34D3A6]/80 hover:underline font-medium"
                  disabled={isSubmitting}
                >
                  Sign in
                </button>
              </p>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
