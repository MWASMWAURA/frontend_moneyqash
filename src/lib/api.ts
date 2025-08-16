export const endpoints = {
  user: {
    // User account endpoints
    profile: '/api/user',
    stats: '/api/user/stats',
    earnings: '/api/user/earnings',
    withdrawals: '/api/user/withdrawals',
    activate: '/api/user/activate',
    withdraw: '/api/user/withdraw',
    referrals: '/api/user/referrals',
  },
  
  // Task endpoints
  tasks: {
    available: '/api/available-tasks',
    complete: (taskId: number) => `/api/tasks/${taskId}/complete`,
  },
  
  // Withdrawal endpoints
  withdrawals: {
    create: '/api/withdrawals',
    list: '/api/withdrawals',
  },
  
  // Authentication endpoints
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
  },
  
  // M-Pesa endpoints
  mpesa: {
    callback: '/api/mpesa/callback',
    b2cCallback: '/api/mpesa/b2c/callback',
  },
};

// Helper function to get full URL (optional - your queryClient already handles this)
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return `${baseUrl}${endpoint}`;
};

export const apiRequest = async (method: string, url: string, data?: any) => {
  const response = await fetch(url, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    },
    body: data ? JSON.stringify(data) : undefined
  });
  
  if (!response.ok) {
    throw new Error(`Request failed: ${response.statusText}`);
  }
  
  return response;
};