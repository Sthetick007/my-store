import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useTelegram } from '@/hooks/useTelegram';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { CartItem } from '@/types';

interface ShoppingCartProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShoppingCart({ isOpen, onClose }: ShoppingCartProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { hapticFeedback, showMainButton, hideMainButton } = useTelegram();
  const queryClient = useQueryClient();

  // Fetch cart items when cart dialog opens (return array directly)
  const { data: cartItems = [], isLoading } = useQuery<CartItem[]>({
    queryKey: ['/api/cart'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/cart', undefined, {
        Authorization: `Bearer ${localStorage.getItem('telegram_token')}`,
      });
      return (res.cartItems as CartItem[]) || [];
    },
    enabled: isOpen,
    staleTime: 0,           // always refetch when opening
    refetchOnMount: true,   // ensure data fetch on mount
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      if (quantity <= 0) {
        return await apiRequest('DELETE', `/api/cart/${id}`, undefined, {
          'Authorization': `Bearer ${localStorage.getItem('telegram_token')}`
        });
      } else {
        return await apiRequest('PUT', `/api/cart/${id}`, { quantity }, {
          'Authorization': `Bearer ${localStorage.getItem('telegram_token')}`
        });
      }
    },
    onMutate: async ({ id }) => {
      // Add item to updating set
      setUpdatingItems(prev => new Set(prev).add(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
    onError: (error, variables) => {
      toast({
        title: 'Update Failed',
        description: 'Failed to update item quantity.',
        variant: 'destructive',
      });
    },
    onSettled: (data, error, variables) => {
      // Remove item from updating set
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(variables.id);
        return newSet;
      });
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (!cartItems || cartItems.length === 0) return;
      
      const total = cartItems.reduce((sum, item) => sum + (parseFloat(item.product.price) * item.quantity), 0);
      
      await apiRequest('POST', '/api/transactions', {
        type: 'purchase',
        amount: -total,
        description: `Purchase - ${cartItems.length} items`,
        status: 'completed',
        metadata: {
          items: cartItems.map(item => ({
            productId: item.productId,
            name: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
          }))
        }
      });

      // Clear cart after successful purchase
      await apiRequest('DELETE', '/api/cart');
    },
    onSuccess: () => {
      hapticFeedback('success');
      toast({
        title: 'Purchase Successful',
        description: 'Your order has been placed successfully!',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      onClose();
    },
    onError: (error) => {
      hapticFeedback('error');
      toast({
        title: 'Purchase Failed',
        description: 'There was an error processing your purchase.',
        variant: 'destructive',
      });
    },
  });

  // Debug: log cart items
  useEffect(() => {
    console.log('🛒 ShoppingCart items:', cartItems);
  }, [cartItems]);

  // Totals for display
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + parseFloat(item.product.price) * item.quantity, 0);

  const handleQuantityChange = (id: string, change: number) => {
    const item = cartItems?.find(item => item._id === id);
    if (item) {
      const newQuantity = item.quantity + change;
      updateQuantityMutation.mutate({ id, quantity: newQuantity });
    }
  };

  const handleCheckout = async () => {
    if (!cartItems || cartItems.length === 0) return;
    
    setIsProcessing(true);
    try {
      await checkoutMutation.mutateAsync();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-dark-card/90 backdrop-blur-md border-gray-700 max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center space-x-2">
              <i className="fas fa-shopping-cart"></i>
              <span>Shopping Cart</span>
              {totalItems > 0 && (
                <Badge className="bg-blue-600 text-white">{totalItems}</Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <Card key={i} className="bg-dark-card/50 border-gray-700">
                    <CardContent className="p-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-700 rounded-lg animate-pulse"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-700 rounded w-32 mb-1 animate-pulse"></div>
                          <div className="h-3 bg-gray-700 rounded w-20 animate-pulse"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : cartItems?.length === 0 ? (
              <div className="text-center py-12">
                <i className="fas fa-shopping-cart text-gray-500 text-4xl mb-4"></i>
                <p className="text-gray-400 text-lg">Your cart is empty</p>
                <p className="text-gray-500 text-sm">Add some products to get started</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {cartItems?.map((item) => (
                    <Card key={item._id} className="bg-dark-card/50 border-gray-700">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                              {item.product.image_url ? (
                                <img
                                  src={item.product.image_url}
                                  alt={item.product.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                    if (fallback) fallback.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div 
                                className="w-full h-full flex items-center justify-center" 
                                style={{ display: item.product.image_url ? 'none' : 'flex' }}
                              >
                                <i className="fas fa-box text-gray-400 text-2xl"></i>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium text-sm truncate">{item.product.name}</p>
                              <p className="text-gray-400 text-xs">${item.product.price} each</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleQuantityChange(item._id, -1)}
                                disabled={updatingItems.has(item._id)}
                                className="w-8 h-8 p-0 border-gray-600 text-gray-300 hover:border-blue-600 hover:text-blue-400"
                              >
                                {updatingItems.has(item._id) ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-300"></div>
                                ) : (
                                  <i className="fas fa-minus text-xs"></i>
                                )}
                              </Button>
                              <span className="text-white font-medium px-2 min-w-[2rem] text-center">
                                {item.quantity}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleQuantityChange(item._id, 1)}
                                disabled={updatingItems.has(item._id)}
                                className="w-8 h-8 p-0 border-gray-600 text-gray-300 hover:border-blue-600 hover:text-blue-400"
                              >
                                {updatingItems.has(item._id) ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-300"></div>
                                ) : (
                                  <i className="fas fa-plus text-xs"></i>
                                )}
                              </Button>
                            </div>
                            <p className="text-blue-600 font-bold text-sm min-w-[4rem] text-right">
                              ${(parseFloat(item.product.price) * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Separator className="bg-gray-700" />

                <div className="flex items-center justify-between text-lg font-bold">
                  <span className="text-white">Total:</span>
                  <span className="text-blue-600">${totalPrice.toFixed(2)}</span>
                </div>

                <Button
                  onClick={handleCheckout}
                  disabled={isProcessing || checkoutMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isProcessing || checkoutMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-credit-card mr-2"></i>
                      Checkout (${totalPrice.toFixed(2)})
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>


    </>
  );
}
