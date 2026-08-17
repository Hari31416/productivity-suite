# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.0] - 2026-08-17

### Added

- **Multiple Scheduled Reminder Times per Habit**:
  - Configurable multiple reminder times throughout the day (`reminderTimes`) supported across all habit frequencies.
  - One-tap preset time chips (`Morning 08:00`, `Midday 12:30`, `Evening 18:00`, `Night 21:30`) and custom time selector in habit creation/edit modal.
  - 7-day rolling window reminder scheduling in `notificationService.ts`.
- **Interactive Android Notification Quick Actions**:
  - Registered native Capacitor action categories (`HABIT_BOOLEAN_ACTION`, `HABIT_NUMERIC_ACTION`, `HABIT_TIMER_ACTION`, `HABIT_INTERVAL_ACTION`).
  - Action buttons on notifications for one-tap completion (`Check-In`, `Mark Done`), step increment logging (`Log Progress`), and opening focus timer (`Start Timer`).
  - Proportional dynamic step sizing (`+250 ml`, `+500 steps`) based on habit target value and unit.
- **Smart Interval Recalculation & Early Completion Silence**:
  - Automatically cancels remaining reminder triggers for today when a habit reaches its target early while preserving upcoming days.
  - Recalculates remaining interval check-in slots upon partial log entries.
- **Notification Testing Suite in Settings**:
  - Instant test buttons for boolean check-ins, numeric progress stepping, timer actions, and task alerts in `SettingsView.tsx`.

### Changed

- **Clean Notification Copy**:
  - Streamlined notification titles and concise body copy without redundant repetitions.
- **Foreground Action Delivery & Query Synchronization**:
  - Foreground action handlers activate MainActivity and automatically invalidate React Query cache to keep UI in sync.

### Fixed

- **Unified Habit Completion Calculation on Dashboard**:
  - Connected `isHabitCompletedOnDate` across `DashboardView` and `HabitDashboardWidget` to eliminate mismatches between the dashboard and habits page.
  - Added support for toggling numeric habits between zero and target value from the dashboard check button.
- **Duplicate Progress Bar in Habit Detail View**:
  - Removed duplicate progress bar from top hero card in `HabitDetailView.tsx`.
- **System Status Bar Safe Area Insets**:
  - Added responsive `--safe-area-inset-top` token and flexible header padding to prevent Android system status bar overlap on all screens.

## [0.5.0] - 2026-08-16

### Added

- **Task Detail View & Dedicated Execution Workspace**:
  - Full-view execution workspace and detail drawer for complex tasks (`TaskDetailView.tsx`).
  - Direct routing for task notification deep links (`#/tasks?taskId=<id>`) and task card clicks.
  - Task Hero and Property Header with status selector, priority dropdown, project association, and relative due date formatting.
  - Expandable full-fidelity markdown preview and toggleable inline markdown editing.
  - Interactive Subtasks Checklist with completion ratio progress badge, inline creation, and move up / down reordering.
  - Connected Notes integration discovering markdown notes referencing or tagged with the task, plus 1-click note creation with full in-place markdown editing/preview.
  - Recurrence schedule description, active notification count, and creation/update/completion timestamps.
- **Shared Circular Focus Timer Hub**:
  - Reusable radial countdown timer component (`CircularFocusTimer.tsx`) shared between tasks and habits.
  - Task-linked timer with 25-minute Pomodoro presets (+5m, +10m, 50m block, custom duration dialog) and automatic `actualMinutes` time tracking.
  - Time Spent vs Estimate comparison progress bar.
- **Shadcn UI Textarea Component**:
  - Reusable accessible textarea primitive for markdown and multi-line text input.

### Changed

- **Refactored Habit Focus Timer**:
  - Refactored `HabitFocusTimer.tsx` to reuse the shared `CircularFocusTimer` engine.
- **Deep Linking & Notes Router Support**:
  - Added `queryParams.noteId` handler in `NotesView.tsx` to auto-open notes in edit/preview mode.

### Fixed

- **Number Input Step Alignment Validation**:
  - Fixed HTML5 step validation on estimated minutes input in `TaskFormModal.tsx` to allow any positive integer value.

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
