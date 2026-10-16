# Admin Access and Firebase Security

The staff dashboard is available at `/tickets/admin`. The home page now has a clearly labeled staff link. The dashboard uses Firebase Authentication and checks the signed-in user's UID against `NEXT_PUBLIC_ADMIN_UID`; the former hardcoded password and client-side `localStorage` login flag have been removed.

## One-Time Setup

1. In Firebase Console, open **Authentication** and select **Get started** if Authentication has not been initialized. Under **Sign-in method**, enable **Email/Password** and **Anonymous**. Create the administrator account yourself. Do not add a public email/password sign-up form.
2. Copy the administrator's Firebase Authentication UID.
3. Copy `.env.example` to `.env.local`, set `NEXT_PUBLIC_ADMIN_UID=<the UID>`, and add the same value to the Vercel project's environment variables. Redeploy after changing the Vercel value. This UID is an identifier, not a password or secret.
4. Replace every `REPLACE_WITH_ADMIN_UID` value in `database.rules.json` with that same UID.
5. Review the rules against the live database data and workflows, then deploy them with `npx firebase-tools deploy --only database --project my-ticket-app-5b992` (or publish the JSON in Firebase Console > Realtime Database > Rules).

The application fails closed for the dashboard if `NEXT_PUBLIC_ADMIN_UID` is not configured. Firebase rules are the actual data-access boundary; hiding the dashboard alone is not security. Never deploy the rules with the placeholder still present.

## Rules Summary

- Public clients can read ticket state and leaderboard data. Game-room reads require Firebase Authentication; the player and target pages sign in anonymously when needed.
- Only the configured administrator can change the active calling list or reset ticket and leaderboard data.
- Public ticket clients can create valid issued-ticket entries, increment the ticket counter by one, and cancel an existing ticket. A cancellation marker must exist before the ticket is removed.
- Authenticated game clients can add a new leaderboard entry but cannot edit or delete an existing entry.
- Player pages create rooms owned by their authenticated Firebase UID. Only that owner or the configured administrator can delete a room.
- The browser target-control page can change a room from `waiting` to `playing` and increment its score by exactly 10 while it is playing. Room IDs are 128-bit random tokens delivered as QR codes, rather than guessable four-digit PINs.
- The QR token is a bearer credential: anyone who obtains it can attempt target actions while the room exists. Keep it visible only to the player and target station, and use trusted server endpoints with separate role authorization for higher-risk deployments.

## Important Limitations

Ticket-state and leaderboard reads are public in the included rules because customer pages and displays need them without signing in. Game-room reads require Firebase Authentication. Do not store private customer information in public paths. The current ticket counter uses separate read and write calls, so simultaneous ticket requests can race; use a transaction or trusted server endpoint if ticket numbering must be reliable under concurrent load.

Firebase Authentication does not make browser-side validation authoritative. Keep the UID restriction in the database rules, and do not grant broad write access at the database root. Review the rules in Firebase Console after deployment. For stronger protection of ticket issuance and game-room operations, move those writes to server-side endpoints and then remove their public write permissions.
