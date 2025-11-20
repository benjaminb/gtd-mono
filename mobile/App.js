import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import SubscriptionPlansScreen from './src/screens/SubscriptionPlansScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'GTD Task Manager' }}
        />
        <Stack.Screen
          name="SubscriptionPlans"
          component={SubscriptionPlansScreen}
          options={{ title: 'Subscription Plans' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
