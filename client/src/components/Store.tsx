import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useTelegram } from '@/hooks/useTelegram';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Product } from '@shared/schema';

export function Store() {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const { hapticFeedback } = useTelegram();
  const queryClient = useQueryClient();

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/products', searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`/api/products?${params}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
  });

  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      return await apiRequest('POST', '/api/cart', { productId, quantity }, {
        'Authorization': `Bearer ${localStorage.getItem('telegram_token')}`
      });
    },
    onSuccess: () => {
      hapticFeedback('success');
      toast({
        title: 'Added to cart',
        description: 'Product has been added to your cart.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
    onError: (error) => {
      hapticFeedback('error');
      toast({
        title: 'Error',
        description: 'Failed to add product to cart.',
        variant: 'destructive',
      });
    },
  });

  const handleAddToCart = (productId: string) => {
    hapticFeedback('light');
    addToCartMutation.mutate({ productId, quantity: 1 });
  };

  const ProductCard = ({ product }: { product: Product }) => (
    <Card className="bg-dark-card/50 backdrop-blur-sm border-gray-700 overflow-hidden hover:border-accent-blue transition-all duration-300 group">
      <div className="aspect-square bg-gray-800 relative overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <i className="fas fa-box text-gray-500 text-3xl"></i>
          </div>
        )}
      </div>
      <CardContent className="p-3">
        <h3 className="font-semibold text-white text-sm mb-1 truncate">{product.name}</h3>
        <p className="text-xs text-gray-400 mb-2 line-clamp-2">{product.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-accent-blue font-bold text-sm">${product.price}</span>
          <Button
            size="sm"
            onClick={() => handleAddToCart(product._id!)}
            disabled={addToCartMutation.isPending}
            className="w-8 h-8 bg-accent-blue hover:bg-accent-blue-dark rounded-full p-0"
          >
            {addToCartMutation.isPending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <i className="fas fa-plus text-white text-xs"></i>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="pb-4">
      {/* Search Bar */}
      <div className="p-4">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-dark-card/50 backdrop-blur-sm border-gray-700 rounded-xl pl-12 text-white placeholder-gray-400 focus:ring-2 focus:ring-accent-blue"
          />
          <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
        </div>
      </div>

      {/* All Products */}
      <div className="px-4">
        <h2 className="text-xl font-bold text-white mb-4">Products</h2>
        {productsLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-dark-card/50 backdrop-blur-sm border-gray-700">
                <Skeleton className="aspect-square w-full" />
                <CardContent className="p-3">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-3 w-3/4 mb-2" />
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : products?.length === 0 ? (
          <div className="text-center py-12">
            <i className="fas fa-box text-gray-500 text-4xl mb-4"></i>
            <p className="text-gray-400 text-lg">No products available</p>
            <p className="text-gray-500 text-sm">Products will appear here when added by admin</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {products?.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
