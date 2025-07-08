import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { Transaction } from '@shared/schema';

interface ProductMessage {
  id: number;
  productId: number;
  productName: string;
  message: string;
  credentials?: {
    username?: string;
    password?: string;
    license?: string;
    instructions?: string;
  };
  createdAt: string;
  status: 'pending' | 'delivered' | 'expired';
}

export function MyProducts() {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<string>('purchase');

  // Purchased products query
  const { data: productMessages, isLoading: productsLoading } = useQuery<ProductMessage[]>({
    queryKey: ['/api/user/products'],
    enabled: !!user,
  });

  // Transactions query
  const { data: transactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions', selectedType],
    queryFn: async () => {
      const params = `?type=${selectedType}`;
      const response = await fetch(`/api/transactions${params}`);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
    enabled: !!user,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'fas fa-plus';
      case 'withdrawal':
        return 'fas fa-minus';
      case 'purchase':
        return 'fas fa-shopping-bag';
      case 'refund':
        return 'fas fa-undo';
      default:
        return 'fas fa-exchange-alt';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'refund':
        return 'text-green-500 bg-green-500/20';
      case 'withdrawal':
      case 'purchase':
        return 'text-red-500 bg-red-500/20';
      default:
        return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-500';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-500';
      case 'failed':
        return 'bg-red-500/20 text-red-500';
      default:
        return 'bg-gray-500/20 text-gray-500';
    }
  };

  const renderProducts = () => {
    if (productsLoading) {
      return (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-dark-card/50 border-gray-700">
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (!productMessages || productMessages.length === 0) {
      return (
        <div className="text-center py-12">
          <i className="fas fa-box-open text-gray-500 text-4xl mb-4"></i>
          <p className="text-gray-400 text-lg">No products yet</p>
          <p className="text-gray-500 text-sm">Your purchased products will appear here</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {productMessages.map((product) => (
          <Card key={product.id} className="bg-dark-card/50 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center justify-between">
                <span className="text-sm">{product.productName}</span>
                <Badge 
                  className={
                    product.status === 'delivered' ? 'bg-green-500' :
                    product.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                  }
                >
                  {product.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-gray-300 text-sm">{product.message}</p>
              </div>
              
              {product.credentials && (
                <div className="bg-gray-800/50 rounded-lg p-3 space-y-2">
                  <h4 className="text-white font-medium text-sm">Credentials:</h4>
                  {product.credentials.username && (
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-xs">Username:</span>
                      <span className="text-white font-mono text-xs">{product.credentials.username}</span>
                    </div>
                  )}
                  {product.credentials.password && (
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-xs">Password:</span>
                      <span className="text-white font-mono text-xs">{product.credentials.password}</span>
                    </div>
                  )}
                  {product.credentials.license && (
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-xs">License:</span>
                      <span className="text-white font-mono text-xs">{product.credentials.license}</span>
                    </div>
                  )}
                  {product.credentials.instructions && (
                    <div className="mt-2">
                      <span className="text-gray-400 text-xs">Instructions:</span>
                      <p className="text-white text-xs mt-1">{product.credentials.instructions}</p>
                    </div>
                  )}
                </div>
              )}
              
              <div className="text-xs text-gray-500">
                Received: {new Date(product.createdAt).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderTransactions = () => {
    if (transactionsLoading) {
      return (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-dark-card/50 backdrop-blur-sm border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-700 rounded-full animate-pulse"></div>
                    <div>
                      <div className="h-4 bg-gray-700 rounded w-32 mb-1 animate-pulse"></div>
                      <div className="h-3 bg-gray-700 rounded w-24 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="h-4 bg-gray-700 rounded w-20 mb-1 animate-pulse"></div>
                    <div className="h-3 bg-gray-700 rounded w-16 animate-pulse"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (!transactions || transactions.length === 0) {
      return (
        <div className="text-center py-12">
          <i className="fas fa-receipt text-gray-500 text-4xl mb-4"></i>
          <p className="text-gray-400 text-lg">No transactions found</p>
          <p className="text-gray-500 text-sm">Your purchase history will appear here</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {transactions.map((transaction) => (
          <Card key={transaction._id} className="bg-dark-card/50 backdrop-blur-sm border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getTransactionColor(transaction.type)}`}>
                    <i className={getTransactionIcon(transaction.type)}></i>
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{transaction.description}</p>
                    <p className="text-gray-400 text-xs">{formatDate(transaction.createdAt?.toString() || '')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${
                    transaction.amount > 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                  </p>
                  <Badge className={cn('text-xs', getStatusColor(transaction.status))}>
                    {transaction.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <Tabs defaultValue="products" className="w-full">
      <TabsList className="grid w-full grid-cols-2 bg-dark-card/50 backdrop-blur-sm border-gray-700 mb-4">
        <TabsTrigger value="products">Products</TabsTrigger>
        <TabsTrigger value="transactions">Purchases</TabsTrigger>
      </TabsList>
      <TabsContent value="products" className="space-y-4">
        {renderProducts()}
      </TabsContent>
      <TabsContent value="transactions" className="space-y-4">
        {renderTransactions()}
      </TabsContent>
    </Tabs>
  );
}