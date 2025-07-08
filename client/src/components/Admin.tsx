import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import type { User, Product, Transaction } from '@shared/schema';

interface AdminStats {
  totalUsers: number;
  totalRevenue: number;
  recentActivity: Transaction[];
}

export function Admin() {
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    imageUrl: '',
    stock: '',
    featured: false,
  });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
    enabled: user?.isAdmin,
  });

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    enabled: user?.isAdmin,
  });

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const createProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      await apiRequest('POST', '/api/admin/products', {
        ...productData,
        price: parseFloat(productData.price),
        stock: parseInt(productData.stock),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Product Created',
        description: 'New product has been added successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setNewProduct({
        name: '',
        description: '',
        price: '',
        category: '',
        imageUrl: '',
        stock: '',
        featured: false,
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create product.',
        variant: 'destructive',
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      await apiRequest('PUT', `/api/admin/products/${id}`, {
        ...data,
        price: parseFloat(data.price),
        stock: parseInt(data.stock),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Product Updated',
        description: 'Product has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setEditingProduct(null);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update product.',
        variant: 'destructive',
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/admin/products/${id}`);
    },
    onSuccess: () => {
      toast({
        title: 'Product Deleted',
        description: 'Product has been deleted successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete product.',
        variant: 'destructive',
      });
    },
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

  if (!user?.isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <i className="fas fa-lock text-gray-500 text-4xl mb-4"></i>
          <p className="text-gray-400 text-lg">Access Denied</p>
          <p className="text-gray-500 text-sm">You need admin privileges to access this section</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-4">
      {/* Admin Stats */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="bg-dark-card/50 backdrop-blur-sm border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Users</p>
                  <p className="text-2xl font-bold text-white">
                    {statsLoading ? '...' : stats?.totalUsers || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-accent-blue/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-users text-accent-blue text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-dark-card/50 backdrop-blur-sm border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Revenue</p>
                  <p className="text-2xl font-bold text-white">
                    ${statsLoading ? '...' : stats?.totalRevenue.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-dollar-sign text-green-500 text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Admin Actions */}
      <div className="px-4 mb-6">
        <h3 className="text-lg font-bold text-white mb-4">Admin Actions</h3>
        <div className="space-y-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full bg-dark-card/50 backdrop-blur-sm border-gray-700 hover:border-accent-blue text-white justify-start h-auto p-4"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-accent-blue/20 rounded-full flex items-center justify-center">
                    <i className="fas fa-user-cog text-accent-blue"></i>
                  </div>
                  <div>
                    <p className="text-white font-medium">User Management</p>
                    <p className="text-gray-400 text-xs">View and manage user accounts</p>
                  </div>
                </div>
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-dark-card border-gray-700 max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-white">User Management</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {usersLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-blue mx-auto"></div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {users?.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 bg-dark-card/30 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-accent-blue/20 rounded-full flex items-center justify-center">
                            <i className="fas fa-user text-accent-blue text-xs"></i>
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-gray-400 text-xs">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={user.isAdmin ? 'default' : 'secondary'}>
                            {user.isAdmin ? 'Admin' : 'User'}
                          </Badge>
                          <span className="text-sm text-gray-400">${user.balance}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full bg-dark-card/50 backdrop-blur-sm border-gray-700 hover:border-accent-blue text-white justify-start h-auto p-4"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <i className="fas fa-box text-purple-500"></i>
                  </div>
                  <div>
                    <p className="text-white font-medium">Product Management</p>
                    <p className="text-gray-400 text-xs">Add, edit, and manage products</p>
                  </div>
                </div>
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-dark-card border-gray-700 max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-white">Product Management</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* Add New Product */}
                <Card className="bg-dark-card/30 border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Add New Product</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name" className="text-gray-300">Name</Label>
                        <Input
                          id="name"
                          value={newProduct.name}
                          onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                          className="bg-dark-card/50 border-gray-600 text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="price" className="text-gray-300">Price</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          value={newProduct.price}
                          onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                          className="bg-dark-card/50 border-gray-600 text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="description" className="text-gray-300">Description</Label>
                      <Textarea
                        id="description"
                        value={newProduct.description}
                        onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                        className="bg-dark-card/50 border-gray-600 text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="category" className="text-gray-300">Category</Label>
                        <Select value={newProduct.category} onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}>
                          <SelectTrigger className="bg-dark-card/50 border-gray-600 text-white">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent className="bg-dark-card border-gray-600">
                            <SelectItem value="Electronics">Electronics</SelectItem>
                            <SelectItem value="Fashion">Fashion</SelectItem>
                            <SelectItem value="Home">Home</SelectItem>
                            <SelectItem value="Sports">Sports</SelectItem>
                            <SelectItem value="Books">Books</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="stock" className="text-gray-300">Stock</Label>
                        <Input
                          id="stock"
                          type="number"
                          value={newProduct.stock}
                          onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                          className="bg-dark-card/50 border-gray-600 text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="imageUrl" className="text-gray-300">Image URL</Label>
                      <Input
                        id="imageUrl"
                        value={newProduct.imageUrl}
                        onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                        className="bg-dark-card/50 border-gray-600 text-white"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="featured"
                        checked={newProduct.featured}
                        onCheckedChange={(checked) => setNewProduct({ ...newProduct, featured: checked })}
                      />
                      <Label htmlFor="featured" className="text-gray-300">Featured Product</Label>
                    </div>
                    <Button
                      onClick={() => createProductMutation.mutate(newProduct)}
                      disabled={createProductMutation.isPending}
                      className="w-full bg-accent-blue hover:bg-accent-blue-dark"
                    >
                      {createProductMutation.isPending ? 'Creating...' : 'Create Product'}
                    </Button>
                  </CardContent>
                </Card>

                {/* Existing Products */}
                <div>
                  <h4 className="text-white font-semibold mb-3">Existing Products</h4>
                  {productsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-blue mx-auto"></div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {products?.map((product) => (
                        <div key={product.id} className="flex items-center justify-between p-3 bg-dark-card/30 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <i className="fas fa-image text-gray-400"></i>
                              )}
                            </div>
                            <div>
                              <p className="text-white font-medium text-sm">{product.name}</p>
                              <p className="text-gray-400 text-xs">${product.price} • Stock: {product.stock}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {product.featured && (
                              <Badge className="bg-accent-blue text-white">Featured</Badge>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingProduct(product)}
                              className="border-gray-600 text-gray-300 hover:border-accent-blue"
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteProductMutation.mutate(product.id)}
                              disabled={deleteProductMutation.isPending}
                              className="border-red-600 text-red-400 hover:border-red-500"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="px-4">
        <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
        {statsLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="bg-dark-card/50 backdrop-blur-sm border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-700 rounded-full animate-pulse"></div>
                      <div>
                        <div className="h-4 bg-gray-700 rounded w-32 mb-1 animate-pulse"></div>
                        <div className="h-3 bg-gray-700 rounded w-24 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {stats?.recentActivity.slice(0, 5).map((activity) => (
              <Card key={activity.id} className="bg-dark-card/50 backdrop-blur-sm border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.type === 'deposit' ? 'bg-green-500/20' : 'bg-accent-blue/20'
                      }`}>
                        <i className={`fas ${
                          activity.type === 'deposit' ? 'fa-plus text-green-500' : 'fa-shopping-cart text-accent-blue'
                        } text-xs`}></i>
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{activity.description}</p>
                        <p className="text-gray-400 text-xs">{formatDate(activity.createdAt!)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
          <DialogContent className="bg-dark-card border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Product</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name" className="text-gray-300">Name</Label>
                  <Input
                    id="edit-name"
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="bg-dark-card/50 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-price" className="text-gray-300">Price</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    step="0.01"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                    className="bg-dark-card/50 border-gray-600 text-white"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-description" className="text-gray-300">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="bg-dark-card/50 border-gray-600 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-stock" className="text-gray-300">Stock</Label>
                  <Input
                    id="edit-stock"
                    type="number"
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) || 0 })}
                    className="bg-dark-card/50 border-gray-600 text-white"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="edit-featured"
                    checked={editingProduct.featured}
                    onCheckedChange={(checked) => setEditingProduct({ ...editingProduct, featured: checked })}
                  />
                  <Label htmlFor="edit-featured" className="text-gray-300">Featured</Label>
                </div>
              </div>
              <Button
                onClick={() => updateProductMutation.mutate({ id: editingProduct.id, data: editingProduct })}
                disabled={updateProductMutation.isPending}
                className="w-full bg-accent-blue hover:bg-accent-blue-dark"
              >
                {updateProductMutation.isPending ? 'Updating...' : 'Update Product'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
