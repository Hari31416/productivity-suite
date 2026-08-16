# Release and Version Bump Guide

This document describes the standard procedure for bumping application versions, validating web and Android builds, and publishing new tagged releases to trigger GitHub Actions automated APK builds.

## Release Overview

The application maintains synchronized versioning across the web package and native Android container:

- **Web Package**: `package.json` (`version`)
- **Android App**: `android/app/build.gradle` (`versionCode` and `versionName`)
- **Changelog**: `CHANGELOG.md` (Release notes following Keep a Changelog)
- **Git Tags**: Semantic version tags in `vX.Y.Z` format (e.g. `v0.2.0`)
- **CI / CD Pipeline**: `.github/workflows/android-build.yml` triggers automatically on tag pushes matching `v*` and attaches the compiled APK to a GitHub Release.

## Step-by-Step Version Bump Workflow

### 1. Update Version Strings

Determine whether the release is a **major**, **minor**, or **patch** update according to Semantic Versioning (`MAJOR.MINOR.PATCH`):

1. **`package.json`**:
   - Update the `"version"` field:
     ```json
     "version": "0.2.0"
     ```

2. **`android/app/build.gradle`**:
   - Increment `versionCode` by `+1` (must always be a monotonically increasing integer).
   - Set `versionName` to match the new version string:
     ```gradle
     versionCode 2
     versionName "0.2.0"
     ```

### 2. Update Changelog

Document new features, fixes, and architectural enhancements in `CHANGELOG.md` under the new version header:

```markdown
## [0.2.0] - YYYY-MM-DD

### Added
- Feature details...
```

### 3. Run Test Suite

Verify all unit, repository, and integration tests pass cleanly:

```bash
pnpm test
```

### 4. Build Web Bundle and Sync Android Assets

Compile TypeScript and build the optimized production assets, then sync into Capacitor's Android native project:

```bash
pnpm build && npx cap sync android
```

### 5. Stage and Commit Changes

Create a clean conventional commit for the release:

```bash
git add package.json android/app/build.gradle CHANGELOG.md RELEASE_PROCESS.md
git commit -m "chore(release): bump version to 0.2.0"
```

### 6. Create Git Tag

Create an annotated git tag corresponding to the new version:

```bash
git tag -a v0.2.0 -m "Release v0.2.0"
```

### 7. Push Commits and Tags to GitHub

Push your commits and the new tag to origin to trigger the automated GitHub Actions workflow:

```bash
git push origin main
git push origin v0.2.0
```

### 8. Monitor GitHub Actions Build

1. Open your repository on GitHub and navigate to the **Actions** tab.
2. The **Build Android APK** workflow will execute the following automated steps:
   - Checkout code and setup pnpm & Node 22
   - Build web bundle and sync Capacitor Android assets
   - Setup Java JDK 21 and Gradle cache
   - Assemble `app-debug.apk`
   - Upload APK build artifact
   - Publish a formal **GitHub Release** with the attached APK and auto-generated release notes.
