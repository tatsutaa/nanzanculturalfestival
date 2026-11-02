# Admin Access and Firebase Security

The staff dashboard is available at `/tickets/admin`. The home page now has a clearly labeled staff link. The dashboard uses Firebase Authentication and checks the signed-in user's UID against `NEXT_PUBLIC_ADMIN_UID`; the former hardcoded password and client-side `localStorage` login flag have been removed.

## One-Time Setup

1. In Firebase Console, open **Authentication** and select **Get started** if Authentication has not been initialized. Under **Sign-in method**, enable **Email/Password** and **Anonymous**. Create the administrator account yourself and a separate low-privilege Email/Password account for the Pico. Do not add a public email/password sign-up form.
2. Copy the administrator's Firebase Authentication UID and the Pico account's UID.
3. Copy `.env.example` to `.env.local`, set `NEXT_PUBLIC_ADMIN_UID=<the UID>`, and add the same value to the Vercel project's environment variables. Redeploy after changing the Vercel value. This UID is an identifier, not a password or secret.
4. Replace every `REPLACE_WITH_ADMIN_UID` value and the `REPLACE_WITH_PICO_UID` values in `database.rules.json` with the corresponding UIDs.
5. Review the rules against the live database data and workflows, then deploy them with `npx firebase-tools deploy --only database --project my-ticket-app-5b992` (or publish the JSON in Firebase Console > Realtime Database > Rules).

The application fails closed for the dashboard if `NEXT_PUBLIC_ADMIN_UID` is not configured. Firebase rules are the actual data-access boundary; hiding the dashboard alone is not security. Never deploy the rules with the placeholder still present.

## Rules Summary

- Public clients can read ticket state and leaderboard data. Player pages sign in anonymously and can read only their own game room. The Pico UID can read game rooms to find the one whose status is `playing`.
- Only the configured administrator can change the active calling list or reset ticket and leaderboard data.
- Public ticket clients can create valid issued-ticket entries, increment the ticket counter by one, and cancel an existing ticket. A cancellation marker must exist before the ticket is removed.
- Authenticated game clients can add a new leaderboard entry but cannot edit or delete an existing entry.
- Player pages create rooms owned by their authenticated Firebase UID. Only that owner or the configured administrator can delete a room.
- The game page can change a room from `waiting` to `playing`, but it cannot change the score. The Pico signs in with its dedicated Email/Password account, discovers the active room, and may increase that room's score by exactly 10 per hit. Use Firebase Authentication ID tokens with the Realtime Database REST API; do not embed a service-account key in Pico firmware. Room IDs are 128-bit random tokens rather than guessable four-digit PINs.
- The Pico must keep its Firebase ID token refreshed and send score updates only to `/game_pins/{roomId}.json?auth={idToken}`, preserving `name`, `status`, and `ownerUid` while changing `score` by exactly +10. Rules reject other client score changes. The optional PyQt monitor only reads room updates and does not write scores.

## Important Limitations

Ticket-state and leaderboard reads are public in the included rules because customer pages and displays need them without signing in. Game-room reads require Firebase Authentication. Do not store private customer information in public paths. The current ticket counter uses separate read and write calls, so simultaneous ticket requests can race; use a transaction or trusted server endpoint if ticket numbering must be reliable under concurrent load.

Firebase Authentication does not make browser-side validation authoritative. Keep the UID restriction in the database rules, and do not grant broad write access at the database root. Review the rules in Firebase Console after deployment. For stronger protection of ticket issuance and game-room operations, move those writes to server-side endpoints and then remove their public write permissions.
