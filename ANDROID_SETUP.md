# Android Application Setup and Build Guide

This guide describes how to initialize, build, and run the Android application for Local Productivity Suite using Capacitor.

## Prerequisites

Before starting, ensure the following tools are installed on your machine:

- Android Studio (including Android SDK, platform-tools, and emulator / device drivers)
- Java Development Kit (JDK 17 or newer)
- Node.js (v18+) and pnpm

## Installation and Setup

Follow the steps below to configure the native Android project.

### Step 1: Install Capacitor Dependencies

Install Capacitor core, the local notifications plugin, and the Capacitor CLI / Android platform packages:

```bash
pnpm add @capacitor/core @capacitor/local-notifications
pnpm add -D @capacitor/cli @capacitor/android
```

### Step 2: Build Web Assets

Compile TypeScript and build the static assets into the `dist/` directory:

```bash
pnpm build
```

### Step 3: Initialize the Android Platform

Generate the native Android project structure:

```bash
npx cap add android
```

This creates an `android/` directory configured with the application ID `com.localproductivity.suite` defined in `capacitor.config.ts`.

### Step 4: Sync Assets and Plugins

Sync the web build and native plugin bindings into the Android project:

```bash
npx cap sync android
```

### Step 5: Run the Application

Open the project in Android Studio:

```bash
npx cap open android
```

In Android Studio:

- Allow Gradle to finish syncing and indexing.
- Select a target Android Virtual Device (AVD) or a connected physical device with USB debugging enabled.
- Click Run or press `Shift + F10`.

Alternatively, run directly from the command line:

```bash
npx cap run android
```

## Generating APK or Android App Bundle

To produce deployable binaries:

- For a debug APK: Navigate to **Build > Build Bundle(s) / APK(s) > Build APK(s)** in Android Studio. The resulting file will be located at `android/app/build/outputs/apk/debug/app-debug.apk`.
- For a release bundle: Navigate to **Build > Generate Signed Bundle / APK** and follow the signing prompts for Google Play distribution.

## Development and Update Workflow

When making modifications to the React application, sync the updates to the Android container:

```bash
pnpm build
npx cap sync android
```
