export const endpoints = {
  user: {
    // User account endpoints
    profile: '/api/user',
    stats: '/api/user/stats',
    earnings: '/api/user/earnings',
    withdrawals: '/api/user/withdrawals',
    activate: '/api/user/activate',
    withdraw: '/api/withdrawals',
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
    login: '/api/login',
    register: '/api/register', 
    logout: '/api/logout',
    user: '/api/user',
  },
  
  // M-Pesa endpoints
  mpesa: {
    callback: '/api/mpesa/callback',
    b2cCallback: '/api/mpesa/b2c/callback',
  },
};

// API Configuration
const getApiBaseUrl = (): string => {
  // Use relative paths in both development and production
  // In development, Vite proxy will handle the routing
  // In production, Vercel will handle the routing
  return '';
};

// Helper function to get full URL
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}${endpoint}`;
};

// App configuration
export const config = {
  apiUrl: getApiBaseUrl(),
  appUrl: import.meta.env.VITE_APP_URL || 'http://localhost:5173',
  isProd: import.meta.env.PROD,
  isDev: import.meta.env.DEV,
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