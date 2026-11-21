import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { SITE_URL } from "@/lib/site";
import { NativeBootstrap } from "@/components/native/NativeBootstrap";
import { NativeUpdates } from "@/components/native/NativeUpdates";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ECRN: Electrical Construction Referral Network",
    template: "%s · ECRN",
  },
  description:
    "Find electrical construction jobs or refer people you know and earn up to $10,000 when they're hired. A Delta Construction Partners initiative.",
  applicationName: "ECRN",
  appleWebApp: {
    capable: true,
    title: "ECRN",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "ECRN: Electrical Construction Jobs & Referral Rewards",
    description:
      "Find electrical construction jobs or refer people you know and earn up to $10,000 when they're hired.",
    type: "website",
    siteName: "ECRN",
    images: [{ url: "/og.jpg", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", images: ["/og.jpg"] },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0A100C",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans antialiased text-ecrn-ink">
        {children}
        <NativeBootstrap />
        <NativeUpdates />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // The native app loads pages live; skip the PWA service worker there.
              if ('serviceWorker' in navigator && navigator.userAgent.indexOf('ECRNApp') !== -1) {
                navigator.serviceWorker.getRegistrations().then(function (registrations) {
                  registrations.forEach(function (registration) {
                    var worker = registration.active || registration.waiting || registration.installing;
                    if (worker && new URL(worker.scriptURL).pathname === '/sw.js') registration.unregister();
                  });
                }).catch(function () {});
              } else if ('serviceWorker' in navigator) {
                window.addEventListener('load', function () {
                  navigator.serviceWorker.register('/sw.js').catch(function (e) {
                    console.warn('[ECRN] SW registration failed:', e);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
