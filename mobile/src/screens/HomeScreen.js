import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import config from '../config/api';

export default function HomeScreen({ navigation }) {
  return (
    <ScrollView style={styles.container}>
      <StatusBar style="auto" />

      <View style={styles.header}>
        <Text style={styles.title}>GTD Task Manager</Text>
        <Text style={styles.subtitle}>Getting Things Done</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🚀 API Connection</Text>
        <Text style={styles.cardText}>Connected to: {config.apiUrl}</Text>
        <Text style={styles.cardSubtext}>
          Make sure your API server is running at this address
        </Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('SubscriptionPlans')}
      >
        <Text style={styles.buttonText}>💳 View Subscription Plans</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.secondaryButton]}
        onPress={() => alert('Tasks feature coming soon!')}
      >
        <Text style={[styles.buttonText, styles.secondaryButtonText]}>
          📋 My Tasks (Coming Soon)
        </Text>
      </TouchableOpacity>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>📱 Platform Info</Text>
        <Text style={styles.infoText}>Platform: {config.apiUrl.includes('10.0.2.2') ? 'Android' : 'iOS'}</Text>
        <Text style={styles.infoText}>Mode: {__DEV__ ? 'Development' : 'Production'}</Text>
      </View>

      <View style={styles.setupInfo}>
        <Text style={styles.setupTitle}>🏃 Quick Setup</Text>
        <Text style={styles.setupText}>
          1. Make sure Docker containers are running:{'\n'}
          <Text style={styles.code}>   docker-compose up -d</Text>
        </Text>
        <Text style={styles.setupText}>
          2. Start the API server:{'\n'}
          <Text style={styles.code}>   cd backend/database && npm start</Text>
        </Text>
        <Text style={styles.setupText}>
          3. The app will automatically connect to the correct endpoint
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  cardText: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  cardSubtext: {
    fontSize: 12,
    color: '#999',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  setupInfo: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
  },
  setupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  setupText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  code: {
    fontFamily: 'monospace',
    backgroundColor: '#f5f5f5',
    padding: 4,
    fontSize: 12,
  },
});
