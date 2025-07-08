import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useAdminAuth() {
  const token = localStorage.getItem('admin_token');
  const queryClient = useQueryClient();
  
  const { data: response, isLoading } = useQuery({
    queryKey: ["/api/admin/verify"],
    queryFn: async () => {
      // If we have an admin token, verify it
      if (token) {
        try {
          // Use admin token to check if it's valid by making a test request
          const adminCheck = await apiRequest('GET', '/api/admin/stats', {}, {
            'Authorization': `Bearer ${token}`
          });
          
          if (adminCheck.success) {
            return { success: true, isAdmin: true };
          }
          
          // If admin token is invalid, clear it
          localStorage.removeItem('admin_token');
          return { success: false, isAdmin: false };
        } catch (error) {
          console.error('Admin token check failed:', error);
          localStorage.removeItem('admin_token');
          return { success: false, isAdmin: false };
        }
      }
      
      return { success: false, isAdmin: false };
    },
    retry: false,
    refetchOnWindowFocus: false,
    enabled: !!token, // Only run query if we have a token
  });

  const adminLogout = async () => {
    localStorage.removeItem('admin_token');
    queryClient.invalidateQueries({ queryKey: ["/api/admin/verify"] });
    queryClient.removeQueries({ queryKey: ["/api/admin"] });
  };

  return {
    isAdminLoggedIn: response?.isAdmin || false,
    isLoading,
    adminLogout,
    // Debug info - remove in production
    debug: { response, token: !!token }
  };
}
