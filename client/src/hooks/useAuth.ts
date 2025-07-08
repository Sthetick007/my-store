import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useAuth() {
  const token = localStorage.getItem('telegram_token');
  const queryClient = useQueryClient();
  
  const { data: response, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      if (!token) return null;
      
      try {
        return await apiRequest('POST', '/api/auth/me', {}, {
          'Authorization': `Bearer ${token}`
        });
      } catch (error) {
        console.error('Auth check failed:', error);
        // Clear invalid token
        localStorage.removeItem('telegram_token');
        return null;
      }
    },
    retry: false,
    enabled: !!token,
  });

  const user = response?.success ? response.user : null;

  const logout = async () => {
    try {
      if (token) {
        // Call logout endpoint
        await apiRequest('POST', '/api/auth/logout', {}, {
          'Authorization': `Bearer ${token}`
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear token and refresh queries regardless of API call result
      localStorage.removeItem('telegram_token');
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      // Force page reload to go back to login
      window.location.reload();
    }
  };

  return {
    user,
    isLoading: !!token && isLoading,
    isAuthenticated: !!user,
    logout,
  };
}
