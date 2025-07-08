import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTelegram } from '@/hooks/useTelegram';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface TelegramAuthProps {
  onSuccess: () => void;
}

export default function TelegramAuth({ onSuccess }: TelegramAuthProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const { webApp, user: telegramUser } = useTelegram();
  const queryClient = useQueryClient();

  // Auto-attempt login if we have Telegram WebApp data
  useEffect(() => {
    if (webApp && webApp.initData && !isConnecting && !showSuccess) {
      handleTelegramLogin();
    }
  }, [webApp]);

  const handleTelegramLogin = async () => {
    setIsConnecting(true);
    setAuthError(null);
    
    try {
      let initData = '';
      
      if (webApp && webApp.initData) {
        console.log('Using real Telegram WebApp data');
        initData = webApp.initData;
      } else if (telegramUser) {
        console.log('Using mock Telegram data for development');
        // For development - create mock initData
        const mockInitData = new URLSearchParams({
          user: JSON.stringify(telegramUser),
          auth_date: Math.floor(Date.now() / 1000).toString(),
          hash: 'dev_mock_hash'
        });
        initData = mockInitData.toString();
      } else {
        throw new Error('No Telegram data available. Please open this app through Telegram.');
      }
      
      console.log('Sending auth request with initData:', initData);
      const response = await apiRequest('POST', '/api/auth/verify', { initData });
      
      console.log('Auth response:', response);
      
      if (response.success) {
        // Store the JWT token
        localStorage.setItem('telegram_token', response.token);
        
        setShowSuccess(true);
        
        // Invalidate queries to refresh user data
        queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
        
        // Show success message then redirect
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        throw new Error(response.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('Authentication failed:', error);
      setAuthError(error instanceof Error ? error.message : 'Authentication failed');
      setIsConnecting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-sm bg-transparent border-none shadow-none">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-8">
              <i className="fas fa-shopping-cart text-white text-2xl"></i>
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-2">TeleShop</h1>
            <p className="text-gray-400 mb-8 text-sm">
              Your premium e-commerce store
            </p>
            
            <div className="flex items-center justify-center space-x-2 text-green-500">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <i className="fas fa-check text-white text-sm"></i>
              </div>
              <span className="text-lg font-medium">Login Successful!</span>
            </div>
            
            <p className="text-gray-300 text-sm mt-4">
              Redirecting to store...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-sm bg-transparent border-none shadow-none">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-8">
              <i className="fas fa-shopping-cart text-white text-2xl"></i>
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-2">TeleShop</h1>
            <p className="text-gray-400 mb-8 text-sm">
              Your premium e-commerce store
            </p>
            
            <div className="flex items-center justify-center space-x-3 text-gray-300">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-300"></div>
              <span className="text-base">Authenticating with Telegram...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-sm bg-transparent border-none shadow-none">
        <CardContent className="p-8 text-center">
          <div className="w-20 h-20 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <i className="fas fa-shopping-cart text-white text-2xl"></i>
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-2">TeleShop</h1>
          <p className="text-gray-400 mb-8 text-sm">
            Your premium e-commerce store
          </p>
          
          {authError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6">
              <p className="text-red-400 text-sm">{authError}</p>
            </div>
          )}
          
          <Button 
            onClick={handleTelegramLogin}
            disabled={isConnecting}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50"
          >
            <i className="fas fa-paper-plane mr-2"></i>
            {isConnecting ? 'Connecting...' : 'Login with Telegram'}
          </Button>
          
          <p className="text-gray-500 text-xs mt-4">
            This app uses Telegram authentication for security
          </p>
        </CardContent>
      </Card>
    </div>
  );
}