import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const contentType = res.headers.get('content-type');
    let errorMessage = res.statusText;
    
    if (contentType && contentType.includes('application/json')) {
      try {
        const errorData = await res.json();
        errorMessage = errorData.message || errorData.error || res.statusText;
      } catch (e) {
        errorMessage = res.statusText;
      }
    } else {
      const text = await res.text();
      if (text.includes('<!DOCTYPE html>')) {
        errorMessage = `Server returned HTML instead of JSON. Status: ${res.status}`;
      } else {
        errorMessage = text || res.statusText;
      }
    }
    
    throw new Error(`${res.status}: ${errorMessage}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  customHeaders?: Record<string, string>,
): Promise<any> {
  const headers: Record<string, string> = {
    ...customHeaders,
  };
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }

  // Always add Accept header for JSON to prevent HTML responses
  headers["Accept"] = "application/json";

  console.log(`API Request: ${method} ${url}`, { 
    headers: { ...headers, Authorization: headers.Authorization ? "Bearer [REDACTED]" : "None" }, 
    data: data ? "Present" : "None" 
  });

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    // Check if the response is OK before proceeding
    if (!res.ok) {
      const contentType = res.headers.get('content-type');
      
      // If it's JSON, parse the error
      if (contentType && contentType.includes('application/json')) {
        const errorData = await res.json();
        const errorMessage = errorData.message || errorData.error || `Error ${res.status}: ${res.statusText}`;
        
        // Handle authentication errors
        if (res.status === 401 || res.status === 403) {
          console.error('Authentication error:', errorMessage);
          // Clear token on auth errors
          localStorage.removeItem('admin_token');
          throw new Error(`Authentication error: ${errorMessage}. Please login again.`);
        }
        
        throw new Error(errorMessage);
      } else {
        // Handle non-JSON responses (like HTML error pages)
        const text = await res.text();
        console.error(`Non-JSON error response:`, { 
          status: res.status, 
          statusText: res.statusText, 
          preview: text.substring(0, 200) 
        });
        
        if (text.includes('<!DOCTYPE html>')) {
          // Authentication issues often return HTML
          if (res.status === 401 || res.status === 403) {
            localStorage.removeItem('admin_token');
            throw new Error('Session expired. Please login again.');
          }
          throw new Error('Server returned HTML instead of JSON. Check authentication.');
        }
        
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
    }
  
    // Process successful response
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const jsonData = await res.json();
      console.log(`API Response: ${res.status} ${res.statusText}`, jsonData);
      return jsonData;
    } else {
      const text = await res.text();
      console.error(`API Response Error: Non-JSON response`, { 
        status: res.status, 
        statusText: res.statusText,
        contentType, 
        textPreview: text.substring(0, 200) 
      });
      
      throw new Error(`Invalid response format: ${text.substring(0, 100)}`);
    }
  }  catch (error) {
    console.error(`API Request failed: ${method} ${url}`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
