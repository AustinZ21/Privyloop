"use client";

import Link from 'next/link';
import { Button } from 'src/components/ui/button';
import { Shield, ArrowRight, User, UserPlus } from 'lucide-react';
import { useAuthState } from 'src/lib/auth-client';
import { useDialogManager } from 'src/lib/dialog-manager';

export default function HomePage() {
  const { isAuthenticated, isLoading, user } = useAuthState();
  const { open } = useDialogManager();

  const handleAuthAction = (action: 'login' | 'signup') => {
    open(action);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-900 via-bg-800 to-bg-700">
      {/* Header with Auth Triggers */}
      <header className="absolute top-0 left-0 right-0 z-10 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-black" />
            </div>
            <span className="text-xl font-bold text-white">PrivyLoop</span>
          </div>
          
          <div className="flex items-center space-x-3">
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            ) : isAuthenticated && user ? (
              <div className="flex items-center space-x-3">
                <span className="text-white text-sm">
                  Welcome, {user.name || user.email?.split('@')[0] || 'User'}!
                </span>
                <Button 
                  asChild
                  className="bg-brand-500 hover:bg-brand-600 text-black font-medium"
                >
                  <Link href="/dashboard">
                    Dashboard
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Button
                  onClick={() => handleAuthAction('login')}
                  variant="outline"
                  className="border-brand-500 text-brand-500 hover:bg-brand-500/10"
                >
                  <User className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
                <Button
                  onClick={() => handleAuthAction('signup')}
                  className="bg-brand-500 hover:bg-brand-600 text-black font-medium"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Get Started
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-screen flex items-center justify-center p-4 pt-24">
        <div className="max-w-2xl mx-auto text-center space-y-8">
        <div className="flex items-center justify-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-brand-500/20">
            <Shield className="w-12 h-12 text-black" />
          </div>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-white">
            Welcome to <span className="text-brand-500">PrivyLoop</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-lg mx-auto">
            Monitor and manage your digital privacy across platforms with AI-powered insights
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {isAuthenticated ? (
            <Button 
              asChild
              className="bg-brand-500 hover:bg-brand-600 text-black font-semibold px-8 py-3 rounded-xl shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 transition-all"
            >
              <Link href="/dashboard">
                View Dashboard
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          ) : (
            <Button 
              onClick={() => handleAuthAction('signup')}
              className="bg-brand-500 hover:bg-brand-600 text-black font-semibold px-8 py-3 rounded-xl shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 transition-all"
            >
              Start Your Privacy Journey
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          )}
          
          <Button 
            variant="outline" 
            className="border-gray-600 text-gray-300 hover:text-white hover:border-brand-500/50 px-8 py-3 rounded-xl"
          >
            Learn More
          </Button>
        </div>

        <div className="pt-12 text-sm text-gray-500">
          Your privacy, your control • Secured with end-to-end encryption
        </div>
      </div>
    </main>
  </div>
  );
}