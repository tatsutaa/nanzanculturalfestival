# School Cultural Festival IoT Ecosystem

A Next.js web app for cultural-festival ticketing, a live target game, and score rankings. Firebase Realtime Database synchronizes ticket and game data with the browser and the connected hardware client.

## Features

- Visitors can issue and cancel queue tickets and see active calls.
- Staff can manage tickets and reset festival data from the protected admin page at `/tickets/admin`.
- Players can join a target game with a room code and follow their score live.
- Visitors can view the live leaderboard.

## Project Structure

```text
app/                  Next.js routes, shared layout, styles, and Firebase client
	tickets/            Visitor ticket page and staff admin page
	shooting-game/      Player game page
	realtime-ranking/   Live leaderboard page
docs/                 Project notes and admin security setup
public/               Audio and other static assets
database.rules.json   Realtime Database access rules
firebase.json         Firebase CLI configuration
```

Next.js and TypeScript configuration files, package manifests, and lint settings live at the project root. Build output and installed dependencies are excluded by `.gitignore`.

## Development

Install dependencies and start the local server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Check the project with `npm run lint` and `npm run build`.

## Firebase and Admin Setup

The staff page uses Firebase Authentication and an administrator UID allowlist. Configure the Firebase account, `NEXT_PUBLIC_ADMIN_UID`, and Realtime Database rules before deployment. Follow [docs/admin-security.md](./docs/admin-security.md); do not deploy `database.rules.json` while it still contains the UID placeholder.

## Project Notes

Architecture decisions and AI collaboration notes are in [docs/prompts.md](./docs/prompts.md).
