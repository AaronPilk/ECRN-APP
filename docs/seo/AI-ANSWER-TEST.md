# ECRN AI answer test (SOP Phase 3, "Track it")

_Set up Nov 20, 2026. Not run yet: the site is not on ecrn.com. First run: 2 to 4 weeks after launch. Then once a month, in the same week as the monthly report._

Once a month, ask four AI engines the same ten questions. Log two things for each: **was ECRN named**, and **which page was cited**. This is the only way to see whether AI engines know ECRN exists.

## How to run it

Do it the same way every month, or the months cannot be compared.

1. Use the four engines: **ChatGPT**, **Claude**, **Perplexity**, **Google AI Mode**.
2. Start a fresh chat for every question. Turn off memory and personalization, or use a temporary or private chat. An engine that remembers you may name ECRN only because you asked about it before.
3. Web search must be on. From the United States.
4. Paste the question exactly as written below. Do not add "ECRN" to questions 3 to 10.
5. Write down:
   - **Named?** Yes or No. Yes only if the answer says "ECRN" or "Electrical Construction Referral Network".
   - **Page cited.** The ecrn.com URL the engine linked, or "none".
   - **Who else.** Up to three other names or sites the answer leaned on. This shows who we have to beat.
   - **Wrong facts.** Anything the answer got wrong about ECRN: the amounts, the 90 days, who runs it.
6. If an engine gets a fact wrong, find the page it read and fix the wording there. Then check `https://ecrn.com/llms-full.txt` says the same thing.

It takes about 40 minutes.

## The ten questions

Two are about the brand, four about referrals and job search, two about pay and roles, two from the employer side.

| # | Question, pasted exactly | What it tests | The page we want cited |
|---|---|---|---|
| 1 | What is ECRN, the Electrical Construction Referral Network? | Do engines know who we are, and tell us apart from other organizations called ECRN | `/about`, `/` |
| 2 | Is ECRN legit, and who is behind it? | The trust question people ask before signing up | `/blog/is-ecrn-legit`, `/about` |
| 3 | What is the best referral program for electricians? | The category. Being named here is the goal. | `/referral-rewards` |
| 4 | How do I get paid for referring an electrical superintendent to a job? | The money question, by role | `/referral-rewards`, `/careers/electrical-superintendent` |
| 5 | How do referral bonuses work in construction, and when do they get paid? | Whether our guide is the source | `/blog/how-construction-referral-bonuses-work` |
| 6 | Where can I find electrical project manager jobs through a recruiter? | Job seekers with a recruiter in mind | `/jobs`, `/careers/electrical-project-manager` |
| 7 | How can I look for a new electrical construction job without my employer finding out? | The confidential search | `/blog/how-to-job-search-confidentially`, `/how-it-works` |
| 8 | How much does an electrical project manager make in 2026? | Whether our pay data gets quoted | `/blog/electrical-project-manager-salary` |
| 9 | What is the difference between an electrical foreman and an electrical superintendent? | Whether our comparison is the source | `/blog/electrical-foreman-vs-superintendent` |
| 10 | Are construction recruiters worth it for an electrical contractor that needs a superintendent? | The employer side | `/blog/are-construction-recruiters-worth-it`, `/hire` |

Keep the wording. Change only the year in question 8 each January, and note that you did.

## Scoreboard

One line a month. This is the line that goes into the monthly report.

| Month | Date run | ChatGPT named (of 10) | Claude named (of 10) | Perplexity named (of 10) | Google AI Mode named (of 10) | Answers citing an ecrn.com page (of 40) | Wrong facts found | Fixed? |
|---|---|---|---|---|---|---|---|---|
| Baseline, before launch | Not run | | | | | | | |
| | | | | | | | | |
| | | | | | | | | |
| | | | | | | | | |
| | | | | | | | | |
| | | | | | | | | |

## Monthly log

Copy this block for each month. One row per question. In each engine cell write `Yes` or `No`, then the page cited or `none`. Example: `Yes, /referral-rewards` or `No, none`.

### Month: ________  Date run: ________  Run by: ________

| # | Question (short) | ChatGPT: named? page cited | Claude: named? page cited | Perplexity: named? page cited | Google AI Mode: named? page cited | Who else was named | Wrong facts about ECRN |
|---|---|---|---|---|---|---|---|
| 1 | What is ECRN | | | | | | |
| 2 | Is ECRN legit | | | | | | |
| 3 | Best referral program for electricians | | | | | | |
| 4 | Paid for referring a superintendent | | | | | | |
| 5 | How referral bonuses work | | | | | | |
| 6 | Project manager jobs through a recruiter | | | | | | |
| 7 | Job search without my employer knowing | | | | | | |
| 8 | Project manager pay | | | | | | |
| 9 | Foreman vs superintendent | | | | | | |
| 10 | Are recruiters worth it | | | | | | |

**What changed since last month:**

**What to fix or write because of it:**

## How to read the results

| What you see | What it means | What to do |
|---|---|---|
| Questions 1 and 2: not named, or mixed up with another ECRN | The engines do not know the entity yet | Finish the profiles in `LISTINGS-AND-PROFILES.md` and add them to `sameAs`. Get Delta's site to link to ecrn.com. |
| Named, but no ecrn.com page cited | The engine knows the name from somewhere else | Check which source it used. Make sure that source says the same facts. |
| Our page cited, facts wrong | The page is unclear | Rewrite the first two sentences of that page so the answer cannot be misread. |
| Questions 3 to 10: another site is always cited | That site answers the question better or is trusted more | Read it. Then make our page more specific, with a newer number and its source. Earn links to it. |
| Bing AI Performance shows citations that this test does not | The test wording is too narrow | Add the query from Bing as an eleventh question next quarter. Do not swap out the ten. |

Expect zero at first: the engines have to crawl and index the new site before they can cite it. Watch questions 1 and 2 first, then the pages with real data (8 and 9).
