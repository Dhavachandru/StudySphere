# Defined Problem Statement

## Problem Context

College students today face a fragmented digital study experience. They manage their academic lives across disconnected tools:

| Domain | Current State | Problem |
|--------|---------------|---------|
| **Study materials** | Scattered across notebooks, Google Docs, and random folders | No single searchable repository; notes get lost |
| **Notes** | Written in one app, never synced with the rest of the workflow | Categories, pinning, and favorites are missing or inconsistent |
| **Planning** | Timetables in calendars, exams in reminders, GPA in spreadsheets | No unified view of what is due, when exams are, and how GPA is trending |
| **Coding practice** | Tracked manually or not at all on platforms like LeetCode | No integration with the rest of the study workflow; no streak or language tracking |
| **AI assistance** | Students open a separate browser tab for ChatGPT or Google | Context switching breaks study flow; no mode-specific AI help (flashcards, quizzes, notes) |
| **Academic productivity** | No holistic view of study hours, coding hours, assignments done, or goal completion | Students cannot see trends or measure progress over time |

The core problem is **fragmentation**: the effort of managing tools competes with the effort of studying. Students need a single, personalized workspace that connects all these activities and provides a clear picture of their academic progress.

## User Problem

**Problem Statement:**

College students struggle to manage their study materials, notes, planning, coding practice, and AI-assisted learning across multiple disconnected tools. The lack of a unified workspace leads to lost notes, missed deadlines, untracked progress, and constant context switching — reducing the time and energy available for actual studying.

## How Might We?

> **How might we help students organize their learning, planning, coding practice, notes, and AI assistance in one simple and personalized workspace?**

### Why this problem was selected

1. **Prevalence**: Nearly every student deals with tool fragmentation. It is not a niche problem — it affects anyone who studies using digital tools.
2. **Impact**: Reducing context switching and centralizing study activities directly improves study efficiency and reduces stress.
3. **Feasibility**: Modern web technologies (React, Supabase, edge functions, in-browser code execution) make it technically feasible to build a unified study workspace as a single web application.
4. **AI integration opportunity**: Embedding an AI assistant directly into the study workflow (rather than as a separate tab) creates a qualitatively different experience — students can generate flashcards, quizzes, and notes without leaving their workspace.
5. **Measurable outcomes**: Study hours, coding streaks, assignment completion, GPA, and goal progress are all quantifiable, making it possible to measure whether the solution actually improves productivity.

## User Needs

| # | Need | Priority |
|---|------|----------|
| N1 | A single workspace that combines notes, planning, assignments, coding, and AI help | High |
| N2 | Notes with search, categories, pinning, and favorites | High |
| N3 | A planner with timetable, exam countdown, attendance, GPA, and semester tracking | High |
| N4 | Assignment tracking with deadlines, priorities, and status | High |
| N5 | A coding environment where code can be written and run (HTML, CSS, JavaScript, Python) | Medium |
| N6 | Coding progress tracking (problems solved, hours, languages, streaks) | Medium |
| N7 | An AI assistant that can chat, explain code, summarize, generate notes, flashcards, quizzes, and translate | High |
| N8 | Visual analytics showing study hours, coding hours, productivity, and goal completion over time | Medium |
| N9 | Social features to find friends and create study groups | Low |
| N10 | A dashboard that summarizes today's schedule, deadlines, goals, exams, and notifications | High |
| N11 | Data that persists across devices (cloud-backed) | High |
| N12 | A clean, responsive interface that works on both laptop and mobile | Medium |

## Success Criteria

| # | Criterion | Measurement | Target |
|---|-----------|-------------|--------|
| S1 | Users can create, edit, search, pin, and delete notes within the app | Functional test | All operations work without error |
| S2 | Users can add timetable entries, exams, attendance, GPA, and goals | Functional test | All planner tabs functional |
| S3 | Users can add, update status, filter, and delete assignments | Functional test | CRUD operations work |
| S4 | Users can write and run HTML, CSS, JavaScript, and Python code | Manual test | Code executes and output is displayed |
| S5 | Users can log coding sessions and view streak/progress charts | Functional test | Data persists and charts render |
| S6 | The AI assistant responds to user messages in all 7 modes (chat, explain, summarize, notes, flashcards, quiz, translate) | Manual test | All modes return formatted Markdown responses |
| S7 | The dashboard displays today's timetable, deadlines, goals, exams, and notifications | Functional test | All widgets load real data |
| S8 | Analytics charts render with real data for weekly and monthly views | Functional test | Charts display study hours, coding hours, productivity |
| S9 | Users can search for friends by username, send/accept requests, and create study groups | Functional test | Social CRUD operations work |
| S10 | Data persists across sessions and devices (cloud-backed via Supabase) | Session test | Data survives logout/login |
| S11 | The app is responsive on mobile and desktop viewports | Visual inspection | No layout breakage at 375px, 768px, 1024px, 1440px |
| S12 | User testing: at least 3 testers can complete all 7 usability tasks without critical blockers | Usability test | ≥ 3 of 3 testers complete all tasks |
