import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const isDev = import.meta.env.DEV;
  
  // Mock user data for development
  const mockUser = {
    id: '123456789',
    firstName: 'Dev',
    lastName: 'User',
    username: 'devuser',
    email: 'dev@example.com',
    balance: '100.00',
    isAdmin: true,
    profileImageUrl: null,
  };

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/telegram/user"],
    retry: false,
    enabled: !isDev, // Don't fetch in dev mode
  });

  return {
    user: isDev ? mockUser : user,
    isLoading: isDev ? false : isLoading,
    isAuthenticated: isDev ? true : !!user,
  };
}
