# AI Collaboration & Prompt Engineering Logs 🤖

This document archives the system architecture decisions, prompting strategies, and human-in-the-loop quality assurance (QA) loops utilized during the **1-week rapid prototyping** of the School Cultural Festival IoT Ecosystem.

---

## 🎯 1. System Requirement Definition
Before initializing the AI collaborative session, the system parameters were strictly defined to guarantee long-term code quality and predictable integration:

- **Objective:** Build an omni-channel cultural festival management system (Digital Ticketing, IoT Score-Sync, and Real-time Rankings).
- **Time Constraints:** 7 days to deploy a fully functional Minimum Viable Product (MVP).
- **Architectural Constraints:**
  - **Type Safety:** 100% strict TypeScript typing. No fallback to `any` types.
  - **Linter Integration:** Standard validation using the modern **ESLint v9 Flat Config**.
  - **Infrastructure:** Frontend decoupled via **Next.js (App Router)** + **Vercel**; backend synchronized directly via **Firebase** Client SDK.

---

## 📝 2. Master System Prompt Template
The following structural context was injected into the AI system prompt before any component or code block was requested. This isolated the AI's behavior to output only highly maintainable infrastructure:

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
- **User Request / Prompt Intent:** Translate physical ticket line logs into a virtualized real-time queue list UI using Tailwind CSS.
- **Prompt Used:**
  ```text
  Generate a responsive Next.js Client Component for a virtual queuing system. 
  It must accept a "tickets" prop matching a strict TypeScript interface `Ticket { id: string; status: 'waiting' | 'called' | 'expired'; userNumber: number; timestamp: Date; }`.
  Keep the tailwind classes modular and avoid any third-party UI framework dependencies.
  ```

### Case Study B: IoT Live Leaderboard
- **User Request / Prompt Intent:** Interface incoming IoT target-game score metrics passed into Firebase via the hardware's Python script.
- **Prompt Used:**
  ```text
  Create an App Router Page component that listens to a real-time Firestore database collection path: `/cultural-festival/target-game/scores`.
  Sort scores in descending order dynamically on the client-side. The score entries must sync dynamically without causing browser reloads or unmounting animations.
  ```

---

## 🐛 4. Human-in-the-Loop Debugging Loops
Rapid development was sustained by aggressively catching runtime errors inside **Browser Developer Tools (DevTools)** and passing structural feedback loops back to the AI assistant to perform rapid automated hotfixes.

### Example: Handling Firebase Asynchronous Type Mismatches
- **Symptom Discovered via DevTools Console:**
  `TypeError: Cannot read properties of undefined (reading 'seconds') at ...`
- **Root Cause Identified:** The Firebase Firestore timestamp format was parsed incorrectly as a native JS Date object prior to processing.
- **Corrective Prompt Fed back to AI:**
  ```text
  The DevTools console threw a TypeError because the Firestore Timestamp payload structure is returning an object containing { seconds: number, nanoseconds: number } instead of a JS Date. 
  Rewrite the interface map parser function to check for the type and utilize `timestamp.toDate()` safely. Keep it concise.
  ```
- **Result:** Bug eliminated within 30 seconds of discovery, preserving the 1-week deployment schedule.
