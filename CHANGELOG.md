# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.2] - 2026-08-16

### Added

- **Consistent Keystore Signing for Android APKs**:
  - Bundled a dedicated 2048-bit RSA `debug.keystore` in `android/app/` with 10,000-day validity.
  - Configured `signingConfigs` in `android/app/build.gradle` for both `debug` and `release` build types.
  - Guarantees deterministic APK certificate signatures across local development builds and GitHub Actions CI pipelines to eliminate package signature conflict errors during in-place app updates.

## [0.4.1] - 2026-08-16

### Fixed

- **Task Notification Due Date & Time Fallbacks**:
  - Enhanced `computeTaskReminderDate` to support task notifications when `dueDate` or `dueTime` is omitted.
  - Automatically calculates upcoming daytime checkpoints (`09:00`, `12:00`, `15:00`, `18:00`, `21:00`) for same-day tasks without due time to prevent expired past timestamps.
  - Added fallback forward offsets for late-night or undated quick tasks.
- **Deterministic Task Notification ID Generation**:
  - Implemented 32-bit integer hash generation (`getTaskNotificationId`) for tasks to ensure consistent identification and prevent ID collisions across rescheduling cycles.
  - Improved reminder cancellation in `taskRepository` on task update and deletion.
- **Startup Reminder Synchronization Isolation**:
  - Isolated web reminder cancellation so that background task and habit rescheduling do not overwrite or clear each other's active timers during app initialization.

## [0.4.0] - 2026-08-16

### Added

- **Hierarchical Android Hardware & Gesture Back Button Handling**:
  - Integrated `@capacitor/app` with a centralized back button priority manager in `src/core/platform/backButton.ts`.
  - Prioritizes dismissal of active dialogs, bottom sheets, full-screen editors, and sub-views before navigating back or exiting.
- **7-Day Rolling Habit Notification Scheduling**:
  - Implemented automatic local notification scheduling for daily and sub-day interval habits in `src/core/notifications/notificationService.ts`.
  - Added deterministic notification ID generator with 7-day rolling window and startup synchronization.
  - Populated default reminder times on seed habits for immediate out-of-the-box alerts.
- **Capacitor Splash Screen & Cold-Start Optimization**:
  - Configured `@capacitor/splash-screen` and pre-hydration CSS placeholder skeleton in `index.html` to eliminate cold-start blank screens.
- **Mobile Bottom Sheet Dialogs & Touch Target Enhancements**:
  - Responsive `DialogContent` adapting to bottom sheet presentation on mobile with safe-area insets.
  - Sticky action footers for Save/Cancel buttons on modal forms.
  - Expanded interactive touch targets to 44dp minimum and increased main bottom padding for navigation bar clearance.

### Changed

- **Dashboard Deduplication & Insights**:
  - Transformed lower habit and task widgets into high-level summary cards (daily adherence, streaks, categories, due today, urgent pipeline) without repeating checkable rows.
  - Fixed daily productivity score calculation to strictly match completed over scheduled ratio.
- **Tasks View Mobile Chrome Optimization**:
  - Converted filter sidebar into a responsive bottom sheet modal dialog on mobile.
  - Streamlined stacked toolbars, search bar, and smart quick-add for clean mobile view.
- **Notes Editor Layout**:
  - Moved note title into a dedicated full-width input container to prevent title truncation on mobile screens.
- **Settings Diagnostics Reorganization**:
  - Grouped raw IndexedDB database inspectors and diagnostics into a collapsible developer section.

### Fixed

- **Habit Detail Back Navigation**:
  - Fixed back button navigation from habit detail view to return directly to the Habits list.
- **Tag Label Truncation**:
  - Removed rigid width caps on project and category tags across task cards and dashboard widgets.

## [0.3.0] - 2026-08-16

### Added

- **Dedicated Focus Timer for Duration Habits**:
  - Interactive SVG circular countdown timer with pause, play, reset, and direct duration editing.
  - Duration adjustment buttons (-10m, -5m, +5m, +10m) and dynamic autofill for remaining target time.
  - Inline progress editing with direct minute input for fast adjustments.
- **Interactive Dotted Progress Segments**:
  - 10-step ratio progress bar in habit hero header for numeric and timer habits with direct dot tap selection.

### Changed

- **Streamlined Habit Detail Layout**:
  - Integrated streak metrics (Current Streak, Best Streak, All-Time Total) directly into hero card.
  - Consolidated top action buttons into Edit button and More actions dropdown menu (Pin, Archive, Delete).
  - Compacted About and Schedule Context section into lightweight metadata strip.
- **Monthly History and Visual Calendar Refinements**:
  - Unified calendar header with inline month navigation.
  - Converted bulky metric cards into a single compact segmented summary strip.
  - Scoped monthly calendar metrics strictly to the selected habit ID.
- **Header Simplification**:
  - Removed redundant theme switcher from main top bar in favor of Settings view.

### Fixed

- **Timer Duration Completion Calculation**:
  - Fixed streak calculator comparison bug to accurately convert logged duration seconds to minutes before checking target completion.
  - Prevented timer habits with partial durations from prematurely showing completed status.

## [0.2.0] - 2026-08-16

### Added

- **URL Hash Query Parameter Routing**:
  - Implemented `parseHashRoute`, `buildHashRoute`, and `useHashRoute` hook in `src/core/router/hashRouter.ts`.
  - Normalized module route matching in `src/core/modules/registry.ts` to support parameterized URL paths such as `#/tasks?taskId=<id>` and `#/habits?habitId=<id>`.
- **View-Level Focus and Auto-Open**:
  - Automatically loads and opens the task edit modal in `TasksView.tsx` when `taskId` is provided in the route query parameter.
  - Automatically loads and opens the habit edit modal in `HabitsView.tsx` when `habitId` is provided.
  - Added smooth scroll and glowing highlight ring for target cards (`#task-card-<id>` and `#habit-card-<id>`).
  - Automatically resets hash query parameters on modal dismissal.
- **Unified Notification Click Actions**:
  - Wired web browser `Notification.onclick` to focus window and route to target item hash paths.
  - Added `setupNotificationListeners` listening for Capacitor `@capacitor/local-notifications` `localNotificationActionPerformed` events to handle Android system tray notification clicks.
- **Diagnostics and Developer Tools**:
  - Added test notification trigger buttons in Settings for habit and task alerts.
  - Added automated integration tests in `src/test/integration/deepLinkingWorkflow.test.tsx`.
- **Documentation & Workflows**:
  - Created `RELEASE_PROCESS.md` detailing step-by-step version bump and release procedures.
  - Added Task Detail View and Execution Workspace specifications to `plans/roadmap.md`.

## [0.1.0] - 2026-08-15

### Added

- **Core Application Architecture**:
  - Offline-first modular architecture with Dexie IndexedDB persistence (`LocalProductivitySuiteDB`).
  - Responsive layout with desktop sidebar, mobile bottom navigation, and global command palette.
- **Habit Tracker Module**:
  - Daily habit check-ins, numeric targets, and timer-based habit models.
  - Streak calculator, 7-day rolling date strip, and weekly progress overviews.
- **Task & Project Management**:
  - Full task lifecycle with priorities (`low`, `medium`, `high`, `urgent`), statuses (`todo`, `in_progress`, `blocked`, `done`), subtasks checklist, and project organization.
  - Smart natural language task parser (`!priority`, `@date`, `#project`).
  - List, Calendar, and Kanban task views.
- **Notes Module**:
  - Markdown editor with live preview, word statistics, tag categorization, and markdown file export.
- **Local Notifications**:
  - Timed reminders for tasks and habit check-in intervals using Web Notifications API and `@capacitor/local-notifications`.
- **Backup & Diagnostics**:
  - Full IndexedDB JSON backup export and merge/replace restore engine.
  - Theme customizer (Light, Dark, System) and storage persistence inspector.
- **Android Platform Container**:
  - Native Capacitor Android configuration and automated GitHub Actions APK release pipeline.
