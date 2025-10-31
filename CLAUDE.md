# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native 0.82.0 mobile application named `pal_pan`, bootstrapped with the React Native Community CLI. The project targets both iOS and Android platforms and uses TypeScript for type safety.

## Development Commands

### Package Management
```bash
yarn install           # Install dependencies
yarn add <package>     # Add new dependency
yarn add -D <package>  # Add new dev dependency
yarn remove <package>  # Remove dependency
```

### Metro Bundler
```bash
yarn start             # Start Metro bundler
```

### Running the App
```bash
yarn android           # Run on Android emulator/device
yarn ios               # Run on iOS simulator/device
```

### iOS-Specific Setup
```bash
bundle install                 # First-time setup: install Ruby dependencies (for CocoaPods)
bundle exec pod install        # Install/update iOS native dependencies (run from project root)
cd ios && bundle exec pod install  # Alternative if above doesn't work
```
Run `bundle exec pod install` after:
- First clone
- Adding/removing native dependencies
- Updating React Native version

### Quality Checks
```bash
yarn lint              # Run ESLint
yarn test              # Run Jest tests
```

## Architecture

### Project Structure
- **App.tsx**: Root component that sets up SafeAreaProvider and renders NewAppScreen template
- **index.js**: Entry point that registers the root component
- **android/**: Android native code (Kotlin)
  - MainActivity.kt: Main activity (component name: "pal_pan")
  - MainApplication.kt: Application setup with ReactHost and autolinking
- **ios/**: iOS native code (Swift)
  - AppDelegate.swift: App delegate with React Native initialization (module name: "pal_pan")
  - Podfile: CocoaPods dependency management
- **__tests__/**: Jest test files

### Native Configuration
- **Android**: Kotlin-based, uses New Architecture with Fabric support
  - minSdkVersion: 24
  - targetSdkVersion: 36
  - compileSdkVersion: 36
  - Kotlin version: 2.1.20
- **iOS**: Swift-based, uses modern RCTReactNativeFactory pattern
  - Minimum iOS version: defined in Podfile via `min_ios_version_supported`
  - Debug builds use Metro bundler, release builds use bundled main.jsbundle

### Key Dependencies
- react-native-safe-area-context: For safe area handling across devices
- @react-native/new-app-screen: Template screen components

### TypeScript Configuration
Extends `@react-native/typescript-config` with default React Native TypeScript settings. Excludes node_modules and iOS Pods directory.

### Testing
Uses Jest with react-native preset. Tests use react-test-renderer for component testing.

## Development Notes

### Fast Refresh
The app supports Fast Refresh - changes to .tsx/.ts files automatically update without full reload.

### Force Reload
- Android: Press R twice or Ctrl+M (Windows/Linux) / Cmd+M (macOS) for Dev Menu → Reload
- iOS: Press R in simulator

### Common Workflow
1. Ensure Metro is running (`npm start`)
2. Launch app on target platform (`npm run android` or `npm run ios`)
3. Make code changes - they'll hot reload automatically
4. For native dependency changes, reinstall pods (iOS) or rebuild (Android)
