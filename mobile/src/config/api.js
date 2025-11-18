// API Configuration
const API_ENDPOINTS = {
  // For iOS Simulator
  ios: 'http://localhost:3000',
  // For Android Emulator (10.0.2.2 is the host machine from Android emulator)
  android: 'http://10.0.2.2:3000',
  // For physical devices on the same network, use your machine's IP
  // Find your IP with: ipconfig getifaddr en0 (Mac) or ifconfig (Linux)
  device: process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.100:3000',
};

// Automatically detect platform and use appropriate endpoint
import { Platform } from 'react-native';

let BASE_URL;

if (__DEV__) {
  // Development mode
  if (Platform.OS === 'ios') {
    BASE_URL = API_ENDPOINTS.ios;
  } else if (Platform.OS === 'android') {
    BASE_URL = API_ENDPOINTS.android;
  } else {
    BASE_URL = API_ENDPOINTS.device;
  }
} else {
  // Production mode - use environment variable or default
  BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://your-production-api.com';
}

export const config = {
  apiUrl: BASE_URL,
  endpoints: {
    // Subscription endpoints
    subscriptions: {
      plans: '/api/subscriptions/plans',
      current: '/api/subscriptions/current',
      create: '/api/subscriptions/create',
      update: '/api/subscriptions/update',
      cancel: '/api/subscriptions/cancel',
      usage: '/api/subscriptions/usage',
    },
    // Task endpoints (to be implemented)
    tasks: {
      list: '/api/tasks',
      create: '/api/tasks',
      update: (id) => `/api/tasks/${id}`,
      delete: (id) => `/api/tasks/${id}`,
    },
    // Payment endpoints
    paymentMethods: {
      list: '/api/payment-methods',
      add: '/api/payment-methods',
      remove: (id) => `/api/payment-methods/${id}`,
      setDefault: (id) => `/api/payment-methods/${id}/default`,
    },
    // Invoice endpoints
    invoices: {
      list: '/api/invoices',
      upcoming: '/api/invoices/upcoming',
      get: (id) => `/api/invoices/${id}`,
    },
  },
  // API request timeout
  timeout: 10000,
};

console.log('🔌 API Configuration:', {
  platform: Platform.OS,
  baseURL: BASE_URL,
  isDevelopment: __DEV__,
});

export default config;
