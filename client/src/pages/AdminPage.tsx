import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { TelegramWebApp } from '@/components/TelegramWebApp';
import { SimpleAdminDashboard } from '@/components/SimpleAdminDashboard';
import { AdminLogin } from '@/components/AdminLogin';
import { LoadingOverlay } from '@/components/LoadingOverlay';

export default function AdminPage() {
  const [location, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const queryClient = useQueryClient();
  
  // Check if admin token exists on component mount
  useEffect(() => {
    const adminToken = localStorage.getItem('admin_token');
    if (adminToken) {
      setShowDashboard(true);
    }
  }, []);
  
  const handleAdminLoginSuccess = (token: string, adminUser: any) => {
    console.log('Admin login success:', { token: token.substring(0, 10) + '...', adminUser });
    setIsLoading(true);
    
    // Brief delay to show success, then redirect
    setTimeout(() => {
      setShowDashboard(true);
      setIsLoading(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/verify"] });
    }, 1000);
  };

  const handleBackToMain = () => {
    setLocation('/');
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setShowDashboard(false);
    queryClient.invalidateQueries({ queryKey: ["/api/admin/verify"] });
    queryClient.removeQueries({ queryKey: ["/api/admin"] });
    setLocation('/');
  };

  return (
    <TelegramWebApp>
      <div className="min-h-screen bg-gradient-to-br from-dark-bg via-gray-900 to-dark-bg">
        {!showDashboard ? (
          <AdminLogin 
            onLoginSuccess={handleAdminLoginSuccess}
            onCancel={handleBackToMain}
          />
        ) : (
          <SimpleAdminDashboard />
        )}

        <LoadingOverlay 
          isOpen={isLoading} 
          message="Loading admin panel..." 
        />
      </div>
    </TelegramWebApp>
  );
}
