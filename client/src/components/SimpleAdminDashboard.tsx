import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function SimpleAdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRevenue: 0,
    pendingTransactions: 0
  });
  
  // Modal states
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEditBalance, setShowEditBalance] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [showSendProduct, setShowSendProduct] = useState(false);
  
  // Form states
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    stock: '0'
  });
  
  const [balanceForm, setBalanceForm] = useState({
    userId: '',
    newBalance: '',
    reason: ''
  });

  const [sendProductForm, setSendProductForm] = useState({
    userId: '',
    productId: '',
    username: '',
    password: '',
    instructions: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch pending transactions
  const { data: pendingTransactions = [] } = useQuery({
    queryKey: ['/api/admin/transactions/pending'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/transactions?status=pending');
      return response.transactions || [];
    }
  });

  // Fetch users
  const { data: users = [] } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/users');
      return response.users || [];
    }
  });

  // Fetch products
  const { data: products = [] } = useQuery({
    queryKey: ['/api/products'],
    queryFn: async () => {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    }
  });

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    window.location.href = '/';
  };

  // Add Product Mutation
  const addProductMutation = useMutation({
    mutationFn: async (productData: typeof productForm) => {
      const token = localStorage.getItem('admin_token');
      return await apiRequest('POST', '/api/admin/products', {
        name: productData.name,
        description: productData.description,
        price: parseFloat(productData.price),
        image_url: productData.imageUrl, // Map imageUrl to image_url
        stock: parseInt(productData.stock)
      }, {
        'Authorization': `Bearer ${token}`
      });
    },
    onSuccess: () => {
      toast({ title: 'Product added successfully!' });
      setShowAddProduct(false);
      setProductForm({
        name: '',
        description: '',
        price: '',
        imageUrl: '',
        stock: '0'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error adding product', 
        description: error.message || 'Failed to add product',
        variant: 'destructive' 
      });
    }
  });

  // Update Balance Mutation
  const updateBalanceMutation = useMutation({
    mutationFn: async (data: typeof balanceForm) => {
      const token = localStorage.getItem('admin_token');
      return await apiRequest('PUT', `/api/admin/users/${data.userId}/balance`, {
        balance: parseFloat(data.newBalance),
        reason: data.reason
      }, {
        'Authorization': `Bearer ${token}`
      });
    },
    onSuccess: () => {
      toast({ title: 'User balance updated successfully!' });
      setShowEditBalance(false);
      setBalanceForm({ userId: '', newBalance: '', reason: '' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error updating balance', 
        description: error.message || 'Failed to update balance',
        variant: 'destructive' 
      });
    }
  });

  // Approve Transaction Mutation
  const approveTransactionMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      const token = localStorage.getItem('admin_token');
      return await apiRequest('POST', `/api/admin/transactions/${transactionId}/approve`, {}, {
        'Authorization': `Bearer ${token}`
      });
    },
    onSuccess: () => {
      toast({ title: 'Transaction approved successfully!' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/transactions/pending'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error approving transaction', 
        description: error.message || 'Failed to approve transaction',
        variant: 'destructive' 
      });
    }
  });

  // Decline Transaction Mutation
  const declineTransactionMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      const token = localStorage.getItem('admin_token');
      return await apiRequest('POST', `/api/admin/transactions/${transactionId}/decline`, {}, {
        'Authorization': `Bearer ${token}`
      });
    },
    onSuccess: () => {
      toast({ title: 'Transaction declined successfully!' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/transactions/pending'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error declining transaction', 
        description: error.message || 'Failed to decline transaction',
        variant: 'destructive' 
      });
    }
  });

  // Send Product Mutation
  const sendProductMutation = useMutation({
    mutationFn: async (data: typeof sendProductForm) => {
      const token = localStorage.getItem('admin_token');
      return await apiRequest('POST', '/api/admin/send-product', {
        userId: data.userId,
        productId: data.productId,
        username: data.username,
        password: data.password,
        instructions: data.instructions
      }, {
        'Authorization': `Bearer ${token}`
      });
    },
    onSuccess: () => {
      toast({ title: 'Product sent successfully!' });
      setShowSendProduct(false);
      setSendProductForm({
        userId: '',
        productId: '',
        username: '',
        password: '',
        instructions: ''
      });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error sending product', 
        description: error.message || 'Failed to send product',
        variant: 'destructive' 
      });
    }
  });

  // Update stats with real data
  useEffect(() => {
    setStats({
      totalUsers: users.length,
      totalRevenue: 0, // Will be calculated from actual transactions
      pendingTransactions: pendingTransactions.length
    });
  }, [users.length, pendingTransactions.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-gray-900 to-dark-bg">
      <div className="p-4 pb-24 space-y-6">
        {/* Header */}
        <div className="bg-dark-card/50 border border-gray-700 rounded-lg p-4">
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-accent-blue/20 rounded-full flex items-center justify-center">
                <i className="fas fa-shield-alt text-accent-blue text-xl"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-gray-400 text-sm">System administration panel</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <Button
                onClick={() => window.location.href = '/'}
                variant="outline"
                size="sm"
                className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
              >
                <i className="fas fa-store mr-2"></i>
                Back to Store
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30"
              >
                <i className="fas fa-sign-out-alt mr-2"></i>
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <Card className="bg-dark-card/50 border-gray-700">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <i className="fas fa-check text-green-500 text-2xl"></i>
              </div>
              <h2 className="text-2xl font-bold text-white">Welcome to Admin Panel!</h2>
              <p className="text-gray-400">
                You have successfully logged into the administrative interface.
              </p>
              <Badge className="bg-green-500 text-white px-4 py-2">
                <i className="fas fa-user-shield mr-2"></i>
                Administrator Access Granted
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-dark-card/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Users</p>
                  <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
                </div>
                <i className="fas fa-users text-blue-400 text-2xl"></i>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-dark-card/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Revenue</p>
                  <p className="text-2xl font-bold text-white">${stats.totalRevenue}</p>
                </div>
                <i className="fas fa-dollar-sign text-green-400 text-2xl"></i>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-dark-card/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Pending</p>
                  <p className="text-2xl font-bold text-white">{stats.pendingTransactions}</p>
                </div>
                <i className="fas fa-clock text-yellow-400 text-2xl"></i>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-dark-card/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Button 
                onClick={() => setShowAddProduct(true)}
                className="bg-blue-500 hover:bg-blue-600 h-16 flex-col space-y-1 text-sm"
              >
                <i className="fas fa-plus"></i>
                <span>Add Product</span>
              </Button>
              
              <Button 
                onClick={() => setShowUsers(true)}
                className="bg-green-500 hover:bg-green-600 h-16 flex-col space-y-1 text-sm"
              >
                <i className="fas fa-users"></i>
                <span>Manage Users</span>
              </Button>
              
              <Button 
                onClick={() => setShowEditBalance(true)}
                className="bg-purple-500 hover:bg-purple-600 h-16 flex-col space-y-1 text-sm"
              >
                <i className="fas fa-wallet"></i>
                <span>Edit Balance</span>
              </Button>

              <Button 
                onClick={() => setShowSendProduct(true)}
                className="bg-orange-500 hover:bg-orange-600 h-16 flex-col space-y-1 text-sm"
              >
                <i className="fas fa-gift"></i>
                <span>Send Product</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pending Payments */}
        <Card className="bg-dark-card/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <i className="fas fa-check-circle text-green-500 text-3xl mb-2"></i>
                  <p className="text-gray-400">No pending payments</p>
                </div>
              ) : (
                pendingTransactions.map((transaction: any) => (
                  <div key={transaction._id || transaction.id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                    <div className="flex-1">
                      <h3 className="text-white font-medium">{transaction.description || transaction.type}</h3>
                      <p className="text-gray-400 text-sm">${transaction.amount}</p>
                      <p className="text-gray-500 text-xs">User: {transaction.userId}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => approveTransactionMutation.mutate(transaction._id || transaction.id)}
                        className="bg-green-500 hover:bg-green-600"
                        disabled={approveTransactionMutation.isPending}
                      >
                        <i className="fas fa-check"></i>
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => declineTransactionMutation.mutate(transaction._id || transaction.id)}
                        className="bg-red-500 hover:bg-red-600"
                        disabled={declineTransactionMutation.isPending}
                      >
                        <i className="fas fa-times"></i>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Product Modal */}
      <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
        <DialogContent className="bg-dark-card/90 backdrop-blur-md border-gray-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Add New Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-gray-400">Product Name</Label>
              <Input
                id="name"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Enter product name"
              />
            </div>
            <div>
              <Label htmlFor="description" className="text-gray-400">Description</Label>
              <Textarea
                id="description"
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Enter product description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price" className="text-gray-400">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="stock" className="text-gray-400">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  value={productForm.stock}
                  onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="imageUrl" className="text-gray-400">Image URL</Label>
              <Input
                id="imageUrl"
                value={productForm.imageUrl}
                onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => addProductMutation.mutate(productForm)}
                disabled={addProductMutation.isPending}
                className="flex-1 bg-accent-blue hover:bg-accent-blue-dark"
              >
                {addProductMutation.isPending ? 'Adding...' : 'Add Product'}
              </Button>
              <Button
                onClick={() => setShowAddProduct(false)}
                variant="outline"
                className="flex-1 bg-gray-800 border-gray-700 text-white"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Balance Modal */}
      <Dialog open={showEditBalance} onOpenChange={setShowEditBalance}>
        <DialogContent className="bg-dark-card/90 backdrop-blur-md border-gray-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Edit User Balance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="userId" className="text-gray-400">User ID</Label>
              <Select
                value={balanceForm.userId}
                onValueChange={(value) => setBalanceForm({ ...balanceForm, userId: value })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user: any) => (
                    <SelectItem key={user._id || user.id} value={user._id || user.id}>
                      {user.firstName} {user.lastName} (@{user.username}) - ${user.balance}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="newBalance" className="text-gray-400">New Balance ($)</Label>
              <Input
                id="newBalance"
                type="number"
                step="0.01"
                value={balanceForm.newBalance}
                onChange={(e) => setBalanceForm({ ...balanceForm, newBalance: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="reason" className="text-gray-400">Reason</Label>
              <Textarea
                id="reason"
                value={balanceForm.reason}
                onChange={(e) => setBalanceForm({ ...balanceForm, reason: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Enter reason for balance change"
              />
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => updateBalanceMutation.mutate(balanceForm)}
                disabled={updateBalanceMutation.isPending}
                className="flex-1 bg-accent-blue hover:bg-accent-blue-dark"
              >
                {updateBalanceMutation.isPending ? 'Updating...' : 'Update Balance'}
              </Button>
              <Button
                onClick={() => setShowEditBalance(false)}
                variant="outline"
                className="flex-1 bg-gray-800 border-gray-700 text-white"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Users Modal */}
      <Dialog open={showUsers} onOpenChange={setShowUsers}>
        <DialogContent className="bg-dark-card/90 backdrop-blur-md border-gray-700 max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">User Management</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {users.length === 0 ? (
              <div className="text-center py-8">
                <i className="fas fa-users text-gray-500 text-3xl mb-2"></i>
                <p className="text-gray-400">No users found</p>
              </div>
            ) : (
              users.map((user: any) => (
                <div key={user._id || user.id} className="p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-white font-semibold">
                        {user.firstName} {user.lastName}
                      </h3>
                      <p className="text-gray-400 text-sm">@{user.username}</p>
                      <p className="text-gray-400 text-sm">ID: {user._id || user.id}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge className="bg-accent-blue">${user.balance}</Badge>
                        <Badge className={user.isAdmin ? 'bg-red-500' : 'bg-green-500'}>
                          {user.isAdmin ? 'Admin' : 'User'}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setBalanceForm({
                          ...balanceForm,
                          userId: user._id || user.id,
                        });
                        setShowUsers(false);
                        setShowEditBalance(true);
                      }}
                      className="bg-purple-500 hover:bg-purple-600"
                    >
                      <i className="fas fa-wallet mr-1"></i>
                      Edit Balance
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Product Modal */}
      <Dialog open={showSendProduct} onOpenChange={setShowSendProduct}>
        <DialogContent className="bg-dark-card/90 backdrop-blur-md border-gray-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Send Product to User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="sendUserId" className="text-gray-400">Select User</Label>
              <Select
                value={sendProductForm.userId}
                onValueChange={(value) => setSendProductForm({ ...sendProductForm, userId: value })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user: any) => (
                    <SelectItem key={user._id || user.id} value={user._id || user.id}>
                      {user.firstName} {user.lastName} (@{user.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="sendProductId" className="text-gray-400">Select Product</Label>
              <Select
                value={sendProductForm.productId}
                onValueChange={(value) => setSendProductForm({ ...sendProductForm, productId: value })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product: any) => (
                    <SelectItem key={product._id || product.id} value={product._id || product.id}>
                      {product.name} - ${product.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sendUsername" className="text-gray-400">Username</Label>
                <Input
                  id="sendUsername"
                  value={sendProductForm.username}
                  onChange={(e) => setSendProductForm({ ...sendProductForm, username: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="Enter username"
                />
              </div>
              <div>
                <Label htmlFor="sendPassword" className="text-gray-400">Password</Label>
                <Input
                  id="sendPassword"
                  type="password"
                  value={sendProductForm.password}
                  onChange={(e) => setSendProductForm({ ...sendProductForm, password: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="Enter password"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="sendInstructions" className="text-gray-400">Instructions</Label>
              <Textarea
                id="sendInstructions"
                value={sendProductForm.instructions}
                onChange={(e) => setSendProductForm({ ...sendProductForm, instructions: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Enter instructions for the user..."
                rows={3}
              />
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={() => sendProductMutation.mutate(sendProductForm)}
                disabled={sendProductMutation.isPending}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                {sendProductMutation.isPending ? 'Sending...' : 'Send Product'}
              </Button>
              <Button
                onClick={() => setShowSendProduct(false)}
                variant="outline"
                className="flex-1 bg-gray-800 border-gray-700 text-white"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
