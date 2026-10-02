import type { Metadata, Viewport } from "next";
import "./globals.css";
import { NativeBootstrap } from "@/components/native/NativeBootstrap";

export const metadata: Metadata = {
  title: {
    default: "ECRN — Electrical Construction Referral Network",
    template: "%s · ECRN",
  },
  description:
    "Your construction network has value. Refer the right people, track placements, and earn payouts. An initiative of Delta Construction Partners.",
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
    title: "ECRN — Electrical Construction Referral Network",
    description:
      "Refer construction industry talent and earn referral payouts when Delta places them.",
    type: "website",
  },
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
    <html lang="en">
      <body className="font-sans antialiased text-ecrn-ink">
        {children}
        <NativeBootstrap />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // The native app loads pages live; skip the PWA service worker there.
              if ('serviceWorker' in navigator && navigator.userAgent.indexOf('ECRNApp') === -1) {
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
