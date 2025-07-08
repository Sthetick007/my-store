import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useQueryClient } from '@tanstack/react-query';
import { TelegramWebApp } from '@/components/TelegramWebApp';
import { AdminDashboard } from '@/components/AdminDashboard';
import { AdminLogin } from '@/components/AdminLogin';
import { LoadingOverlay } from '@/components/LoadingOverlay';

export default function AdminPage() {
  const [location, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(true);
  const { isAdminLoggedIn } = useAdminAuth();
  const queryClient = useQueryClient();
  
  // If admin is already logged in, show dashboard directly
  useEffect(() => {
    if (isAdminLoggedIn) {
      setShowAdminLogin(false);
    }
  }, [isAdminLoggedIn]);

  const handleAdminLoginSuccess = (token: string, adminUser: any) => {
    console.log('Admin login success:', { token: token.substring(0, 10) + '...', adminUser });
    setShowAdminLogin(false);
    // Force re-fetch of admin status
    queryClient.invalidateQueries({ queryKey: ["/api/admin/verify"] });
  };

  const handleBackToMain = () => {
    setLocation('/');
  };

  return (
    <TelegramWebApp>
      <div className="min-h-screen bg-gradient-to-br from-dark-bg via-gray-900 to-dark-bg">
        {showAdminLogin ? (
          <AdminLogin 
            onLoginSuccess={handleAdminLoginSuccess}
            onCancel={handleBackToMain}
          />
        ) : (
          <AdminDashboard />
        )}

        <LoadingOverlay 
          isOpen={isLoading} 
          message="Processing..." 
        />
      </div>
    </TelegramWebApp>
  );
}
