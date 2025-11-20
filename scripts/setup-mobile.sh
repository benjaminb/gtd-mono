#!/bin/bash

# Mobile App Setup Script for Apple Silicon
# This script sets up the mobile development environment optimized for M1/M2/M3 Macs

set -e

echo "📱 GTD Mobile App Setup (Apple Silicon)"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}❌ This script is designed for macOS (Apple Silicon)${NC}"
    echo "For other platforms, please follow the manual setup instructions."
    exit 1
fi

# Check if running on Apple Silicon
if [[ $(uname -m) != "arm64" ]]; then
    echo -e "${YELLOW}⚠️  Warning: This script is optimized for Apple Silicon (M1/M2/M3)${NC}"
    echo "You appear to be running on Intel. The setup will continue but may not be optimized."
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo -e "${GREEN}✓ Running on Apple Silicon${NC}"
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    echo "Or use Homebrew: brew install node"
    exit 1
fi

echo -e "${GREEN}✓ Node.js is installed ($(node -v))${NC}"

# Check for npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ npm is installed ($(npm -v))${NC}"

# Check for Watchman (recommended for React Native)
if ! command -v watchman &> /dev/null; then
    echo -e "${YELLOW}⚠️  Watchman is not installed (recommended)${NC}"
    echo "Install with: brew install watchman"
    read -p "Continue without Watchman? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✓ Watchman is installed${NC}"
fi

echo ""

# Ask what platform to set up
echo "Which platform would you like to set up?"
echo "1) iOS Simulator (requires Xcode)"
echo "2) Android Emulator"
echo "3) Both"
echo "4) Skip (manual setup)"
echo ""
read -p "Enter your choice (1-4): " platform_choice

case $platform_choice in
    1|3)
        echo ""
        echo "🍎 iOS Setup"
        echo "============"

        # Check for Xcode
        if ! command -v xcodebuild &> /dev/null; then
            echo -e "${YELLOW}⚠️  Xcode is not installed${NC}"
            echo "Please install Xcode from the App Store"
            echo "After installation, run: sudo xcodebuild -license accept"
        else
            XCODE_VERSION=$(xcodebuild -version | head -n 1)
            echo -e "${GREEN}✓ Xcode is installed ($XCODE_VERSION)${NC}"

            # Check for Command Line Tools
            if ! xcode-select -p &> /dev/null; then
                echo "Installing Xcode Command Line Tools..."
                xcode-select --install
            else
                echo -e "${GREEN}✓ Xcode Command Line Tools installed${NC}"
            fi

            # Check for iOS Simulator
            if xcrun simctl list devices | grep -q "iPhone"; then
                echo -e "${GREEN}✓ iOS Simulators available${NC}"
                echo ""
                echo "Available iOS Simulators:"
                xcrun simctl list devices available | grep iPhone | head -5
            fi
        fi

        # Check for CocoaPods
        if ! command -v pod &> /dev/null; then
            echo -e "${YELLOW}⚠️  CocoaPods not installed${NC}"
            echo "Installing CocoaPods..."
            sudo gem install cocoapods
        else
            echo -e "${GREEN}✓ CocoaPods installed ($(pod --version))${NC}"
        fi
        ;;
esac

case $platform_choice in
    2|3)
        echo ""
        echo "🤖 Android Setup"
        echo "================"

        # Check for Java
        if ! command -v java &> /dev/null; then
            echo -e "${YELLOW}⚠️  Java is not installed${NC}"
            echo "Install Java 17: brew install openjdk@17"
        else
            echo -e "${GREEN}✓ Java is installed ($(java -version 2>&1 | head -n 1))${NC}"
        fi

        # Check for Android Studio / SDK
        if [ -d "$HOME/Library/Android/sdk" ]; then
            echo -e "${GREEN}✓ Android SDK found${NC}"
            export ANDROID_HOME=$HOME/Library/Android/sdk
            export PATH=$PATH:$ANDROID_HOME/emulator
            export PATH=$PATH:$ANDROID_HOME/platform-tools
        else
            echo -e "${YELLOW}⚠️  Android SDK not found${NC}"
            echo "Please install Android Studio from https://developer.android.com/studio"
            echo "After installation, set up environment variables:"
            echo "  export ANDROID_HOME=\$HOME/Library/Android/sdk"
            echo "  export PATH=\$PATH:\$ANDROID_HOME/emulator"
            echo "  export PATH=\$PATH:\$ANDROID_HOME/platform-tools"
        fi

        # Check for Android emulator
        if command -v emulator &> /dev/null; then
            echo -e "${GREEN}✓ Android emulator available${NC}"
        fi
        ;;
esac

echo ""
echo "📦 Installing Mobile Dependencies"
echo "=================================="

cd mobile

# Install npm dependencies
echo "Installing npm packages..."
npm install

echo ""
echo -e "${GREEN}✅ Mobile dependencies installed${NC}"

# Get local IP address
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || echo "Unable to detect")

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env file..."
    cat > .env << EOF
# API Configuration
# For iOS Simulator and Android Emulator, localhost will be used automatically
# For physical devices, update this to your computer's IP address
EXPO_PUBLIC_API_URL=http://${LOCAL_IP}:3000
EOF
    echo -e "${GREEN}✓ Created .env file${NC}"
    echo "Your local IP: ${LOCAL_IP}"
else
    echo -e "${YELLOW}ℹ️  .env file already exists${NC}"
fi

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "📍 Next Steps:"
echo ""
echo "1. Start the backend API server:"
echo -e "   ${YELLOW}cd ../backend/database && npm start${NC}"
echo ""
echo "2. Start the mobile app:"
echo -e "   ${YELLOW}cd mobile && npm start${NC}"
echo ""
echo "3. Then choose your platform:"
echo "   • Press 'i' for iOS Simulator"
echo "   • Press 'a' for Android Emulator"
echo "   • Scan QR code with Expo Go app for physical device"
echo ""
echo "📱 Quick Commands:"
echo -e "   ${YELLOW}npm run ios${NC}     # Run on iOS Simulator"
echo -e "   ${YELLOW}npm run android${NC}  # Run on Android Emulator"
echo ""
echo "🔧 Configuration:"
echo "   • API URL: http://${LOCAL_IP}:3000"
echo "   • Edit mobile/.env to change API endpoint"
echo ""
echo "📚 Documentation:"
echo -e "   ${YELLOW}cat ../docs/MOBILE_DEVELOPMENT.md${NC}"
echo ""
