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
  const { webApp, user: telegramUser } = useTelegram();
  const queryClient = useQueryClient();

  const handleTelegramLogin = async () => {
    setIsConnecting(true);
    
    try {
      // Simulate connecting state
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      let initData = '';
      
      if (webApp && webApp.initData) {
        initData = webApp.initData;
      } else if (telegramUser) {
        // For development - create mock initData
        const mockInitData = new URLSearchParams({
          user: JSON.stringify(telegramUser),
          auth_date: Math.floor(Date.now() / 1000).toString(),
          hash: 'mock_hash_for_dev'
        });
        initData = mockInitData.toString();
      } else {
        throw new Error('No Telegram data available');
      }
      
      const response = await apiRequest('POST', '/api/auth/telegram', { initData });
      
      if (response.success) {
        setShowSuccess(true);
        
        // Invalidate queries to refresh user data
        queryClient.invalidateQueries({ queryKey: ['/api/auth/telegram/user'] });
        
        // Show success message then redirect
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (error) {
      console.error('Authentication failed:', error);
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
              <span className="text-base">Connecting to Telegram...</span>
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
          
          <Button 
            onClick={handleTelegramLogin}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-medium"
          >
            <i className="fas fa-paper-plane mr-2"></i>
            Login with Telegram
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}