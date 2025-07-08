import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useAuth() {
  const token = localStorage.getItem('telegram_token');
  
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

  return {
    user,
    isLoading: !!token && isLoading,
    isAuthenticated: !!user,
  };
}
