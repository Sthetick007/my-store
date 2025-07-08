import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useQueryClient } from '@tanstack/react-query';
import { TelegramWebApp } from '@/components/TelegramWebApp';
import { Header } from '@/components/Header';
import { TabNavigation } from '@/components/TabNavigation';
import { Store } from '@/components/Store';
import { Wallet } from '@/components/Wallet';
import { UserProducts } from '@/components/UserProducts';
import { Settings } from '@/components/Settings';
import { AdminDashboard } from '@/components/AdminDashboard';
import { AdminLogin } from '@/components/AdminLogin';
import { ShoppingCart } from '@/components/ShoppingCart';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { FloatingCartButton } from '@/components/FloatingCartButton';
import type { TabType } from '@/types';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('store');
  const [location] = useLocation();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const { user } = useAuth();
  const { isEligibleForAdmin, isAdminLoggedIn, adminLogout, debug } = useAdminAuth();
  const queryClient = useQueryClient();
  
  // Debug admin status
  useEffect(() => {
    console.log('🔐 Admin status:', { 
      isEligibleForAdmin, 
      isAdminLoggedIn, 
      user,
      debug,
      showAdminLogin
    });
  }, [isEligibleForAdmin, isAdminLoggedIn, user, debug, showAdminLogin]);

  // Handle deep linking from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab') as TabType;
    if (tab && ['store', 'wallet', 'products', 'settings'].includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  const handleAdminToggle = () => {
    if (isAdminMode) {
      // If we're already in admin mode, log out
      adminLogout();
      setIsAdminMode(false);
      setActiveTab('store');
    } else if (isAdminLoggedIn) {
      // If we're already logged in as admin, just switch to admin mode
      setIsAdminMode(true);
      setActiveTab('admin');
    } else {
      // Otherwise show the login screen
      setShowAdminLogin(true);
    }
  };
  
  const handleAdminLoginSuccess = (token: string, adminUser: any) => {
    console.log('Admin login success:', { token: token.substring(0, 10) + '...', adminUser });
    setShowAdminLogin(false);
    setIsAdminMode(true);
    setActiveTab('admin');
    // Force re-fetch of admin eligibility
    queryClient.invalidateQueries({ queryKey: ["/api/admin/check-eligibility"] });
  };

  const renderTabContent = () => {
    if (showAdminLogin) {
      return (
        <AdminLogin 
          onLoginSuccess={handleAdminLoginSuccess}
          onCancel={() => setShowAdminLogin(false)}
        />
      );
    }
    
    if (isAdminMode) {
      return <AdminDashboard />;
    }

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
        <Header 
          onAdminToggle={handleAdminToggle}
          showAdminSwitch={!showAdminLogin && (isEligibleForAdmin || isAdminLoggedIn)}
        />
        
        <main className="pb-16">
          {renderTabContent()}
        </main>

        {!isAdminMode && (
          <TabNavigation 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
            isAdmin={user?.isAdmin || false}
          />
        )}

        {!isAdminMode && (
          <>
            <ShoppingCart 
              isOpen={isCartOpen} 
              onClose={() => setIsCartOpen(false)} 
            />

            <FloatingCartButton 
              onClick={() => setIsCartOpen(true)} 
            />
          </>
        )}

        <LoadingOverlay 
          isOpen={isLoading} 
          message="Processing..." 
        />
      </div>
    </TelegramWebApp>
  );
}
