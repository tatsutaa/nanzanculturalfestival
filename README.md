This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

---

# 🚀 [Your App Name] (School Cultural Festival IoT Ecosystem)

A highly optimized, dynamic Web application built to automate interactive attractions and solve real-world logistical challenges at our high school cultural festival.

## 🌟 Project Overview
This project was conceptualized, designed, and deployed within **just one week**. To achieve this rapid development lifecycle, I adopted an **AI-collaborative engineering workflow**, translating complex requirements into a production-ready system with precision and high efficiency.

## 🛠️ Tech Stack & Architecture
- **Frontend Framework:** Next.js (App Router), TypeScript, Tailwind CSS
- **Backend / Database:** Firebase (Cloud Firestore / Realtime Database)
- **Deployment & CI/CD:** Vercel (Integrated with GitHub)
- **Code Quality:** ESLint v9 (Flat Config)
- **Hardware Integration:** Python

## ⚡ IoT Architecture & Hardware Integration
To automate score tracking and eliminate manual data entry, the application operates as a full-scale IoT ecosystem:
- **Hardware Layer:** An infrared (IR) sensor system embedded in the game hardware to detect real-time hits.
- **Data Ingestion Layer (Python):** A Python script runs on the hardware backend to process raw sensor signals and securely push hit events to Firebase.
- **Real-time Synchronization (JavaScript/Next.js):** The frontend listens to Firebase's real-time data streams, instantly reflecting scores on the UI without requiring page reloads.

## 🤖 AI Collaboration & Prompt Logs (★追加点)
To demonstrate the system architecture decision-making and human-in-the-loop engineering process, the complete documentation of requirements and AI interactions is recorded in this repository:
- **Prompt Engineering & Specification:** Detailed engineering prompts used to enforce concise, type-safe, and high-quality code generation can be found in [docs/prompts.md](./docs/prompts.md).
- **Quality Assurance Loop:** Real-time debugging practices using Browser Developer Tools (DevTools) to pipe error logs back into the AI for rapid automated hotfixes.

## 📋 Core Features
- **Digital Ticketing System:** Eliminates physical queues by issuing digital tickets and managing entry flows in real time.
- **Target Game Score Sync (*Under Active Development*):** Captures infrared sensor events via Python and syncs scores with the cloud.
- **Real-time Leaderboard:** Aggregates game metrics dynamically to display high scores instantly.

## 💻 Getting Started (Local Development)

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📖 Learn More & Deploy
- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Deploy on Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) for more details.
