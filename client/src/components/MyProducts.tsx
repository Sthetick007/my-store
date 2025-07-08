import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

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

  const { data: productMessages, isLoading } = useQuery<ProductMessage[]>({
    queryKey: ['/api/user/products'],
    enabled: !!user,
  });

  if (isLoading) {
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
}