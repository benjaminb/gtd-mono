import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config/api';

// Create axios instance
const api = axios.create({
  baseURL: config.apiUrl,
  timeout: config.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  async (requestConfig) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        requestConfig.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error reading auth token:', error);
    }
    return requestConfig;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      await AsyncStorage.removeItem('authToken');
      // You can add navigation to login screen here
    }

    return Promise.reject(error);
  }
);

// API Service Methods
export const apiService = {
  // Subscription Plans
  async getSubscriptionPlans() {
    const response = await api.get(config.endpoints.subscriptions.plans);
    return response.data;
  },

  async getCurrentSubscription() {
    const response = await api.get(config.endpoints.subscriptions.current);
    return response.data;
  },

  async createSubscription(planId, paymentMethodId = null) {
    const response = await api.post(config.endpoints.subscriptions.create, {
      planId,
      paymentMethodId,
    });
    return response.data;
  },

  async updateSubscription(newPlanId) {
    const response = await api.put(config.endpoints.subscriptions.update, {
      newPlanId,
    });
    return response.data;
  },

  async cancelSubscription(immediate = false) {
    const response = await api.post(config.endpoints.subscriptions.cancel, {
      immediate,
    });
    return response.data;
  },

  async getUsageStats() {
    const response = await api.get(config.endpoints.subscriptions.usage);
    return response.data;
  },

  // Payment Methods
  async getPaymentMethods() {
    const response = await api.get(config.endpoints.paymentMethods.list);
    return response.data;
  },

  async addPaymentMethod(stripePaymentMethodId) {
    const response = await api.post(config.endpoints.paymentMethods.add, {
      stripePaymentMethodId,
    });
    return response.data;
  },

  async removePaymentMethod(paymentMethodId) {
    const response = await api.delete(config.endpoints.paymentMethods.remove(paymentMethodId));
    return response.data;
  },

  async setDefaultPaymentMethod(paymentMethodId) {
    const response = await api.put(config.endpoints.paymentMethods.setDefault(paymentMethodId));
    return response.data;
  },

  // Invoices
  async getInvoices(limit = 10) {
    const response = await api.get(config.endpoints.invoices.list, {
      params: { limit },
    });
    return response.data;
  },

  async getUpcomingInvoice() {
    const response = await api.get(config.endpoints.invoices.upcoming);
    return response.data;
  },

  async getInvoice(invoiceId) {
    const response = await api.get(config.endpoints.invoices.get(invoiceId));
    return response.data;
  },

  // Tasks (placeholder for future implementation)
  async getTasks() {
    const response = await api.get(config.endpoints.tasks.list);
    return response.data;
  },

  async createTask(taskData) {
    const response = await api.post(config.endpoints.tasks.create, taskData);
    return response.data;
  },

  async updateTask(taskId, taskData) {
    const response = await api.put(config.endpoints.tasks.update(taskId), taskData);
    return response.data;
  },

  async deleteTask(taskId) {
    const response = await api.delete(config.endpoints.tasks.delete(taskId));
    return response.data;
  },

  // Auth helpers
  async setAuthToken(token) {
    await AsyncStorage.setItem('authToken', token);
  },

  async clearAuthToken() {
    await AsyncStorage.removeItem('authToken');
  },

  async getAuthToken() {
    return await AsyncStorage.getItem('authToken');
  },
};

export default api;
