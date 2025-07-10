import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
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

export function UserProducts() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: transactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
  });

  const { data: productMessages, isLoading: messagesLoading } = useQuery<ProductMessage[]>({
    queryKey: ['/api/user/products', user?.id],
    queryFn: async () => {
      try {
        // If we have a user, first try the direct endpoint with user ID
        if (user && user.id) {
          console.log('Fetching products for user ID:', user.id);
          
          // Try the direct endpoint first
          const directResponse = await fetch(`/api/user/products/by-id/${user.id}`);
          
          if (directResponse.ok) {
            const data = await directResponse.json();
            console.log('Fetched user products directly:', data);
            return data;
          }
          
          console.log('Direct fetch failed, trying authenticated endpoint');
          
          // Fall back to authenticated endpoint
          const response = await fetch('/api/user/products', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('telegram_token')}`
            }
          });
          
          if (!response.ok) {
            throw new Error('Failed to fetch products');
          }
          
          const data = await response.json();
          console.log('Fetched user products via auth:', data);
          return data;
        }
        return [];
      } catch (error) {
        console.error('Error fetching user products:', error);
        return [];
      }
    },
    enabled: !!user?.id,
  });

  // Use real product messages data

  const recentTransactions = transactions?.slice(0, 3) || [];

  return (
    <div className="p-4 pb-24 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-white">My Products</h1>
          <p className="text-gray-400">Manage your subscriptions and purchases</p>
        </div>
      </div>

      {/* Purchased Items */}
      <Card className="bg-dark-card/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <i className="fas fa-box mr-2 text-accent-blue"></i>
            Purchased Items
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {messagesLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : !productMessages || productMessages.length === 0 ? (
            <div className="text-center py-8">
              <i className="fas fa-shopping-bag text-gray-500 text-4xl mb-4"></i>
              <p className="text-gray-400 text-lg">No purchased items</p>
              <p className="text-gray-500 text-sm">Products sent to you by admin will appear here</p>
            </div>
          ) : (
            productMessages.map((product) => (
              <Card key={product.id} className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-semibold">{product.productName}</h3>
                      <Badge className={
                        product.status === 'delivered' ? 'bg-green-500 text-white' :
                        product.status === 'pending' ? 'bg-yellow-500 text-black' : 'bg-red-500 text-white'
                      }>
                        {product.status}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-gray-400">
                      <i className="fas fa-calendar mr-1"></i>
                      Purchased: {new Date(product.createdAt).toLocaleDateString()}
                    </div>

                    {product.message && (
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <p className="text-gray-300 text-sm">{product.message}</p>
                      </div>
                    )}
                    
                    {product.credentials && (
                      <div className="bg-gradient-to-r from-gray-800/70 to-gray-800/40 rounded-lg p-3 space-y-2 border border-gray-700/50 shadow-md">
                        <h4 className="text-white font-medium text-sm flex items-center">
                          <i className="fas fa-key mr-1 text-accent-blue"></i> Access Details:
                        </h4>
                        {product.credentials.username && (
                          <div className="flex justify-between items-center bg-gray-900/50 rounded p-2">
                            <span className="text-gray-400 text-xs">Username:</span>
                            <div className="flex items-center bg-gray-800 px-2 py-1 rounded">
                              <span className="text-white font-mono text-xs">{product.credentials.username}</span>
                              <button 
                                className="ml-2 text-xs text-gray-400 hover:text-white"
                                onClick={() => {
                                  navigator.clipboard.writeText(product.credentials?.username || '');
                                  toast({
                                    title: "Copied!",
                                    description: "Username copied to clipboard"
                                  })
                                }}
                                title="Copy to clipboard"
                              >
                                <i className="fas fa-copy"></i>
                              </button>
                            </div>
                          </div>
                        )}
                        {product.credentials.password && (
                          <div className="flex justify-between items-center bg-gray-900/50 rounded p-2">
                            <span className="text-gray-400 text-xs">Password:</span>
                            <div className="flex items-center bg-gray-800 px-2 py-1 rounded">
                              <span className="text-white font-mono text-xs">{product.credentials.password}</span>
                              <button 
                                className="ml-2 text-xs text-gray-400 hover:text-white"
                                onClick={() => {
                                  navigator.clipboard.writeText(product.credentials?.password || '');
                                  toast({
                                    title: "Copied!",
                                    description: "Password copied to clipboard"
                                  })
                                }}
                                title="Copy to clipboard"
                              >
                                <i className="fas fa-copy"></i>
                              </button>
                            </div>
                          </div>
                        )}
                        {product.credentials.license && (
                          <div className="flex justify-between items-center bg-gray-900/50 rounded p-2">
                            <span className="text-gray-400 text-xs">License Key:</span>
                            <div className="flex items-center bg-gray-800 px-2 py-1 rounded">
                              <span className="text-white font-mono text-xs">{product.credentials.license}</span>
                              <button 
                                className="ml-2 text-xs text-gray-400 hover:text-white"
                                onClick={() => {
                                  navigator.clipboard.writeText(product.credentials?.license || '');
                                  toast({
                                    title: "Copied!",
                                    description: "License key copied to clipboard"
                                  })
                                }}
                                title="Copy to clipboard"
                              >
                                <i className="fas fa-copy"></i>
                              </button>
                            </div>
                          </div>
                        )}
                        {product.credentials.instructions && (
                          <div className="mt-3 bg-gray-900/50 p-2 rounded">
                            <div className="flex items-center mb-1">
                              <i className="fas fa-info-circle text-accent-blue mr-1"></i>
                              <span className="text-gray-400 text-xs font-medium">Instructions:</span>
                            </div>
                            <p className="text-white text-xs mt-1 whitespace-pre-wrap">{product.credentials.instructions}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="bg-dark-card/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <i className="fas fa-history mr-2 text-accent-blue"></i>
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : recentTransactions.length === 0 ? (
            <div className="text-center py-6">
              <i className="fas fa-receipt text-gray-500 text-3xl mb-3"></i>
              <p className="text-gray-400">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div key={transaction._id} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.type === 'deposit' ? 'bg-green-500/20' :
                      transaction.type === 'purchase' ? 'bg-blue-500/20' : 'bg-gray-500/20'
                    }`}>
                      <i className={`fas ${
                        transaction.type === 'deposit' ? 'fa-plus' :
                        transaction.type === 'purchase' ? 'fa-shopping-cart' : 'fa-exchange-alt'
                      } text-sm ${
                        transaction.type === 'deposit' ? 'text-green-400' :
                        transaction.type === 'purchase' ? 'text-blue-400' : 'text-gray-400'
                      }`}></i>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium capitalize">{transaction.type}</p>
                      <p className="text-gray-400 text-xs">{transaction.createdAt ? new Date(transaction.createdAt.toString()).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${
                      transaction.type === 'deposit' ? 'text-green-400' : 'text-white'
                    }`}>
                      {transaction.type === 'deposit' ? '+' : '-'}${transaction.amount}
                    </p>
                    <Badge className={`text-xs ${
                      transaction.status === 'pending' ? 'bg-yellow-500 text-black' :
                      transaction.status === 'completed' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}