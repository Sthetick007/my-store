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
      const response = await apiRequest('POST', '/api/admin/login', credentials);
      console.log('Admin login response:', response);
      return response;
    },
    onSuccess: (data) => {
      console.log('Login mutation success:', data);
      if (data.success && data.token) {
        // Store admin token separately from user token
        localStorage.setItem('admin_token', data.token);
        toast({
          title: 'Welcome Admin!',
          description: 'Successfully logged into admin panel',
          variant: 'default',
        });
        onLoginSuccess(data.token, data.user);
      } else {
        const errorMsg = data.message || 'Login failed';
        setError(errorMsg);
        toast({
          title: 'Login failed',
          description: errorMsg,
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      console.error('Login mutation error:', error);
      const errorMsg = error.message || 'Network error occurred';
      setError(errorMsg);
      toast({
        title: 'Login error',
        description: errorMsg,
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-dark-bg via-gray-900 to-dark-bg">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-accent-blue/20 rounded-full flex items-center justify-center mb-4">
            <i className="fas fa-shield-alt text-accent-blue text-2xl"></i>
          </div>
          <h1 className="text-3xl font-bold text-white">Admin Portal</h1>
          <p className="text-gray-400">Secure access to system administration</p>
        </div>

        {/* Login Card */}
        <Card className="bg-dark-card/80 backdrop-blur-md border-gray-700/50 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-semibold text-white">Administrator Login</CardTitle>
            <CardDescription className="text-gray-400">Enter your credentials to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white font-medium">Username</Label>
                <div className="relative">
                  <i className="fas fa-user absolute left-3 top-3 text-gray-400"></i>
                  <Input
                    id="username"
                    placeholder="Enter admin username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 border-gray-700 bg-gray-800/50 text-white placeholder-gray-500 focus:border-accent-blue focus:ring-accent-blue/20"
                    disabled={loginMutation.isPending}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white font-medium">Password</Label>
                <div className="relative">
                  <i className="fas fa-lock absolute left-3 top-3 text-gray-400"></i>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter admin password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 border-gray-700 bg-gray-800/50 text-white placeholder-gray-500 focus:border-accent-blue focus:ring-accent-blue/20"
                    disabled={loginMutation.isPending}
                  />
                </div>
              </div>
              
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                  <p className="text-red-400 text-sm flex items-center">
                    <i className="fas fa-exclamation-triangle mr-2"></i>
                    {error}
                  </p>
                </div>
              )}
              
              <Button
                type="submit"
                className="w-full bg-accent-blue hover:bg-accent-blue-dark text-white font-medium py-2.5 transition-all duration-200"
                disabled={loginMutation.isPending || !username || !password}
              >
                {loginMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Authenticating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sign-in-alt mr-2"></i>
                    Sign In
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="pt-4">
            <Button
              variant="outline"
              className="w-full border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white hover:border-gray-600 transition-all duration-200"
              onClick={onCancel}
              disabled={loginMutation.isPending}
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back to App
            </Button>
          </CardFooter>
        </Card>

        {/* Security Notice */}
        <div className="text-center text-xs text-gray-500 space-y-1">
          <p className="flex items-center justify-center">
            <i className="fas fa-lock mr-1"></i>
            Secure connection established
          </p>
          <p>This area is restricted to authorized administrators only</p>
        </div>
      </div>
    </div>
  );
}
