import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useAdminAuth() {
  const token = localStorage.getItem('admin_token');
  const queryClient = useQueryClient();
  
  const { data: response, isLoading } = useQuery({
    queryKey: ["/api/admin/check-eligibility"],
    queryFn: async () => {
      const userToken = localStorage.getItem('telegram_token');
      
      // Check admin eligibility first with regular user token
      if (userToken) {
        try {
          const eligibilityCheck = await apiRequest('GET', '/api/admin/check-eligibility', {}, {
            'Authorization': `Bearer ${userToken}`
          });
          
          return eligibilityCheck;
        } catch (error) {
          console.error('Admin eligibility check failed:', error);
          return { success: false, eligible: false };
        }
      }
      
      // If we have an admin token, verify it
      if (token) {
        try {
          // Use admin token to check if it's valid
          const adminCheck = await apiRequest('GET', '/api/admin/check-eligibility', {}, {
            'Authorization': `Bearer ${token}`
          });
          
          if (adminCheck.success && adminCheck.isAdmin) {
            return { success: true, eligible: true, isAdmin: true };
          }
          
          // If admin token is invalid, clear it
          localStorage.removeItem('admin_token');
          return { success: false, eligible: false };
        } catch (error) {
          console.error('Admin token check failed:', error);
          localStorage.removeItem('admin_token');
          return { success: false, eligible: false };
        }
      }
      
      return { success: false, eligible: false };
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  const adminLogout = async () => {
    localStorage.removeItem('admin_token');
    queryClient.invalidateQueries({ queryKey: ["/api/admin/check-eligibility"] });
    queryClient.removeQueries({ queryKey: ["/api/admin"] });
  };

  return {
    isEligibleForAdmin: response?.eligible || false,
    isAdminLoggedIn: response?.isAdmin || false,
    isLoading,
    adminLogout,
    // Debug info - remove in production
    debug: { response, token: !!token }
  };
}
