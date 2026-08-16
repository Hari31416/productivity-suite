# Future Product Roadmap

This document outlines planned feature enhancements, UI modernizations, notification improvements, and architectural extensions for upcoming development cycles.

## 1. Notification Deep Linking and Action Routing

Enable instant navigation to specific items when clicking system notifications.

### Capabilities to Implement

- **URL Hash Query Parameter Parsing**:
  - Support query parameters in hash routes, such as `#/tasks?taskId=<id>` and `#/habits?habitId=<id>`.
- **View-Level Focus and Auto-Open**:
  - In [`TasksView.tsx`](../src/modules/tasks/components/TasksView.tsx), automatically open the task edit modal or scroll and highlight the target task card when `taskId` is present in the route.
  - In [`HabitsView.tsx`](../src/modules/habits/components/HabitsView.tsx), automatically open the habit details view or check-in modal when `habitId` is passed.
- **Unified Click Action Listener**:
  - Listen for native Android notification clicks via `@capacitor/local-notifications` (`localNotificationActionPerformed`).
  - Wire web browser `Notification.onclick` to trigger hash navigation and bring window to focus.

## 2. Habit Tracker UI Overhaul

Redesign the habit tracking experience with dedicated detail screens, streamlined creation forms, interactive circular timers, and monthly visual completion history.

### Habit Details View

- **Hero Header**:
  - Large icon and custom color accent.
  - Habit title, category pill (e.g. Health & Wellness), and type indicator (e.g. Daily - Counter).
  - Favorite / Pin toggle.
- **Streak Cards**:
  - Current Streak counter with flame badge.
  - Best Streak counter with trophy badge.
- **Today Progress Tracker**:
  - Discrete progress dot indicators (e.g. 8 of 8 glasses complete).
  - Visual completion percentage badge.
- **About and Context**:
  - Habit description, motivation notes, and scheduled reminder times overview.
- **Action Toolbar**:
  - Edit habit and quick check-in actions.

### Add and Edit Habit Form

- **Segmented Type Selector**:
  - Toggle between `Yes/No` (boolean), `Counter` (numeric targets), and `Timer` (duration-based) habit models.
- **Target and Unit Configuration**:
  - Dedicated numeric input with customizable unit selector (glasses, pages, reps, minutes).
- **Frequency Options**:
  - Daily, specific days of week, or custom sub-day intervals.
- **Multi-Reminder Timeline**:
  - Configurable multiple reminder times per day (e.g. `08:00`, `12:00`, `16:00`) with an inline `+ Add` reminder pill interface.

### Dedicated Habit Focus Timer

- **Circular Countdown Interface**:
  - Radial SVG / Canvas progress ring showing elapsed vs remaining time.
  - Central time display (`MM:SS`) with play / pause toggle.
- **Session Metrics**:
  - Completed sessions count for the day.
  - Total accumulated time tracked.
- **Controls**:
  - Reset timer button.
  - Finish session button to log completion directly to habit history.

### Habit History and Monthly Calendar View

- **Monthly Grid View**:
  - Visual calendar month overview with filled completion dots for successful days.
- **Monthly Summary Metrics**:
  - Overall completion rate (e.g. `23 days complete - 74%`).
  - Best streak achieved within the month.
  - Total time and counter aggregates.

## 3. Advanced Habit Notifications

- **Multiple Scheduled Times**:
  - Allow each habit to schedule distinct notification triggers throughout the day.
- **Interactive Notification Actions**:
  - Add quick action buttons directly on the Android notification (e.g. "Check-In (+1)" or "Start Timer").
- **Interval Check-in Automation**:
  - Smart interval recalculation that adjusts remaining reminders as daily targets are completed early.

## 4. Unified Pomodoro and Task Focus Sessions

- **Task-Linked Timer Sessions**:
  - Run the circular focus timer against specific tasks (e.g. 25-minute Pomodoro block for a project task) to record actual time spent vs estimated duration.
- **Offline Ambient Focus Audio**:
  - Lightweight Web Audio synthesis and offline ambient tracks (rain, white noise, cafe, binaural focus frequencies) playable during active focus timer sessions.

## 5. Habit Stacking, Routines and Streak Protection

- **Routine Stacking Chains**:
  - Group habits into structured sequence stacks (e.g. "Morning Routine": *Drink Water -> Stretch -> Meditation*).
  - Completing one item in a stack prompts or activates the subsequent item.
- **Streak Freeze and Planned Rest Days**:
  - Configure rest days for specific habits (e.g. gym workout 5 days/week with weekend rest) without breaking streak calculations.
  - Support manual streak freezes for travel or illness.

## 6. Cross-Module Bi-Directional Linking

- **Notes Linked to Tasks and Habits**:
  - Attach contextual markdown notes to tasks or habit check-ins for detailed documentation and reflection.
- **Task and Habit Mentions in Notes**:
  - Quick auto-complete mentions (`@task-name` and `#habit-name`) within notes with interactive direct links.

## 7. Android Home Screen Widgets

- **Habit Quick-Log Widget**:
  - Interactive Android AppWidget for logging daily habit completions with a single tap directly from the home screen.
- **Daily Focus Task Widget**:
  - Home screen widget displaying high-priority and urgent tasks due today.

## 8. Productivity Analytics and Weekly Review

- **Time-of-Day Consistency Heatmaps**:
  - Visual heatmap showing hourly distribution of habit completions and task wrap-ups.
- **Weekly Review Digest**:
  - Automated weekly summary report generated every Sunday evaluating productivity score, streak milestones, and time allocation across projects.

## 9. Security and Archive Encryption

- **Password-Protected Backup Exports**:
  - Optional AES-GCM password encryption for JSON backup files to protect personal notes and task archives during off-device export and storage.
