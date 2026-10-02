import type { CapacitorConfig } from "@capacitor/cli";

/**
 * ECRN native app (iOS + Android).
 *
 * The app loads the live ECRN site inside a native shell, so every web
 * deploy updates the app instantly — no App Store resubmission needed for
 * content or UI changes. Native features (contacts, push, share, Face ID)
 * are exposed to the site through Capacitor plugins.
 */
const APP_URL = "https://ecrn.aaron-9c3.workers.dev";

const config: CapacitorConfig = {
  appId: "com.goecrn.app",
  appName: "ECRN",
  // Offline fallback page bundled into the app.
  webDir: "native-shell",
  backgroundColor: "#0A100C",
  server: {
    url: APP_URL,
    cleartext: false,
    errorPath: "offline.html",
  },
  // Lets the site recognize it's running inside the app.
  appendUserAgent: "ECRNApp",
  ios: {
    contentInset: "never",
    scheme: "ECRN",
    limitsNavigationsToAppBoundDomains: false,
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: "#0A100C",
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
