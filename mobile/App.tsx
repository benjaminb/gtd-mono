import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { TaskProvider } from '@gtd/core';
import { AppNavigator } from './src/navigation/AppNavigator';
import { apiClient, CURRENT_USER_ID } from './src/config/api';

export default function App() {
  return (
    <TaskProvider userId={CURRENT_USER_ID} apiClient={apiClient}>
      <StatusBar style="light" />
      <AppNavigator />
    </TaskProvider>
  );
}
