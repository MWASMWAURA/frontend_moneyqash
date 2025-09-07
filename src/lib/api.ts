// This file exports API endpoints, config, and request helpers

export const endpoints = {
  user: {
    profile: '/api/user',
    stats: '/api/user/stats',
    earnings: '/api/user/earnings',
    withdrawals: '/api/user/withdrawals',
    activate: '/api/user/activate',
    withdraw: '/api/withdrawals',
    referrals: '/api/user/referrals',
  },
  tasks: {
    available: '/api/available-tasks',
    complete: (taskId: number) => `/api/tasks/${taskId}/complete`,
  },
  withdrawals: {
    create: '/api/withdrawals',
    list: '/api/withdrawals',
  },
  auth: {
    login: '/api/login',
    register: '/api/register',
    logout: '/api/logout',
    user: '/api/user',
  },
  mpesa: {
    callback: '/api/mpesa/callback',
    b2cCallback: '/api/mpesa/b2c/callback',
  },
};

export const getApiBaseUrl = (): string => {
  return '';
};

export const getApiUrl = (endpoint: string): string => {
  return `${getApiBaseUrl()}${endpoint}`;
};

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
      'Cache-Control': 'no-cache',
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.statusText}`);
  }

  return response;
};
