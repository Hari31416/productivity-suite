# Android Automated UI Testing and Visual Inspection Guide

This guide provides instructions for AI agents on how to launch the Android emulator, build and install the native debug APK, automate UI actions, and capture on-device screenshots for visual inspection.

## Prerequisites and Environment Paths

The Android SDK tools are typically located at the following paths on macOS:

- **Android SDK Root**: `~/Library/Android/sdk`
- **ADB Binary**: `~/Library/Android/sdk/platform-tools/adb`
- **Emulator Binary**: `~/Library/Android/sdk/emulator/emulator`

Check installed Android Virtual Devices (AVDs):

```bash
~/Library/Android/sdk/emulator/emulator -list-avds
```

## Step 1: Start the Android Emulator

If no physical device or emulator is running, launch the target AVD (e.g. `Medium_Phone_API_36.1`) as a background daemon process:

```bash
~/Library/Android/sdk/emulator/emulator -avd Medium_Phone_API_36.1 -no-audio -no-snapshot-save
```

Wait until the emulator has completed booting:

```bash
~/Library/Android/sdk/platform-tools/adb wait-for-device && while [ "$(/Users/hari/Library/Android/sdk/platform-tools/adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" != "1" ]; do sleep 2; done && echo "BOOT_COMPLETED"
```

## Step 2: Build and Install the Native APK

Sync the latest React web assets and build and install the debug APK onto the emulator:

```bash
pnpm build && npx cap sync android && cd android && ./gradlew installDebug
```

## Step 3: Launch the Application

Launch the main activity using ADB:

```bash
~/Library/Android/sdk/platform-tools/adb shell am start -n com.localproductivity.suite/com.localproductivity.suite.MainActivity
```

Allow the Capacitor WebView 2 to 3 seconds to initialize and render.

## Step 4: Interact with the UI via ADB

Agents can trigger touch gestures, text entry, and hardware key events directly:

- **Tap a coordinate**:
  ```bash
  ~/Library/Android/sdk/platform-tools/adb shell input tap <X> <Y>
  ```
- **Swipe or scroll**:
  ```bash
  ~/Library/Android/sdk/platform-tools/adb shell input swipe <startX> <startY> <endX> <endY> <duration_ms>
  ```
  Example (scroll down): `~/Library/Android/sdk/platform-tools/adb shell input swipe 500 1800 500 800 300`
- **Type text into focused field**:
  ```bash
  ~/Library/Android/sdk/platform-tools/adb shell input text "Sample%sText"
  ```
  Note: Use `%s` instead of spaces when passing strings through ADB shell input.
- **Press Android Back Button**:
  ```bash
  ~/Library/Android/sdk/platform-tools/adb shell input keyevent 4
  ```

## Step 5: Capture and View On-Device Screenshots

Capture native screenshots directly from the framebuffer and save them to a file:

```bash
~/Library/Android/sdk/platform-tools/adb exec-out screencap -p > screenshot.png
```

After capturing, call the `view_file` tool on the absolute path of `screenshot.png` to visually inspect layout, component alignment, contrast, typography, and safe area padding.

## Step 6: Test Deep-Linking Directly on Android

To test notification routing and deep link parameter handling (`#/habits?habitId=<id>` or `#/tasks?taskId=<id>`):

```bash
~/Library/Android/sdk/platform-tools/adb shell am start -a android.intent.action.VIEW -d "http://localhost/#/habits?habitId=<habit-id>" com.localproductivity.suite
```

## Troubleshooting and Clean Up

- **Check device connection**: `~/Library/Android/sdk/platform-tools/adb devices`
- **View native Android runtime logs**: `~/Library/Android/sdk/platform-tools/adb logcat -d | grep -E "Capacitor|Chromium"`
- **Stop running emulator**: `~/Library/Android/sdk/platform-tools/adb emu kill`
