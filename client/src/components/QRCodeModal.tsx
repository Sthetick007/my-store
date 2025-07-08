import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QRCodeData } from '@/types';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: string;
  userId: string;
  paymentMethod?: string;
}

export function QRCodeModal({ isOpen, onClose, amount, userId, paymentMethod = 'QR' }: QRCodeModalProps) {
  const qrData: QRCodeData = {
    amount,
    userId,
    timestamp: Date.now(),
  };

  // Generate different QR codes based on payment method
  let qrCodeUrl: string;
  if (paymentMethod === 'UPI') {
    // UPI payment string format
    const upiString = `upi://pay?pa=merchant@paytm&pn=TeleShop&am=${amount}&cu=INR&tn=Payment%20for%20TeleShop`;
    qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiString)}`;
  } else {
    // Regular QR code with payment data
    qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(JSON.stringify(qrData))}`;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-dark-card/90 backdrop-blur-md border-gray-700 max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white text-center">
            {paymentMethod === 'UPI' ? 'UPI Payment' : 'Payment QR Code'}
          </DialogTitle>
          <p className="text-gray-400 text-sm text-center">
            {paymentMethod === 'UPI' ? 'Scan with any UPI app' : 'Scan to receive payment'}
          </p>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-6">
          <div className="bg-white rounded-xl p-4">
            <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
              <img
                src={qrCodeUrl}
                alt="Payment QR Code"
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback if QR code service fails
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden text-center">
                <div className="w-32 h-32 bg-black mx-auto mb-2 rounded-lg flex items-center justify-center">
                  <i className="fas fa-qrcode text-white text-4xl"></i>
                </div>
                <p className="text-gray-600 text-xs">QR Code</p>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-gray-400 text-sm">Amount:</p>
            <p className="text-2xl font-bold text-white">${amount}</p>
          </div>
          
          <Button
            onClick={onClose}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
