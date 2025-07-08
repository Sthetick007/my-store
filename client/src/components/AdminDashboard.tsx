import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Store } from './Store';
import type { Product, User, Transaction } from '@shared/schema';

interface AdminStats {
  totalUsers: number;
  totalRevenue: number;
  pendingTransactions: number;
}

interface ProductMessage {
  id: number;
  userId: string;
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

export function AdminDashboard() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<'admin' | 'store'>('admin');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [showSendMessage, setShowSendMessage] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  
  // Get the admin token from localStorage
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    console.log('Admin token found:', !!token);
    setAdminToken(token);
  }, []);
  const [messageForm, setMessageForm] = useState({
    userId: '',
    productId: '',
    message: '',
    credentials: {
      username: '',
      password: '',
      license: '',
      instructions: '',
    }
  });
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    imageUrl: '',
    featured: false,
    stock: '0',
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if admin token exists
  if (!adminToken) {
    return (
      <div className="p-4 pb-24 text-center">
        <i className="fas fa-lock text-gray-500 text-4xl mb-4"></i>
        <p className="text-gray-400 text-lg">Access Denied</p>
        <p className="text-gray-500 text-sm">Admin authentication required</p>
      </div>
    );
  }

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      return await apiRequest('GET', '/api/admin/stats', {}, {
        'Authorization': `Bearer ${adminToken}`
      });
    },
    enabled: !!adminToken
  });

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      return await apiRequest('GET', '/api/admin/users', {}, {
        'Authorization': `Bearer ${adminToken}`
      });
    },
    enabled: !!adminToken
  });

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/admin/products'],
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/admin/transactions'],
  });

  const addProductMutation = useMutation({
    mutationFn: async (product: typeof productForm) => {
      await apiRequest('POST', '/api/admin/products', {
        ...product,
        price: parseFloat(product.price),
        stock: parseInt(product.stock),
      });
    },
    onSuccess: () => {
      toast({ title: 'Product added successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setShowAddProduct(false);
      setProductForm({
        name: '',
        description: '',
        price: '',
        category: '',
        imageUrl: '',
        featured: false,
        stock: '0',
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async (product: typeof productForm) => {
      await apiRequest('PUT', `/api/admin/products/${selectedProduct?.id}`, {
        ...product,
        price: parseFloat(product.price),
        stock: parseInt(product.stock),
      });
    },
    onSuccess: () => {
      toast({ title: 'Product updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setShowEditProduct(false);
      setSelectedProduct(null);
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/admin/products/${id}`);
    },
    onSuccess: () => {
      toast({ title: 'Product deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
  });

  const approveTransactionMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('POST', `/api/admin/transactions/${id}/approve`);
    },
    onSuccess: () => {
      toast({ title: 'Transaction approved' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
    },
  });

  const denyTransactionMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('POST', `/api/admin/transactions/${id}/deny`);
    },
    onSuccess: () => {
      toast({ title: 'Transaction denied' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: typeof messageForm) => {
      await apiRequest('POST', '/api/admin/messages', messageData);
    },
    onSuccess: () => {
      toast({ title: 'Message sent successfully' });
      setShowSendMessage(false);
      setMessageForm({
        userId: '',
        productId: '',
        message: '',
        credentials: {
          username: '',
          password: '',
          license: '',
          instructions: '',
        }
      });
    },
  });

  if (currentView === 'store') {
    return (
      <div className="pb-24 space-y-4">
        <div className="bg-dark-card/50 border border-gray-700 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <h2 className="text-xl font-bold text-white">Store View</h2>
            <Button
              onClick={() => setCurrentView('admin')}
              className="bg-red-500 hover:bg-red-600 w-full sm:w-auto"
              size="sm"
            >
              <i className="fas fa-cog mr-2"></i>
              Admin Panel
            </Button>
          </div>
        </div>
        <Store />
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 space-y-6">
      {/* Header - Mobile Responsive */}
      <div className="bg-dark-card/50 border border-gray-700 rounded-lg p-4">
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-accent-blue/20 rounded-full flex items-center justify-center">
              <i className="fas fa-shield-alt text-accent-blue"></i>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-gray-400 text-sm">System administration panel</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <Button
              onClick={() => setCurrentView('store')}
              variant="outline"
              size="sm"
              className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 w-full sm:w-auto"
            >
              <i className="fas fa-store mr-2"></i>
              Store View
            </Button>
            <Button
              onClick={() => setShowSendMessage(true)}
              size="sm"
              className="bg-green-500 hover:bg-green-600 w-full sm:w-auto"
            >
              <i className="fas fa-paper-plane mr-2"></i>
              Send Message
            </Button>
            <Button
              onClick={() => {
                localStorage.removeItem('admin_token');
                window.location.href = '/';
              }}
              variant="outline"
              size="sm"
              className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30 w-full sm:w-auto"
            >
              <i className="fas fa-sign-out-alt mr-2"></i>
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards - Mobile Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-dark-card/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-white">
                  {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.totalUsers || 0}
                </p>
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
                <p className="text-2xl font-bold text-white">
                  {statsLoading ? <Skeleton className="h-8 w-24" /> : `$${stats?.totalRevenue || 0}`}
                </p>
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
                <p className="text-2xl font-bold text-white">
                  {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.pendingTransactions || 0}
                </p>
              </div>
              <i className="fas fa-clock text-yellow-400 text-2xl"></i>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="products" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-dark-card/50 border-gray-700">
          <TabsTrigger value="products" className="text-white">Products</TabsTrigger>
          <TabsTrigger value="transactions" className="text-white">Transactions</TabsTrigger>
          <TabsTrigger value="users" className="text-white">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Product Management</h2>
            <Button
              onClick={() => setShowAddProduct(true)}
              className="bg-accent-blue hover:bg-accent-blue-dark"
            >
              <i className="fas fa-plus mr-2"></i>
              Add Product
            </Button>
          </div>

          <div className="grid gap-4">
            {productsLoading ? (
              [...Array(3)].map((_, i) => (
                <Card key={i} className="bg-dark-card/50 border-gray-700">
                  <CardContent className="p-4">
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))
            ) : (
              products?.map((product) => (
                <Card key={product.id} className="bg-dark-card/50 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-white font-semibold">{product.name}</h3>
                        <p className="text-gray-400 text-sm">{product.description}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge className="bg-accent-blue">${product.price}</Badge>
                          <Badge variant="outline" className="border-gray-600 text-gray-300">
                            {product.category}
                          </Badge>
                          {product.featured && (
                            <Badge className="bg-yellow-500">Featured</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedProduct(product);
                            setProductForm({
                              name: product.name,
                              description: product.description || '',
                              price: product.price.toString(),
                              category: product.category || '',
                              imageUrl: product.imageUrl || '',
                              featured: product.featured || false,
                              stock: product.stock?.toString() || '0',
                            });
                            setShowEditProduct(true);
                          }}
                        >
                          <i className="fas fa-edit"></i>
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteProductMutation.mutate(product.id)}
                        >
                          <i className="fas fa-trash"></i>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <h2 className="text-xl font-bold text-white">Transaction Management</h2>
          <div className="grid gap-4">
            {transactionsLoading ? (
              [...Array(3)].map((_, i) => (
                <Card key={i} className="bg-dark-card/50 border-gray-700">
                  <CardContent className="p-4">
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))
            ) : (
              transactions?.map((transaction) => (
                <Card key={transaction.id} className="bg-dark-card/50 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-white font-semibold">{transaction.type}</h3>
                          <Badge
                            className={
                              transaction.status === 'completed' ? 'bg-green-500' :
                              transaction.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                            }
                          >
                            {transaction.status}
                          </Badge>
                        </div>
                        <p className="text-gray-400 text-sm">{transaction.description}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-accent-blue font-semibold">
                            ${Math.abs(parseFloat(transaction.amount || '0'))}
                          </span>
                          <span className="text-gray-500 text-sm">
                            {new Date(transaction.createdAt || '').toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {transaction.status === 'pending' && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => approveTransactionMutation.mutate(transaction.id)}
                            className="bg-green-500 hover:bg-green-600"
                          >
                            <i className="fas fa-check"></i>
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => denyTransactionMutation.mutate(transaction.id)}
                            variant="destructive"
                          >
                            <i className="fas fa-times"></i>
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <h2 className="text-xl font-bold text-white">User Management</h2>
          <div className="grid gap-4">
            {usersLoading ? (
              [...Array(3)].map((_, i) => (
                <Card key={i} className="bg-dark-card/50 border-gray-700">
                  <CardContent className="p-4">
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))
            ) : (
              users?.map((user) => (
                <Card key={user.id} className="bg-dark-card/50 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-white font-semibold">
                          {user.firstName} {user.lastName}
                        </h3>
                        <p className="text-gray-400 text-sm">@{user.username}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge className="bg-accent-blue">${user.balance}</Badge>
                          <Badge className={user.isAdmin ? 'bg-red-500' : 'bg-green-500'}>
                            {user.isAdmin ? 'Admin' : 'User'}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setMessageForm({
                            ...messageForm,
                            userId: user.id,
                          });
                          setShowSendMessage(true);
                        }}
                      >
                        <i className="fas fa-paper-plane"></i>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Product Modal */}
      <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
        <DialogContent className="bg-dark-card/90 backdrop-blur-md border-gray-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Add New Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-gray-400">Name</Label>
              <Input
                id="name"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div>
              <Label htmlFor="description" className="text-gray-400">Description</Label>
              <Textarea
                id="description"
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price" className="text-gray-400">Price</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="category" className="text-gray-400">Category</Label>
                <Select
                  value={productForm.category}
                  onValueChange={(value) => setProductForm({ ...productForm, category: value })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Electronics">Electronics</SelectItem>
                    <SelectItem value="Fashion">Fashion</SelectItem>
                    <SelectItem value="Home">Home</SelectItem>
                    <SelectItem value="Sports">Sports</SelectItem>
                    <SelectItem value="Books">Books</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="imageUrl" className="text-gray-400">Image URL</Label>
              <Input
                id="imageUrl"
                value={productForm.imageUrl}
                onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="featured"
                checked={productForm.featured}
                onChange={(e) => setProductForm({ ...productForm, featured: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="featured" className="text-gray-400">Featured Product</Label>
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

      {/* Edit Product Modal */}
      <Dialog open={showEditProduct} onOpenChange={setShowEditProduct}>
        <DialogContent className="bg-dark-card/90 backdrop-blur-md border-gray-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name" className="text-gray-400">Name</Label>
              <Input
                id="edit-name"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div>
              <Label htmlFor="edit-description" className="text-gray-400">Description</Label>
              <Textarea
                id="edit-description"
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-price" className="text-gray-400">Price</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="edit-category" className="text-gray-400">Category</Label>
                <Select
                  value={productForm.category}
                  onValueChange={(value) => setProductForm({ ...productForm, category: value })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Electronics">Electronics</SelectItem>
                    <SelectItem value="Fashion">Fashion</SelectItem>
                    <SelectItem value="Home">Home</SelectItem>
                    <SelectItem value="Sports">Sports</SelectItem>
                    <SelectItem value="Books">Books</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-imageUrl" className="text-gray-400">Image URL</Label>
              <Input
                id="edit-imageUrl"
                value={productForm.imageUrl}
                onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-featured"
                checked={productForm.featured}
                onChange={(e) => setProductForm({ ...productForm, featured: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="edit-featured" className="text-gray-400">Featured Product</Label>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => updateProductMutation.mutate(productForm)}
                disabled={updateProductMutation.isPending}
                className="flex-1 bg-accent-blue hover:bg-accent-blue-dark"
              >
                {updateProductMutation.isPending ? 'Updating...' : 'Update Product'}
              </Button>
              <Button
                onClick={() => setShowEditProduct(false)}
                variant="outline"
                className="flex-1 bg-gray-800 border-gray-700 text-white"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Message Modal */}
      <Dialog open={showSendMessage} onOpenChange={setShowSendMessage}>
        <DialogContent className="bg-dark-card/90 backdrop-blur-md border-gray-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Send Product Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="userId" className="text-gray-400">User ID</Label>
              <Input
                id="userId"
                value={messageForm.userId}
                onChange={(e) => setMessageForm({ ...messageForm, userId: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Enter user ID"
              />
            </div>
            <div>
              <Label htmlFor="productId" className="text-gray-400">Product ID</Label>
              <Input
                id="productId"
                value={messageForm.productId}
                onChange={(e) => setMessageForm({ ...messageForm, productId: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Enter product ID"
              />
            </div>
            <div>
              <Label htmlFor="message" className="text-gray-400">Message</Label>
              <Textarea
                id="message"
                value={messageForm.message}
                onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Enter your message to the user"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400">Credentials (Optional)</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Username"
                  value={messageForm.credentials.username}
                  onChange={(e) => setMessageForm({
                    ...messageForm,
                    credentials: { ...messageForm.credentials, username: e.target.value }
                  })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
                <Input
                  placeholder="Password"
                  value={messageForm.credentials.password}
                  onChange={(e) => setMessageForm({
                    ...messageForm,
                    credentials: { ...messageForm.credentials, password: e.target.value }
                  })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <Input
                placeholder="License Key"
                value={messageForm.credentials.license}
                onChange={(e) => setMessageForm({
                  ...messageForm,
                  credentials: { ...messageForm.credentials, license: e.target.value }
                })}
                className="bg-gray-800 border-gray-700 text-white"
              />
              <Textarea
                placeholder="Instructions"
                value={messageForm.credentials.instructions}
                onChange={(e) => setMessageForm({
                  ...messageForm,
                  credentials: { ...messageForm.credentials, instructions: e.target.value }
                })}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => sendMessageMutation.mutate(messageForm)}
                disabled={sendMessageMutation.isPending}
                className="flex-1 bg-green-500 hover:bg-green-600"
              >
                {sendMessageMutation.isPending ? 'Sending...' : 'Send Message'}
              </Button>
              <Button
                onClick={() => setShowSendMessage(false)}
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