import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTelegram } from '@/hooks/useTelegram';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Activity {
  id: string;
  type: 'transaction' | 'product_received' | 'balance_change';
  subType: string;
  title: string;
  description: string;
  amount?: number;
  productName?: string;
  username?: string;
  status: string;
  createdAt: string;
  icon: string;
  color: 'green' | 'blue' | 'red' | 'purple' | 'gray' | 'yellow';
}

export function Settings() {
  const { user, logout } = useAuth();
  const { hapticFeedback } = useTelegram();
  const [showInstructions, setShowInstructions] = useState(false);

  // Fetch comprehensive activity data
  const { data: activityData } = useQuery<{
    success: boolean;
    activities: Activity[];
    total: number;
  }>({
    queryKey: ['/api/user/activity', user?.id],
    queryFn: async () => {
      const response = await fetch('/api/user/activity', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('telegram_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch activity');
      }
      
      return response.json();
    },
    enabled: !!user?.id,
  });

  const recentActivities = activityData?.activities || [];

  const handleLogout = () => {
    hapticFeedback('medium');
    logout();
  };

  const handleContactUs = () => {
    hapticFeedback('medium');
    // Open Telegram chat
    window.open('https://t.me/yourbotusername', '_blank');
  };

  const handleContactSupport = () => {
    hapticFeedback('medium');
    // Open email client
    window.open('mailto:support@example.com?subject=Support Request', '_blank');
  };

  if (!user) return null;

  return (
    <div className="p-4 pb-24 space-y-6 max-w-md mx-auto">

      {/* User Profile Card */}
      <Card className="bg-dark-card/50 backdrop-blur-sm border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={user.profileImageUrl || ''} alt={user.firstName} />
                <AvatarFallback className="bg-blue-600 text-white">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold truncate">
                  {user.firstName} {user.lastName}
                </h3>
                <p className="text-gray-400 text-sm truncate">@{user.username}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInstructions(true)}
              className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 p-2"
              title="Instructions to Purchase"
            >
              <i className="fas fa-info-circle text-lg"></i>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">User ID</span>
            <span className="text-white text-sm truncate">{user.telegramId || user.id}</span>
          </div>
          {user.balance !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Balance</span>
              <span className="text-white font-semibold">${user.balance.toFixed(2)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Summary Cards with minimal height */}
      {recentActivities.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardContent className="p-3 text-center">
              <i className="fas fa-plus-circle text-green-400 text-lg mb-1"></i>
              <p className="text-white font-semibold text-sm">
                {recentActivities.filter(a => a.subType === 'deposit').length}
              </p>
              <p className="text-gray-400 text-xs">Deposits</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="p-3 text-center">
              <i className="fas fa-shopping-bag text-blue-400 text-lg mb-1"></i>
              <p className="text-white font-semibold text-sm">
                {recentActivities.filter(a => a.subType === 'purchase').length}
              </p>
              <p className="text-gray-400 text-xs">Purchases</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardContent className="p-3 text-center">
              <i className="fas fa-gift text-purple-400 text-lg mb-1"></i>
              <p className="text-white font-semibold text-sm">
                {recentActivities.filter(a => a.type === 'product_received').length}
              </p>
              <p className="text-gray-400 text-xs">Products</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Settings Options */}
      <div className="space-y-3">
        <Separator className="bg-gray-700 my-4" />

        <Button
          variant="outline"
          className="w-full justify-start bg-dark-card/30 border-gray-700 text-white hover:bg-dark-card/50"
          onClick={handleContactUs}
        >
          <i className="fas fa-comment mr-3 text-gray-400"></i>
          Contact Us
        </Button>

        <Button
          variant="outline"
          className="w-full justify-start bg-dark-card/30 border-gray-700 text-white hover:bg-dark-card/50"
          onClick={handleContactSupport}
        >
          <i className="fas fa-envelope mr-3 text-gray-400"></i>
          Support Email
        </Button>

        {/* Instructions Card */}
        <Card className="bg-gradient-to-r from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm flex items-center">
              <i className="fas fa-info-circle mr-2 text-blue-400"></i>
              Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-gray-300 text-sm leading-relaxed">
              Please wait for 15 min to 4 hr after purchasing a product or balance add in wallet. 
              We will review and verify the payment and product will be delivered to you in 
              My Products → Purchased Items section.
            </p>
          </CardContent>
        </Card>

        <Separator className="bg-gray-700 my-4" />

        <Button
          variant="outline"
          className="w-full justify-start bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30"
          onClick={handleLogout}
        >
          <i className="fas fa-sign-out-alt mr-3"></i>
          Logout
        </Button>
      </div>
    </div>
  );
}