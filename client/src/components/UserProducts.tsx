import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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

  const { data: transactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
  });

  const { data: productMessages, isLoading: messagesLoading } = useQuery<ProductMessage[]>({
    queryKey: ['/api/user/products'],
    enabled: !!user,
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

      {/* Active Subscriptions */}
      <Card className="bg-dark-card/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <i className="fas fa-box mr-2 text-accent-blue"></i>
            Active Subscriptions
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
              <p className="text-gray-400 text-lg">No active subscriptions</p>
              <p className="text-gray-500 text-sm">Purchase a subscription to get started</p>
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
                      <div className="bg-gray-800/50 rounded-lg p-3 space-y-2">
                        <h4 className="text-white font-medium text-sm">Access Details:</h4>
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
                            <span className="text-gray-400 text-xs">License Key:</span>
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