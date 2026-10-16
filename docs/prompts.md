# AI Collaboration & Prompt Engineering Logs 🤖

This document archives the system architecture decisions, prompting strategies, and human-in-the-loop quality assurance (QA) processes used during the **one-week rapid-prototyping effort** for the School Cultural Festival IoT Ecosystem.

---

## 🎯 1. System Requirement Definition
Before beginning the AI collaboration, the system requirements and constraints were clearly defined to support long-term code quality and predictable integration:

- **Objective:** Build an omni-channel cultural festival management system (Digital Ticketing, IoT Score-Sync, and Real-time Rankings).
- **Timeline:** Deploy a fully functional Minimum Viable Product (MVP) within 7 days.
- **Architectural Constraints:**
  - **Type Safety:** 100% strict TypeScript typing. No fallback to `any` types.
  - **Linter Integration:** Standard validation using the modern **ESLint v9 Flat Config**.
  - **Infrastructure:** Frontend built with **Next.js (App Router)** and deployed on **Vercel**; backend data synchronized directly through the **Firebase** Client SDK.

---

## 🏗️ 1.5 Architecture Decision Record (ADR)
- **Phase 1 (PHP & GitHub Pages):** I initially attempted to deploy a dynamic backend using PHP on GitHub Pages. However, I discovered that GitHub Pages only supports static content hosting, so server-side PHP execution is not possible on the platform.
- **Phase 2 (Local Hosting):** I evaluated running a local PHP server on a personal machine. I quickly realized that this setup did not meet the cultural festival system's high-availability requirements, since the web application would become unavailable whenever the host PC was powered down or went to sleep.
- **Phase 3 (Serverless Stack / Final Selection):** I pivoted to a modern serverless architecture combining **Next.js (App Router) + Vercel + Firebase**. This eliminated the need for continuous physical server management while providing 24/7 cloud availability and sub-second real-time data synchronization.

---

## 📝 2. Master System Prompt Template
The following structural context was included in the AI system prompt before requesting any component or code. It guided the AI to produce maintainable infrastructure:

```text
[SYSTEM CONTEXT & CONSTRAINTS]
- You are a senior frontend architect specializing in Next.js 15+ (App Router), TypeScript, and Firebase.
- Your output code must be highly concise, minimal, and clear. Avoid nested boilerplate or redundant wrappers.
- Do not make assumptions about data structures. Explicitly define all data structures as TypeScript interfaces.
- Always implement error handling for asynchronous network calls (e.g., Firebase Firestore listeners) using try/catch blocks.
```

---

## 🛠️ 3. Component Generation Case Studies

### Case Study A: Digital Ticketing Component
- **User Request / Prompt Intent:** Convert physical ticket-queue records into a virtualized, real-time queue UI using Tailwind CSS.
- **Prompt Used:**
  ```text
  Generate a responsive Next.js Client Component for a virtual queuing system. 
  It must accept a "tickets" prop matching a strict TypeScript interface `Ticket { id: string; status: 'waiting' | 'called' | 'expired'; userNumber: number; timestamp: Date; }`.
  Keep the tailwind classes modular and avoid any third-party UI framework dependencies.
  ```

### Case Study B: IoT Live Leaderboard
- **User Request / Prompt Intent:** Display incoming IoT target-game scores sent to Firebase by the hardware's Python script.
- **Prompt Used:**
  ```text
  Create an App Router Page component that listens to a real-time Firestore database collection path: `/cultural-festival/target-game/scores`.
  Sort scores dynamically in descending order on the client side. Score entries must update without reloading the browser page or interrupting animations by unmounting components.
  ```

---

## 🐛 4. Human-in-the-Loop Debugging Loops
Rapid development was supported by promptly catching runtime errors in the **Browser Developer Tools (DevTools)** and giving the AI assistant structured feedback to generate fixes.

### Example: Handling Firebase Asynchronous Type Mismatches
- **Symptom Discovered via DevTools Console:**
  `TypeError: Cannot read properties of undefined (reading 'seconds') at ...`
- **Root Cause Identified:** The Firebase Firestore timestamp was incorrectly treated as a native JavaScript `Date` object before processing.
- **Corrective Prompt Sent to the AI:**
  ```text
  The DevTools console reported a TypeError because the Firestore Timestamp payload is an object containing `{ seconds: number, nanoseconds: number }`, not a JavaScript `Date`.
  Rewrite the interface-mapping parser to check the value's type and safely use `timestamp.toDate()`. Keep the solution concise.
  ```
- **Result:** The bug was fixed within 30 seconds of discovery, keeping the project on its one-week deployment schedule.

---

## 📂 5. Keeping the Git Change List Focused
To keep the Git change list focused on files relevant to my work, I used `.gitignore` to exclude files that should not be tracked, including dependencies, build outputs, and local environment files. I then checked `git status` to review the remaining changes and confirm which files were in scope. This helped me focus on the files I intended to edit. `.gitignore` excludes matching files from Git's untracked-file list; it does not hide tracked files or filter the VS Code Explorer.
