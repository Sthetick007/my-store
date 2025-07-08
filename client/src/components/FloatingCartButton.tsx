import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { CartItem } from '@/types';

interface FloatingCartButtonProps {
  onClick: () => void;
}

export function FloatingCartButton({ onClick }: FloatingCartButtonProps) {
  const { data: cartItems } = useQuery<CartItem[]>({
    queryKey: ['/api/cart'],
  });

  const totalItems = cartItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-24 right-4 z-40">
      <Button
        onClick={onClick}
        className="w-14 h-14 bg-accent-blue hover:bg-accent-blue-dark shadow-lg rounded-full p-0 transition-all duration-300 hover:scale-110"
      >
        <i className="fas fa-shopping-cart text-white text-xl"></i>
        <Badge className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-dark-bg">
          {totalItems}
        </Badge>
      </Button>
    </div>
  );
}