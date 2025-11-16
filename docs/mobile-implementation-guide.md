# Mobile Implementation Guide

Step-by-step guide to implementing the React Native mobile apps with maximum code sharing.

## Table of Contents

1. [Project Setup](#project-setup)
2. [Shared Package Creation](#shared-package-creation)
3. [Mobile App Implementation](#mobile-app-implementation)
4. [Screen Examples](#screen-examples)
5. [Navigation Setup](#navigation-setup)
6. [Keeping UIs Consistent](#keeping-uis-consistent)

## Project Setup

### 1. Convert to Monorepo

**Install Yarn Workspaces** (or npm workspaces):

```json
// package.json (root)
{
  "name": "gtd-mono",
  "private": true,
  "workspaces": [
    "packages/*",
    "frontend",
    "mobile",
    "backend/database"
  ],
  "scripts": {
    "dev:web": "cd frontend && npm run dev",
    "dev:mobile": "cd mobile && npm start",
    "dev:backend": "cd backend/database && npm run dev",
    "build:all": "npm run build:core && npm run build:web && npm run build:mobile",
    "test:all": "npm run test --workspaces"
  }
}
```

### 2. Create Shared Packages

```bash
mkdir -p packages/core packages/ui-components
cd packages/core
npm init -y
```

**packages/core/package.json**:
```json
{
  "name": "@gtd/core",
  "version": "1.0.0",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "dependencies": {
    "react": "^19.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/react": "^19.0.0"
  }
}
```

### 3. Initialize React Native App

```bash
npx create-expo-app mobile --template blank-typescript
cd mobile
npm install @react-navigation/native @react-navigation/native-stack
npm install react-native-screens react-native-safe-area-context
npm install @shopify/flash-list react-native-reanimated
npm install @react-native-async-storage/async-storage
npm install @react-native-community/netinfo
```

**mobile/package.json additions**:
```json
{
  "dependencies": {
    "@gtd/core": "*",
    "@gtd/ui-components": "*"
  }
}
```

## Shared Package Creation

### packages/core/src/index.ts

```typescript
// Export all shared modules
export * from './api';
export * from './hooks';
export * from './state';
export * from './utils';
export * from './types';
```

### packages/core/src/types/index.ts

```typescript
export interface Task {
  id: string;
  name: string;
  done: boolean;
  emoji: string | null;
  source: 'user' | 'ai-suggested' | 'ai-accepted';
  customProperties: Record<string, any>;
  timeTracking: TimeTracking;
  createdAt: string;
  updatedAt: string;
}

export interface TimeTracking {
  totalSeconds: number;
  sessions: TimeSession[];
  currentSessionStart: string | null;
}

export interface TimeSession {
  startTime: string;
  endTime: string;
  durationSeconds: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface PropertySchema {
  id: string;
  propertyName: string;
  dataType: 'text' | 'number' | 'date' | 'boolean' | 'select';
  constraints: Record<string, any>;
}
```

### packages/core/src/api/client.ts

```typescript
import type { Task, User, PropertySchema } from '../types';

export class ApiClient {
  constructor(private baseURL: string) {}

  // Task endpoints
  async createTask(data: {
    userId: string;
    name: string;
    done?: boolean;
    emoji?: string;
    customProperties?: Record<string, any>;
  }): Promise<Task> {
    const response = await fetch(`${this.baseURL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create task');
    return response.json();
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    const response = await fetch(`${this.baseURL}/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update task');
    return response.json();
  }

  async deleteTask(taskId: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/tasks/${taskId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete task');
  }

  async getUserTasks(userId: string): Promise<Task[]> {
    const response = await fetch(`${this.baseURL}/users/${userId}/tasks`);
    if (!response.ok) throw new Error('Failed to fetch tasks');
    return response.json();
  }

  async getSubtasks(taskId: string): Promise<Task[]> {
    const response = await fetch(`${this.baseURL}/tasks/${taskId}/subtasks`);
    if (!response.ok) throw new Error('Failed to fetch subtasks');
    return response.json();
  }

  // Time tracking endpoints
  async startTimeTracking(taskId: string): Promise<Task> {
    const response = await fetch(
      `${this.baseURL}/tasks/${taskId}/time-tracking/start`,
      { method: 'POST' }
    );
    if (!response.ok) throw new Error('Failed to start time tracking');
    return response.json();
  }

  async stopTimeTracking(taskId: string): Promise<Task> {
    const response = await fetch(
      `${this.baseURL}/tasks/${taskId}/time-tracking/stop`,
      { method: 'POST' }
    );
    if (!response.ok) throw new Error('Failed to stop time tracking');
    return response.json();
  }

  // Property schema endpoints
  async getPropertySchemas(userId: string): Promise<PropertySchema[]> {
    const response = await fetch(
      `${this.baseURL}/property-schemas/user/${userId}`
    );
    if (!response.ok) throw new Error('Failed to fetch schemas');
    return response.json();
  }

  // User endpoints
  async login(email: string, password: string): Promise<User> {
    const response = await fetch(`${this.baseURL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) throw new Error('Invalid credentials');
    return response.json();
  }
}
```

### packages/core/src/state/TaskContext.tsx

```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ApiClient } from '../api/client';
import type { Task } from '../types';

interface TaskContextValue {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  activeTimeTracking: string | null;

  // Task operations
  createTask: (data: Partial<Task>) => Promise<Task>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<Task>;
  deleteTask: (taskId: string) => Promise<void>;
  loadAllTasks: () => Promise<void>;

  // Time tracking
  startTimeTracking: (taskId: string) => Promise<void>;
  stopTimeTracking: (taskId: string) => Promise<void>;
  toggleTimeTracking: (taskId: string) => Promise<void>;

  // Helpers
  getRootTasks: () => Task[];
  getChildren: (taskId: string) => Task[];
}

const TaskContext = createContext<TaskContextValue | null>(null);

interface TaskProviderProps {
  children: ReactNode;
  userId: string;
  apiClient: ApiClient;
}

export const TaskProvider = ({ children, userId, apiClient }: TaskProviderProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTimeTracking, setActiveTimeTracking] = useState<string | null>(null);
  const [taskRelationships, setTaskRelationships] = useState<Record<string, string[]>>({});

  // Load all tasks
  const loadAllTasks = async () => {
    try {
      setLoading(true);
      setError(null);

      const allTasks = await apiClient.getUserTasks(userId);

      // Build relationships
      const relationships: Record<string, string[]> = {};
      for (const task of allTasks) {
        const subtasks = await apiClient.getSubtasks(task.id);
        relationships[task.id] = subtasks.map(st => st.id);
      }

      setTasks(allTasks);
      setTaskRelationships(relationships);

      // Find any active tracking
      const activeTask = allTasks.find(
        t => t.timeTracking?.currentSessionStart !== null
      );
      if (activeTask) {
        setActiveTimeTracking(activeTask.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadAllTasks();
    }
  }, [userId]);

  // Create task
  const createTask = async (data: Partial<Task>) => {
    const newTask = await apiClient.createTask({
      userId,
      name: data.name!,
      done: data.done,
      emoji: data.emoji,
      customProperties: data.customProperties,
    });

    setTasks(prev => [...prev, newTask]);
    return newTask;
  };

  // Update task
  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    const updated = await apiClient.updateTask(taskId, updates);
    setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
    return updated;
  };

  // Delete task
  const deleteTask = async (taskId: string) => {
    await apiClient.deleteTask(taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  // Start time tracking
  const startTimeTracking = async (taskId: string) => {
    // Stop currently active task
    if (activeTimeTracking && activeTimeTracking !== taskId) {
      await stopTimeTracking(activeTimeTracking);
    }

    const updated = await apiClient.startTimeTracking(taskId);
    setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
    setActiveTimeTracking(taskId);
  };

  // Stop time tracking
  const stopTimeTracking = async (taskId: string) => {
    const updated = await apiClient.stopTimeTracking(taskId);
    setTasks(prev => prev.map(t => t.id === taskId ? updated : t));

    if (activeTimeTracking === taskId) {
      setActiveTimeTracking(null);
    }
  };

  // Toggle time tracking
  const toggleTimeTracking = async (taskId: string) => {
    if (activeTimeTracking === taskId) {
      await stopTimeTracking(taskId);
    } else {
      await startTimeTracking(taskId);
    }
  };

  // Get root tasks (no parents)
  const getRootTasks = () => {
    const childIds = new Set(Object.values(taskRelationships).flat());
    return tasks.filter(task => !childIds.has(task.id));
  };

  // Get children of a task
  const getChildren = (taskId: string) => {
    const childIds = taskRelationships[taskId] || [];
    return tasks.filter(t => childIds.includes(t.id));
  };

  const value: TaskContextValue = {
    tasks,
    loading,
    error,
    activeTimeTracking,
    createTask,
    updateTask,
    deleteTask,
    loadAllTasks,
    startTimeTracking,
    stopTimeTracking,
    toggleTimeTracking,
    getRootTasks,
    getChildren,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

export const useTask = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTask must be used within TaskProvider');
  }
  return context;
};
```

### packages/core/src/utils/time.ts

```typescript
import type { TimeTracking } from '../types';

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function calculateTotalTime(timeTracking: TimeTracking): number {
  let total = timeTracking.totalSeconds || 0;

  if (timeTracking.currentSessionStart) {
    const startTime = new Date(timeTracking.currentSessionStart);
    const now = new Date();
    const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
    total += elapsedSeconds;
  }

  return total;
}

export function isTracking(timeTracking: TimeTracking): boolean {
  return timeTracking.currentSessionStart !== null;
}
```

## Mobile App Implementation

### mobile/src/App.tsx

```typescript
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TaskProvider, ApiClient } from '@gtd/core';
import { AppNavigator } from './navigation/AppNavigator';
import { AuthProvider, useAuth } from './context/AuthContext';

const API_URL = __DEV__
  ? 'http://localhost:3000/api'
  : 'https://api.gtd-app.com/api';

const apiClient = new ApiClient(API_URL);

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <TaskProvider userId={user.id} apiClient={apiClient}>
      <AppNavigator />
    </TaskProvider>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <NavigationContainer>
            <AppContent />
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

### mobile/src/navigation/AppNavigator.tsx

```typescript
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TaskListScreen } from '../screens/TaskListScreen';
import { TaskDetailScreen } from '../screens/TaskDetailScreen';
import { GraphViewScreen } from '../screens/GraphViewScreen';
import { SearchScreen } from '../screens/SearchScreen';
import type { Task } from '@gtd/core';

export type RootStackParamList = {
  TaskList: undefined;
  TaskDetail: { taskId: string };
  GraphView: undefined;
  Search: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#667eea',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="TaskList"
        component={TaskListScreen}
        options={{
          title: 'Tasks',
          headerRight: () => <ViewSwitcher />,
        }}
      />
      <Stack.Screen
        name="TaskDetail"
        component={TaskDetailScreen}
        options={{
          title: 'Task Details',
        }}
      />
      <Stack.Screen
        name="GraphView"
        component={GraphViewScreen}
        options={{
          title: 'Graph View',
        }}
      />
      <Stack.Screen
        name="Search"
        component={SearchScreen}
        options={{
          title: 'Search Tasks',
        }}
      />
    </Stack.Navigator>
  );
};
```

## Screen Examples

### mobile/src/screens/TaskListScreen.tsx

```typescript
import { View, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useTask } from '@gtd/core';
import { TaskCard } from '../components/TaskCard';
import { FAB } from '../components/FAB';

export const TaskListScreen = ({ navigation }) => {
  const { getRootTasks, loading } = useTask();
  const rootTasks = getRootTasks();

  const handleTaskPress = (taskId: string) => {
    navigation.navigate('TaskDetail', { taskId });
  };

  const handleCreateTask = () => {
    // Show create task modal
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <FlashList
        data={rootTasks}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onPress={() => handleTaskPress(item.id)}
          />
        )}
        estimatedItemSize={80}
        contentContainerStyle={styles.list}
      />

      <FAB
        icon="plus"
        onPress={handleCreateTask}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    padding: 16,
  },
});
```

### mobile/src/components/TaskCard.tsx

```typescript
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Checkbox } from 'expo-checkbox';
import * as Haptics from 'expo-haptics';
import { useTask, formatDuration, calculateTotalTime } from '@gtd/core';
import type { Task } from '@gtd/core';
import { TimeTrackingButton } from './TimeTrackingButton';

interface TaskCardProps {
  task: Task;
  onPress: () => void;
}

export const TaskCard = ({ task, onPress }: TaskCardProps) => {
  const { updateTask, toggleTimeTracking, activeTimeTracking } = useTask();

  const isTracking = activeTimeTracking === task.id;
  const totalTime = calculateTotalTime(task.timeTracking);
  const timeDisplay = totalTime > 0 ? formatDuration(totalTime) : null;

  const handleToggleDone = async () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await updateTask(task.id, { done: !task.done });
  };

  const handleToggleTracking = async () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(
        isTracking
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Heavy
      );
    }
    await toggleTimeTracking(task.id);
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      android_ripple={{ color: '#e0e0e0' }}
    >
      <View style={styles.row}>
        <Checkbox
          value={task.done}
          onValueChange={handleToggleDone}
          color={task.done ? '#4CAF50' : '#667eea'}
          style={styles.checkbox}
        />

        {task.emoji && (
          <Text style={styles.emoji}>{task.emoji}</Text>
        )}

        <Text
          style={[
            styles.name,
            task.done && styles.nameDone,
          ]}
          numberOfLines={2}
        >
          {task.name}
        </Text>

        <TimeTrackingButton
          isTracking={isTracking}
          onPress={handleToggleTracking}
        />
      </View>

      {timeDisplay && (
        <Text
          style={[
            styles.time,
            isTracking && styles.timeActive,
          ]}
        >
          {isTracking ? '⏱ ' : '🕐 '}{timeDisplay}
        </Text>
      )}

      {Object.keys(task.customProperties).length > 0 && (
        <View style={styles.properties}>
          {Object.entries(task.customProperties).slice(0, 2).map(([key, value]) => (
            <View key={key} style={styles.property}>
              <Text style={styles.propertyKey}>{key}: </Text>
              <Text style={styles.propertyValue}>{String(value)}</Text>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardPressed: {
    opacity: 0.7,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
  },
  emoji: {
    fontSize: 24,
  },
  name: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  nameDone: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  time: {
    marginTop: 8,
    fontSize: 13,
    color: '#999',
    marginLeft: 48,
  },
  timeActive: {
    color: '#ff9800',
    fontWeight: '600',
  },
  properties: {
    marginTop: 8,
    marginLeft: 48,
    gap: 4,
  },
  property: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  propertyKey: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
  },
  propertyValue: {
    fontSize: 12,
    color: '#666',
  },
});
```

### mobile/src/components/TimeTrackingButton.tsx

```typescript
import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface TimeTrackingButtonProps {
  isTracking: boolean;
  onPress: () => void;
}

export const TimeTrackingButton = ({ isTracking, onPress }: TimeTrackingButtonProps) => {
  const scale = useSharedValue(1);
  const backgroundColor = useSharedValue(isTracking ? '#ff9800' : '#667eea');

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: withTiming(backgroundColor.value, { duration: 200 }),
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  // Update color when tracking state changes
  React.useEffect(() => {
    backgroundColor.value = isTracking ? '#ff9800' : '#667eea';
  }, [isTracking]);

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.button, animatedStyle]}
    >
      <MaterialCommunityIcons
        name={isTracking ? 'pause' : 'play'}
        size={18}
        color="#fff"
      />
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

## Navigation Setup

### Bottom Tab Navigator (Alternative)

```typescript
// mobile/src/navigation/TabNavigator.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TaskListScreen } from '../screens/TaskListScreen';
import { GraphViewScreen } from '../screens/GraphViewScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { ReportsScreen } from '../screens/ReportsScreen';

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#667eea',
        tabBarInactiveTintColor: '#999',
        headerStyle: {
          backgroundColor: '#667eea',
        },
        headerTintColor: '#fff',
      }}
    >
      <Tab.Screen
        name="Tasks"
        component={TaskListScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Graph"
        component={GraphViewScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="graph" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="magnify" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chart-bar" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
```

## Keeping UIs Consistent

### Design Token Sync

Create a script to sync design tokens:

```typescript
// scripts/sync-design-tokens.ts
import fs from 'fs';
import path from 'path';

// Read tokens from web
const webTokens = require('../frontend/src/theme/tokens.ts');

// Generate mobile tokens
const mobileTokens = {
  colors: webTokens.colors,
  spacing: webTokens.spacing,
  typography: {
    ...webTokens.typography,
    // Convert to React Native format
    h1: {
      fontSize: webTokens.typography.h1.size,
      fontWeight: webTokens.typography.h1.weight,
    },
    // ... rest of typography
  },
  borderRadius: webTokens.borderRadius,
};

// Write to mobile theme file
fs.writeFileSync(
  path.join(__dirname, '../mobile/src/theme/tokens.ts'),
  `export const tokens = ${JSON.stringify(mobileTokens, null, 2)};`
);

console.log('✅ Design tokens synced to mobile app');
```

Run before building:
```json
{
  "scripts": {
    "prebuild:mobile": "npm run sync-tokens",
    "build:mobile": "eas build"
  }
}
```

### Component Checklist

When adding a new feature, ensure you update:

1. ✅ **Shared logic** (`packages/core`) - Business logic, API calls
2. ✅ **Web UI** (`frontend/src/components`) - Web-specific rendering
3. ✅ **Mobile UI** (`mobile/src/components`) - Mobile-specific rendering
4. ✅ **Tests** - Both web and mobile
5. ✅ **Documentation** - Update design system docs
6. ✅ **Design tokens** - If new colors/spacing/typography

### Automated Testing

```typescript
// packages/core/__tests__/timeTracking.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { TaskProvider, useTask } from '../src/state/TaskContext';

describe('Time Tracking (Cross-Platform)', () => {
  it('should toggle time tracking on/off', async () => {
    const { result } = renderHook(() => useTask(), {
      wrapper: ({ children }) => (
        <TaskProvider userId="user-1" apiClient={mockApi}>
          {children}
        </TaskProvider>
      ),
    });

    // Start tracking
    await act(async () => {
      await result.current.toggleTimeTracking('task-1');
    });
    expect(result.current.activeTimeTracking).toBe('task-1');

    // Stop tracking
    await act(async () => {
      await result.current.toggleTimeTracking('task-1');
    });
    expect(result.current.activeTimeTracking).toBeNull();
  });

  it('should auto-stop other tasks when starting new one', async () => {
    const { result } = renderHook(() => useTask(), {
      wrapper: ({ children }) => (
        <TaskProvider userId="user-1" apiClient={mockApi}>
          {children}
        </TaskProvider>
      ),
    });

    // Start task 1
    await act(async () => {
      await result.current.startTimeTracking('task-1');
    });
    expect(result.current.activeTimeTracking).toBe('task-1');

    // Start task 2 (should stop task 1)
    await act(async () => {
      await result.current.startTimeTracking('task-2');
    });
    expect(result.current.activeTimeTracking).toBe('task-2');
    expect(mockApi.stopTimeTracking).toHaveBeenCalledWith('task-1');
  });
});
```

This test runs on both web and mobile, ensuring consistent behavior!

## Summary

This architecture gives you:

✅ **70-80% code sharing** - Most logic lives in `packages/core`
✅ **Native performance** - Platform-specific optimizations where needed
✅ **Single source of truth** - Business logic is shared, not duplicated
✅ **Easy maintenance** - Change once in core, applies everywhere
✅ **Consistent UX** - Shared design tokens and behavior
✅ **Type safety** - TypeScript across all packages
✅ **Fast development** - Hot reload on all platforms

When you add a feature:
1. Implement business logic in `packages/core` ✅
2. Implement web UI in `frontend/src` ✅
3. Implement mobile UI in `mobile/src` ✅
4. Tests ensure they behave identically ✅

One change → Three platforms updated consistently!
