# Admin Access and Firebase Security

The staff dashboard is available at `/tickets/admin`. The home page now has a clearly labeled staff link. The dashboard uses Firebase Authentication and checks the signed-in user's UID against `NEXT_PUBLIC_ADMIN_UID`; the former hardcoded password and client-side `localStorage` login flag have been removed.

## One-Time Setup

1. In Firebase Console, enable **Authentication > Sign-in method > Email/Password** and create the administrator account yourself. Do not add a public sign-up form.
2. Copy the administrator's Firebase Authentication UID.
3. Set `NEXT_PUBLIC_ADMIN_UID=<the UID>` in local `.env.local` and in the Vercel project's environment variables. Redeploy after changing the Vercel value. This UID is an identifier, not a password or secret.
4. Replace every `REPLACE_WITH_ADMIN_UID` value in `database.rules.json` with that same UID.
5. Review the rules against the live database data and workflows, then deploy them to the correct Firebase project with `firebase deploy --only database` (or publish the JSON in Firebase Console > Realtime Database > Rules).

The application fails closed for the dashboard if `NEXT_PUBLIC_ADMIN_UID` is not configured. Firebase rules are the actual data-access boundary; hiding the dashboard alone is not security. Never deploy the rules with the placeholder still present.

## Rules Summary

- Public clients can read the ticket state, game rooms, and leaderboard needed by the display pages.
- Only the configured administrator can change the active calling list or reset ticket and leaderboard data.
- Public ticket clients can create valid issued-ticket entries, increment the ticket counter by one, and cancel an existing ticket. A cancellation marker must exist before the ticket is removed.
- Public game clients can add a new leaderboard entry but cannot edit or delete an existing entry.
- Game-room creation and deletion remain available to the public client because the current shooting-game flow performs those writes directly. The four-digit room code is not strong authorization; a production deployment should move these operations behind a trusted server endpoint and use unguessable room tokens.

## Important Limitations

Realtime Database reads are public in the included rules because the customer pages and live displays read these records without signing in. Do not store private customer information in these paths. The current ticket counter uses separate read and write calls, so simultaneous ticket requests can race; use a transaction or trusted server endpoint if ticket numbering must be reliable under concurrent load.

Firebase Authentication does not make browser-side validation authoritative. Keep the UID restriction in the database rules, and do not grant broad write access at the database root. Review the rules in Firebase Console after deployment. For stronger protection of ticket issuance and game-room operations, move those writes to server-side endpoints and then remove their public write permissions.
