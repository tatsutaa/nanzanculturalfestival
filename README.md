# School Cultural Festival IoT Ecosystem

A Next.js web app for cultural-festival ticketing, a live target game, and score rankings. Firebase Realtime Database synchronizes ticket and game data with the browser and the connected hardware client.

## Features

- Visitors can issue and cancel queue tickets and see active calls.
- Staff can manage tickets and reset festival data from the protected admin page at `/tickets/admin`.
- Players can join a target game with a room code and follow their score live.
- Staff can open `/laser-game` in any browser, scan the player's QR code, and record target hits without installing a separate app.
- Visitors can view the live leaderboard.

## Project Structure

```text
app/                  Next.js routes, shared layout, styles, and Firebase client
	tickets/            Visitor ticket page and staff admin page
	shooting-game/      Player game page
	laser-game/        Browser-based target control page
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

The staff page uses Firebase Authentication and an administrator UID allowlist. Enable the Email/Password and Anonymous providers, configure `NEXT_PUBLIC_ADMIN_UID`, and deploy the Realtime Database rules before use. Follow [docs/admin-security.md](./docs/admin-security.md); do not deploy `database.rules.json` while it still contains the UID placeholder.

## Browser-Based Target Controls

Open the site on the target device and visit `/laser-game`. On the player's `/shooting-game` screen, show the QR code; tap **Scan QR with Camera** on the target and point its camera at the code. The browser pairs automatically. Start the game when the player is ready; each hit button press adds 10 points and updates both screens live. No Python runtime, desktop app, or service-account key is needed for this browser workflow. Camera access requires HTTPS (or localhost during development).

The PyQt5 client in `app/laser_game.py` remains available as an optional hardware integration and accepts the same 32-character room token manually. Its dependencies are listed in `app/requirements-laser-game.txt`; it requires a separately managed Firebase service-account JSON file and the `FIREBASE_SERVICE_ACCOUNT_PATH` environment variable. Keep that private key outside the repository.

## Project Notes

Architecture decisions and AI collaboration notes are in [docs/prompts.md](./docs/prompts.md).
