# Future Product Roadmap

This document outlines planned feature enhancements, UI modernizations, notification improvements, and architectural extensions for upcoming development cycles.

## 1. Notification Deep Linking and Action Routing [Completed]

Enable instant navigation to specific items when clicking system notifications.

### Implemented Capabilities

- **URL Hash Query Parameter Parsing**:
  - Full query parameter parsing and building support in hash routes (`#/tasks?taskId=<id>` and `#/habits?habitId=<id>`) via [`hashRouter.ts`](../src/core/router/hashRouter.ts) and [`registry.ts`](../src/core/modules/registry.ts).
- **View-Level Focus and Auto-Open**:
  - In [`TasksView.tsx`](../src/modules/tasks/components/TasksView.tsx), automatically fetches and opens the task modal while scrolling and highlighting the target card (`#task-card-<id>`).
  - In [`HabitsView.tsx`](../src/modules/habits/components/HabitsView.tsx), automatically fetches and opens the habit modal while scrolling and highlighting the target card (`#habit-card-<id>`).
- **Unified Click Action Listener**:
  - Native Android notification action listener via `@capacitor/local-notifications` (`localNotificationActionPerformed`).
  - Web browser `Notification.onclick` wired in [`notificationService.ts`](../src/core/notifications/notificationService.ts) to bring window to focus and navigate to target item hash route.

## 2. Habit Tracker UI Overhaul [Completed]

Redesigned the habit tracking experience with dedicated detail screens, streamlined creation forms, interactive circular timers, and monthly visual completion history. Habit notification deep links directly route and land on this dedicated view.

### Implemented Capabilities

- **Dedicated Habit Details View**:
  - Direct destination when clicking habit reminder notifications (`#/habits?habitId=<id>`) in [`HabitDetailView.tsx`](../src/modules/habits/components/HabitDetailView.tsx).
  - Hero header with custom color accents and integrated 3-column stats strip (Current Streak, Best Streak, All-Time Total).
  - Consolidated top action bar featuring a primary Edit button and a More actions dropdown menu for Pin, Archive, and Delete.
  - Interactive 10-step dotted segmented progress bar for numeric and timer habits with direct dot tap selection.
  - Compact About, Motivation, and Scheduled Reminder metadata section.
- **Add and Edit Habit Form**:
  - Segmented Type Selector for `Yes/No` (boolean), `Counter` (numeric targets), and `Timer` (duration-based) models in [`HabitFormModal.tsx`](../src/modules/habits/components/HabitFormModal.tsx).
  - Numeric input with customizable units and multi-reminder pill timeline.
- **Dedicated Habit Focus Timer**:
  - Radial SVG circular countdown progress ring with play, pause, reset, and direct duration editing in [`HabitFocusTimer.tsx`](../src/modules/habits/components/HabitFocusTimer.tsx).
  - Proportional stepper buttons (-10m, -5m, +5m, +10m) and dynamic autofill for remaining target duration.
  - Direct inline minute editing for quick manual adjustments.
- **Habit History and Monthly Calendar View**:
  - Scoped monthly log tracking and history calculation in [`HabitMonthlyCalendar.tsx`](../src/modules/habits/components/HabitMonthlyCalendar.tsx).
  - Unified header with inline month switcher and compact 4-metric summary strip.

## 3. Task Detail View and Execution Workspace

Provide a dedicated slide-over panel and full-view workspace for complex task execution, time tracking, and contextual attachments. Once ready, task notification deep links will directly route and open this execution workspace.

### Task Hero and Property Header

- **Deep Link Notification Landing Target**:
  - Direct destination when clicking task reminder notifications (`#/tasks?taskId=<id>`), transitioning from the modal popover to the full task workspace drawer.
- **Status and Priority Controls**:
  - Quick-switch status dropdown (To Do, In Progress, Blocked, Done).
  - Priority selector with color badge indicators (Low, Medium, High, Urgent).
- **Project Association and Due Date**:
  - Project pill with custom color dot and quick project reassignment.
  - Date and time picker with relative due badges (Today, Tomorrow, Overdue).
- **Rich Markdown Description**:
  - Expandable full-fidelity markdown preview and edit mode for requirements, links, and code snippets.

### Interactive Subtasks Checklist

- **Progress Overview**:
  - Completion ratio badge and visual progress bar (e.g. `4 of 5 subtasks completed - 80%`).
- **Inline Management**:
  - Quick subtask creation input, drag-and-drop reordering, and instant checkbox toggling.

### Task-Linked Focus Timer Hub

- **Embedded Circular Timer**:
  - Mini circular countdown timer widget with 25-minute Pomodoro presets and custom durations.
- **Time Spent vs Estimate Tracker**:
  - Visual comparison bar comparing estimated task duration against accumulated active timer sessions.

### Context and Linked References

- **Connected Notes**:
  - Section listing all markdown notes referencing or tagged with this task.
- **Recurrence Schedule and History**:
  - Recurrence interval details, parent template link, and creation / completion timestamps.

## 4. Advanced Habit Notifications

- **Multiple Scheduled Times**:
  - Allow each habit to schedule distinct notification triggers throughout the day.
- **Interactive Notification Actions**:
  - Add quick action buttons directly on the Android notification (e.g. "Check-In (+1)" or "Start Timer").
- **Interval Check-in Automation**:
  - Smart interval recalculation that adjusts remaining reminders as daily targets are completed early.

## 5. Unified Pomodoro and Task Focus Sessions

- **Task-Linked Timer Sessions**:
  - Run the circular focus timer against specific tasks (e.g. 25-minute Pomodoro block for a project task) to record actual time spent vs estimated duration.
- **Offline Ambient Focus Audio**:
  - Lightweight Web Audio synthesis and offline ambient tracks (rain, white noise, cafe, binaural focus frequencies) playable during active focus timer sessions.

## 6. Habit Stacking, Routines and Streak Protection

- **Routine Stacking Chains**:
  - Group habits into structured sequence stacks (e.g. "Morning Routine": _Drink Water -> Stretch -> Meditation_).
  - Completing one item in a stack prompts or activates the subsequent item.
- **Streak Freeze and Planned Rest Days**:
  - Configure rest days for specific habits (e.g. gym workout 5 days/week with weekend rest) without breaking streak calculations.
  - Support manual streak freezes for travel or illness.

## 7. Cross-Module Bi-Directional Linking

- **Notes Linked to Tasks and Habits**:
  - Attach contextual markdown notes to tasks or habit check-ins for detailed documentation and reflection.
- **Task and Habit Mentions in Notes**:
  - Quick auto-complete mentions (`@task-name` and `#habit-name`) within notes with interactive direct links.

## 8. Android Home Screen Widgets

- **Habit Quick-Log Widget**:
  - Interactive Android AppWidget for logging daily habit completions with a single tap directly from the home screen.
- **Daily Focus Task Widget**:
  - Home screen widget displaying high-priority and urgent tasks due today.

## 9. Productivity Analytics and Weekly Review

- **Time-of-Day Consistency Heatmaps**:
  - Visual heatmap showing hourly distribution of habit completions and task wrap-ups.
- **Weekly Review Digest**:
  - Automated weekly summary report generated every Sunday evaluating productivity score, streak milestones, and time allocation across projects.

## 10. Security and Archive Encryption

- **Password-Protected Backup Exports**:
  - Optional AES-GCM password encryption for JSON backup files to protect personal notes and task archives during off-device export and storage.

## 11. Gamification, XP and Level Progression System

Turn productivity and consistency into an engaging progression system with experience points (XP), dynamic level ranks, streak multipliers, and achievement badges.

### XP Reward Engine

- **Habit Check-Ins**:
  - Earn base XP on daily habit completions (e.g. +10 XP for standard check-ins, +15 XP for completed timer sessions).
- **Streak Multipliers and Milestones**:
  - Consecutive streaks grant escalating XP bonuses (e.g. 7-day streak grants +50 XP bonus, 30-day streak unlocks a 1.25x XP multiplier).
- **Task Completion and Priority Scaling**:
  - Complete tasks with XP weighted by priority level (Low: +10 XP, Medium: +20 XP, High: +35 XP, Urgent: +50 XP).
  - Additional subtask bonuses (+5 XP per completed subtask item).
- **Knowledge and Note Creation**:
  - Capturing thoughts and authoring markdown notes grants XP based on length and organization (+15 XP per note created or revised).
- **Daily Score Mastery**:
  - Achieving a 100% daily productivity score awards a "Perfect Day" bonus (+100 XP).

### Leveling Progression and Ranks

- **Dynamic Level Curve**:
  - Tiered XP thresholds to progress from Level 1 ("Novice Planner") to higher ranks ("Focus Apprentice", "Productivity Specialist", "Master of Routine", "Grandmaster").
- **Level-Up Celebrations**:
  - Celebratory micro-animations and sound-free particle effects when crossing level thresholds.
- **Profile and Dashboard Progress Indicators**:
  - Visual XP bar and level badge on the dashboard header and user profile settings displaying current rank, total accumulated XP, and XP remaining to next level.

### Achievements and Unlockable Badges

- **Habit Consistency Badges**:
  - Unlock achievements for 7, 30, 100, and 365 unbroken streak milestones.
- **Task Crusher Badges**:
  - Unlock achievements for completing 50, 250, and 1000 tasks.
- **Focus Master Badges**:
  - Unlock achievements for logging 10, 50, and 200 hours of active timer sessions.
- **Knowledge Scribe Badges**:
  - Unlock achievements for authoring 25, 100, and 500 structured markdown notes.

## 12. Google Drive Cloud Sync and Automated Backup

Provide seamless, user-owned cloud synchronization and automated snapshot backups using Google Drive, keeping local-first Dexie IndexedDB state in sync across mobile and desktop devices with zero custom server infrastructure.

### Google Drive Integration Architecture

- **AppData Folder Isolation**:
  - Restrict cloud storage to the hidden `drive.appdata` scope (`https://www.googleapis.com/auth/drive.appdata`) so sync files remain isolated, secure, and hidden from regular Drive document lists.
- **Cross-Platform Authentication**:
  - Public Client OAuth 2.0 PKCE flow on Web via Google Identity Services.
  - Native Google Auth integration on Android via Capacitor plugin without exposing client secrets.
- **Manifest-Driven Synchronization**:
  - Maintain a lightweight remote `sync_manifest.json` tracking last modified timestamps, device IDs, format version, and SHA-256 data checksums.
  - Automated sync triggers on application start, network reconnect, and debounced database changes.

### Security and Data Integrity Safeguards

- **Client-Side End-to-End Encryption (E2EE)**:
  - Optional user-defined master passphrase deriving an AES-GCM-256 key via PBKDF2 or Argon2 using the native Web Crypto API prior to uploading snapshots to Google Drive.
- **Strict Schema Validation and Sanitization**:
  - Full Zod schema validation of all inbound payloads before applying updates to Dexie tables to prevent schema poisoning.
  - HTML and markdown sanitization via DOMPurify to prevent stored XSS attacks from synchronized note content.
- **Secure Token Storage**:
  - In-memory token management on Web and hardware-backed keystore storage on Android.
- **Conflict Resolution and Safety Backups**:
  - Automatic pre-sync local snapshot creation before applying remote updates.
  - Monotonic timestamp Last-Write-Wins (LWW) resolution for individual entities with merge conflict prompts when concurrent edits are detected.
