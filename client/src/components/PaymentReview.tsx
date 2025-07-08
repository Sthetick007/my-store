import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PaymentReviewProps {
  amount: string;
  paymentMethod: string;
  onClose: () => void;
}

export function PaymentReview({ amount, paymentMethod, onClose }: PaymentReviewProps) {
  return (
    <div className="p-4 space-y-6">
      <Card className="bg-dark-card/50 backdrop-blur-sm border-gray-700">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-clock text-yellow-400 text-2xl"></i>
          </div>
          <CardTitle className="text-white">Payment Under Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="space-y-2">
            <p className="text-gray-300">Your payment is being processed</p>
            <div className="flex items-center justify-center space-x-2">
              <Badge className="bg-accent-blue text-white">
                {paymentMethod}
              </Badge>
              <span className="text-white font-semibold">${amount}</span>
            </div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
            <h4 className="text-white font-medium">What happens next?</h4>
            <ul className="text-sm text-gray-300 space-y-1 text-left">
              <li className="flex items-start">
                <i className="fas fa-check-circle text-green-400 mr-2 mt-0.5"></i>
                Payment verification in progress
              </li>
              <li className="flex items-start">
                <i className="fas fa-clock text-yellow-400 mr-2 mt-0.5"></i>
                You will receive your product soon
              </li>
              <li className="flex items-start">
                <i className="fas fa-bell text-blue-400 mr-2 mt-0.5"></i>
                Check "My Products" for updates
              </li>
            </ul>
          </div>
          
          <div className="text-xs text-gray-500">
            <p>Processing time: 5-15 minutes</p>
            <p>You will be notified once approved</p>
          </div>
          
          <Button
            onClick={onClose}
            className="w-full bg-accent-blue hover:bg-accent-blue-dark"
          >
            Got it
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}