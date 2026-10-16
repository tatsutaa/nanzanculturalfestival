This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

---

# 🚀 [Your App Name] (School Cultural Festival IoT Ecosystem)

A dynamic Web application built to automate interactive attractions at our high school cultural festival.

## 🌟 Project Overview
Built within **just one week** using an **AI-collaborative engineering workflow**, translating complex requirements into a production-ready system efficiently.

## 🛠️ Tech Stack & Architecture
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS
- **Backend / Database:** Firebase (Cloud Firestore / Realtime Database)
- **Deployment:** Vercel
- **Hardware Integration:** Python

## ⚡ IoT Architecture
- **Hardware & Python:** IR sensors detect hits, and a Python script pushes data payloads to **Firebase**.
- **Real-time Sync:** The Next.js frontend listens to Firebase streams to instantly update scores and live rankings.

## 📋 Core Features
- **Digital Ticketing System:** Manages entries dynamically.
- **Target Game Score Sync:** Captures IR events and syncs scores to the cloud.
- **Real-time Leaderboard:** Displays live high scores.

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
- [Next.js Documentation](https://nextjs.org/docs)
- [Deploy on Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme)
