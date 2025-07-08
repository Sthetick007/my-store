import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions', selectedFilter === 'all' ? undefined : selectedFilter],
    queryFn: async () => {
      const params = selectedFilter === 'all' ? '' : `?type=${selectedFilter}`;
      const response = await fetch(`/api/transactions${params}`);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
  });

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'purchase', label: 'Purchases' },
    { id: 'deposit', label: 'Deposits' },
    { id: 'withdrawal', label: 'Withdrawals' },
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

  return (
    <div className="pb-4">
      {/* Filter Controls */}
      <div className="p-4">
        <div className="flex space-x-3 mb-4 overflow-x-auto">
          {filters.map((filter) => (
            <Button
              key={filter.id}
              variant={selectedFilter === filter.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilter(filter.id)}
              className={cn(
                'whitespace-nowrap',
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

      {/* Transaction History */}
      <div className="px-4">
        <h3 className="text-lg font-bold text-white mb-4">Transaction History</h3>
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
              <Card key={transaction.id} className="bg-dark-card/50 backdrop-blur-sm border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getTransactionColor(transaction.type)}`}>
                        <i className={getTransactionIcon(transaction.type)}></i>
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{transaction.description}</p>
                        <p className="text-gray-400 text-xs">{formatDate(transaction.createdAt!)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        parseFloat(transaction.amount) > 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {parseFloat(transaction.amount) > 0 ? '+' : ''}${Math.abs(parseFloat(transaction.amount)).toFixed(2)}
                      </p>
                      <Badge className={cn('text-xs', getStatusColor(transaction.status))}>
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                  {transaction.metadata && (
                    <p className="text-gray-400 text-xs ml-13">
                      {JSON.stringify(transaction.metadata)}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
