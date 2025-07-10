import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useTelegram } from '@/hooks/useTelegram';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { History } from './History';

type PaymentStep = 'amount' | 'method' | 'qr' | 'verification';

export function PaymentOptions() {
  const [amount, setAmount] = useState('');
  const [currentStep, setCurrentStep] = useState<PaymentStep>('amount');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'crypto' | ''>('');
  const [orderId, setOrderId] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const { toast } = useToast();
  const { hapticFeedback } = useTelegram();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Refresh user balance
  const refreshBalance = () => {
    console.log('🔄 Manually refreshing user balance...');
    queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    toast({ title: 'Balance refreshed!', description: 'Your balance has been updated.' });
  };

  // Create transaction mutation
  const createTransactionMutation = useMutation({
    mutationFn: async ({ amount, method, orderId }: { amount: string; method: string; orderId: string }) => {
      const token = localStorage.getItem('telegram_token');
      console.log('🔄 Creating transaction:', { amount, method, orderId });
      console.log('🔐 User token:', token ? `${token.substring(0, 20)}...` : 'missing');
      
      const response = await apiRequest('POST', '/api/transactions', {
        type: 'deposit',
        amount: parseFloat(amount),
        description: `Add funds via ${method}`,
        status: 'pending',
        metadata: {
          paymentMethod: method,
          orderId: orderId,
          timestamp: new Date().toISOString(),
        }
      }, {
        'Authorization': `Bearer ${token}`
      });
      
      console.log('✅ Transaction created:', response);
      return response;
    },
    onSuccess: (data) => {
      console.log('🎉 Transaction creation success:', data);
      hapticFeedback('success');
      setCurrentStep('verification');
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
    },
    onError: (error) => {
      console.error('❌ Transaction creation error:', error);
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
    setCurrentStep('method');
  };

  const handleMethodSelect = (method: 'upi' | 'crypto') => {
    setPaymentMethod(method);
    setCurrentStep('qr');
  };

  const handleVerifyPayment = () => {
    if (!orderId.trim()) {
      toast({
        title: 'Order ID Required',
        description: 'Please enter your order/transaction ID.',
        variant: 'destructive',
      });
      return;
    }
    createTransactionMutation.mutate({ amount, method: paymentMethod, orderId });
  };

  const handleReset = () => {
    setCurrentStep('amount');
    setAmount('');
    setPaymentMethod('');
    setOrderId('');
  };

  const quickAmounts = ['10', '25', '50', '100', '250', '500'];

  // QR Code URLs (you can replace these with your actual payment QR codes)
  const getQRCode = () => {
    if (paymentMethod === 'upi') {
      return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=merchant@upi&pn=Store&am=${amount}&cu=INR&tn=Payment%20for%20${amount}`;
    } else if (paymentMethod === 'crypto') {
      return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=bitcoin:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa?amount=${parseFloat(amount) * 0.000025}`;
    }
    return '';
  };

  // Step 1: Amount Selection
  if (currentStep === 'amount') {
    return (
      <div className="p-4 pb-24 space-y-6 max-w-md mx-auto w-full min-w-0">
        <Card className="bg-dark-card/50 backdrop-blur-sm border-gray-700 w-full">
          <CardHeader>
            <CardTitle className="text-white flex items-center min-w-0">
              <i className="fas fa-wallet mr-3 text-accent-blue flex-shrink-0"></i>
              <span className="truncate">Add Funds to Wallet</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-gray-400">Enter Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 text-lg h-12 w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-gray-400">Quick Select</Label>
              <div className="grid grid-cols-3 gap-2 w-full">
                {quickAmounts.map((amt) => (
                  <Button
                    key={amt}
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(amt)}
                    className="bg-gray-800/50 border-gray-700 text-white hover:bg-gray-700 hover:border-accent-blue w-full min-w-0"
                  >
                    <span className="truncate">${amt}</span>
                  </Button>
                ))}
              </div>
            </div>
            
            <Button
              onClick={handleAddFunds}
              disabled={!amount || parseFloat(amount) <= 0}
              className="w-full bg-accent-blue hover:bg-accent-blue-dark h-12 text-lg"
            >
              Continue to Payment Method
            </Button>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card className="bg-dark-card/50 backdrop-blur-sm border-gray-700 w-full">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between min-w-0">
              <span className="truncate">Recent Transactions</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(true)}
                className="text-accent-blue hover:bg-accent-blue/20 flex-shrink-0"
              >
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <History limit={3} />
          </CardContent>
        </Card>

        {/* Full History Modal */}
        {showHistory && (
          <Dialog open={showHistory} onOpenChange={setShowHistory}>
            <DialogContent className="bg-dark-card/90 backdrop-blur-md border-gray-700 max-w-md max-h-[80vh] overflow-y-auto w-[95vw] mx-auto">
              <DialogHeader>
                <DialogTitle className="text-white">Transaction History</DialogTitle>
              </DialogHeader>
              <History />
            </DialogContent>
          </Dialog>
        )}
      </div>
    );
  }

  // Step 2: Payment Method Selection
  if (currentStep === 'method') {
    return (
      <div className="p-4 pb-24 space-y-6 max-w-md mx-auto w-full min-w-0">
        <Card className="bg-dark-card/50 backdrop-blur-sm border-gray-700 w-full">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between min-w-0">
              <span className="truncate">Select Payment Method</span>
              <Badge className="bg-accent-blue text-white flex-shrink-0">${amount}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* UPI Option */}
            <Card 
              className="bg-gray-800/50 border-gray-700 cursor-pointer hover:border-accent-blue transition-all w-full"
              onClick={() => handleMethodSelect('upi')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between min-w-0">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center shrink-0">
                      <i className="fas fa-mobile-alt text-orange-400 text-xl"></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">UPI Payment</p>
                      <p className="text-gray-400 text-sm truncate">Pay with any UPI app</p>
                    </div>
                  </div>
                  <Badge className="bg-green-500 text-white shrink-0 ml-2">Instant</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Crypto Option */}
            <Card 
              className="bg-gray-800/50 border-gray-700 cursor-pointer hover:border-accent-blue transition-all w-full"
              onClick={() => handleMethodSelect('crypto')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between min-w-0">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center shrink-0">
                      <i className="fab fa-bitcoin text-yellow-400 text-xl"></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">Cryptocurrency</p>
                      <p className="text-gray-400 text-sm truncate">Pay with Bitcoin/USDT</p>
                    </div>
                  </div>
                  <Badge className="bg-blue-500 text-white shrink-0 ml-2">Secure</Badge>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={() => setCurrentStep('amount')}
              variant="outline"
              className="w-full border-gray-700 text-gray-400 hover:bg-gray-700"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back to Amount
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 3: QR Code Display
  if (currentStep === 'qr') {
    return (
      <div className="p-4 pb-24 space-y-6 max-w-md mx-auto w-full min-w-0">
        <Card className="bg-dark-card/50 backdrop-blur-sm border-gray-700 w-full">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between min-w-0">
              <span className="truncate">Scan QR to Pay</span>
              <Badge className="bg-accent-blue text-white flex-shrink-0">${amount}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            {/* QR Code */}
            <div className="flex justify-center w-full">
              <div className="bg-white p-4 rounded-lg w-full max-w-[280px] mx-auto">
                <img
                  src={getQRCode()}
                  alt="Payment QR Code"
                  className="w-full h-auto max-w-[250px] max-h-[250px] mx-auto"
                />
              </div>
            </div>

            {/* Payment Instructions */}
            <div className="space-y-2 text-left w-full">
              <h3 className="text-white font-medium text-center truncate">
                {paymentMethod === 'upi' ? 'UPI Payment Instructions' : 'Crypto Payment Instructions'}
              </h3>
              <div className="text-gray-400 text-sm space-y-1">
                {paymentMethod === 'upi' ? (
                  <>
                    <p className="break-words">1. Open any UPI app (PhonePe, GPay, Paytm)</p>
                    <p className="break-words">2. Scan the QR code above</p>
                    <p className="break-words">3. Enter amount: <span className="text-accent-blue font-bold">${amount}</span></p>
                    <p className="break-words">4. Complete the payment</p>
                    <p className="break-words">5. Copy the transaction ID and enter below</p>
                  </>
                ) : (
                  <>
                    <p className="break-words">1. Open your crypto wallet app</p>
                    <p className="break-words">2. Scan the QR code above</p>
                    <p className="break-words">3. Send exact amount: <span className="text-accent-blue font-bold">${amount}</span></p>
                    <p className="break-words">4. Wait for confirmation</p>
                    <p className="break-words">5. Copy the transaction hash and enter below</p>
                  </>
                )}
              </div>
            </div>

            {/* Order ID Input */}
            <div className="space-y-2 text-left w-full">
              <Label htmlFor="orderId" className="text-gray-400">
                {paymentMethod === 'upi' ? 'Transaction/Order ID' : 'Transaction Hash'}
              </Label>
              <Input
                id="orderId"
                placeholder={paymentMethod === 'upi' ? 'Enter transaction ID' : 'Enter transaction hash'}
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 w-full"
              />
            </div>

            <div className="flex flex-col space-y-3 w-full">
              <Button
                onClick={() => setCurrentStep('method')}
                variant="outline"
                className="w-full border-gray-700 text-gray-400 hover:bg-gray-700"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Back
              </Button>
              <Button
                onClick={handleVerifyPayment}
                disabled={!orderId.trim() || createTransactionMutation.isPending}
                className="w-full bg-accent-blue hover:bg-accent-blue-dark"
              >
                {createTransactionMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check mr-2"></i>
                    Verify Payment
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 4: Verification Status
  if (currentStep === 'verification') {
    return (
      <div className="p-4 pb-24 space-y-6 max-w-md mx-auto w-full min-w-0">
        <Card className="bg-dark-card/50 backdrop-blur-sm border-gray-700 w-full">
          <CardContent className="p-8 text-center space-y-6">
            {/* Success Icon */}
            <div className="mx-auto w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
              <i className="fas fa-clock text-green-400 text-3xl"></i>
            </div>

            {/* Status Message */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white break-words">Payment Under Verification</h2>
              <p className="text-gray-400 break-words">
                Your payment of <span className="text-accent-blue font-bold">${amount}</span> is being verified.
              </p>
              <p className="text-gray-400 text-sm break-words">
                Your balance will be updated once the payment is approved by our admin team.
              </p>
            </div>

            {/* Transaction Details */}
            <div className="bg-gray-800/50 rounded-lg p-4 space-y-2 w-full">
              <div className="flex justify-between text-sm min-w-0">
                <span className="text-gray-400 flex-shrink-0">Amount:</span>
                <span className="text-white truncate ml-2">${amount}</span>
              </div>
              <div className="flex justify-between text-sm min-w-0">
                <span className="text-gray-400 flex-shrink-0">Method:</span>
                <span className="text-white capitalize truncate ml-2">{paymentMethod}</span>
              </div>
              <div className="flex justify-between text-sm min-w-0">
                <span className="text-gray-400 flex-shrink-0">Order ID:</span>
                <span className="text-white font-mono text-xs break-all ml-2">{orderId}</span>
              </div>
              <div className="flex justify-between text-sm min-w-0">
                <span className="text-gray-400 flex-shrink-0">Status:</span>
                <Badge className="bg-yellow-500 text-white ml-2">Pending</Badge>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 w-full">
              <Button
                onClick={refreshBalance}
                className="w-full bg-green-500 hover:bg-green-600"
              >
                <i className="fas fa-sync-alt mr-2"></i>
                Refresh Balance
              </Button>
              <Button
                onClick={handleReset}
                className="w-full bg-accent-blue hover:bg-accent-blue-dark"
              >
                <i className="fas fa-plus mr-2"></i>
                Add More Funds
              </Button>
              <Button
                onClick={() => setShowHistory(true)}
                variant="outline"
                className="w-full border-gray-700 text-gray-400 hover:bg-gray-700"
              >
                <i className="fas fa-history mr-2"></i>
                View Transaction History
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History Modal */}
        {showHistory && (
          <Dialog open={showHistory} onOpenChange={setShowHistory}>
            <DialogContent className="bg-dark-card/90 backdrop-blur-md border-gray-700 max-w-md max-h-[80vh] overflow-y-auto w-[95vw] mx-auto">
              <DialogHeader>
                <DialogTitle className="text-white">Transaction History</DialogTitle>
              </DialogHeader>
              <History />
            </DialogContent>
          </Dialog>
        )}
      </div>
    );
  }

  return null;
}
