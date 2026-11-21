# ECRN releases and TestFlight

The iOS app uses Capacitor 8, Swift Package Manager, and `ios/App/App.xcodeproj`,
scheme `App`. Bundle ID: `com.goecrn.app`; team: `5F5C5G25Y6`; automatic signing.
The Android app uses the same live website: https://ecrn.aaron-9c3.workers.dev.

## Web releases

Push the verified release to `origin/main`. Cloudflare Workers Builds deploys it.
`/api/version` returns the deployed Git commit. Verify it matches the pushed commit,
then check the affected pages and login.

Native cold launches load the current website. An app already open checks for new
web releases on resume and periodically. After at least a minute in the background,
viewing screens reload automatically. Editing screens offer a reload button so
unfinished work is preserved. Native plugins, permissions, icons, and bundled assets
need a new store build. Native apps do not use the browser PWA service worker.

## Archive and upload

For this release the native configuration is already synced. **Do not run cap sync.**
Use the existing project; there is no CocoaPods workspace.

1. Ensure the working tree contains the intended release and the Xcode project has
   the next build number in both configurations. Marketing version remains `1.0`.
2. From `ios/App`, archive with `xcodebuild -project App.xcodeproj -scheme App
   -configuration Release -destination "generic/platform=iOS" -archivePath
   "$HOME/Desktop/ECRN-1.0-build3.xcarchive" -allowProvisioningUpdates archive`.
3. Inspect the archive's `Info.plist` ApplicationProperties and confirm version/build.
4. Export with an options plist containing `method=app-store-connect`,
   `destination=upload`, `teamID=5F5C5G25Y6`, `signingStyle=automatic`,
   `uploadSymbols=true`, and `manageAppVersionAndBuildNumber=false`.
5. Run `xcodebuild -exportArchive -archivePath "$HOME/Desktop/ECRN-1.0-build3.xcarchive"
   -exportOptionsPlist /tmp/ECRN-ExportOptions.plist -exportPath /tmp/ECRN-export-build3
   -allowProvisioningUpdates`.
6. Confirm **Upload succeeded / EXPORT SUCCEEDED**. Apple processing is a separate
   step before the build is available in TestFlight.

Xcode uses the Apple account signed in under Settings → Accounts. If authentication
is requested, the account owner signs in directly; credentials and two-factor codes
must not be placed in scripts or logs. Existing tester groups and signing settings
remain managed by the account owner.

## Account access

Use the same `/login` for administrators and ordinary members. The profile's database
role determines the landing page. Shared demo shortcuts have been retired. Review
credentials, if needed for Apple review, should be a normal dedicated account provided
through App Store Connect by the account owner; do not use retired demo accounts.
