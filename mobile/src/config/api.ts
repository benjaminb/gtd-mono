import { ApiClient } from '@gtd/core';

// Update this to match your backend URL
// For local development:
// - iOS Simulator: http://localhost:3000
// - Android Emulator: http://10.0.2.2:3000
// - Physical device: http://YOUR_COMPUTER_IP:3000
const API_BASE_URL = __DEV__
  ? 'http://10.0.2.2:3000/api' // Android emulator default
  : 'https://your-production-api.com/api';

export const apiClient = new ApiClient(API_BASE_URL);

// Hardcoded user ID for now - in production this would come from auth
export const CURRENT_USER_ID = 'user123';
