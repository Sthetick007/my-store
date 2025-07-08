import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
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
  const { user } = useAuth();

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
