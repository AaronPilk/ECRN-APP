# ECRN → TestFlight

The iOS app (bundle ID `com.goecrn.app`) is a native Capacitor shell that loads
https://ecrn.aaron-9c3.workers.dev and adds native features: contacts import, push
notifications, the native share sheet, and Face ID lock.

**Web changes go live in the app instantly** after `npm run deploy` — no new TestFlight
build needed. You only need a new build when native code/config changes (plugins,
icons, Info.plist, capacitor.config.ts).

## One-time setup

1. Install **Xcode** from the Mac App Store (open it once and let it install components).
2. Terminal:
   ```bash
   cd "/Users/pilksclaes/ECRN App"
   npm install
   npm run deploy
   npx cap sync ios
   npx cap open ios
   ```
3. In Xcode, left sidebar → click **App** (blue icon) → target **App** →
   **Signing & Capabilities** tab:
   - Check **Automatically manage signing**
   - **Team:** pick your Apple Developer team
   - Bundle Identifier should already read `com.goecrn.app`
4. Create the app record: https://appstoreconnect.apple.com → **Apps** → **+** → **New App**
   - Platform: iOS · Name: `ECRN – Construction Referrals` (the store name must be unique)
   - Language: English (U.S.) · Bundle ID: `com.goecrn.app` · SKU: `ecrn-ios`
   - User Access: Full Access

## Upload a build

1. Xcode top bar device menu → **Any iOS Device (arm64)**
2. Menu **Product → Archive** (a few minutes)
3. Organizer window → **Distribute App** → **App Store Connect** → **Upload** → keep defaults → **Upload**
4. App Store Connect → ECRN → **TestFlight**. The build shows "Processing" for ~10–30 minutes.
5. **Internal Testing → +** → create a group (e.g. "Delta team") → add testers (they must be
   users in App Store Connect → Users and Access) → add the build.
6. Testers install the **TestFlight** app from the App Store and accept the invite.

Each later upload needs a higher build number: Xcode → target App → **General** →
**Build** (1 → 2 → 3…).

## Before external testers / App Store review

- External TestFlight testers require Apple's Beta App Review (usually under a day).
- Needed in App Store Connect: Privacy Policy URL
  `https://ecrn.aaron-9c3.workers.dev/privacy`, Support URL
  `https://ecrn.aaron-9c3.workers.dev/support`, and a demo login for the reviewer
  (`partner@demo.goecrn.com` + the demo password).
- **Push notifications:** in Xcode → Signing & Capabilities → **+ Capability** →
  **Push Notifications**, then create an APNs key in the Apple Developer portal.
  Until then the app's "Turn on notifications" button reports it isn't available.
- Real-user emails (signup confirmation, magic links) need a custom SMTP provider in
  Supabase — the built-in one only emails your Supabase team members.
