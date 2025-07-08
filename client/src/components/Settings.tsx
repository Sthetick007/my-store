import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTelegram } from '@/hooks/useTelegram';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { History } from './History';
import { MyProducts } from './MyProducts';

export function Settings() {
  const { user, logout } = useAuth();
  const { hapticFeedback } = useTelegram();
  const [showHistory, setShowHistory] = useState(false);
  const [showMyProducts, setShowMyProducts] = useState(false);

  const handleLogout = () => {
    hapticFeedback('impact');
    logout();
  };

  const handleContactUs = () => {
    hapticFeedback('impact');
    // Open Telegram chat
    window.open('https://t.me/yourbotusername', '_blank');
  };

  const handleContactSupport = () => {
    hapticFeedback('impact');
    // Open email client
    window.open('mailto:support@example.com?subject=Support Request', '_blank');
  };

  if (!user) return null;

  return (
    <div className="p-4 space-y-6">
      {/* User Profile Card */}
      <Card className="bg-dark-card/50 backdrop-blur-sm border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center space-x-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={user.profileImageUrl || ''} alt={user.firstName} />
              <AvatarFallback className="bg-accent-blue text-white">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">
                {user.firstName} {user.lastName}
              </h3>
              <p className="text-gray-400 text-sm">@{user.username}</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Email</span>
            <span className="text-white">{user.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Balance</span>
            <span className="text-accent-blue font-semibold">${user.balance}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Role</span>
            <Badge className={user.isAdmin ? 'bg-red-500' : 'bg-green-500'}>
              {user.isAdmin ? 'Admin' : 'User'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Settings Options */}
      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full justify-start bg-dark-card/30 border-gray-700 text-white hover:bg-dark-card/50"
          onClick={() => setShowHistory(true)}
        >
          <i className="fas fa-history mr-3 text-gray-400"></i>
          Transaction History
        </Button>

        <Button
          variant="outline"
          className="w-full justify-start bg-dark-card/30 border-gray-700 text-white hover:bg-dark-card/50"
          onClick={() => setShowMyProducts(true)}
        >
          <i className="fas fa-box mr-3 text-gray-400"></i>
          My Products
        </Button>

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

      {/* History Modal */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="bg-dark-card/90 backdrop-blur-md border-gray-700 max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Transaction History</DialogTitle>
          </DialogHeader>
          <History />
        </DialogContent>
      </Dialog>

      {/* My Products Modal */}
      <Dialog open={showMyProducts} onOpenChange={setShowMyProducts}>
        <DialogContent className="bg-dark-card/90 backdrop-blur-md border-gray-700 max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">My Products</DialogTitle>
          </DialogHeader>
          <MyProducts />
        </DialogContent>
      </Dialog>
    </div>
  );
}