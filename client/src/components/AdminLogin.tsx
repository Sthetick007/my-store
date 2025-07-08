import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface AdminLoginProps {
  onLoginSuccess: (token: string, user: any) => void;
  onCancel: () => void;
}

export function AdminLogin({ onLoginSuccess, onCancel }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { toast } = useToast();
  
  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      return await apiRequest('POST', '/api/admin/login', credentials);
    },
    onSuccess: (data) => {
      if (data.success) {
        // Store admin token separately from user token
        localStorage.setItem('admin_token', data.token);
        toast({
          title: 'Login successful',
          description: 'Welcome to the admin panel',
          variant: 'default',
        });
        onLoginSuccess(data.token, data.user);
      } else {
        setError(data.message || 'Login failed');
        toast({
          title: 'Login failed',
          description: data.message || 'Invalid credentials',
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      setError(error.message || 'Login failed');
      toast({
        title: 'Login error',
        description: error.message || 'An error occurred during login',
        variant: 'destructive',
      });
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Username and password are required');
      return;
    }
    
    loginMutation.mutate({ username, password });
  };
  
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md bg-dark-card/80 border-gray-700">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white">Admin Login</CardTitle>
          <CardDescription className="text-gray-400">Enter your credentials to access the admin panel</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white">Username</Label>
                <Input
                  id="username"
                  placeholder="Enter admin username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="border-gray-700 bg-gray-800/50 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-gray-700 bg-gray-800/50 text-white"
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <Button
                type="submit"
                className="w-full bg-accent-blue hover:bg-blue-600 text-white font-medium"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? 'Logging in...' : 'Login'}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            className="w-full border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white"
            onClick={onCancel}
          >
            Go Back
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
