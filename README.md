# School Cultural Festival IoT Ecosystem

A Next.js web app for cultural-festival ticketing, a live target game, and score rankings. Firebase Realtime Database synchronizes ticket and game data with the browser and the connected hardware client.

## Features

- Visitors can issue and cancel queue tickets and see active calls.
- Staff can manage tickets and reset festival data from the protected admin page at `/tickets/admin`.
- Players can join a target game with a room code and follow their score live.
- Players prepare a game from one screen. The page displays the live score written by the Raspberry Pi Pico WH integration.
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

The staff page uses Firebase Authentication and an administrator UID allowlist. Enable the Email/Password and Anonymous providers, configure `NEXT_PUBLIC_ADMIN_UID`, and deploy the Realtime Database rules before use. Follow [docs/admin-security.md](./docs/admin-security.md); do not deploy `database.rules.json` while it still contains the UID placeholder.

## Target Game

Open `/shooting-game`, enter a player name, and prepare the game. The page displays score changes written by the Pico WH and saves the final score to the leaderboard when the game ends; it has no manual score control. Configure a dedicated Firebase Email/Password account on the Pico. Its firmware can discover a room with `status: "playing"` and update `/game_pins/{roomId}/score` by +10 through the Realtime Database REST API. Replace `REPLACE_WITH_PICO_UID` in the rules with that account's UID. Pico firmware is not included in this repository.

The optional PyQt5 client in `app/laser_game.py` is a passive room and score monitor; it does not add points. Its dependencies are listed in `app/requirements-laser-game.txt`; it requires a separately managed Firebase service-account JSON file and the `FIREBASE_SERVICE_ACCOUNT_PATH` environment variable. Keep that private key outside the repository.

## Project Notes

Architecture decisions and AI collaboration notes are in [docs/prompts.md](./docs/prompts.md).
