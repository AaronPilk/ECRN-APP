# TestFlight feedback repair — November 20, 2026

## Reports reviewed

App Store Connect contained two screenshot reports for version 1.0, build 3,
on an iPhone 15 Pro running iOS 18.7.3 (393 × 852 points):

- Login: alignment, placement and excessive gaps.
- Startup: logo appears zoomed in, with both sides cropped.

No crash feedback was listed. Both original screenshot exports were inspected.

## Repairs

- Auth screens group the logo, form and footer in a centered, bounded column.
  Dynamic viewport height and combined safe-area padding protect phone edges;
  long forms stay in normal document flow and can scroll.
- Login uses less mobile card padding and a tighter sign-up section. Both
  password/link mode controls have at least 44-pixel height. Input text remains
  16 pixels and input height remains 52 pixels.
- The iOS launch logo has a required width ceiling of 72% of the screen and
  a preferred width priority above the image's compression resistance. This
  prevents its intrinsic width from expanding beyond a phone. Centering,
  aspect-fit rendering, supplied artwork and the 580-point tablet cap remain.
- iOS build number is 4; marketing version remains 1.0.

The native splash needs build 4. The login repair is delivered by the live web
application and also applies to the Android wrapper. Android splash assets were
checked; the full logo is already centered within their margins.

## Verification

- TypeScript and the Cloudflare/OpenNext production build pass.
- Login checked at 320 × 568, 393 × 852, 430 × 932 and 852 × 393. No horizontal
  overflow; short/landscape screens scroll rather than clipping the form.
- Signup checked at 393 × 852 with all input font sizes at 16 pixels.
- iPhone/iPad launch storyboard compiles with no diagnostics.
- Source review confirms Capacitor's iOS splash plugin uses this storyboard.

The initial local production packaging attempt ran out of disk space. Removing
only disposable test files under /tmp allowed the retry to pass. Native runtime
layout measurements were not completed; the splash was validated through its
constraints and storyboard compiler. Device acceptance remains the final check.

No authentication, signing, certificate, tester or App Store Connect settings
were changed. No Capacitor sync was run. The original checkout was not edited.
