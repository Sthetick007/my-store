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
      <div className="p-4 space-y-6">
        <Card className="bg-dark-card/50 backdrop-blur-sm border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <i className="fas fa-wallet mr-3 text-accent-blue"></i>
              Add Funds to Wallet
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
                className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 text-lg h-12"
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
                    className="bg-gray-800/50 border-gray-700 text-white hover:bg-gray-700 hover:border-accent-blue"
                  >
                    ${amt}
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

        {/* Full History Modal */}
        {showHistory && (
          <Dialog open={showHistory} onOpenChange={setShowHistory}>
            <DialogContent className="bg-dark-card/90 backdrop-blur-md border-gray-700 max-w-md max-h-[80vh] overflow-y-auto">
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
      <div className="p-4 space-y-6">
        <Card className="bg-dark-card/50 backdrop-blur-sm border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span>Select Payment Method</span>
              <Badge className="bg-accent-blue text-white">${amount}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* UPI Option */}
            <Card 
              className="bg-gray-800/50 border-gray-700 cursor-pointer hover:border-accent-blue transition-all"
              onClick={() => handleMethodSelect('upi')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                      <i className="fas fa-mobile-alt text-orange-400 text-xl"></i>
                    </div>
                    <div>
                      <p className="text-white font-medium">UPI Payment</p>
                      <p className="text-gray-400 text-sm">Pay with any UPI app</p>
                    </div>
                  </div>
                  <Badge className="bg-green-500 text-white">Instant</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Crypto Option */}
            <Card 
              className="bg-gray-800/50 border-gray-700 cursor-pointer hover:border-accent-blue transition-all"
              onClick={() => handleMethodSelect('crypto')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                      <i className="fab fa-bitcoin text-yellow-400 text-xl"></i>
                    </div>
                    <div>
                      <p className="text-white font-medium">Cryptocurrency</p>
                      <p className="text-gray-400 text-sm">Pay with Bitcoin/USDT</p>
                    </div>
                  </div>
                  <Badge className="bg-blue-500 text-white">Secure</Badge>
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
      <div className="p-4 space-y-6">
        <Card className="bg-dark-card/50 backdrop-blur-sm border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span>Scan QR to Pay</span>
              <Badge className="bg-accent-blue text-white">${amount}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            {/* QR Code */}
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-lg">
                <img
                  src={getQRCode()}
                  alt="Payment QR Code"
                  className="w-64 h-64"
                />
              </div>
            </div>

            {/* Payment Instructions */}
            <div className="space-y-2">
              <h3 className="text-white font-medium">
                {paymentMethod === 'upi' ? 'UPI Payment Instructions' : 'Crypto Payment Instructions'}
              </h3>
              <div className="text-gray-400 text-sm space-y-1">
                {paymentMethod === 'upi' ? (
                  <>
                    <p>1. Open any UPI app (PhonePe, GPay, Paytm)</p>
                    <p>2. Scan the QR code above</p>
                    <p>3. Enter amount: <span className="text-accent-blue font-bold">${amount}</span></p>
                    <p>4. Complete the payment</p>
                    <p>5. Copy the transaction ID and enter below</p>
                  </>
                ) : (
                  <>
                    <p>1. Open your crypto wallet app</p>
                    <p>2. Scan the QR code above</p>
                    <p>3. Send exact amount: <span className="text-accent-blue font-bold">${amount}</span></p>
                    <p>4. Wait for confirmation</p>
                    <p>5. Copy the transaction hash and enter below</p>
                  </>
                )}
              </div>
            </div>

            {/* Order ID Input */}
            <div className="space-y-2">
              <Label htmlFor="orderId" className="text-gray-400">
                {paymentMethod === 'upi' ? 'Transaction/Order ID' : 'Transaction Hash'}
              </Label>
              <Input
                id="orderId"
                placeholder={paymentMethod === 'upi' ? 'Enter transaction ID' : 'Enter transaction hash'}
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400"
              />
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={() => setCurrentStep('method')}
                variant="outline"
                className="flex-1 border-gray-700 text-gray-400 hover:bg-gray-700"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Back
              </Button>
              <Button
                onClick={handleVerifyPayment}
                disabled={!orderId.trim() || createTransactionMutation.isPending}
                className="flex-1 bg-accent-blue hover:bg-accent-blue-dark"
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
      <div className="p-4 space-y-6">
        <Card className="bg-dark-card/50 backdrop-blur-sm border-gray-700">
          <CardContent className="p-8 text-center space-y-6">
            {/* Success Icon */}
            <div className="mx-auto w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
              <i className="fas fa-clock text-green-400 text-3xl"></i>
            </div>

            {/* Status Message */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Payment Under Verification</h2>
              <p className="text-gray-400">
                Your payment of <span className="text-accent-blue font-bold">${amount}</span> is being verified.
              </p>
              <p className="text-gray-400 text-sm">
                Your balance will be updated once the payment is approved by our admin team.
              </p>
            </div>

            {/* Transaction Details */}
            <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Amount:</span>
                <span className="text-white">${amount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Method:</span>
                <span className="text-white capitalize">{paymentMethod}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Order ID:</span>
                <span className="text-white font-mono text-xs">{orderId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Status:</span>
                <Badge className="bg-yellow-500 text-white">Pending</Badge>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
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
            <DialogContent className="bg-dark-card/90 backdrop-blur-md border-gray-700 max-w-md max-h-[80vh] overflow-y-auto">
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
