# Mobile Development Guide

Complete guide for developing and testing the GTD mobile app on iOS and Android, optimized for Apple Silicon (M1/M2/M3 Macs).

## 📱 Overview

The GTD mobile app is built with:
- **React Native** - Cross-platform mobile framework
- **Expo** - Development toolchain and runtime
- **React Navigation** - Navigation library
- **Axios** - HTTP client for API communication
- **AsyncStorage** - Local storage for authentication tokens

## 🚀 Quick Start

```bash
# 1. Run the setup script (macOS/Apple Silicon)
./scripts/setup-mobile.sh

# 2. Start the backend API server
cd backend/database
npm install
npm start

# 3. Start the mobile app
cd mobile
npm start

# 4. Choose your platform:
# Press 'i' for iOS Simulator
# Press 'a' for Android Emulator
# Scan QR code with Expo Go for physical device
```

---

## 📋 Prerequisites

### Required for All Development

- **macOS** (for iOS development)
- **Node.js 18+** - https://nodejs.org/
- **npm** (comes with Node.js)
- **Watchman** (recommended) - `brew install watchman`

### For iOS Development

- **Xcode 14+** - Install from App Store
- **Xcode Command Line Tools**
- **iOS Simulator** (included with Xcode)
- **CocoaPods** - `sudo gem install cocoapods`

### For Android Development

- **Android Studio** - https://developer.android.com/studio
- **Android SDK** (included with Android Studio)
- **Java 17** - `brew install openjdk@17`
- **Android Emulator** (set up via Android Studio)

### Verification

Check your setup:

```bash
# Node.js
node -v  # Should show v18.x.x or higher
npm -v   # Should show 9.x.x or higher

# Watchman (optional but recommended)
watchman version

# iOS tools
xcodebuild -version
pod --version

# Android tools
java -version  # Should show 17.x.x
```

---

## 🛠️ Setup Instructions

### Automated Setup (Recommended)

Use the setup script for guided installation:

```bash
./scripts/setup-mobile.sh
```

The script will:
1. ✅ Check for required tools (Node.js, npm, Watchman)
2. ✅ Verify platform-specific requirements (Xcode, Android Studio)
3. ✅ Install mobile dependencies
4. ✅ Create `.env` file with your local IP
5. ✅ Provide next steps

### Manual Setup

If you prefer manual setup or need more control:

```bash
# 1. Navigate to mobile directory
cd mobile

# 2. Install dependencies
npm install

# 3. Create .env file
cp .env.example .env

# 4. Get your local IP address
# macOS:
ipconfig getifaddr en0

# Linux:
hostname -I | awk '{print $1}'

# 5. Edit .env and update EXPO_PUBLIC_API_URL
# For physical devices only - simulators/emulators work automatically
nano .env
```

---

## 📱 iOS Development

### Setting Up iOS Simulator

1. **Install Xcode** from the App Store

2. **Accept License Agreement:**
   ```bash
   sudo xcodebuild -license accept
   ```

3. **Install Command Line Tools:**
   ```bash
   xcode-select --install
   ```

4. **List Available Simulators:**
   ```bash
   xcrun simctl list devices available
   ```

### Running on iOS Simulator

**Method 1: Using Expo CLI (Recommended)**

```bash
cd mobile
npm start

# In the Expo DevTools (browser opens automatically):
# Press 'i' to open iOS Simulator
```

**Method 2: Direct Command**

```bash
npm run ios
```

**Method 3: Specific Simulator**

```bash
# List available simulators
xcrun simctl list devices

# Run on specific device
npx expo run:ios --device "iPhone 15 Pro"
```

### iOS Troubleshooting

**Simulator Won't Start:**
```bash
# Kill existing simulators
killall Simulator

# Reset simulator
xcrun simctl erase all

# Restart
npm run ios
```

**Port 8081 Already in Use:**
```bash
# Kill Metro bundler
lsof -ti:8081 | xargs kill -9

# Restart app
npm start
```

**Build Errors:**
```bash
# Clear Xcode build cache
cd ios
xcodebuild clean
pod deintegrate
pod install
cd ..
npm run ios
```

**Network Issues:**
- iOS Simulator uses `localhost:3000` automatically
- Make sure backend API is running on port 3000
- Check `mobile/src/config/api.js` for endpoint configuration

---

## 🤖 Android Development

### Setting Up Android Emulator

1. **Install Android Studio** from https://developer.android.com/studio

2. **Configure Environment Variables:**

   Add to your `~/.zshrc` or `~/.bash_profile`:
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   ```

   Then reload:
   ```bash
   source ~/.zshrc  # or ~/.bash_profile
   ```

3. **Create Android Virtual Device (AVD):**

   Open Android Studio → Tools → Device Manager → Create Device

   Recommended configuration:
   - Device: Pixel 7 Pro
   - System Image: API 33 (Android 13) or API 34 (Android 14)
   - Graphics: Automatic

4. **Verify Setup:**
   ```bash
   # List available emulators
   emulator -list-avds

   # Check adb
   adb devices
   ```

### Running on Android Emulator

**Method 1: Using Expo CLI (Recommended)**

```bash
cd mobile
npm start

# In the Expo DevTools:
# Press 'a' to open Android Emulator
```

**Method 2: Direct Command**

```bash
npm run android
```

**Method 3: Start Emulator First**

```bash
# List available AVDs
emulator -list-avds

# Start specific emulator
emulator -avd Pixel_7_Pro_API_33 &

# Then run app
npm run android
```

### Android Troubleshooting

**Emulator Won't Start:**
```bash
# Check if emulator is running
adb devices

# Kill existing emulator
adb emu kill

# Restart emulator
emulator -avd YOUR_AVD_NAME
```

**"Unable to load script" Error:**
```bash
# Make sure Metro bundler is running
npm start

# In another terminal
npm run android

# Or restart with cache clear
npm start -- --reset-cache
```

**"INSTALL_FAILED_INSUFFICIENT_STORAGE":**
```bash
# Wipe emulator data
emulator -avd YOUR_AVD_NAME -wipe-data
```

**Connection Refused (Network Issues):**
- Android Emulator uses `10.0.2.2:3000` to access host's localhost
- This is configured automatically in `mobile/src/config/api.js`
- Verify backend is running: `curl http://localhost:3000`
- Check emulator can reach host: `adb shell ping 10.0.2.2`

**Reverse Proxy (Alternative Method):**
```bash
# Forward emulator port to host
adb reverse tcp:3000 tcp:3000

# Now emulator can use localhost:3000
```

---

## 📲 Physical Device Testing

### iOS Physical Device

1. **Connect iPhone via USB or WiFi**

2. **Install Expo Go:**
   - Download from App Store
   - Open Expo Go app

3. **Start Development Server:**
   ```bash
   cd mobile
   npm start
   ```

4. **Connect Device:**
   - **Same WiFi Network:** Scan QR code in Expo Go
   - **Different Network:** Use tunnel mode:
     ```bash
     npm start -- --tunnel
     ```

5. **Update API URL:**
   ```bash
   # Edit mobile/.env
   EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_IP:3000

   # Find your IP:
   ipconfig getifaddr en0
   ```

### Android Physical Device

1. **Enable Developer Mode:**
   - Settings → About Phone → Tap "Build Number" 7 times
   - Settings → Developer Options → Enable "USB Debugging"

2. **Install Expo Go:**
   - Download from Google Play Store

3. **Connect via USB or Wireless:**

   **USB Method:**
   ```bash
   # Connect phone via USB
   adb devices  # Should show your device

   # Start app
   cd mobile
   npm start
   # Press 'a' in terminal
   ```

   **WiFi Method:**
   ```bash
   # Connect phone and computer to same WiFi
   cd mobile
   npm start
   # Scan QR code in Expo Go app
   ```

4. **Update API URL:**
   ```bash
   # Edit mobile/.env
   EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_IP:3000
   ```

### Physical Device Troubleshooting

**Can't Connect to API:**
```bash
# 1. Verify both devices on same network
ipconfig getifaddr en0  # Your computer's IP

# 2. Check backend is accessible
curl http://YOUR_IP:3000

# 3. Update .env file
echo "EXPO_PUBLIC_API_URL=http://YOUR_IP:3000" > mobile/.env

# 4. Restart app
npm start
```

**QR Code Won't Scan:**
- Use tunnel mode: `npm start -- --tunnel`
- Manually enter URL in Expo Go
- Check firewall settings

---

## 🔧 Configuration

### API Endpoints

The mobile app automatically detects the correct API endpoint:

**File:** `mobile/src/config/api.js`

```javascript
// iOS Simulator
http://localhost:3000

// Android Emulator
http://10.0.2.2:3000

// Physical Devices
http://YOUR_LOCAL_IP:3000  // From .env file
```

### Environment Variables

**File:** `mobile/.env`

```bash
# API Configuration
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000

# For simulators/emulators, this is detected automatically
# For physical devices, set this to your computer's local IP
```

### Finding Your Local IP

**macOS:**
```bash
ipconfig getifaddr en0
```

**Linux:**
```bash
hostname -I | awk '{print $1}'
```

**Windows:**
```bash
ipconfig
# Look for "IPv4 Address" under your active network adapter
```

---

## 📂 Project Structure

```
mobile/
├── App.js                          # Main app component with navigation
├── package.json                    # Dependencies and scripts
├── .env                           # Environment variables (gitignored)
├── .env.example                   # Environment template
├── app.json                       # Expo configuration
├── babel.config.js                # Babel configuration
└── src/
    ├── config/
    │   └── api.js                 # API endpoint configuration
    ├── services/
    │   └── api.js                 # Axios wrapper with auth
    └── screens/
        ├── HomeScreen.js          # Home/welcome screen
        └── SubscriptionPlansScreen.js  # Subscription plans
```

---

## 🔌 API Integration

### API Service

**File:** `mobile/src/services/api.js`

The app uses an Axios-based API service with automatic auth token injection:

```javascript
import { apiService } from '../services/api';

// Get subscription plans
const { plans } = await apiService.getSubscriptionPlans();

// Get current subscription (requires auth)
const { plan } = await apiService.getCurrentSubscription();

// Create subscription (requires auth)
await apiService.createSubscription(planId);
```

### Authentication

Tokens are stored in AsyncStorage and automatically added to requests:

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Store auth token
await AsyncStorage.setItem('authToken', token);

// Token is automatically added to all API requests via interceptor
```

### Available API Methods

```javascript
// Subscription endpoints
apiService.getSubscriptionPlans()
apiService.getCurrentSubscription()
apiService.createSubscription(planId)
apiService.cancelSubscription()

// Custom requests
apiService.get('/custom-endpoint')
apiService.post('/custom-endpoint', data)
```

---

## 🎨 Navigation

The app uses React Navigation with a stack navigator:

**File:** `App.js`

```javascript
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="SubscriptionPlans" component={SubscriptionPlansScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

### Adding New Screens

1. Create screen component in `src/screens/`
2. Import in `App.js`
3. Add to Stack.Navigator

Example:
```javascript
import NewScreen from './src/screens/NewScreen';

<Stack.Screen
  name="NewScreen"
  component={NewScreen}
  options={{ title: 'My New Screen' }}
/>
```

### Navigating Between Screens

```javascript
// In any screen component
export default function MyScreen({ navigation }) {
  const goToPlans = () => {
    navigation.navigate('SubscriptionPlans');
  };

  const goBack = () => {
    navigation.goBack();
  };

  return (
    <Button title="View Plans" onPress={goToPlans} />
  );
}
```

---

## 🧪 Testing

### Manual Testing Workflow

1. **Start Backend:**
   ```bash
   cd backend/database
   npm start
   ```

2. **Start Mobile App:**
   ```bash
   cd mobile
   npm start
   ```

3. **Test on Platform:**
   - iOS: Press 'i' or `npm run ios`
   - Android: Press 'a' or `npm run android`

4. **Test API Connection:**
   - Open Home screen
   - Verify API URL is correct
   - Navigate to Subscription Plans
   - Should load plans from backend

### Testing Checklist

- [ ] Home screen loads
- [ ] API connection info displays correctly
- [ ] Navigation to Subscription Plans works
- [ ] Subscription plans load from API
- [ ] Plans display with correct pricing
- [ ] Selecting a plan shows confirmation dialog
- [ ] Network errors show user-friendly alerts
- [ ] App works offline (cached data)
- [ ] Physical device can reach API

### Debug Tools

**React Native Debugger:**
```bash
# Install globally
brew install --cask react-native-debugger

# Start debugger (before starting app)
open "rndebugger://set-debugger-loc?host=localhost&port=8081"
```

**Expo DevTools:**
- Opens automatically when running `npm start`
- Shows logs, errors, performance
- Access at http://localhost:19002

**Console Logs:**
```bash
# iOS Simulator logs
xcrun simctl spawn booted log stream --predicate 'eventMessage contains "GTD"'

# Android Emulator logs
adb logcat *:S ReactNative:V ReactNativeJS:V
```

---

## 🐛 Common Issues

### "Network request failed"

**Symptoms:** Can't connect to API from mobile app

**Solutions:**
1. Verify backend is running: `curl http://localhost:3000`
2. Check correct endpoint for your platform:
   - iOS Simulator: localhost:3000
   - Android Emulator: 10.0.2.2:3000
   - Physical device: Your local IP
3. Update `.env` file if using physical device
4. Restart Metro bundler: `npm start -- --reset-cache`

### "Unable to resolve module"

**Symptoms:** Import errors, missing modules

**Solutions:**
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npm start -- --reset-cache
```

### "Build failed" on iOS

**Symptoms:** Xcode build errors

**Solutions:**
```bash
cd ios
pod deintegrate
pod install
cd ..
npm run ios
```

### "Command failed" on Android

**Symptoms:** Gradle build errors

**Solutions:**
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### Metro Bundler Issues

**Symptoms:** "Metro bundler has encountered an error"

**Solutions:**
```bash
# Kill Metro
lsof -ti:8081 | xargs kill -9

# Clear all caches
rm -rf node_modules
npm install
watchman watch-del-all
npm start -- --reset-cache
```

### Simulator/Emulator Performance

**Slow performance:**

**iOS:**
- Use newer simulator devices (iPhone 14+)
- Close other apps
- Restart simulator

**Android:**
- Allocate more RAM in AVD settings (4GB minimum)
- Use x86_64 system images (faster than ARM)
- Enable hardware acceleration
- Use Google Play Store images instead of Google APIs

---

## 📦 Scripts Reference

**File:** `mobile/package.json`

```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  }
}
```

### Custom Scripts

Add these to `package.json` for convenience:

```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "clear": "npm start -- --reset-cache",
    "tunnel": "npm start -- --tunnel",
    "ios:device": "npm run ios -- --device",
    "android:device": "npm run android -- --device"
  }
}
```

---

## 🚢 Building for Production

### iOS Production Build

**Prerequisites:**
- Apple Developer Account
- App Store Connect app created
- Certificates and provisioning profiles

**Build with EAS:**
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure

# Build for iOS
eas build --platform ios

# Submit to App Store
eas submit --platform ios
```

### Android Production Build

**Prerequisites:**
- Google Play Console account
- App created in console
- Signing key

**Build with EAS:**
```bash
# Build for Android
eas build --platform android

# Submit to Google Play
eas submit --platform android
```

### Standalone APK (Android)

```bash
# Build APK for testing
eas build --platform android --profile preview

# Download and install on device
adb install path/to/app.apk
```

---

## 🔐 Security Considerations

### API Security

1. **Always use HTTPS in production:**
   ```javascript
   // mobile/.env (production)
   EXPO_PUBLIC_API_URL=https://api.yourdomain.com
   ```

2. **Store tokens securely:**
   - Use AsyncStorage for development
   - Consider expo-secure-store for production
   - Never commit tokens to git

3. **Implement token refresh:**
   ```javascript
   // Add token refresh logic in api.js interceptors
   api.interceptors.response.use(
     response => response,
     async error => {
       if (error.response?.status === 401) {
         // Refresh token logic here
       }
       return Promise.reject(error);
     }
   );
   ```

### Data Privacy

- Don't log sensitive data in production
- Implement proper user authentication
- Follow platform-specific privacy guidelines
- Add privacy policy and terms of service

---

## 📚 Additional Resources

### Official Documentation

- **React Native:** https://reactnative.dev/
- **Expo:** https://docs.expo.dev/
- **React Navigation:** https://reactnavigation.org/
- **Axios:** https://axios-http.com/

### Apple Silicon Optimization

- **Rosetta 2:** May be needed for some tools
  ```bash
  softwareupdate --install-rosetta
  ```
- **Homebrew:** Use ARM version for best performance
- **Android Emulator:** Use ARM64 system images when available

### Useful Commands

```bash
# Check architecture
uname -m  # Should show "arm64" on Apple Silicon

# Install Rosetta (if needed)
softwareupdate --install-rosetta

# Reset iOS Simulator
xcrun simctl erase all

# Reset Android Emulator
emulator -avd YOUR_AVD -wipe-data

# View React Native logs
npx react-native log-ios
npx react-native log-android
```

---

## 🆘 Getting Help

1. **Check logs first:**
   - Metro bundler terminal
   - Expo DevTools console
   - Device/simulator system logs

2. **Common fixes:**
   - Restart Metro: Kill port 8081 and `npm start`
   - Clear cache: `npm start -- --reset-cache`
   - Reinstall: `rm -rf node_modules && npm install`

3. **Documentation:**
   - `/docs/LOCAL_DEVELOPMENT.md` - Backend setup
   - `/backend/database/SUBSCRIPTION_SETUP.md` - API details
   - This guide for mobile-specific issues

4. **Community:**
   - React Native Discord
   - Expo Forums
   - Stack Overflow (tag: react-native, expo)

---

## 🎯 Next Steps

Once you have the mobile app running:

1. **Explore the Code:**
   - Review `mobile/src/screens/` for UI components
   - Check `mobile/src/services/api.js` for API integration
   - Understand navigation in `mobile/App.js`

2. **Customize the App:**
   - Add new screens for tasks, projects, contexts
   - Implement user authentication flow
   - Add offline data synchronization
   - Customize UI/UX with your branding

3. **Add Features:**
   - Task creation and management
   - Project organization
   - Time tracking
   - AI-powered suggestions
   - Push notifications

4. **Prepare for Production:**
   - Set up EAS Build
   - Configure app icons and splash screens
   - Add analytics and crash reporting
   - Implement proper error handling
   - Write automated tests

---

Happy mobile development! 📱🚀
