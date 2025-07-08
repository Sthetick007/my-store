import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-gray-900 to-dark-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-dark-card/50 backdrop-blur-sm border-gray-700">
        <CardContent className="p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-accent-blue to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-store text-white text-2xl"></i>
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-2">TeleShop</h1>
          <p className="text-gray-400 mb-8">
            Your complete e-commerce wallet solution for Telegram
          </p>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-center space-x-3 text-gray-300">
              <i className="fas fa-shopping-cart text-accent-blue"></i>
              <span className="text-sm">Browse and purchase products</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-300">
              <i className="fas fa-wallet text-accent-blue"></i>
              <span className="text-sm">Manage your digital wallet</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-300">
              <i className="fas fa-history text-accent-blue"></i>
              <span className="text-sm">Track transaction history</span>
            </div>
          </div>
          
          <Button 
            onClick={() => window.location.href = '/api/login'}
            className="w-full bg-accent-blue hover:bg-accent-blue-dark text-white"
          >
            <i className="fas fa-sign-in-alt mr-2"></i>
            Get Started
          </Button>
          
          <p className="text-xs text-gray-500 mt-4">
            Secure authentication powered by Replit
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
