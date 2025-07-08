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

export function Settings() {
  const { user, logout } = useAuth();
  const { hapticFeedback } = useTelegram();
  const [showHistory, setShowHistory] = useState(false);
  const [showAddFunds, setShowAddFunds] = useState(false);

  const handleAddFunds = () => {
    hapticFeedback('medium');
    setShowAddFunds(true);
  };

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
    <div className="p-4 space-y-6">
      {/* User Profile Card */}
      {/* Balance Card */}
      <Card className="bg-accent-blue/20 backdrop-blur-sm border-accent-blue/30">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-accent-blue/30 p-3 rounded-full mr-3">
              <i className="fas fa-coins text-accent-blue text-xl"></i>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Available Balance</p>
              <h3 className="text-xl font-bold text-white">${user.balance?.toFixed(2) || '0.00'}</h3>
            </div>
          </div>
          <Button size="sm" className="bg-accent-blue hover:bg-accent-blue-dark" onClick={handleAddFunds}>
            <i className="fas fa-plus mr-1"></i>
            Add Funds
          </Button>
        </CardContent>
      </Card>

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

      {/* Add Funds Modal */}
      <Dialog open={showAddFunds} onOpenChange={setShowAddFunds}>
        <DialogContent className="bg-dark-card/90 backdrop-blur-md border-gray-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Add Funds</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h3 className="text-white font-medium">Select Amount</h3>
              <div className="grid grid-cols-3 gap-2">
                {[10, 25, 50, 100, 200, 500].map((amount) => (
                  <Button 
                    key={amount}
                    variant="outline"
                    className="border-gray-700 hover:border-accent-blue hover:bg-accent-blue/20"
                  >
                    ${amount}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="pt-4">
              <Button className="w-full bg-accent-blue hover:bg-accent-blue-dark">
                <i className="fas fa-credit-card mr-2"></i>
                Proceed to Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}