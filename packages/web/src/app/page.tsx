import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Shield, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-bg-900 via-bg-800 to-bg-700 flex items-center justify-center p-4">
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
          <Button 
            asChild
            className="bg-brand-500 hover:bg-brand-600 text-black font-semibold px-8 py-3 rounded-xl shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 transition-all"
          >
            <Link href="/dashboard">
              View Dashboard
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
          
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
  );
}