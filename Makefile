# Local Productivity Suite - Makefile
# Tooling and Automation Workflow

SHELL := /bin/bash

# Android Configuration
ANDROID_HOME ?= $(HOME)/Library/Android/sdk
ADB := $(ANDROID_HOME)/platform-tools/adb
EMULATOR := $(ANDROID_HOME)/emulator/emulator
AVD ?= Medium_Phone_API_36.1
PACKAGE_NAME := com.localproductivity.suite
ACTIVITY_NAME := .MainActivity
APK_PATH := android/app/build/outputs/apk/debug/app-debug.apk

.PHONY: help dev build sync test test-e2e typecheck format format-check \
        build-android start-emulator wait-device install-android run-android \
        uninstall-android android stop-emulator clean

# Default Target: Show Help
help:
	@echo "================================================================"
	@echo "                LOCAL PRODUCTIVITY SUITE                        "
	@echo "================================================================"
	@echo "Available commands:"
	@echo "  make dev                - Start local Vite development server"
	@echo "  make build              - Build TypeScript and Vite web bundle"
	@echo "  make sync               - Sync web assets to Capacitor Android project"
	@echo "  make test               - Run Vitest unit & integration test suite"
	@echo "  make test-e2e           - Run Playwright end-to-end test suite"
	@echo "  make typecheck          - Run TypeScript strict type verification"
	@echo "  make format             - Format source code with Prettier"
	@echo "  make format-check       - Check source code formatting"
	@echo "  make build-android      - Build production web assets and assemble debug APK"
	@echo "  make start-emulator     - Launch Android emulator in background (if not active)"
	@echo "  make wait-device        - Wait until Android emulator/device has fully booted"
	@echo "  make install-android    - Install debug APK onto connected device/emulator"
	@echo "  make uninstall-android  - Uninstall app package from connected device/emulator"
	@echo "  make run-android        - Launch app on connected device/emulator"
	@echo "  make android            - Full workflow: build, sync, assemble, boot & run on emulator"
	@echo "  make stop-emulator      - Gracefully terminate running Android emulator"
	@echo "  make clean              - Remove build and temporary artifacts"
	@echo "================================================================"

# Web Development & Testing Targets
dev:
	pnpm dev

build:
	pnpm build

sync:
	npx cap sync android

test:
	pnpm test

test-e2e:
	pnpm test:e2e

typecheck:
	pnpm typecheck

format:
	pnpm format

format-check:
	pnpm format:check

# Android Build & Emulator Targets
build-android: build sync
	@echo "==> Assembling Android Debug APK..."
	cd android && ./gradlew assembleDebug

start-emulator:
	@echo "==> Checking for active Android emulator..."
	@if $(ADB) devices | grep -q "emulator"; then \
		echo "==> Emulator is already running."; \
	else \
		echo "==> Starting Android emulator ($(AVD))..."; \
		nohup $(EMULATOR) -avd $(AVD) -no-snapshot-load > /dev/null 2>&1 & \
		echo "==> Emulator launched in background."; \
	fi

wait-device:
	@echo "==> Waiting for device/emulator connection..."
	@$(ADB) wait-for-device
	@echo "==> Waiting for Android OS boot completion..."
	@$(ADB) shell 'while [[ -z $$(getprop sys.boot_completed) ]]; do sleep 1; done'
	@echo "==> Device boot completed."

install-android:
	@if [ ! -f "$(APK_PATH)" ]; then \
		echo "==> APK not found. Running build-android first..."; \
		$(MAKE) build-android; \
	fi
	@echo "==> Installing $(APK_PATH)..."
	@OUT=$$($(ADB) install -r -d $(APK_PATH) 2>&1) || true; \
	echo "$$OUT"; \
	if echo "$$OUT" | grep -q "INSTALL_FAILED_UPDATE_INCOMPATIBLE"; then \
		echo "==> Signature mismatch detected. Performing clean reinstall..."; \
		$(ADB) uninstall $(PACKAGE_NAME); \
		$(ADB) install -r $(APK_PATH); \
	fi

uninstall-android:
	@echo "==> Uninstalling $(PACKAGE_NAME)..."
	@$(ADB) uninstall $(PACKAGE_NAME) 2>/dev/null || echo "==> Package not found on device."

run-android:
	@echo "==> Starting $(PACKAGE_NAME)$(ACTIVITY_NAME)..."
	$(ADB) shell am start -n $(PACKAGE_NAME)/$(PACKAGE_NAME)$(ACTIVITY_NAME)

# Complete Automated Pipeline: Build, Sync, Assemble, Launch Emulator, Install & Run
android: build-android start-emulator wait-device install-android run-android
	@echo "==> Android app successfully deployed and running!"

stop-emulator:
	@echo "==> Stopping running emulator..."
	@$(ADB) emu kill 2>/dev/null || echo "==> No active emulator to stop."

clean:
	@echo "==> Cleaning build artifacts..."
	rm -rf dist
	cd android && ./gradlew clean 2>/dev/null || true
	@echo "==> Clean complete."
