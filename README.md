# StudyFlow

StudyFlow is a full-stack productivity platform for students that combines goals, tasks, Pomodoro focus tracking, analytics, resources, study circles, and AI planning.

## 1) Current Architecture

This repository is split into two apps:

- `frontend/`: React + TypeScript + Vite SPA
- `backend/`: Express + TypeScript + Prisma + MySQL API

Note: Although the app behaves like a typical MERN-style product, the current backend persistence layer is Prisma + MySQL (not Mongoose/MongoDB).

## 2) Feature Overview (Accurate to Current Code)

### Authentication & Account

- Secure signup and sign-in flow with persistent session handling.
- Token-based authentication protects user data and private screens.
- Password recovery flow supports:
  - Forgot password request
  - Reset link/token verification
  - New password setup
- In-app password change for logged-in users without logging out.
- Profile management includes:
  - Name and bio updates
  - Notification preference controls
  - Avatar/photo upload and display across the app UI
- Session-aware behavior:
  - Unauthorized sessions are handled safely
  - User state refreshes after profile/security changes

### Goals & Tasks

- Create long-term or short-term goals to structure study outcomes.
- Add tasks to goals in two ways:
  - One-by-one while planning
  - Bulk creation for fast setup
- Task lifecycle actions:
  - Mark complete/incomplete
  - Delete tasks
  - Track progress in real time
- Goal progress is calculated automatically from task completion ratio.
- Each task can include an intended focus duration (`focusMinutes`) for better planning.
- "Start Timer" from a task launches Focus Mode and preloads/starts the timer for that task duration.
- This creates a direct loop:
  - Plan task -> Start timer -> Complete focus -> See analytics impact

### Focus (Pomodoro)

- Dedicated focus workspace with:
  - Focus mode (work interval)
  - Break mode (recovery interval)
- Fully user-controlled timing:
  - Custom focus minutes
  - Custom break minutes
  - No forced fixed duration workflow
- Timer controls support start, pause, resume, and reset.
- Session tracking behavior:
  - Focus completion saves a real study session
  - Break intervals are not recorded as study time
  - Partial session persistence helps reduce accidental data loss (tab hide/unload scenarios)
- Task-integrated timer launch helps users execute planned work with minimal friction.

### Real Analytics

- Analytics are based on actual tracked focus sessions, not estimated conversions.
- Time-based insights include:
  - Weekly distribution of study hours
  - Total study hours accumulated
  - Subject/category breakdown of focus time
- Task productivity insights remain task-driven (completion/activity trend).
- Visuals are designed for pattern discovery:
  - Daily consistency changes
  - Workload balance over the week
  - Relationship between planned tasks and real focus time
- Built-in "How analytics work" guide explains the data source and interpretation in plain language.

### Dashboard

- Personalized landing screen with quick context:
  - Greeting and momentum/streak cues
  - Snapshot of current progress
- Consistency heatmap helps identify routine quality over time.
- Insight cards summarize key metrics so users can act without opening full analytics.
- Designed as a high-level command center before drilling into specific modules.

### Calendar

- Personal planning layer for scheduling study sessions, deadlines, and reminders.
- Event operations support create, view, and delete actions.
- Useful for converting goals into time-bound execution blocks.

### Resources

- Save important materials in one place:
  - Upload notes/files
  - Save external links
- Resources are displayed in a manageable list with delete support.
- Helps reduce context switching by centralizing learning references.

### Study Circles (Collaboration)

- Collaborative mode for peer accountability and group learning.
- Core circle flows:
  - Create a circle
  - Join via invite code
  - Membership constraints and validation for stability
- Collaboration features include:
  - Group messaging/chat
  - Shared goals and scheduling
  - Weekly leaderboard for motivation
  - Live session coordination endpoints
- Encourages consistency through social commitment and visibility.

### AI Planner

- AI generates structured multi-week plans from user goals.
- Plans are output in a predictable structure for reliable rendering and interaction.
- Designed to convert vague goals into actionable weekly/day-level steps.
- Includes response-handling safeguards to keep UX stable even when model output varies.
- Requires `GROQ_API_KEY` in the Next frontend runtime environment; without it, planner intentionally falls back to a mock plan.

### UX Prompts / Guidance

- Contextual guidance appears at key moments to improve feature adoption.
- After goal creation, users can be nudged toward starting Pomodoro tracking.
- Prompts are condition-aware to reduce repetition and annoyance.
- Analytics help modal teaches users how numbers are generated so insights are trusted.
- Prompt design is intentionally lightweight, actionable, and non-blocking.


