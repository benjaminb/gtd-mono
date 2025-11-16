# GTD Mobile App

React Native mobile app for the GTD Task Manager, built with Expo.

## Features

- ✅ View and manage tasks
- ⏱️ Time tracking with play/pause
- 🔍 Search and filter tasks
- 📱 Native iOS and Android support
- 🎯 Haptic feedback
- 🌲 Hierarchical task view with expand/collapse
- 🔄 Real-time sync with backend

## Tech Stack

- **React Native** - Cross-platform mobile framework
- **Expo** - Development and build tooling
- **TypeScript** - Type safety
- **@gtd/core** - Shared business logic (monorepo package)
- **React Navigation** - Navigation library
- **Expo Haptics** - Native haptic feedback

## Getting Started

### Prerequisites

- Node.js >= 16
- npm or yarn
- Expo Go app on your phone (for testing)
- iOS Simulator (Mac only) or Android Emulator

### Installation

From the monorepo root:

```bash
npm install
```

### Development

#### Running on iOS Simulator (Mac only)

```bash
npm run dev:mobile
# Then press 'i' in the terminal
```

#### Running on Android Emulator

```bash
npm run dev:mobile
# Then press 'a' in the terminal
```

#### Running on Physical Device

1. Install the Expo Go app on your phone
2. Run `npm run dev:mobile`
3. Scan the QR code with Expo Go (Android) or Camera app (iOS)

### Configuration

Update the API URL in `src/config/api.ts`:

```typescript
const API_BASE_URL = __DEV__
  ? 'http://YOUR_COMPUTER_IP:3000/api' // Update for physical device
  : 'https://your-production-api.com/api';
```

**Important for Android Emulator:**
- Use `http://10.0.2.2:3000/api` to connect to localhost

**Important for iOS Simulator:**
- Use `http://localhost:3000/api`

**Important for Physical Device:**
- Use your computer's IP address (e.g., `http://192.168.1.100:3000/api`)
- Make sure your phone and computer are on the same network

## Project Structure

```
mobile/
├── src/
│   ├── components/      # Reusable UI components
│   │   └── TaskCard.tsx # Task display component
│   ├── screens/         # Screen components
│   │   └── TaskListScreen.tsx
│   ├── navigation/      # Navigation setup
│   │   └── AppNavigator.tsx
│   ├── config/          # App configuration
│   │   └── api.ts       # API client setup
│   └── hooks/           # Custom hooks (future)
├── App.tsx              # Root component
├── package.json
└── tsconfig.json
```

## Code Sharing

This app shares ~75% of its code with the web frontend through the `@gtd/core` package:

**Shared:**
- Business logic (TaskContext)
- API client
- Type definitions
- Utility functions (search, time formatting)

**Platform-specific:**
- UI components (React Native vs React DOM)
- Navigation (React Navigation vs React Router)
- Platform APIs (Haptics, etc.)

## Available Features

### TaskCard Component
- Displays task with emoji/icon
- Checkbox for completion
- Time tracking button (play/pause)
- Haptic feedback on interactions
- AI suggestion badge

### TaskListScreen
- FlatList for performance
- Search/filter bar
- Hierarchical task view
- Expand/collapse subtasks
- Real-time time tracking updates

## Next Steps

Recommended features to add:

1. **TaskDetailScreen** - View and edit task details
2. **CreateTaskScreen** - Create new tasks
3. **GraphView** - Mobile-optimized graph visualization
4. **Settings** - Configure API URL, theme, etc.
5. **iOS Widgets** - Quick glance at tasks
6. **Android Widgets** - Home screen task list
7. **Push Notifications** - Task reminders
8. **Offline Support** - Work without internet

## Building for Production

### iOS

```bash
cd mobile
npx expo build:ios
```

### Android

```bash
cd mobile
npx expo build:android
```

## Troubleshooting

### "Unable to resolve module @gtd/core"

Make sure you've installed dependencies from the monorepo root:

```bash
cd /path/to/gtd-mono
npm install
```

### "Network request failed"

- Check that the backend is running
- Verify the API URL in `src/config/api.ts`
- For physical devices, ensure same network connection

### Metro bundler cache issues

```bash
cd mobile
npx expo start --clear
```

## Contributing

When adding new features:

1. If it's business logic → add to `packages/core`
2. If it's UI → add to `mobile/src`
3. Keep platform-specific code minimal
4. Test on both iOS and Android

## License

Same as parent project
