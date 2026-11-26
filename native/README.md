# Tempo native wrapper

This project includes a Capacitor config so Tempo can later be wrapped as a native iOS/Android app.

Recommended production route:
1. Keep the web/PWA version working first.
2. Add a static export or hosted server URL.
3. Run `npm install`.
4. Run `npm run native:add:ios` and/or `npm run native:add:android`.
5. Run `npm run native:sync`.

Tempo currently has no push notifications. If reminders are added back for a native build, prefer Capacitor Push Notifications over Web Push.
