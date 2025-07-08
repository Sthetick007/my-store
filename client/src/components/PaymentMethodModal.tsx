import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QRCodeModal } from './QRCodeModal';

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: string;
  userId: string;
  onPaymentMethod?: (method: string) => void;
}

export function PaymentMethodModal({ isOpen, onClose, amount, userId, onPaymentMethod }: PaymentMethodModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  const handleMethodSelect = (method: string) => {
    setSelectedMethod(method);
    if (onPaymentMethod) {
      onPaymentMethod(method);
    } else {
      setShowQR(true);
    }
  };

  const handleQRClose = () => {
    setShowQR(false);
    setSelectedMethod(null);
    onClose();
  };

  if (showQR && selectedMethod) {
    return (
      <QRCodeModal
        isOpen={showQR}
        onClose={handleQRClose}
        amount={amount}
        userId={userId}
        paymentMethod={selectedMethod}
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-dark-card/90 backdrop-blur-md border-gray-700 max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white text-center">
            Select Payment Method
          </DialogTitle>
          <p className="text-gray-400 text-sm text-center">
            Choose your preferred payment option
          </p>
        </DialogHeader>
        
        <div className="flex flex-col space-y-4">
          <Button
            onClick={() => handleMethodSelect('UPI')}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 flex items-center justify-center space-x-3"
          >
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <i className="fas fa-mobile-alt text-white"></i>
            </div>
            <span className="text-lg font-medium">UPI Payment</span>
          </Button>
          
          <Button
            onClick={() => handleMethodSelect('QR')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 flex items-center justify-center space-x-3"
          >
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <i className="fas fa-qrcode text-white"></i>
            </div>
            <span className="text-lg font-medium">QR Code</span>
          </Button>
          
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}