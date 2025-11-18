import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { apiService } from '../services/api';

export default function SubscriptionPlansScreen({ navigation }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState(null);

  useEffect(() => {
    loadPlans();
    loadCurrentSubscription();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await apiService.getSubscriptionPlans();
      setPlans(response.plans || []);
    } catch (error) {
      console.error('Error loading plans:', error);
      Alert.alert(
        'Error',
        'Failed to load subscription plans. Make sure the API server is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentSubscription = async () => {
    try {
      const response = await apiService.getCurrentSubscription();
      setCurrentPlan(response.plan?.name);
    } catch (error) {
      // User might not have a subscription yet
      console.log('No current subscription');
    }
  };

  const handleSelectPlan = (plan) => {
    Alert.alert(
      'Subscribe to ' + plan.name,
      `Price: $${plan.price}/${plan.interval}\nFeatures: ${plan.features.join(', ')}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Subscribe',
          onPress: () => subscribeToPlan(plan),
        },
      ]
    );
  };

  const subscribeToPlan = async (plan) => {
    try {
      setLoading(true);
      await apiService.createSubscription(plan.planId);
      Alert.alert('Success', 'Subscription created successfully!');
      await loadCurrentSubscription();
    } catch (error) {
      console.error('Error creating subscription:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to create subscription');
    } finally {
      setLoading(false);
    }
  };

  const renderPlan = ({ item }) => {
    const isCurrentPlan = currentPlan === item.name;

    return (
      <TouchableOpacity
        style={[styles.planCard, isCurrentPlan && styles.currentPlanCard]}
        onPress={() => !isCurrentPlan && handleSelectPlan(item)}
        disabled={isCurrentPlan}
      >
        <View style={styles.planHeader}>
          <Text style={styles.planName}>{item.name}</Text>
          {isCurrentPlan && <Text style={styles.currentBadge}>CURRENT</Text>}
        </View>

        <Text style={styles.planPrice}>
          ${item.price}
          <Text style={styles.planInterval}>/{item.interval}</Text>
        </Text>

        <View style={styles.limitsContainer}>
          <Text style={styles.limitText}>
            📋 Tasks: {item.maxTasks === -1 ? 'Unlimited' : item.maxTasks}
          </Text>
          <Text style={styles.limitText}>
            📁 Projects: {item.maxProjects === -1 ? 'Unlimited' : item.maxProjects}
          </Text>
          <Text style={styles.limitText}>
            ⏱️ Time Entries: {item.maxTimeEntries === -1 ? 'Unlimited' : `${item.maxTimeEntries}/month`}
          </Text>
        </View>

        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Features:</Text>
          {item.features.map((feature, index) => (
            <Text key={index} style={styles.featureText}>
              ✓ {feature.replace(/_/g, ' ')}
            </Text>
          ))}
        </View>

        {!isCurrentPlan && (
          <View style={styles.buttonContainer}>
            <Text style={styles.buttonText}>Select Plan</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading plans...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Subscription Plans</Text>
      {currentPlan && (
        <Text style={styles.subtitle}>Current Plan: {currentPlan}</Text>
      )}

      <FlatList
        data={plans}
        renderItem={renderPlan}
        keyExtractor={(item) => item.planId}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    paddingBottom: 20,
  },
  planCard: {
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
  currentPlanCard: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  currentBadge: {
    backgroundColor: '#007AFF',
    color: 'white',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold',
  },
  planPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 16,
  },
  planInterval: {
    fontSize: 16,
    color: '#666',
  },
  limitsContainer: {
    marginBottom: 16,
  },
  limitText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  featuresContainer: {
    marginBottom: 16,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  buttonContainer: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
