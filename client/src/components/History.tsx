import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Transaction } from '@shared/schema';

interface HistoryProps {
  limit?: number;
}

export function History({ limit }: HistoryProps = {}) {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions', selectedFilter === 'all' ? undefined : selectedFilter],
    queryFn: async () => {
      const params = selectedFilter === 'all' ? '' : `?type=${selectedFilter}`;
      const token = localStorage.getItem('telegram_token');
      console.log('🔍 Fetching user transactions with filter:', selectedFilter);
      console.log('🔐 User token:', token ? `${token.substring(0, 20)}...` : 'missing');
      
      const response = await fetch(`/api/transactions${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        console.error('❌ Failed to fetch transactions:', response.status, response.statusText);
        throw new Error('Failed to fetch transactions');
      }
      
      const data = await response.json();
      console.log('📋 User transactions received:', data);
      return data;
    },
    refetchInterval: 5000, // Refetch every 5 seconds to check for status updates
  });

  // Whenever transactions are fetched, also refresh user auth data to update balance
  useEffect(() => {
    if (transactions) {
      console.log('🔄 Refreshing user auth data to update balance...');
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    }
  }, [transactions, queryClient]);

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'purchase', label: 'Purchases' },
    { id: 'deposit', label: 'Deposits' },
  ];

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
        return 'fas fa-wallet';
      case 'withdrawal':
        return 'fas fa-arrow-up';
      case 'purchase':
        return 'fas fa-shopping-cart';
      case 'refund':
        return 'fas fa-undo-alt';
      default:
        return 'fas fa-exchange-alt';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'refund':
        return 'text-white bg-blue-600/80';
      case 'withdrawal':
      case 'purchase':
        return 'text-white bg-gray-600/80';
      default:
        return 'text-white bg-gray-500/80';
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

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">Transaction History</h3>
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {filters.map((filter) => (
            <Button
              key={filter.id}
              variant={selectedFilter === filter.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilter(filter.id)}
              className={cn(
                'whitespace-nowrap flex-shrink-0',
                selectedFilter === filter.id
                  ? 'bg-accent-blue text-white'
                  : 'bg-dark-card/70 backdrop-blur-sm text-gray-300 border-gray-700 hover:border-accent-blue'
              )}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
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
        ) : transactions?.length === 0 ? (
          <div className="text-center py-12">
            <i className="fas fa-receipt text-gray-500 text-4xl mb-4"></i>
            <p className="text-gray-400 text-lg">No transactions found</p>
            <p className="text-gray-500 text-sm">
              {selectedFilter === 'all' 
                ? 'Your transaction history will appear here' 
                : `No ${selectedFilter} transactions found`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions?.slice(0, limit || transactions.length).map((transaction) => (
              <Card key={transaction.id} className="bg-dark-card/50 backdrop-blur-sm border-gray-700 w-full">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between min-w-0">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getTransactionColor(transaction.type)}`}>
                        <i className={getTransactionIcon(transaction.type)}></i>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-medium text-sm truncate">{transaction.description}</p>
                        <p className="text-gray-400 text-xs truncate">{formatDate(transaction.createdAt!.toString())}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
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
        )}
      </div>
    </div>
  );
}
