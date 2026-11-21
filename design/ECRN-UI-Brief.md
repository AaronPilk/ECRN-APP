# ECRN — UI & brand brief (for design work)

Give this file, `ECRN-Screen-Map.pdf`, and any PNGs from `screens/` to ChatGPT (or a designer) as context.

## What ECRN is
A referral network and job board run by **Delta Construction Partners**.
- **Referral partners** refer people they know in construction and earn $1,000–$10,000 when Delta places them.
- **Job seekers** browse confidential roles and apply.
- **Admins** (Delta staff) manage candidates, jobs, companies and payouts. Admin screens aren't in this pack because the demo accounts can't reach them.

It ships as an **iOS/Android app** (a native shell around the web app) and as a website. Every screen here was captured exactly as the app shows it, at iPhone width (393 pt).

## Current visual system
**Direction:** Apple-clean. White and light-grey surfaces inside the app, with ECRN green kept for primary actions and active states. Near-black is used for the strongest CTAs and for marketing surfaces.

| Token | Hex | Used for |
|---|---|---|
| ecrn-green | `#16C172` | Primary buttons, accents, active nav, success |
| ecrn-green-bright | `#22E380` | Hover / highlight |
| ecrn-green-dark | `#0FA15D` | Pressed state |
| ecrn-black | `#0A100C` | "Dark" buttons, hero cards, splash, marketing background |
| ecrn-ink | `#0F1612` | Body text |
| ecrn-carbon | `#161F1B` | Dark surfaces |
| ecrn-mist | `#F6F8F7` | Light section backgrounds |
| page background | `#FAFAFA` | App background |

- **Type:** the system font (SF Pro on iPhone). There's no custom brand typeface yet.
- **Shape:** large rounded corners (cards about 16–24 px, buttons 16 px), soft shadows, thin slate-200 borders.
- **Buttons:** primary (green on black text), dark (black on white text), secondary (white with border), ghost, danger (red).
- **Logo:** green triangle/mountain mark plus the "ECRN" wordmark (`ecrn-horizontal-white.png` is the white version for dark backgrounds).
- **Navigation:** top bar with logo and avatar; bottom tab bar in the app (Dashboard, Referrals, Jobs, Earnings, Profile for partners).
- **Motion:** 200 ms fade-in and 280 ms slide-up on cards.

## Screens in this pack
| # | Screen | Audience | Route | File |
|---|---|---|---|---|
| 1 | Log in | Logged out | `/login` | `screens/A01-log-in.png` |
| 2 | Sign up | Logged out | `/signup` | `screens/A02-sign-up.png` |
| 3 | Forgot password | Logged out | `/forgot-password` | `screens/A03-forgot-password.png` |
| 4 | Check your email | Logged out | `/check-email` | `screens/A04-check-your-email.png` |
| 5 | Hiring request form | Logged out | `/hire` | `screens/A05-hiring-request-form.png` |
| 6 | Hiring request sent | Logged out | `/hire/thanks` | `screens/A06-hiring-request-sent.png` |
| 7 | Support | Logged out | `/support` | `screens/A07-support.png` |
| 8 | Privacy policy | Logged out | `/privacy` | `screens/A08-privacy-policy.png` |
| 9 | Terms of use | Logged out | `/terms` | `screens/A09-terms-of-use.png` |
| 10 | Partner dashboard | Referral partner | `/dashboard` | `screens/B10-partner-dashboard.png` |
| 11 | My referrals | Referral partner | `/referrals` | `screens/B11-my-referrals.png` |
| 12 | Referral detail | Referral partner | `/referrals/[id]` | `screens/B12-referral-detail.png` |
| 13 | New referral | Referral partner | `/referrals/new` | `screens/B13-new-referral.png` |
| 14 | Refer from contacts | Referral partner | `/referrals/import` | `screens/B14-refer-from-contacts.png` |
| 15 | Open jobs | Referral partner | `/jobs` | `screens/B15-open-jobs.png` |
| 16 | Job detail | Referral partner | `/jobs/[id]` | `screens/B16-job-detail.png` |
| 17 | Earnings | Referral partner | `/earnings` | `screens/B17-earnings.png` |
| 18 | Profile | Referral partner | `/profile` | `screens/B18-profile.png` |
| 19 | Delete account | Referral partner | `/profile/delete` | `screens/B19-delete-account.png` |
| 20 | Job seeker home | Job seeker | `/candidate` | `screens/C21-job-seeker-home.png` |
| 21 | Job seeker jobs | Job seeker | `/candidate/jobs` | `screens/C22-job-seeker-jobs.png` |
| 22 | Apply | Job seeker | `/candidate/apply` | `screens/C23-apply.png` |
| 23 | My applications | Job seeker | `/candidate/applications` | `screens/C24-my-applications.png` |
| 24 | Application detail | Job seeker | `/candidate/applications/[id]` | `screens/C25-application-detail.png` |
| 25 | Job seeker profile | Job seeker | `/candidate/profile` | `screens/C26-job-seeker-profile.png` |

Not shown here: admin screens, onboarding role picker (only appears once for new accounts), reset-password (needs an email link), and the invite-link landing page.

## Constraints to keep in mind when redesigning
- Each screen is a mobile web page inside the native app, so any design must be buildable in **HTML/CSS (Tailwind)**. No native-only UI.
- Keep tap targets at least 44 pt, and form text at 16 px or larger (otherwise iOS zooms on focus).
- The status bar is light text on a dark background (splash and status bar are `#0A100C`).
- Legal pages (privacy, terms, support) are required by the App Store and should stay plain and readable.

## Suggested prompt to start with
> Attached is the current UI of ECRN, a construction referral and job app (screen map PDF plus brief). Keep the layouts and content. Propose a refined visual identity: color palette, typography (a brand typeface that pairs with SF Pro), card and button styles, iconography, and how the dark (#0A100C) and green (#16C172) brand should show up in the logged-in app. Then redesign the Partner dashboard, My referrals, and Job detail screens as examples. Give me exact hex values, font sizes and spacing so a developer can apply them in Tailwind.
