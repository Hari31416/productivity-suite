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

## 10. Gamification, XP and Level Progression System

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

