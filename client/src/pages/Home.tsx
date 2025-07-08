import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useTelegram } from '@/hooks/useTelegram';
import { apiRequest } from '@/lib/queryClient';
import { TelegramWebApp } from '@/components/TelegramWebApp';
import { Header } from '@/components/Header';
import { TabNavigation } from '@/components/TabNavigation';
import { Store } from '@/components/Store';
import { Wallet } from '@/components/Wallet';
import { UserProducts } from '@/components/UserProducts';
import { Settings } from '@/components/Settings';
import { ShoppingCart } from '@/components/ShoppingCart';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { FloatingCartButton } from '@/components/FloatingCartButton';
import type { TabType } from '@/types';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('store');
  const [location] = useLocation();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const { user, isAuthenticated } = useAuth();
  const { webApp, user: telegramUser, isReady } = useTelegram();
  const queryClient = useQueryClient();

  // Auto-authenticate with Telegram data
  useEffect(() => {
    const autoAuthenticate = async () => {
      if (!isReady) return;
      
      // Skip auth if already authenticated
      if (isAuthenticated) {
        setIsAuthenticating(false);
        return;
      }

      // Skip auth if no token and no Telegram data
      const existingToken = localStorage.getItem('telegram_token');
      if (!existingToken && !telegramUser) {
        setIsAuthenticating(false);
        return;
      }

      try {
        setIsLoading(true);
        
        let initData = '';
        
        if (webApp && webApp.initData) {
          console.log('✅ Using real Telegram WebApp data');
          initData = webApp.initData;
        } else if (telegramUser) {
          console.log('⚠️ Using mock Telegram data for development');
          // For development - create mock initData
          const mockInitData = new URLSearchParams({
            user: JSON.stringify(telegramUser),
            auth_date: Math.floor(Date.now() / 1000).toString(),
            hash: 'dev_mock_hash'
          });
          initData = mockInitData.toString();
        }

        if (initData) {
          const response = await apiRequest('POST', '/api/auth/verify', {
            initData
          });

          if (response.success && response.token) {
            localStorage.setItem('telegram_token', response.token);
            queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
            console.log('✅ Auto-authentication successful');
          }
        }
      } catch (error) {
        console.error('Auto-authentication failed:', error);
      } finally {
        setIsLoading(false);
        setIsAuthenticating(false);
      }
    };

    autoAuthenticate();
  }, [isReady, telegramUser, webApp, isAuthenticated, queryClient]);

  // Handle deep linking from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab') as TabType;
    if (tab && ['store', 'wallet', 'products', 'settings'].includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'store':
        return <Store />;
      case 'wallet':
        return <Wallet />;
      case 'products':
        return <UserProducts />;
      case 'settings':
        return <Settings />;
      default:
        return <Store />;
    }
  };

  // Show loading while authenticating
  if (isAuthenticating) {
    return (
      <TelegramWebApp>
        <div className="min-h-screen bg-gradient-to-br from-dark-bg via-gray-900 to-dark-bg flex items-center justify-center">
          <LoadingOverlay 
            isOpen={true} 
            message="Connecting to Telegram..." 
          />
        </div>
      </TelegramWebApp>
    );
  }

  return (
    <TelegramWebApp>
      <div className="min-h-screen bg-gradient-to-br from-dark-bg via-gray-900 to-dark-bg">
        <Header />
        
        <main className="pb-16">
          {renderTabContent()}
        </main>

        <TabNavigation 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          isAdmin={user?.isAdmin || false}
        />

        <ShoppingCart 
          isOpen={isCartOpen} 
          onClose={() => setIsCartOpen(false)} 
        />

        <FloatingCartButton 
          onClick={() => setIsCartOpen(true)} 
        />

        <LoadingOverlay 
          isOpen={isLoading} 
          message="Processing..." 
        />
      </div>
    </TelegramWebApp>
  );
}
