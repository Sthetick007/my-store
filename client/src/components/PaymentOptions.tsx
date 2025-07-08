import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useTelegram } from '@/hooks/useTelegram';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PaymentMethodModal } from './PaymentMethodModal';
import { PaymentReview } from './PaymentReview';
import { History } from './History';

export function PaymentOptions() {
  const [amount, setAmount] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentReview, setShowPaymentReview] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const { toast } = useToast();
  const { hapticFeedback } = useTelegram();
  const queryClient = useQueryClient();

  const addFundsMutation = useMutation({
    mutationFn: async ({ amount, method }: { amount: string; method: string }) => {
      await apiRequest('POST', '/api/transactions', {
        type: 'deposit',
        amount: parseFloat(amount),
        description: `Add funds via ${method}`,
        status: 'pending',
        metadata: {
          paymentMethod: method,
          timestamp: new Date().toISOString(),
        }
      });
    },
    onSuccess: () => {
      hapticFeedback('success');
      setShowPaymentModal(false);
      setShowPaymentReview(true);
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error) => {
      hapticFeedback('error');
      toast({
        title: 'Payment Failed',
        description: 'There was an error processing your payment.',
        variant: 'destructive',
      });
    },
  });

  const handleAddFunds = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount.',
        variant: 'destructive',
      });
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePaymentMethod = (method: string) => {
    setPaymentMethod(method);
    addFundsMutation.mutate({ amount, method });
  };

  const quickAmounts = ['10', '25', '50', '100', '250', '500'];

  if (showPaymentReview) {
    return (
      <PaymentReview
        amount={amount}
        paymentMethod={paymentMethod}
        onClose={() => {
          setShowPaymentReview(false);
          setAmount('');
          setPaymentMethod('');
        }}
      />
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Add Funds Section */}
      <Card className="bg-dark-card/50 backdrop-blur-sm border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <i className="fas fa-wallet mr-3 text-accent-blue"></i>
            Add Funds
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-gray-400">Enter Amount</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-gray-400">Quick Select</Label>
            <div className="grid grid-cols-3 gap-2">
              {quickAmounts.map((amt) => (
                <Button
                  key={amt}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(amt)}
                  className="bg-gray-800/50 border-gray-700 text-white hover:bg-gray-700"
                >
                  ${amt}
                </Button>
              ))}
            </div>
          </div>
          
          <Button
            onClick={handleAddFunds}
            disabled={!amount || parseFloat(amount) <= 0}
            className="w-full bg-accent-blue hover:bg-accent-blue-dark"
          >
            Continue to Payment
          </Button>
        </CardContent>
      </Card>

      {/* Payment Methods Info */}
      <Card className="bg-dark-card/50 backdrop-blur-sm border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">Payment Methods</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
            <div className="flex items-center space-x-3">
              <i className="fas fa-mobile-alt text-orange-400 text-xl"></i>
              <div>
                <p className="text-white font-medium">UPI</p>
                <p className="text-gray-400 text-sm">Instant payment</p>
              </div>
            </div>
            <Badge className="bg-green-500 text-white">Popular</Badge>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
            <div className="flex items-center space-x-3">
              <i className="fas fa-qrcode text-blue-400 text-xl"></i>
              <div>
                <p className="text-white font-medium">QR Code</p>
                <p className="text-gray-400 text-sm">Scan to pay</p>
              </div>
            </div>
            <Badge className="bg-blue-500 text-white">Fast</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card className="bg-dark-card/50 backdrop-blur-sm border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span>Recent Transactions</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(true)}
              className="text-accent-blue hover:bg-accent-blue/20"
            >
              View All
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <History limit={3} />
        </CardContent>
      </Card>

      {/* Payment Method Modal */}
      <PaymentMethodModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={amount}
        userId="123456789"
        onPaymentMethod={handlePaymentMethod}
      />

      {/* Full History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-dark-card/90 backdrop-blur-md border-gray-700 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span>Transaction History</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHistory(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <i className="fas fa-times"></i>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <History />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}