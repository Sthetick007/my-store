import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useTelegram } from '@/hooks/useTelegram';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Product } from '@shared/schema';

export function Store() {
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingProducts, setLoadingProducts] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { hapticFeedback } = useTelegram();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  // Fetch products
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/products', searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`/api/products?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('📦 Products fetched:', data);
      return data;
    },
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      const token = localStorage.getItem('telegram_token');
      
      console.log('🛒 Starting add to cart process');
      console.log('🔐 Token exists:', !!token);
      console.log('� Token value:', token ? `${token.substring(0, 20)}...` : 'null');
      console.log('�📦 Product ID:', productId);
      console.log('🔢 Quantity:', quantity);
      
      if (!token) {
        console.error('❌ No authentication token found in localStorage');
        throw new Error('Please log in to add items to cart');
      }

      if (!productId) {
        throw new Error('Product ID is required');
      }

      console.log('📡 Making API request to /api/cart');
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          productId: productId.toString(), 
          quantity: Number(quantity) 
        })
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Network error' }));
        console.error('❌ API Error:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Add to cart success:', data);
      return { ...data, productId };
    },
    onMutate: async ({ productId }) => {
      // Add product to loading set
      setLoadingProducts(prev => new Set(prev).add(productId));
    },
    onSuccess: (data) => {
      console.log('🎉 Mutation success callback:', data);
      hapticFeedback('success');
      toast({
        title: 'Added to cart',
        description: 'Product has been added to your cart.',
      });
      // Invalidate cart queries to refresh cart data
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
    onError: (error: any, variables) => {
      console.error('💥 Mutation error callback:', error);
      hapticFeedback('error');
      toast({
        title: 'Error',
        description: error?.message || 'Failed to add product to cart.',
        variant: 'destructive',
      });
    },
    onSettled: (data, error, variables) => {
      // Remove product from loading set
      setLoadingProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(variables.productId);
        return newSet;
      });
    },
  });

  const handleAddToCart = (productId: string) => {
    console.log('🎯 handleAddToCart called with productId:', productId);
    
    if (!productId) {
      console.error('❌ No product ID provided');
      toast({
        title: 'Error',
        description: 'Product ID is missing.',
        variant: 'destructive',
      });
      return;
    }
    
    // Remove haptic feedback for now to avoid errors in development
    // hapticFeedback('light');
    addToCartMutation.mutate({ productId, quantity: 1 });
  };

  const ProductCard = ({ product }: { product: Product }) => {
    console.log('🎨 Rendering product card:', product.name, 'ID:', product._id);
    
    const isLoading = loadingProducts.has(product._id!);
    
    return (
      <Card className="bg-dark-card/50 backdrop-blur-sm border-gray-700 overflow-hidden hover:border-blue-600 transition-all duration-300 group">
        <div className="w-full h-48 bg-gray-800 relative overflow-hidden">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                console.error('🖼️ Image failed to load:', product.image_url);
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className="w-full h-full flex items-center justify-center" 
            style={{ display: product.image_url ? 'none' : 'flex' }}
          >
            <i className="fas fa-box text-gray-500 text-4xl"></i>
          </div>
        </div>
        <CardContent className="p-4">
          <div className="mb-3">
            <h3 className="font-semibold text-white text-lg mb-2">{product.name}</h3>
            <p className="text-sm text-gray-400 line-clamp-3 leading-relaxed">{product.description}</p>
          </div>
          <div className="flex items-center justify-between">
            <div className="bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20 shadow-lg">
              <span className="text-white font-bold text-lg drop-shadow-sm">${product.price}</span>
            </div>
            <Button
              size="sm"
              onClick={() => handleAddToCart(product._id!)}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <i className="fas fa-cart-plus text-white mr-2"></i>
              )}
              {isLoading ? 'Adding...' : 'Add to Cart'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="pb-24">
      {/* Search Bar */}
      <div className="p-4 max-w-4xl mx-auto">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-dark-card/50 backdrop-blur-sm border-gray-700 rounded-xl pl-12 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-600"
          />
          <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
        </div>
      </div>

      {/* All Products */}
      <div className="px-4 max-w-4xl mx-auto">
        <h2 className="text-xl font-bold text-white mb-4">Products</h2>
        {productsLoading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-dark-card/50 backdrop-blur-sm border-gray-700">
                <Skeleton className="w-full h-48" />
                <CardContent className="p-4">
                  <Skeleton className="h-5 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-3" />
                  <div className="flex items-center justify-between">
                    <div className="bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20">
                      <Skeleton className="h-5 w-16 bg-gray-600" />
                    </div>
                    <Skeleton className="h-9 w-24" />
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
          <div className="space-y-4">
            {products?.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
