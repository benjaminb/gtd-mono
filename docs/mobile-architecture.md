# Mobile App Architecture - iOS & Android

Complete architecture design for native GTD Task Manager mobile applications with maximum code sharing and native performance.

## Executive Summary

**Recommended Approach**: React Native with shared business logic and platform-specific optimizations

**Key Benefits**:
- 70-80% code sharing between web, iOS, and Android
- Native performance with platform-specific modules where needed
- Single language/framework knowledge (JavaScript/React)
- Shared business logic and state management
- Consistent UI/UX with platform-appropriate patterns

## Table of Contents

1. [Technology Stack Comparison](#technology-stack-comparison)
2. [Recommended Architecture](#recommended-architecture)
3. [Project Structure](#project-structure)
4. [Code Sharing Strategy](#code-sharing-strategy)
5. [Platform-Specific Features](#platform-specific-features)
6. [Component Design System](#component-design-system)
7. [Development Workflow](#development-workflow)
8. [Performance Optimizations](#performance-optimizations)

## Technology Stack Comparison

### Option 1: React Native (RECOMMENDED)

**Pros**:
- ✅ Shares React knowledge with existing web app
- ✅ 70-80% code reuse across all platforms
- ✅ Large ecosystem and community
- ✅ Hot reload for fast development
- ✅ Can drop down to native code when needed
- ✅ Expo for easier development and deployment
- ✅ Same state management (Context API/Redux)
- ✅ Familiar debugging tools

**Cons**:
- ❌ Slightly larger app size than pure native
- ❌ Some complex animations may need native modules
- ❌ Bridge can be a bottleneck for intensive operations

**Performance**: 90-95% of native for most use cases

### Option 2: Flutter

**Pros**:
- ✅ Excellent performance (compiled to native)
- ✅ Beautiful UI with Material/Cupertino widgets
- ✅ Single codebase for all platforms
- ✅ Hot reload

**Cons**:
- ❌ Requires learning Dart
- ❌ Cannot reuse web React code
- ❌ Need to rewrite all business logic
- ❌ Smaller ecosystem than React Native

**Performance**: 95-99% of native

### Option 3: Native (Swift + Kotlin)

**Pros**:
- ✅ 100% native performance
- ✅ Full platform API access
- ✅ Best possible user experience

**Cons**:
- ❌ Maintain 3 separate codebases (web, iOS, Android)
- ❌ 3x development time for features
- ❌ Harder to keep UI consistent
- ❌ Requires expertise in multiple languages

**Performance**: 100% native

### Decision Matrix

| Criteria | React Native | Flutter | Native |
|----------|--------------|---------|--------|
| Code Reuse | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐ |
| Performance | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Dev Speed | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| Maintainability | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| Learning Curve | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| Ecosystem | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

**Winner**: React Native - Best balance of code reuse, performance, and maintainability

## Recommended Architecture

### Monorepo Structure

```
gtd-mono/
├── packages/
│   ├── core/                    # Shared business logic
│   │   ├── api/                # API client (shared)
│   │   ├── models/             # Data models
│   │   ├── utils/              # Utility functions
│   │   ├── hooks/              # Shared React hooks
│   │   └── state/              # State management
│   │
│   ├── ui-components/          # Shared UI components
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── TaskCard/
│   │   └── index.js
│   │
│   └── native-modules/         # Platform-specific native code
│       ├── ios/
│       └── android/
│
├── frontend/                   # Web app (existing)
│   └── src/
│
├── mobile/                     # React Native app
│   ├── src/
│   │   ├── components/        # Mobile-specific components
│   │   ├── screens/           # Screen components
│   │   ├── navigation/        # React Navigation setup
│   │   ├── ios/               # iOS-specific code
│   │   └── android/           # Android-specific code
│   ├── ios/                   # iOS native project
│   └── android/               # Android native project
│
└── backend/                   # Backend (existing)
```

### Technology Stack

**Core**:
- React Native 0.73+
- TypeScript (for better maintainability)
- Expo (managed workflow with custom native modules)

**Navigation**:
- React Navigation 6.x (native stack navigator)

**State Management**:
- React Context API (matching web app)
- Optional: Zustand for more complex state

**Storage**:
- AsyncStorage for offline support
- SQLite for local database cache

**UI Components**:
- React Native Elements or NativeBase (base components)
- Custom design system matching web

**Performance**:
- React Native Reanimated 2 for smooth animations
- React Native Gesture Handler for native gestures
- Hermes engine for faster JS execution

**Development Tools**:
- Expo Dev Client
- Flipper for debugging
- Jest for testing
- Detox for E2E testing

## Project Structure

### Mobile App Structure

```
mobile/
├── src/
│   ├── App.tsx                 # Root component
│   ├── navigation/
│   │   ├── AppNavigator.tsx   # Main navigation
│   │   ├── TasksStack.tsx     # Tasks navigation
│   │   └── types.ts           # Navigation types
│   │
│   ├── screens/
│   │   ├── TaskListScreen.tsx
│   │   ├── TaskDetailScreen.tsx
│   │   ├── GraphViewScreen.tsx
│   │   ├── SearchScreen.tsx
│   │   └── ReportsScreen.tsx
│   │
│   ├── components/             # Mobile-specific components
│   │   ├── TaskCard.tsx
│   │   ├── GraphView.tsx      # Mobile-optimized graph
│   │   ├── TimeTrackingButton.tsx
│   │   └── EmojiPicker.tsx
│   │
│   ├── hooks/                  # Mobile-specific hooks
│   │   ├── useTimeTracking.ts
│   │   ├── useOfflineSync.ts
│   │   └── useHapticFeedback.ts
│   │
│   ├── theme/
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   └── spacing.ts
│   │
│   └── utils/
│       ├── platform.ts         # Platform detection
│       └── animations.ts
│
├── ios/                        # iOS native code
│   └── GTDTaskManager/
│       └── NativeModules/      # Custom native modules
│
├── android/                    # Android native code
│   └── app/src/main/java/
│       └── NativeModules/
│
├── app.json                    # Expo config
├── babel.config.js
├── metro.config.js
└── tsconfig.json
```

## Code Sharing Strategy

### 1. Shared Core Logic (packages/core)

**API Client** - 100% shared:
```typescript
// packages/core/api/client.ts
export class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async createTask(data: CreateTaskInput): Promise<Task> {
    const response = await fetch(`${this.baseURL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }

  async startTimeTracking(taskId: string): Promise<Task> {
    const response = await fetch(
      `${this.baseURL}/tasks/${taskId}/time-tracking/start`,
      { method: 'POST' }
    );
    return response.json();
  }

  // ... all other API methods
}
```

**State Management** - 100% shared:
```typescript
// packages/core/state/TaskContext.tsx
import { createContext, useContext, useState } from 'react';
import { ApiClient } from '../api/client';

// This file works in both web and mobile!
export const TaskContext = createContext(null);

export const TaskProvider = ({ children, apiClient }) => {
  const [tasks, setTasks] = useState([]);
  const [activeTimeTracking, setActiveTimeTracking] = useState(null);

  const toggleTimeTracking = async (taskId: string) => {
    if (activeTimeTracking === taskId) {
      const updated = await apiClient.stopTimeTracking(taskId);
      setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
      setActiveTimeTracking(null);
    } else {
      // Stop other task if tracking
      if (activeTimeTracking) {
        await apiClient.stopTimeTracking(activeTimeTracking);
      }
      const updated = await apiClient.startTimeTracking(taskId);
      setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
      setActiveTimeTracking(taskId);
    }
  };

  return (
    <TaskContext.Provider value={{ tasks, toggleTimeTracking, /* ... */ }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTask = () => useContext(TaskContext);
```

**Utility Functions** - 100% shared:
```typescript
// packages/core/utils/time.ts
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export function calculateTotalTime(timeTracking: TimeTracking): number {
  let total = timeTracking.totalSeconds;
  if (timeTracking.currentSessionStart) {
    const elapsed = Date.now() - new Date(timeTracking.currentSessionStart).getTime();
    total += Math.floor(elapsed / 1000);
  }
  return total;
}
```

### 2. Platform-Specific UI Components

**Web Version**:
```tsx
// frontend/src/components/Button.tsx
export const Button = ({ onPress, children, variant }) => {
  return (
    <button
      onClick={onPress}
      className={`btn btn-${variant}`}
    >
      {children}
    </button>
  );
};
```

**Mobile Version**:
```tsx
// mobile/src/components/Button.tsx
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export const Button = ({ onPress, children, variant }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.button, styles[variant]]}
      activeOpacity={0.7}
    >
      <Text style={styles.text}>{children}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primary: {
    backgroundColor: '#667eea',
  },
  text: {
    color: '#fff',
    fontWeight: '600',
  },
});
```

### 3. Cross-Platform Components (packages/ui-components)

Some components can be 90% shared with small platform adaptations:

```tsx
// packages/ui-components/TaskCard/TaskCard.tsx
import { Platform } from 'react-native';

export const TaskCard = ({ task, onPress, onToggleTracking }) => {
  const timeDisplay = useMemo(() => {
    const total = calculateTotalTime(task.timeTracking);
    return formatDuration(total);
  }, [task.timeTracking]);

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <Checkbox
          value={task.done}
          onValueChange={() => onToggleDone(task.id)}
        />

        {task.emoji && <Text style={styles.emoji}>{task.emoji}</Text>}

        <Text style={styles.name}>{task.name}</Text>

        {Platform.OS === 'ios' && (
          <Haptic onPress={() => onToggleTracking(task.id)}>
            <TimeTrackingButton isTracking={task.isTracking} />
          </Haptic>
        )}

        {Platform.OS === 'android' && (
          <TimeTrackingButton
            isTracking={task.isTracking}
            onPress={() => onToggleTracking(task.id)}
          />
        )}
      </View>

      {timeDisplay && (
        <Text style={styles.time}>{timeDisplay}</Text>
      )}
    </Pressable>
  );
};
```

## Platform-Specific Features

### iOS-Specific Optimizations

**1. Haptic Feedback**:
```typescript
// mobile/src/utils/haptics.ios.ts
import * as Haptics from 'expo-haptics';

export const playTimeTrackingStart = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};

export const playTimeTrackingStop = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};

export const playTaskComplete = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};
```

**2. 3D Touch / Haptic Touch**:
```tsx
// Quick actions for tasks
<ContextMenu
  actions={[
    { title: 'Start Timer', icon: 'play' },
    { title: 'Mark Done', icon: 'checkmark' },
    { title: 'Edit', icon: 'pencil' },
  ]}
  onPress={handleContextAction}
>
  <TaskCard task={task} />
</ContextMenu>
```

**3. Widgets** (iOS 14+):
```swift
// ios/Widgets/TaskWidget.swift
struct TaskWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(
            kind: "TaskWidget",
            provider: TaskTimelineProvider()
        ) { entry in
            TaskWidgetView(entry: entry)
        }
        .configurationDisplayName("Active Tasks")
        .description("See your currently tracked task")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
```

**4. Siri Shortcuts**:
```swift
// ios/SiriIntents/StartTaskIntent.swift
class StartTaskIntentHandler: NSObject, StartTaskIntentHandling {
    func handle(intent: StartTaskIntent, completion: @escaping (StartTaskIntentResponse) -> Void) {
        // Start time tracking via bridge
        RNBridge.startTimeTracking(taskId: intent.taskId)
        completion(StartTaskIntentResponse.success())
    }
}
```

### Android-Specific Optimizations

**1. Material Design 3**:
```tsx
// mobile/src/theme/android.ts
export const androidTheme = {
  colors: {
    primary: '#667eea',
    surface: '#ffffff',
    background: '#f5f5f5',
    // Material You dynamic colors
    ...MD3Colors,
  },
  elevation: {
    card: 2,
    modal: 8,
  },
};
```

**2. Back Handler**:
```tsx
// mobile/src/navigation/AppNavigator.android.tsx
import { BackHandler } from 'react-native';

useEffect(() => {
  const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return true;
    }
    return false;
  });

  return () => backHandler.remove();
}, [navigation]);
```

**3. Widgets** (Android):
```kotlin
// android/app/src/main/java/widgets/TaskWidget.kt
class TaskWidget : GlanceAppWidget() {
    override suspend fun provideGlance(context: Context, id: GlanceId) {
        provideContent {
            TaskWidgetContent()
        }
    }
}
```

**4. Live Activities / Quick Settings Tile**:
```kotlin
// android/app/src/main/java/tiles/TimeTrackingTile.kt
class TimeTrackingTile : TileService() {
    override fun onClick() {
        // Toggle time tracking
        sendBroadcast(Intent("com.gtd.TOGGLE_TRACKING"))
    }
}
```

## Component Design System

### Design Tokens (Shared)

```typescript
// packages/core/theme/tokens.ts
export const tokens = {
  colors: {
    primary: '#667eea',
    primaryDark: '#5568d3',
    secondary: '#764ba2',
    success: '#4CAF50',
    warning: '#ff9800',
    error: '#f44336',
    text: {
      primary: '#333',
      secondary: '#666',
      disabled: '#999',
    },
    background: {
      primary: '#ffffff',
      secondary: '#f5f5f5',
      tertiary: '#e0e0e0',
    },
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },

  typography: {
    h1: { size: 32, weight: 'bold' },
    h2: { size: 24, weight: 'bold' },
    h3: { size: 20, weight: '600' },
    body: { size: 16, weight: 'normal' },
    caption: { size: 13, weight: 'normal' },
  },

  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    full: 9999,
  },
};
```

### Component Mapping

| Web Component | Mobile Equivalent | Notes |
|---------------|-------------------|-------|
| `<div>` | `<View>` | Container |
| `<button>` | `<TouchableOpacity>` / `<Pressable>` | Interactive |
| `<input>` | `<TextInput>` | Text input |
| `<span>` | `<Text>` | Text |
| `<svg>` | `react-native-svg` | Graphics |
| CSS | StyleSheet | Styling |

### Responsive Layouts

```typescript
// packages/core/utils/responsive.ts
import { Dimensions, Platform } from 'react-native';

export const breakpoints = {
  phone: 0,
  tablet: 768,
  desktop: 1024,
};

export const useResponsive = () => {
  const { width } = Dimensions.get('window');

  return {
    isPhone: width < breakpoints.tablet,
    isTablet: width >= breakpoints.tablet && width < breakpoints.desktop,
    isDesktop: width >= breakpoints.desktop,
    width,
  };
};

// Usage in component
const { isPhone, isTablet } = useResponsive();

<View style={[
  styles.container,
  isPhone && styles.containerPhone,
  isTablet && styles.containerTablet,
]} />
```

## Development Workflow

### 1. Feature Development Process

**Step 1**: Design feature in shared core
```typescript
// packages/core/features/timeTracking.ts
export const useTimeTracking = (apiClient) => {
  const [active, setActive] = useState(null);

  const toggle = async (taskId) => {
    // Shared logic works everywhere
  };

  return { active, toggle };
};
```

**Step 2**: Implement web UI
```tsx
// frontend/src/components/TimeTrackingButton.tsx
export const TimeTrackingButton = ({ taskId }) => {
  const { active, toggle } = useTimeTracking(apiClient);
  return <button onClick={() => toggle(taskId)}>...</button>;
};
```

**Step 3**: Implement mobile UI
```tsx
// mobile/src/components/TimeTrackingButton.tsx
export const TimeTrackingButton = ({ taskId }) => {
  const { active, toggle } = useTimeTracking(apiClient);
  return (
    <TouchableOpacity onPress={() => toggle(taskId)}>
      {/* Mobile UI */}
    </TouchableOpacity>
  );
};
```

### 2. Keeping UIs in Sync

**Design System Documentation**:
```markdown
# Time Tracking Button

## Behavior (All Platforms)
- Shows play icon when not tracking
- Shows pause icon when tracking
- Orange color when tracking (#ff9800)
- Purple color when idle (#667eea)

## Web Implementation
- SVG icons
- CSS transitions
- Hover states

## Mobile Implementation
- React Native Vector Icons
- Reanimated 2 animations
- Haptic feedback on iOS
- Ripple effect on Android

## States
1. Idle: Play icon, purple background
2. Tracking: Pause icon, orange background
3. Loading: Spinner
```

**Automated Testing Ensures Consistency**:
```typescript
// packages/core/__tests__/timeTracking.test.ts
describe('Time Tracking', () => {
  it('should toggle between start and stop', async () => {
    // Test runs on both web and mobile
    const { result } = renderHook(() => useTimeTracking(mockApi));

    await act(() => result.current.toggle('task-1'));
    expect(result.current.active).toBe('task-1');

    await act(() => result.current.toggle('task-1'));
    expect(result.current.active).toBeNull();
  });
});
```

### 3. Platform-Specific Testing

**Web Tests**:
```bash
cd frontend && npm test
```

**Mobile Tests**:
```bash
cd mobile && npm test
npm run test:ios
npm run test:android
npm run test:e2e
```

## Performance Optimizations

### 1. List Rendering

**Problem**: Rendering 1000+ tasks is slow

**Solution**: Virtual lists

```tsx
// mobile/src/screens/TaskListScreen.tsx
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={tasks}
  renderItem={({ item }) => <TaskCard task={item} />}
  estimatedItemSize={80}
  // 60fps scrolling even with 10,000 tasks
/>
```

### 2. Graph View Optimization

**Problem**: SVG graph rendering is expensive on mobile

**Solution**: Use react-native-skia for GPU-accelerated rendering

```tsx
// mobile/src/components/GraphView.tsx
import { Canvas, Circle, Line } from '@shopify/react-native-skia';

<Canvas style={{ flex: 1 }}>
  {nodes.map(node => (
    <Circle
      key={node.id}
      cx={node.x}
      cy={node.y}
      r={25}
      color={node.done ? '#4CAF50' : '#667eea'}
    />
  ))}
  {edges.map(edge => (
    <Line
      key={edge.id}
      p1={{ x: edge.from.x, y: edge.from.y }}
      p2={{ x: edge.to.x, y: edge.to.y }}
      color="#667eea"
      strokeWidth={2}
    />
  ))}
</Canvas>
```

### 3. Offline Support

```typescript
// mobile/src/hooks/useOfflineSync.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingActions, setPendingActions] = useState([]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);

      if (state.isConnected && pendingActions.length > 0) {
        // Sync pending actions
        syncPendingActions();
      }
    });

    return unsubscribe;
  }, []);

  const queueAction = async (action) => {
    if (isOnline) {
      return await executeAction(action);
    } else {
      // Queue for later
      setPendingActions(prev => [...prev, action]);
      await AsyncStorage.setItem('pending', JSON.stringify([...pendingActions, action]));
    }
  };

  return { isOnline, queueAction };
};
```

### 4. Image/Asset Optimization

```typescript
// mobile/src/utils/assets.ts
import FastImage from 'react-native-fast-image';

// Cached, optimized images
<FastImage
  source={{ uri: emojiUrl, priority: FastImage.priority.high }}
  style={styles.emoji}
  resizeMode={FastImage.resizeMode.contain}
/>
```

## Migration Path

### Phase 1: Setup (Week 1-2)
1. Set up monorepo with Yarn workspaces/npm workspaces
2. Extract shared code to `packages/core`
3. Set up React Native project with Expo
4. Configure TypeScript

### Phase 2: Core Features (Week 3-6)
1. Implement navigation
2. Port TaskListScreen
3. Port TaskDetailScreen
4. Implement time tracking
5. Add offline support

### Phase 3: Advanced Features (Week 7-10)
1. GraphView optimization
2. Search implementation
3. Reports/Analytics
4. Property schemas

### Phase 4: Platform Polish (Week 11-12)
1. iOS-specific features (widgets, Siri)
2. Android-specific features (widgets, tiles)
3. Performance optimization
4. App store preparation

## Cost/Benefit Analysis

### React Native Approach

**Development Time**:
- Initial setup: 2 weeks
- Core features: 4 weeks
- Advanced features: 4 weeks
- Polish: 2 weeks
- **Total: 12 weeks**

**Ongoing Maintenance**:
- Feature addition: ~1.5x web development time
- Bug fix: ~1.2x web development time
- Code sharing: ~75%

### Pure Native Approach

**Development Time**:
- iOS app: 10 weeks
- Android app: 10 weeks
- **Total: 20 weeks** (if done sequentially)

**Ongoing Maintenance**:
- Feature addition: ~3x web development time
- Bug fix: ~3x web development time
- Code sharing: ~0%

### Recommendation

**React Native saves**:
- 40% initial development time
- 50% ongoing maintenance effort
- Maintains 90%+ native performance
- Keeps team focused on single tech stack

This approach maximizes your goals of native performance, maintainability, and consistency across platforms.
