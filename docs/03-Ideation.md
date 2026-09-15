# Ideation

## Brainstorming

Before selecting StudySphere as the final solution, multiple ideas were considered to address the problem of fragmented student study workflows.

### Idea 1: Study Planner App

A dedicated app for timetables, exam countdowns, and goal tracking. Focused solely on planning.

### Idea 2: Notes Application

A note-taking app with markdown support, categories, search, pinning, and favorites. Focused solely on notes.

### Idea 3: AI Study Assistant

A chat-based AI assistant that can explain concepts, generate flashcards, create quizzes, and summarize text. Focused solely on AI interaction.

### Idea 4: Coding Practice Platform

A platform to write and run code in-browser, track problems solved, languages used, and streaks. Focused solely on coding.

### Idea 5: Student Productivity Dashboard

A dashboard aggregating study hours, coding hours, assignment completion, and goal progress into visual analytics. Focused solely on tracking and visualization.

### Idea 6: All-in-One Student Workspace (StudySphere)

A unified workspace combining notes, planning, assignments, coding practice, coding progress, AI assistance, analytics, and social features (friends and study groups) in a single application with cloud persistence.

## Idea Comparison

| Idea | Advantages | Limitations | User Value | Technical Feasibility |
|------|-----------|-------------|------------|----------------------|
| Study Planner | Simple to build; focused scope | Only solves planning; students still need other tools for notes, coding, AI | Medium — solves one part of the problem | High — standard CRUD app |
| Notes App | Clear utility; well-understood domain | No planning, coding, or AI; does not address fragmentation | Medium — solves one part | High — standard CRUD app |
| AI Study Assistant | High novelty; mode-specific help (flashcards, quizzes) | Only AI; no notes, planning, or coding; requires external API or built-in logic | Medium-High — valuable but narrow | Medium — requires edge function and AI integration |
| Coding Practice Platform | Strong for CS students; live preview | Only coding; excludes non-CS students; no notes or planning | Low-Medium — niche audience | Medium — requires in-browser code execution (iframe, Pyodide) |
| Productivity Dashboard | Visual analytics are motivating | Dashboard without underlying tools is just a viewer; no creation capability | Low — passive, not active | High — charts and data aggregation |
| **All-in-One Workspace (StudySphere)** | **Solves fragmentation; all tools in one place; AI integrated into workflow; cloud-backed; social features** | **Larger scope; more complex to build; requires careful UX to avoid clutter** | **High — addresses the root cause directly** | **Medium — larger but feasible with React + Supabase + Edge Functions** |

## Selection Criteria

The following criteria were used to evaluate and select the final solution:

| Criterion | Description | Weight |
|-----------|-------------|--------|
| **User usefulness** | Does the solution address a real, prevalent student need? | High |
| **Simplicity** | Is the solution simple enough for non-technical students to use? | High |
| **Feasibility** | Can the solution be built with available technologies within the project scope? | High |
| **Scalability** | Can the solution grow to include more features without major rewrites? | Medium |
| **AI usefulness** | Does the solution meaningfully integrate AI into the study workflow? | Medium |
| **Student productivity impact** | Will the solution measurably improve study efficiency? | High |

## Selected Solution

**StudySphere — the All-in-One Student Workspace** was selected because:

1. **Addresses the root cause**: The core problem is fragmentation, and only a unified workspace solves that. Individual tools (planner, notes, AI, coding) each solve a symptom but not the root cause.
2. **Highest user value**: Students get everything in one place — no more switching between 4–5 apps.
3. **AI integrated into the workflow**: Rather than a separate AI tool, the AI assistant is embedded in the study environment with 7 modes (chat, explain code, summarize, generate notes, flashcards, quiz, translate) that complement the other features.
4. **Measurable productivity**: Analytics and progress tracking provide quantifiable feedback, satisfying the "student productivity impact" criterion.
5. **Technically feasible**: React for the frontend, Supabase for database/auth/edge functions, in-browser iframe for HTML/CSS/JS preview, Pyodide for Python execution — all proven, available technologies.
6. **Scalable**: The architecture (component-based pages, typed data models, cloud database) allows adding new features without rewriting existing ones.

## Final Concept

StudySphere is a web-based, cloud-backed student workspace with the following major features:

| Feature | Description |
|---------|-------------|
| **Dashboard** | Greeting, live clock, stat cards (study hours, coding streak, productivity, pending assignments), 14-day activity bar chart, today's timetable, upcoming deadlines, daily goals, upcoming exams, and notifications |
| **Notes** | Markdown notes with autosave, search, category filter, pin, favorite, and delete |
| **Planner** | Tabbed planner: Timetable (weekly grid), Exam Countdown, Attendance (with progress bars), GPA (per semester), Semester tracking, Daily Goals, Weekly Goals |
| **Assignments** | Assignment tracker with title, subject, due date, priority (low/medium/high), status (pending/in-progress/completed/overdue), filter, and description |
| **AI Assistant** | Chat interface with 7 modes: Chat, Explain Code, Summarize, Generate Notes, Flashcards, Generate Quiz, Translate. Conversation history saved to cloud. Runs via a Supabase Edge Function with a built-in study assistant (or external AI API if configured). |
| **Coding Hub** | In-browser code editor, compiler & runner for Java, C++, and Python with live console output, standard I/O (stdin), copy button, and sample templates. |
| **Coding Progress** | Log daily coding sessions (problems solved, hours, languages, notes). Stats cards, 30-day bar chart, recent sessions list, and streak tracking. |
| **Analytics** | Auto-calculated stats from activity across the app. Weekly/monthly toggle. Study vs coding hours chart, productivity score chart, and summary cards. |
| **Exam Schedule** | Dedicated exam tracker with countdown cards, completed exam list, and add/edit/delete. |
| **Notifications** | Notification list with read/unread status. |
| **Connect** | Social feature: set a username, search for friends by username, send/accept/decline friend requests, and view friends list. |
| **Group Study** | Create study groups, join/leave groups, invite friends, and view members. |
| **Profile** | User profile with avatar, bio, college, department, semester, achievements, and stats (notes, assignments, friends, groups). |
| **Settings** | Theme (light/dark), notification toggle, privacy, language. |
| **Authentication** | Email/password signup and login via Supabase Auth. |
