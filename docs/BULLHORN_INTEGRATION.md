# ECRN, Staffing Referrals and Bullhorn: integration hand-off

_Last updated Nov 20, 2026. For whoever provides API access at Delta, Staffing Referrals or Bullhorn, and for the developer who plugs it in._

## 1. Where things stand

Delta's recruiters work in **Bullhorn**. **Staffing Referrals** sits between ECRN and Bullhorn. **Sense** sends texts and emails from there.

ECRN has **no API access to any of them yet**. Everything on the ECRN side is built and waiting:

| Piece | State today | What turns it on |
|---|---|---|
| Outbound events (ECRN to Staffing Referrals) | Every event is queued in the database. Nothing is sent. Nothing is lost. | A webhook URL from Staffing Referrals |
| Inbound webhook (Bullhorn to ECRN) | Built. Answers `503 not configured` until two secrets are set. | A shared secret and the Supabase secret key |
| Scheduled delivery | Built. Answers `503` until its secret is set. | A cron secret and a scheduler |
| Bullhorn direct API (optional) | Client built, does nothing. Never run against a live Bullhorn account. | Bullhorn API key and API user |
| Admin screen | Live at **Admin, Integrations** (`/admin/sync`). Includes a simulator that plays the part of Bullhorn. | Nothing. Works now. |

Going live should need credentials and small mapping edits, not new code. Section 11 is the exact list of what ECRN needs from each party. Section 12 is the go-live checklist.

## 2. How it fits together

```
                      ECRN (Next.js on Cloudflare Workers + Supabase)
 ┌──────────────────────────────────────────────────────────────────────────┐
 │  member signs up, refers, applies        admin assigns an owner          │
 │                │                                   │                     │
 │        database triggers write one row per event                         │
 │                ▼                                                         │
 │        integration_outbox  (queued, sent, failed, skipped)               │
 │                │                                                         │
 │   dispatchOutbox(): shape as Bullhorn JSON, sign, POST                   │
 └────────────────┼─────────────────────────────────────────────────────────┘
                  │  HTTPS POST, header X-ECRN-Signature
                  ▼
         Staffing Referrals  ───────────►  Bullhorn  ───────────►  Sense
                  │                 (recruiters work here)   (texts and emails)
                  │  HTTPS POST, header X-ECRN-Signature
                  ▼
 ┌──────────────────────────────────────────────────────────────────────────┐
 │  POST /api/integrations/staffing-referrals                               │
 │        │ 1. check the signature                                          │
 │        │ 2. store the event in integration_inbox (repeats are ignored)   │
 │        │ 3. applyInboundEvent(): update ECRN tables                      │
 │        │ 4. keep the raw Bullhorn record in crm_records                  │
 │        ▼                                                                 │
 │  staff, jobs, job_recruiters, candidates, job_applications, payouts      │
 └──────────────────────────────────────────────────────────────────────────┘

 Optional second route, without Staffing Referrals:
   ECRN  ──(Bullhorn REST API, OAuth)──►  Bullhorn
   reads CorporateUser, JobOrder, Placement and feeds them through the same step 2 to 4.
```

Two ideas run through all of it:

- **Routing.** Every person and every application belongs to the account manager who owns the job, who hands it to one of their recruiters. That ownership lives in Bullhorn. ECRN sends its best guess out with each event (`owner`, `assignedRecruiter`) and accepts Bullhorn's answer back. A Bullhorn assignment always wins over ECRN's automatic routing.
- **Nothing is lost.** Outbound events wait in a queue until they are delivered. Inbound events are stored before they are applied. The full Bullhorn record is kept even when ECRN only uses a few fields.

## 3. Signature scheme (both directions)

One shared secret, `STAFFING_REFERRALS_SECRET`, used the same way both ways.

```
signature = lowercase hex of HMAC-SHA256( raw request body, shared secret )
header    = X-ECRN-Signature: <signature>
```

- Sign the **exact bytes** of the body. Do not re-serialise the JSON before signing or checking.
- Inbound, ECRN also accepts the header name `X-Signature`, and a leading `sha256=`.
- ECRN compares in constant time. A missing or wrong signature gets `401`.

Node.js, on the Staffing Referrals side:

```js
import { createHmac } from "node:crypto";

const body = JSON.stringify(event);
const signature = createHmac("sha256", process.env.ECRN_SHARED_SECRET).update(body).digest("hex");

await fetch("https://ecrn.com/api/integrations/staffing-referrals", {
  method: "POST",
  headers: { "content-type": "application/json", "x-ecrn-signature": signature },
  body,
});
```

From a terminal (handy for a first test):

```bash
BODY='{"id":"evt_1001","type":"candidate.linked","data":{"ecrnId":"0f8e6a34-2b1c-4d5e-8f90-a1b2c3d4e5f6","id":771204}}'
SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$STAFFING_REFERRALS_SECRET" | sed 's/^.* //')

curl -X POST https://ecrn.com/api/integrations/staffing-referrals \
  -H "content-type: application/json" \
  -H "x-ecrn-signature: $SIG" \
  --data "$BODY"
```

If Staffing Referrals needs a different scheme (an API key header, for example), the only code to change is the header block in `dispatchOutbox` and the check at the top of the inbound route.

## 4. Outbound: what ECRN sends

### Delivery rules

- **Where:** `POST` to `STAFFING_REFERRALS_WEBHOOK_URL`, JSON body.
- **Headers:** `content-type: application/json`, `x-ecrn-event: <event type>`, `x-ecrn-event-id: <uuid>`, `x-ecrn-signature: <hex>`.
- **Success:** any `2xx` answer within 15 seconds. The row is marked `sent`.
- **Failure:** anything else. The row is marked `failed` and retried on later runs, up to 5 attempts. After that it waits in Admin, Integrations, Outbox for a manual retry.
- **Order:** oldest first, 15 events per run by default.
- **Repeats:** an event can arrive twice in rare cases (a timeout after Staffing Referrals already accepted it). Use `eventId` to ignore repeats.
- **Never sent:** rows marked `skipped`. These are demo data and echoes (a change that came from Bullhorn is not sent straight back).

### Envelope

Every event has the same wrapper. `data.entity` names the Bullhorn entity the fields follow.

```json
{
  "source": "ECRN",
  "event": "candidate.created",
  "eventId": "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
  "occurredAt": "2026-11-20T15:04:05.123456+00:00",
  "data": { "entity": "Candidate", "...": "..." }
}
```

### Owner and recruiter on every person and submission

```json
"owner":             { "id": 48213, "name": "Dana Whitfield", "email": "dana.whitfield@deltacp.com", "ecrnId": "5d2c7a1e-8f43-4b8e-9a6f-2f1c0b7d4e11" },
"assignedRecruiter": { "id": 48377, "name": "Marcus Reyes",   "email": "marcus.reyes@deltacp.com",   "ecrnId": "9b1f3c52-6a7d-4e0b-b2c8-71d4a5e6f022" }
```

- `owner` is the account manager. `assignedRecruiter` is the recruiter.
- `id` is the Bullhorn CorporateUser id. It is `null` until the team has been linked to Bullhorn (section 5, `user.upserted`). Match on `email` until then.
- Either can be `null` when nobody is assigned yet.

### 4.1 candidate.created

A person enters ECRN: someone referred them, they applied, or they finished sign-up as a job seeker.

```json
{
  "source": "ECRN",
  "event": "candidate.created",
  "eventId": "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
  "occurredAt": "2026-11-20T15:04:05.123456+00:00",
  "data": {
    "entity": "Candidate",
    "id": null,
    "externalID": "0f8e6a34-2b1c-4d5e-8f90-a1b2c3d4e5f6",
    "ecrnId": "0f8e6a34-2b1c-4d5e-8f90-a1b2c3d4e5f6",
    "firstName": "Ana",
    "lastName": "Diaz",
    "email": "ana.diaz@example.com",
    "mobile": "813-555-0199",
    "occupation": "Electrical Project Manager",
    "companyName": "Brightline Electric",
    "address": { "city": "Tampa", "state": "FL", "countryID": 1 },
    "status": "new",
    "source": "ECRN Referral",
    "willRelocate": null,
    "customText": {
      "careerStatus": "Passive",
      "confidential": true,
      "moveMotivators": "Higher pay, Bigger projects",
      "yearsExperience": 12,
      "linkedin": "https://www.linkedin.com/in/anadiaz",
      "hasResume": true
    },
    "referredBy": {
      "firstName": "Luis",
      "lastName": "Ortega",
      "email": "luis.ortega@example.com",
      "mobile": "727-555-0123",
      "ecrnId": "c3a1e2d4-5b6f-4a7b-8c9d-0e1f2a3b4c5d"
    },
    "owner": { "id": 48213, "name": "Dana Whitfield", "email": "dana.whitfield@deltacp.com", "ecrnId": "5d2c7a1e-8f43-4b8e-9a6f-2f1c0b7d4e11" },
    "assignedRecruiter": { "id": 48377, "name": "Marcus Reyes", "email": "marcus.reyes@deltacp.com", "ecrnId": "9b1f3c52-6a7d-4e0b-b2c8-71d4a5e6f022" },
    "routingReason": "job_owner"
  }
}
```

Notes:

- `id` is the Bullhorn candidate id. It is `null` the first time. Please answer with `candidate.linked` (section 5.4) so later events carry it.
- `externalID` and `ecrnId` are both the ECRN id. Store it on the Bullhorn candidate.
- `status` is ECRN's own value: `new`, `contacted`, `qualified`, `not_qualified`, `submitted_to_job`, `interviewing`, `offer_stage`, `placed`, `payout_pending`, `payout_approved`, `payout_paid`, `rejected`, `inactive`.
- `source` is `ECRN Referral` (a member referred them), `ECRN App` (they signed up themselves) or `ECRN`.
- `customText.confidential: true` means the person is employed and quietly open to a move. Treat with care.
- `customText.careerStatus` is `Active`, `Passive` or `Not Looking`.
- `referredBy` is `null` when nobody referred them.
- `routingReason` is `job_owner`, `recruiter_attribution`, `territory`, `manual`, `bullhorn` or `null`.

### 4.2 candidate.updated

Same shape as `candidate.created`. Sent when contact details, status, career signals, resume, owner or recruiter change. `id` carries the Bullhorn candidate id once linked.

```json
{
  "source": "ECRN",
  "event": "candidate.updated",
  "eventId": "2c8e7cde-ccfe-4c3e-8c6e-bc9efcce5cfe",
  "occurredAt": "2026-11-20T15:04:05.123456+00:00",
  "data": {
    "entity": "Candidate",
    "id": 771204,
    "externalID": "0f8e6a34-2b1c-4d5e-8f90-a1b2c3d4e5f6",
    "ecrnId": "0f8e6a34-2b1c-4d5e-8f90-a1b2c3d4e5f6",
    "firstName": "Ana",
    "lastName": "Diaz",
    "email": "ana.diaz@example.com",
    "mobile": "813-555-0199",
    "occupation": "Electrical Project Manager",
    "companyName": "Brightline Electric",
    "address": { "city": "Tampa", "state": "FL", "countryID": 1 },
    "status": "contacted",
    "source": "ECRN Referral",
    "willRelocate": null,
    "customText": {
      "careerStatus": "Passive",
      "confidential": true,
      "moveMotivators": "Higher pay, Bigger projects",
      "yearsExperience": 12,
      "linkedin": "https://www.linkedin.com/in/anadiaz",
      "hasResume": true
    },
    "referredBy": { "firstName": "Luis", "lastName": "Ortega", "email": "luis.ortega@example.com", "mobile": "727-555-0123", "ecrnId": "c3a1e2d4-5b6f-4a7b-8c9d-0e1f2a3b4c5d" },
    "owner": { "id": 48213, "name": "Dana Whitfield", "email": "dana.whitfield@deltacp.com", "ecrnId": "5d2c7a1e-8f43-4b8e-9a6f-2f1c0b7d4e11" },
    "assignedRecruiter": { "id": 48377, "name": "Marcus Reyes", "email": "marcus.reyes@deltacp.com", "ecrnId": "9b1f3c52-6a7d-4e0b-b2c8-71d4a5e6f022" },
    "routingReason": "job_owner"
  }
}
```

### 4.3 referral.created

A member referred someone. Sent for every referral, including a second member referring a person who is already in ECRN (`isPrimary: false`, `duplicateStatus: "pending_review"`). The person themselves arrives separately as `candidate.created`.

```json
{
  "source": "ECRN",
  "event": "referral.created",
  "eventId": "3d7f8def-ddff-4d4f-9d7f-cd0f0ddf6d0f",
  "occurredAt": "2026-11-20T15:04:05.123456+00:00",
  "data": {
    "entity": "Referral",
    "ecrnId": "e4f5a6b7-c8d9-4e0f-a1b2-c3d4e5f6a7b8",
    "candidateEcrnId": "0f8e6a34-2b1c-4d5e-8f90-a1b2c3d4e5f6",
    "isPrimary": true,
    "duplicateStatus": "unique",
    "referralSource": "contacts",
    "notes": "Worked with her at Brightline. Strong on healthcare jobs.",
    "referrer": {
      "id": "c3a1e2d4-5b6f-4a7b-8c9d-0e1f2a3b4c5d",
      "first_name": "Luis",
      "last_name": "Ortega",
      "email": "luis.ortega@example.com",
      "phone": "727-555-0123"
    }
  }
}
```

`referralSource` is `manual`, `contacts` or `job_link`. `duplicateStatus` is `unique`, `pending_review`, `confirmed_duplicate` or `overridden_primary`.

### 4.4 job_referral.created

A member referred someone to a specific job. In Bullhorn terms this is a JobSubmission.

```json
{
  "source": "ECRN",
  "event": "job_referral.created",
  "eventId": "4e6a9ef0-ee00-4e50-8e80-de1a1ee07e10",
  "occurredAt": "2026-11-20T15:04:05.123456+00:00",
  "data": {
    "entity": "JobSubmission",
    "ecrnId": "f5a6b7c8-d9e0-4f1a-b2c3-d4e5f6a7b8c9",
    "action": "created",
    "candidateEcrnId": "0f8e6a34-2b1c-4d5e-8f90-a1b2c3d4e5f6",
    "candidate": { "ecrnId": "0f8e6a34-2b1c-4d5e-8f90-a1b2c3d4e5f6" },
    "jobOrder": { "id": 30517, "ecrnId": "7a6b5c4d-3e2f-4a1b-9c8d-7e6f5a4b3c2d", "title": "Senior Electrical Estimator" },
    "status": "submitted_to_job",
    "via": "Referral",
    "referrerEcrnId": "c3a1e2d4-5b6f-4a7b-8c9d-0e1f2a3b4c5d",
    "comments": null,
    "owner": { "id": 48213, "name": "Dana Whitfield", "email": "dana.whitfield@deltacp.com", "ecrnId": "5d2c7a1e-8f43-4b8e-9a6f-2f1c0b7d4e11" },
    "assignedRecruiter": null
  }
}
```

`jobOrder.id` is the Bullhorn JobOrder id. It is `null` for a job that was created by hand in ECRN and never linked. `status` for job referrals uses the same values as a person's status (section 4.1).

### 4.5 job_referral.updated

Same shape. Sent when that job referral changes status, owner or recruiter.

```json
{
  "source": "ECRN",
  "event": "job_referral.updated",
  "eventId": "5f5b0fa1-ff11-4f61-9f91-ef2b2ff18f21",
  "occurredAt": "2026-11-20T15:04:05.123456+00:00",
  "data": {
    "entity": "JobSubmission",
    "ecrnId": "f5a6b7c8-d9e0-4f1a-b2c3-d4e5f6a7b8c9",
    "action": "updated",
    "candidateEcrnId": "0f8e6a34-2b1c-4d5e-8f90-a1b2c3d4e5f6",
    "candidate": { "ecrnId": "0f8e6a34-2b1c-4d5e-8f90-a1b2c3d4e5f6" },
    "jobOrder": { "id": 30517, "ecrnId": "7a6b5c4d-3e2f-4a1b-9c8d-7e6f5a4b3c2d", "title": "Senior Electrical Estimator" },
    "status": "interviewing",
    "via": "Referral",
    "referrerEcrnId": "c3a1e2d4-5b6f-4a7b-8c9d-0e1f2a3b4c5d",
    "comments": null,
    "owner": { "id": 48213, "name": "Dana Whitfield", "email": "dana.whitfield@deltacp.com", "ecrnId": "5d2c7a1e-8f43-4b8e-9a6f-2f1c0b7d4e11" },
    "assignedRecruiter": { "id": 48377, "name": "Marcus Reyes", "email": "marcus.reyes@deltacp.com", "ecrnId": "9b1f3c52-6a7d-4e0b-b2c8-71d4a5e6f022" }
  }
}
```

### 4.6 application.created

A member applied to a job themselves.

```json
{
  "source": "ECRN",
  "event": "application.created",
  "eventId": "6a4c1ab2-0022-4a72-8aa2-fa3c3aa29a32",
  "occurredAt": "2026-11-20T15:04:05.123456+00:00",
  "data": {
    "entity": "JobSubmission",
    "ecrnId": "a6b7c8d9-e0f1-4a2b-83d4-e5f6a7b8c9d0",
    "action": "created",
    "candidateEcrnId": "0f8e6a34-2b1c-4d5e-8f90-a1b2c3d4e5f6",
    "candidate": { "ecrnId": "0f8e6a34-2b1c-4d5e-8f90-a1b2c3d4e5f6" },
    "jobOrder": { "id": 30517, "ecrnId": "7a6b5c4d-3e2f-4a1b-9c8d-7e6f5a4b3c2d", "title": "Senior Electrical Estimator" },
    "status": "submitted",
    "via": "Direct application",
    "referrerEcrnId": null,
    "comments": "Available to start in January.",
    "owner": { "id": 48213, "name": "Dana Whitfield", "email": "dana.whitfield@deltacp.com", "ecrnId": "5d2c7a1e-8f43-4b8e-9a6f-2f1c0b7d4e11" },
    "assignedRecruiter": null
  }
}
```

`status` for applications is `submitted`, `reviewing`, `interviewing`, `offer`, `hired`, `rejected` or `withdrawn`.

### 4.7 application.status_changed

Same shape. Sent when an application moves to a new status in ECRN.

```json
{
  "source": "ECRN",
  "event": "application.status_changed",
  "eventId": "7b3d2bc3-1133-4b83-9bb3-ab4d4bb3ab43",
  "occurredAt": "2026-11-20T15:04:05.123456+00:00",
  "data": {
    "entity": "JobSubmission",
    "ecrnId": "a6b7c8d9-e0f1-4a2b-83d4-e5f6a7b8c9d0",
    "action": "status_changed",
    "candidateEcrnId": "0f8e6a34-2b1c-4d5e-8f90-a1b2c3d4e5f6",
    "candidate": { "ecrnId": "0f8e6a34-2b1c-4d5e-8f90-a1b2c3d4e5f6" },
    "jobOrder": { "id": 30517, "ecrnId": "7a6b5c4d-3e2f-4a1b-9c8d-7e6f5a4b3c2d", "title": "Senior Electrical Estimator" },
    "status": "interviewing",
    "via": "Direct application",
    "referrerEcrnId": null,
    "comments": null,
    "owner": { "id": 48213, "name": "Dana Whitfield", "email": "dana.whitfield@deltacp.com", "ecrnId": "5d2c7a1e-8f43-4b8e-9a6f-2f1c0b7d4e11" },
    "assignedRecruiter": { "id": 48377, "name": "Marcus Reyes", "email": "marcus.reyes@deltacp.com", "ecrnId": "9b1f3c52-6a7d-4e0b-b2c8-71d4a5e6f022" }
  }
}
```

### 4.8 application.assigned

Same shape. Sent when the account manager or recruiter on an application changes and the status did not.

```json
{
  "source": "ECRN",
  "event": "application.assigned",
  "eventId": "8c2e3cd4-2244-4c94-8cc4-bc5e5cc4bc54",
  "occurredAt": "2026-11-20T15:04:05.123456+00:00",
  "data": {
    "entity": "JobSubmission",
    "ecrnId": "a6b7c8d9-e0f1-4a2b-83d4-e5f6a7b8c9d0",
    "action": "assigned",
    "candidateEcrnId": "0f8e6a34-2b1c-4d5e-8f90-a1b2c3d4e5f6",
    "candidate": { "ecrnId": "0f8e6a34-2b1c-4d5e-8f90-a1b2c3d4e5f6" },
    "jobOrder": { "id": 30517, "ecrnId": "7a6b5c4d-3e2f-4a1b-9c8d-7e6f5a4b3c2d", "title": "Senior Electrical Estimator" },
    "status": "reviewing",
    "via": "Direct application",
    "referrerEcrnId": null,
    "comments": null,
    "owner": { "id": 48213, "name": "Dana Whitfield", "email": "dana.whitfield@deltacp.com", "ecrnId": "5d2c7a1e-8f43-4b8e-9a6f-2f1c0b7d4e11" },
    "assignedRecruiter": { "id": 48377, "name": "Marcus Reyes", "email": "marcus.reyes@deltacp.com", "ecrnId": "9b1f3c52-6a7d-4e0b-b2c8-71d4a5e6f022" }
  }
}
```

### 4.9 company_lead.created

A company filled in the hiring request form on ecrn.com.

```json
{
  "source": "ECRN",
  "event": "company_lead.created",
  "eventId": "9d1f4de5-3355-4da5-9dd5-cd6f6dd5cd65",
  "occurredAt": "2026-11-20T15:04:05.123456+00:00",
  "data": {
    "entity": "Lead",
    "companyName": "Gulf Coast Electric",
    "name": "Priya Shah",
    "email": "priya@gulfcoastelectric.example",
    "phone": "813-555-0144",
    "address": { "city": "Tampa, FL" },
    "description": "Electrical superintendent\nGround-up healthcare work, 3 to 5 years out.",
    "numOpenings": 2,
    "salary": "$110-130K",
    "ecrnId": "b7c8d9e0-f1a2-4b3c-94e5-f6a7b8c9d0e1"
  }
}
```

### 4.10 member.onboarded

A member finished the onboarding questions. `entity` is `ReferralPartner` for someone who only wants to refer, otherwise `Member`. Job seekers also arrive as `candidate.created`.

```json
{
  "source": "ECRN",
  "event": "member.onboarded",
  "eventId": "0e0a5ef6-4466-4eb6-8ee6-de7a7ee6de76",
  "occurredAt": "2026-11-20T15:04:05.123456+00:00",
  "data": {
    "entity": "Member",
    "firstName": "Ana",
    "lastName": "Diaz",
    "email": "ana.diaz@example.com",
    "mobile": "813-555-0199",
    "intent": "open",
    "careerStatus": "Passive",
    "city": "Tampa",
    "state": "FL",
    "ecrnId": "d4e5f6a7-b8c9-4d0e-9f1a-2b3c4d5e6f70"
  }
}
```

`intent` is `job` (looking), `open` (employed, open to a move), `refer` or `both`.

## 5. Inbound: what ECRN accepts

### Endpoint

```
POST https://ecrn.com/api/integrations/staffing-referrals
content-type: application/json
x-ecrn-signature: <hex HMAC-SHA256 of the raw body>
```

Until ecrn.com points at the app, use the address shown on Admin, Integrations (it is built from wherever the app is running).

`GET` on the same address is a health check. It returns `{ "ok": true, "configured": true|false, "accepts": [...] }` and never reveals a secret.

### Body

One event:

```json
{ "id": "evt_1001", "type": "candidate.linked", "data": { "ecrnId": "0f8e6a34-2b1c-4d5e-8f90-a1b2c3d4e5f6", "id": 771204 } }
```

or a batch of up to 25:

```json
{ "events": [ { "id": "evt_1001", "type": "...", "data": {} }, { "id": "evt_1002", "type": "...", "data": {} } ] }
```

- `id` is **your** event id. ECRN uses it to ignore repeats, so always send one and keep it the same when you retry.
- `type` picks the handler. Names are forgiving: `JobOrder.updated`, `job_order.created` and `job.upserted` all mean the same thing.
- `data` is the Bullhorn record. Bullhorn's own field names and shapes are understood: epoch-millisecond dates, `address { city, state }`, to-many lists as `{ "total": 1, "data": [...] }`, status text as configured in Bullhorn.
- Missing fields are fine. A field you leave out never blanks an ECRN value.
- One event per request is the safest. Batches work, in order.

### Answers

| Code | Meaning | What to do |
|---|---|---|
| `200` | Every event was stored. The body says what happened to each. | Nothing |
| `400` | The body is not JSON, or holds no events | Fix and resend |
| `401` | Signature missing or wrong | Check the secret and that you sign the raw body |
| `413` | More than 25 events, or a body over 1 MB | Send smaller batches |
| `500` | At least one event could not be stored | Retry the same request with the same ids |
| `503` | ECRN is not configured yet (`{"error":"not configured"}`) | Wait for go-live |

A `200` body:

```json
{
  "ok": true,
  "received": 2,
  "applied": 1,
  "ignored": 0,
  "failed": 0,
  "duplicates": 1,
  "notStored": 0,
  "results": [
    { "index": 0, "id": "evt_1001", "type": "candidate.linked", "status": "applied", "summary": "Ana Diaz: linked to Bullhorn.", "error": null },
    { "index": 1, "id": "evt_0999", "type": "job.upserted", "status": "duplicate", "summary": "Already received. Ignored.", "error": null }
  ]
}
```

Per-event status:

- `applied`: ECRN was updated, or already matched.
- `ignored`: nothing in ECRN matched, or the type has no handler. Stored, harmless.
- `failed`: stored, but could not be applied. The reason is in `error`. An admin can fix the cause and press **Run again** on Admin, Integrations, Inbox. No need to resend.
- `duplicate`: this `id` was already received.

### How ECRN finds the record

Always in this order:

1. The ECRN id (`ecrnId`, or `externalID` when it holds the ECRN id).
2. The Bullhorn id (`id`), against the id saved earlier.
3. Email, for people and team members only.

So the cleanest setup is: store ECRN's `ecrnId` in Bullhorn's `externalID`, and send `candidate.linked` once so ECRN knows the Bullhorn id.

### 5.1 user.upserted (CorporateUser to team)

Creates or updates a Delta team member. **Send these first.** Job owners and candidate owners are matched against the team by Bullhorn user id.

```json
{
  "id": "evt_2001",
  "type": "user.upserted",
  "data": {
    "id": 48377,
    "firstName": "Marcus",
    "lastName": "Reyes",
    "email": "marcus.reyes@deltacp.com",
    "mobile": "813-555-0177",
    "occupation": "Senior Recruiter",
    "userType": { "id": 14, "name": "Recruiter" },
    "reportToPerson": { "id": 48213 },
    "enabled": true,
    "isDeleted": false
  }
}
```

What happens:

- Matched by ECRN id, then Bullhorn id, then email (so people already added by hand in ECRN are linked, not duplicated).
- Name, email, phone, title, manager and active flag are updated.
- **Role.** Send `"role": "owner" | "account_manager" | "recruiter"` to set it outright. Without it, ECRN guesses from `occupation` and `userType` for new people only. A role an admin set in ECRN is never overwritten by a guess.
- **Manager.** `reportToPerson.id` (or `manager.id`, `managerId`) is the manager's Bullhorn id. If the manager has not arrived yet, the link is made when they do.
- **Invite code.** New people get a personal code made from their name (`MARCUS`, then `MARCUSR`, and so on). An existing code is never changed, because it is printed on links people already share.
- `enabled: false` or `isDeleted: true` makes them inactive. Nobody is deleted.

### 5.2 job.upserted (JobOrder to job)

```json
{
  "id": "evt_3001",
  "type": "job.upserted",
  "data": {
    "id": 30517,
    "title": "Senior Electrical Estimator",
    "status": "Accepting Candidates",
    "isOpen": true,
    "isPublic": 1,
    "employmentType": "Direct Hire",
    "salary": 135000,
    "salaryUnit": "Per Year",
    "startDate": 1796601600000,
    "numOpenings": 1,
    "address": { "city": "Tampa", "state": "Florida", "zip": "33602" },
    "publicDescription": "<p>Lead estimates for commercial and industrial electrical projects.</p><ul><li>8+ years estimating</li></ul>",
    "owner": { "id": 48213, "firstName": "Dana", "lastName": "Whitfield" },
    "assignedUsers": { "total": 1, "data": [ { "id": 48377, "firstName": "Marcus", "lastName": "Reyes" } ] },
    "clientCorporation": { "id": 9120, "name": "Gulf Coast Electric" },
    "publishedCategory": { "id": 3, "name": "Electrical" },
    "dateLastModified": 1795300000000
  }
}
```

What happens:

- Matched by ECRN id, then Bullhorn JobOrder id. No match creates a new job (a title is required).
- Title, city, state, employment type, salary, description, start date and trade are copied. HTML in the description becomes plain text. State names become two-letter codes.
- **Status** goes through the job status table (section 8). A new job is `open` only if Bullhorn says it is open. Unknown wording with no `isOpen` saves the job as a draft for an admin to look at.
- **Public.** New jobs show on the ECRN job board unless the event says `isPublic` is `0` or `false`. See the open question in section 13.
- **Owner.** `owner.id` is matched to the team and becomes the job's account manager. Every application and referral for the job then routes to that person.
- **Recruiters.** `assignedUsers` replaces the job's recruiter list. Leave it out to keep the list as it is.
- **Client name.** `clientCorporation.name` is stored where only admins can see it. Members and the public job board never see it, unless the event sets `"isCompanyPublic": true`.
- **Payout.** Optional `"referralPayout": 5000` (dollars) sets the referral reward shown to members. Otherwise an admin sets it in ECRN.

### 5.3 job.closed

```json
{ "id": "evt_3002", "type": "job.closed", "data": { "id": 30517, "status": "Placed", "reason": "filled" } }
```

The job becomes `filled` when the status or reason says placed or filled. Any other reason archives it. Either way it leaves the job board.

### 5.4 candidate.linked

Send this after creating the Bullhorn candidate from a `candidate.created` event.

```json
{ "id": "evt_4001", "type": "candidate.linked", "data": { "ecrnId": "0f8e6a34-2b1c-4d5e-8f90-a1b2c3d4e5f6", "id": 771204 } }
```

ECRN saves `771204` as the person's Bullhorn id. From then on outbound events carry it as `data.id`, and inbound events can use it alone.

### 5.5 candidate.updated

```json
{
  "id": "evt_4002",
  "type": "candidate.updated",
  "data": {
    "id": 771204,
    "ecrnId": "0f8e6a34-2b1c-4d5e-8f90-a1b2c3d4e5f6",
    "status": "Interviewing",
    "owner": { "id": 48213 },
    "assignedRecruiter": { "id": 48377 }
  }
}
```

What happens:

- **Status.** `status` is Bullhorn's wording and goes through the candidate status table (section 8). Wording ECRN does not know changes nothing and is noted on the inbox row. To set an ECRN value directly, send `"ecrnStatus": "qualified"`.
- A new status shows to the member who referred the person, the same as when an admin changes it by hand. Reaching `placed` opens a pending payout for that member.
- **Owner and recruiter.** `owner` becomes the account manager and `assignedRecruiter` the recruiter, and the routing reason is set to `bullhorn`, which ECRN's automatic routing never overrides. If `owner` is a recruiter in ECRN's team, they become the recruiter and their manager becomes the account manager.
- ECRN does **not** copy contact details back from Bullhorn onto a member's record. The full record is kept in the mirror.
- No matching person: the event is `ignored`. ECRN does not create people from Bullhorn.

### 5.6 submission.updated (JobSubmission to application)

```json
{
  "id": "evt_5001",
  "type": "submission.updated",
  "data": {
    "id": 2218840,
    "ecrnId": "a6b7c8d9-e0f1-4a2b-83d4-e5f6a7b8c9d0",
    "status": "Interview Scheduled",
    "candidate": { "id": 771204, "ecrnId": "0f8e6a34-2b1c-4d5e-8f90-a1b2c3d4e5f6" },
    "jobOrder": { "id": 30517 },
    "sendingUser": { "id": 48377 }
  }
}
```

What happens:

- Matched by `ecrnId` (the id ECRN sent in `application.created` or `job_referral.created`), then by the Bullhorn submission id if ECRN has seen it before, then by candidate plus job.
- **Status** goes through the submission status table (section 8). `"ecrnStatus": "offer"` sets an ECRN value directly. A late "New Lead" never moves an application back to the start.
- If the match is a job referral, not an application, the referral's status follows the same progress.
- `owner`, `assignedRecruiter` or `sendingUser` update who the application belongs to.
- An event with no `status` only saves the link.

### 5.7 placement.created

```json
{
  "id": "evt_6001",
  "type": "placement.created",
  "data": {
    "id": 91077,
    "status": "Approved",
    "candidate": { "id": 771204, "ecrnId": "0f8e6a34-2b1c-4d5e-8f90-a1b2c3d4e5f6" },
    "jobOrder": { "id": 30517 },
    "employmentType": "Direct Hire",
    "salary": 135000,
    "salaryUnit": "Per Year",
    "fee": 0.2,
    "dateBegin": 1796601600000
  }
}
```

What happens:

- The person's status becomes `placed`. ECRN's database then opens a **pending payout** for the member who referred them, using the referral reward on the ECRN job. Nobody is paid automatically: an admin approves it on the Payouts page.
- If the person applied to that job in ECRN, the application becomes `hired`.
- Salary, start date, fee and the rest of the record are kept in the mirror.
- Nobody referred them: no payout, and the inbox row says so.

### 5.8 placement.updated

Same body and same effect as `placement.created` (safe to send more than once).

```json
{ "id": "evt_6002", "type": "placement.updated", "data": { "id": 91077, "status": "Cancelled", "candidate": { "id": 771204 } } }
```

A status that says cancelled, terminated or fell through is **flagged for review and changes nothing**. ECRN never takes back a placement or a payout by itself. See section 13.

### Anything else

Any other `type` is stored in the inbox and marked `ignored`. Nothing breaks.

## 6. Field mapping

"Out" is ECRN to Bullhorn. "In" is Bullhorn to ECRN. The same tables are on Admin, Integrations, Field mapping, and the code reads them from `lib/integrations/mapping.ts`.

### Candidate and `candidates`

| ECRN | Direction | Bullhorn | Notes |
|---|---|---|---|
| `candidates.id` | both | `externalID` (also sent as `ecrnId`) | The key ECRN matches on first |
| `candidates.external_crm_id` | in | `id` | Saved by `candidate.linked` |
| `first_name`, `last_name` | out | `firstName`, `lastName` | |
| `email` | out | `email` | Last-resort match for inbound events |
| `phone` | out | `mobile` | |
| `current_job_title` | out | `occupation` | |
| `current_company` | out | `companyName` | |
| `location_city`, `location_state` | out | `address.city`, `address.state` | |
| `status` | both | `status` | Out sends the ECRN value. In goes through the status table |
| `source_type` | out | `source` | ECRN Referral, ECRN App or ECRN |
| `relocation` | out | `willRelocate` | |
| `career_status` | out | `customText.careerStatus` | Active, Passive, Not Looking. Custom field number to be chosen |
| `is_confidential` | out | `customText.confidential` | Employed and quietly open to a move |
| `move_motivators` | out | `customText.moveMotivators` | |
| `years_experience` | out | `customText.yearsExperience` | |
| `linkedin_url` | out | `customText.linkedin` | |
| `resume_path` | out | `customText.hasResume` | A flag only. Sending the file is a go-live decision |
| `primary_referrer_user_id` | out | `referredBy { firstName, lastName, email, mobile, ecrnId }` | |
| `account_manager_id` | both | `owner { id, name, email, ecrnId }` | `id` is the Bullhorn CorporateUser id |
| `recruiter_id` | both | `assignedRecruiter { id, name, email, ecrnId }` | |
| `routing_reason` | out | `routingReason` | Becomes `bullhorn` when Bullhorn assigns the owner |

### JobOrder and `jobs`

| ECRN | Direction | Bullhorn | Notes |
|---|---|---|---|
| `jobs.external_crm_id` | in | `id` | |
| `title` | in | `title` | |
| `location_city`, `location_state` | in | `address.city`, `address.state` | State names become codes |
| `job_type` | in | `employmentType` | See section 8 |
| `compensation_min`, `compensation_max` | in | `salary` (or `salaryLow`, `salaryHigh`) | Yearly dollars. Hourly rates only fill the display text |
| `compensation_display` | in | `salary` + `salaryUnit`, `payRate` | Left alone once an admin has rewritten it |
| `description` | in | `publicDescription`, else `description` | HTML becomes plain text |
| `status` | in | `status`, `isOpen`, `isDeleted` | See section 8 |
| `is_public` | in | `isPublic` | New jobs are public unless the event says otherwise |
| `account_manager_id` | in | `owner.id` | Matched to the team |
| `job_recruiters` | in | `assignedUsers` | The list is replaced each time it is sent |
| `job_private.client_company` | in | `clientCorporation.name` | Admin-only unless `isCompanyPublic` is true |
| `trade` | in | `publishedCategory.name` (or `categories`) | |
| `start_date` | in | `startDate` | |
| `referral_payout_amount` | in | `referralPayout` (optional, dollars) | Otherwise set by an admin in ECRN |

### JobSubmission and `job_applications`, `job_referrals`

| ECRN | Direction | Bullhorn | Notes |
|---|---|---|---|
| `job_applications.id` or `job_referrals.id` | both | `ecrnId` | Send it back so ECRN can match without guessing |
| `metadata.bullhorn_submission_id` | in | `id` | |
| `candidate_id` | both | `candidateEcrnId`, `candidate { id, ecrnId, email }` | |
| `job_id` | both | `jobOrder { id, ecrnId, title }` | |
| `status` | both | `status` | Out sends the ECRN value. In goes through the status table |
| `notes` | out | `comments` | |
| application or referral | out | `via` | Direct application or Referral |
| `account_manager_id` | both | `owner { id, name, email, ecrnId }` | |
| `recruiter_id` | both | `assignedRecruiter` (in also accepts `sendingUser`) | |

### Placement and `candidates`, `payouts`

| ECRN | Direction | Bullhorn | Notes |
|---|---|---|---|
| `candidates.status = placed` | in | A placement exists and is not cancelled | |
| person (match) | in | `candidate { id, ecrnId, email }` | |
| `job_applications.status = hired` | in | `jobOrder { id, ecrnId }` | Only when the person applied to that job in ECRN |
| `payouts` (pending) | in | created by ECRN | Amount comes from the ECRN job's referral reward |
| `crm_records.data` | in | `salary`, `dateBegin`, `fee`, `employmentType`, `status` | Kept in the mirror |

### CorporateUser and `staff`

| ECRN | Direction | Bullhorn | Notes |
|---|---|---|---|
| `staff.external_crm_id` | both | `id` | Sent back out as `owner.id` and `assignedRecruiter.id` |
| `first_name`, `last_name` | in | `firstName`, `lastName` (or `name`) | |
| `email` | in | `email` | Fallback match for people already in ECRN |
| `phone` | in | `mobile`, else `phone` | |
| `title` | in | `occupation` | |
| `staff_role` | in | `role`, else guessed from `occupation` and `userType` | Guess is for new people only |
| `manager_id` | in | `reportToPerson.id` (or `manager.id`) | |
| `is_active` | in | `enabled`, `isDeleted` | |
| `invite_code` | in | created by ECRN | Made from the name. Never changed afterwards |

## 7. Where Bullhorn records are kept

Every inbound record is saved whole in `crm_records` (provider `bullhorn`, entity type `CorporateUser`, `JobOrder`, `Candidate`, `JobSubmission` or `Placement`, keyed by the Bullhorn id), with a link to the ECRN row it matched. A partial event is merged into what is already stored. So fields ECRN has no screen for yet are still there when a report needs them. Admin, Integrations, Bullhorn mirror shows the counts and the latest 25.

## 8. Status mapping (Bullhorn to ECRN)

Bullhorn status lists are set per company. The left column is Bullhorn's defaults plus common variants. **Delta needs to confirm these against its own lists** (section 11). Matching ignores capitals, spaces and punctuation. To change a mapping, edit one line in `lib/integrations/mapping.ts`.

### Candidate status to a person's ECRN status

| Bullhorn says | ECRN shows |
|---|---|
| New Lead, New, Lead, Referred, Referral | `new` |
| Contacted, Attempted Contact, Left Message, In Contact, Phone Screen, Screening | `contacted` |
| Qualified, Pre-Qualified, Screened, Available | `qualified` |
| Not Qualified, Unqualified, Not a Fit, DNU, Do Not Use | `not_qualified` |
| Submitted, Submitted to Job, Internal Submission, Client Submission, Submitted to Client | `submitted_to_job` |
| Interviewing, Interview, Interview Scheduled, Client Interview | `interviewing` |
| Offer, Offer Stage, Offer Extended, Offer Out, Offer Accepted | `offer_stage` |
| Placed, Hired, Placement, Started, On Assignment | `placed` (opens a pending payout for the referrer) |
| Rejected, Client Rejected, Declined, Candidate Not Interested, Withdrawn | `rejected` |
| Inactive, Archive, Archived, Unavailable, Do Not Contact | `inactive` |
| Active, Passive, Private | no change (describes availability, not a stage) |
| anything else | no change, noted on the inbox row |

ECRN's payout stages (`payout_pending`, `payout_approved`, `payout_paid`) are never set from Bullhorn, and "Placed" never pulls someone back out of them.

### JobSubmission status to an application's ECRN status

| Bullhorn says | ECRN shows |
|---|---|
| New Lead, Web Response, New, Applied, Application Received | `submitted` |
| Submitted, Internally Submitted, Internal Submission, Sales Rep Submission, Client Submission, Submitted to Client, Reviewing, Under Review, In Review, Shortlisted | `reviewing` |
| Interview Scheduled, Interviewing, Interview, Client Interview, First Interview, Second Interview, Final Interview | `interviewing` |
| Offer Extended, Offer, Offer Out, Offer Accepted, Offer Stage | `offer` |
| Placed, Hired, Placement, Started | `hired` |
| Client Rejected, Rejected, Sales Rep Rejected, Not a Fit, Not Qualified | `rejected` |
| Candidate Not Interested, Withdrawn, Candidate Withdrew, Offer Rejected, Offer Declined | `withdrawn` |

In Bullhorn "Submitted" means a recruiter put the person forward, so the member sees "Reviewing". When the match is a job referral, the same progress is written as `submitted_to_job`, `interviewing`, `offer_stage`, `placed`, `rejected` or `inactive`.

### JobOrder status to a job's ECRN status

| Bullhorn says | ECRN shows |
|---|---|
| Accepting Candidates, Currently Interviewing, Accepting Submissions, Open, Active | `open` |
| Covered, Offer Out, On Hold, Hold, Paused | `paused` |
| Placed, Filled | `filled` |
| Lost, Canceled, Cancelled, Closed, Archive, Archived, Inactive | `archived` |
| unknown wording, `isOpen: true` | `open` |
| unknown wording, `isOpen: false` | `archived` |
| `isDeleted: true` | `archived` |
| unknown wording, no `isOpen`, new job | `draft` |

`open` and `paused` jobs show on the job board. `filled`, `archived` and `draft` do not.

### Employment type to job type

| Bullhorn says | ECRN shows |
|---|---|
| Direct Hire, Permanent, Full Time | Full-time |
| Contract, Temporary | Contract |
| Contract To Hire, Temp to Perm | Contract-to-hire |
| Part Time | Part-time |
| anything else | kept as Bullhorn wrote it |

## 9. Environment variables

All are **secrets**. Set each one on the Cloudflare Worker and never commit a value:

```bash
npx wrangler secret put STAFFING_REFERRALS_WEBHOOK_URL
```

| Name | Needed for | What it is |
|---|---|---|
| `STAFFING_REFERRALS_WEBHOOK_URL` | Outbound | The address Staffing Referrals gives ECRN to post events to |
| `STAFFING_REFERRALS_SECRET` | Outbound signing and inbound checking | One long random value shared with Staffing Referrals. Make it with `openssl rand -hex 32` |
| `SUPABASE_SECRET_KEY` | Inbound webhook, scheduled delivery | The Supabase secret (service role) key: Supabase dashboard, Project settings, API keys. It bypasses row-level security, so it lives on the server only |
| `CRON_SECRET` | Scheduled delivery | A long random value the scheduler sends as `authorization: Bearer ...` |
| `BULLHORN_CLIENT_ID`, `BULLHORN_CLIENT_SECRET` | Direct API (optional) | The API key from Bullhorn Support |
| `BULLHORN_USERNAME`, `BULLHORN_PASSWORD` | Direct API (optional) | The dedicated API user. Preferred way to sign in |
| `BULLHORN_REFRESH_TOKEN` | Direct API (optional) | Alternative to username and password |
| `BULLHORN_REDIRECT_URI` | Direct API (optional) | Only if one was registered with the API key |
| `BULLHORN_OAUTH_URL`, `BULLHORN_REST_URL` | Direct API (optional) | Only to skip Bullhorn's data-centre lookup. Normally blank |

With every one of them blank the app runs normally: events queue, the inbound address answers `503`, and Admin, Integrations shows each connection as not connected.

## 10. Scheduled delivery

Events do not send themselves. Something has to call this every few minutes:

```
POST https://ecrn.com/api/integrations/dispatch
authorization: Bearer <CRON_SECRET>
```

It answers `{ "ok": true, "sent": 4, "failed": 0, "skipped": null }`. While the webhook URL is not set, `skipped` explains that events are still queued. It answers `503` until `CRON_SECRET` and `SUPABASE_SECRET_KEY` are set, and `401` for a wrong secret.

Optional query string: `limit` (events per run, default 15, max 200) and `pull=1` (also pull from Bullhorn when the direct API is configured).

An admin can also press **Send queued events now** on Admin, Integrations at any time.

### Option A: a small Cloudflare Worker with a Cron Trigger (recommended)

The ECRN app is built by OpenNext, which does not expose a scheduled handler, so use a second tiny Worker whose only job is to call the address above.

`cron/wrangler.jsonc`:

```jsonc
{
  "name": "ecrn-cron",
  "main": "index.js",
  "compatibility_date": "2026-09-01",
  // Lets this Worker call the ECRN Worker even on a workers.dev address.
  "compatibility_flags": ["global_fetch_strictly_public"],
  "triggers": { "crons": ["*/5 * * * *"] },
  "vars": { "ECRN_URL": "https://ecrn.com" }
}
```

`cron/index.js`:

```js
export default {
  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(
      fetch(`${env.ECRN_URL}/api/integrations/dispatch`, {
        method: "POST",
        headers: { authorization: `Bearer ${env.CRON_SECRET}` },
      })
    );
  },
};
```

```bash
cd cron
npx wrangler secret put CRON_SECRET     # the same value as on the ECRN Worker
npx wrangler deploy
```

### Option B: any scheduler that can make an HTTP request

GitHub Actions on a schedule, an uptime service, or a server crontab:

```bash
curl -fsS -X POST https://ecrn.com/api/integrations/dispatch -H "authorization: Bearer $CRON_SECRET"
```

### Option C: from the database

Supabase's `pg_cron` and `pg_net` extensions can make the same call every five minutes. Keep the secret in Supabase Vault, not in the SQL.

### Sizing

Cloudflare limits how many outgoing requests one Worker invocation may make: 50 on the free plan and 1,000 on the paid plan. Database calls count.

- **Outbound.** Each event costs three requests (claim, send, record). The default of 15 per run fits the free plan. On the paid plan `?limit=100` is fine. If the queue is long, the next run carries on where this one stopped.
- **Inbound.** Applying one event takes up to about 20 database calls. On the free plan Staffing Referrals should send **one event per request**. On the paid plan batches of 25 are fine.

## 11. What ECRN needs to go live

### From Staffing Referrals

1. The **webhook URL** that accepts ECRN's events.
2. Whether they can check an **HMAC-SHA256 signature header**. If they need something else (an API key, basic auth, IP allow-list), what exactly.
3. Whether they accept the **payloads in section 4 as they are**. If they need a different shape, their spec, so `toBullhorn` can be adjusted.
4. Whether they can **send events to ECRN** (section 5), which of the eight they can produce, and in what shape. If they cannot send webhooks, say so: the direct Bullhorn route (section 14) covers the same ground.
5. That each inbound event carries a **stable event id**, reused on retries.
6. How a referral's **referrer** should be recorded on their side, so the member who referred someone is visible to recruiters.
7. A **test environment** or a test tenant, and a contact for the first end-to-end run.
8. Any **rate limits**, timeouts or retry rules ECRN should respect.

### From Delta (whoever administers Bullhorn)

1. The **team list**: every recruiter and account manager with Bullhorn user id, name, email, title and who they report to. Or a go-ahead to pull it. Plus which people are account managers and which are recruiters, if the titles do not make that obvious.
2. Delta's actual **status lists**: Candidate status, JobSubmission status and JobOrder status, exactly as they appear in Bullhorn, so section 8 can be checked line by line.
3. Which **custom fields** on the Bullhorn candidate should hold: career status, the confidential flag, move motivators, years of experience, LinkedIn. And confirmation that `externalID` is free to hold the ECRN id.
4. **Which jobs belong on ECRN**: every open job, or only the ones marked public in Bullhorn. And whether a client's name may ever be shown to members.
5. Where the **referral reward** for a job comes from: a field on the Bullhorn job, or typed into ECRN by an admin.
6. In Bullhorn, is a candidate's **owner** the recruiter or the account manager? ECRN handles both, but it is worth knowing.
7. The rule for a **cancelled placement** (a guarantee period, for example), so payouts can follow it.
8. Whether **resumes** uploaded in ECRN should be attached to the Bullhorn candidate. Not built yet. Today only a "has a resume" flag is sent.

### From Bullhorn (only for the direct API route)

1. **REST API access** switched on for Delta's account.
2. An **API key**: client id and client secret. Bullhorn Support issues these on request from the account owner.
3. A dedicated **API user** (username and password) that has accepted the terms of service once by signing in, with rights to read CorporateUser, JobOrder, Placement, Candidate and JobSubmission, and to create and edit Candidate and JobSubmission.
4. The **redirect URI** registered with the key, if Bullhorn requires one.
5. Delta's **API limits** (calls per minute and concurrent sessions).

### From the ECRN side (hosting)

1. Set the secrets in section 9.
2. Set up the scheduler in section 10.
3. Point ecrn.com at the app, so the inbound address is final before it is handed out.

## 12. Go-live checklist

Work down the list. Each step can be checked on Admin, Integrations.

**Before anyone else is involved**

- [ ] Open Admin, Integrations, Simulator. Run the samples in order: account manager, recruiter, job, link the person, update the person, submission, placement. Check Team, Jobs, the person's page and Payouts. This proves the inbound side end to end.
- [ ] Remove what the samples created (team members with example.com emails, the sample job) and press **Clear simulated records** on the Bullhorn mirror tab.

**Inbound**

- [ ] Set `STAFFING_REFERRALS_SECRET` and `SUPABASE_SECRET_KEY`. The Inbound webhook card turns to Ready.
- [ ] `GET` the inbound address. It should say `"configured": true`.
- [ ] Send the `curl` test from section 3 with a real person's ECRN id. Expect `200` and an applied row in the Inbox tab.
- [ ] Send it again unchanged. Expect `"duplicates": 1`.
- [ ] Give Staffing Referrals the address and the secret (through a password manager, not email).
- [ ] Load the team first: one `user.upserted` per person. Check the Team page: roles, managers, codes.
- [ ] Load the jobs: one `job.upserted` per open job. Check owners, and that no client name shows on the public job board.
- [ ] Review the inbox for `ignored` and `failed` rows. Unknown status wording shows up there. Add it to `lib/integrations/mapping.ts`.

**Outbound**

- [ ] Look through the Outbox tab. Open a few rows and read exactly what will be sent. Demo rows should be `skipped`.
- [ ] Decide whether the backlog should be sent. Every real event since launch is queued and will go out oldest first. To hold any back, mark them `skipped` in the database first.
- [ ] Set `STAFFING_REFERRALS_WEBHOOK_URL`. The outbound card turns to Connected.
- [ ] Press **Send queued events now** once. Check sent and failed, and confirm with Staffing Referrals that the events arrived and the signature checked out.
- [ ] Confirm a candidate appears in Bullhorn with the right owner, and that `candidate.linked` comes back.
- [ ] Set `CRON_SECRET` and deploy the scheduler. Watch one run arrive.

**Full loop**

- [ ] In ECRN: refer a test person to a job. In Bullhorn: see the candidate and submission under the job's owner.
- [ ] In Bullhorn: move the submission to an interview status. In ECRN: the application or referral shows Interviewing.
- [ ] In Bullhorn: create a placement. In ECRN: the person is placed and a pending payout exists for the referrer.
- [ ] Confirm Sense picks the person up from Bullhorn the way Delta expects.

**After go-live**

- [ ] Rotate the shared secret if it was ever sent over email or chat.
- [ ] Check the Failed counts weekly for the first month.

## 13. Decisions still open

These do not block the build. Each has a safe default in place.

| Question | Default today |
|---|---|
| Should only Bullhorn jobs marked public appear on ECRN? | A new job is public unless the event says `isPublic` is 0 or false |
| Does a cancelled placement cancel the payout? | No. It is flagged for a person to review |
| Should Bullhorn be able to overwrite a member's phone, email or title? | No. ECRN keeps what the member entered and stores Bullhorn's copy in the mirror |
| Should the backlog of queued events be sent at go-live? | Yes, oldest first, unless rows are marked `skipped` first |
| Should resumes be attached in Bullhorn? | Not built. A flag says whether one exists |
| Where does `member.onboarded` belong in Bullhorn for people who only refer? | Sent as entity `ReferralPartner`. Staffing Referrals decides where it lands |

Two behaviours worth knowing:

- **Echoes are stopped.** When Bullhorn changes a person or an application, ECRN's own triggers queue an outbound event for that change. Sending it straight back would loop, so those rows are marked `skipped` with the note "Echo of an inbound Bullhorn event". They stay visible in the Outbox under Skipped.
- **Inbound events without an `id` cannot be recognised as repeats.** They are applied every time they arrive. The handlers are safe to run twice, but please send an id.

## 14. The direct Bullhorn route (optional)

If Delta would rather have ECRN talk to Bullhorn itself, or Staffing Referrals cannot send events back, the client in `lib/integrations/bullhorn.ts` does it. It follows Bullhorn's documented sign-in:

1. `GET https://rest.bullhornstaffing.com/rest-services/loginInfo?username=...` returns Delta's `oauthUrl` and `restUrl` (which data centre).
2. `GET {oauthUrl}/authorize?client_id=...&response_type=code&action=Login&username=...&password=...` redirects with a `code`. (Or skip this with a refresh token.)
3. `POST {oauthUrl}/token?grant_type=authorization_code&code=...&client_id=...&client_secret=...` returns an `access_token` (10 minutes) and a `refresh_token`.
4. `POST {restUrl}/login?version=2.0&access_token=...` returns `BhRestToken` and the company `restUrl`.
5. Every call after that goes to `{restUrl}...` with the header `BhRestToken`.

What it offers:

| Function | Bullhorn call | Becomes |
|---|---|---|
| `pullCorporateUsers()` | `query/CorporateUser` | `user.upserted` events |
| `pullJobOrders({ since })` | `query/JobOrder` ordered by `dateLastModified` | `job.upserted` events |
| `pullPlacements({ since })` | `query/Placement` ordered by `dateLastModified` | `placement.updated` events |
| `pushCandidate(payload)` | `PUT entity/Candidate` or `POST entity/Candidate/{id}` | a `candidate.linked` event |
| `pushJobSubmission(payload)` | `PUT entity/JobSubmission` | a `submission.updated` event |

Every result goes through the same inbox and handlers as a webhook event, so sections 5 to 8 apply unchanged. With the credentials set, Admin, Integrations shows a **Pull from Bullhorn now** button, and the scheduler can do it with `?pull=1`. Each run handles about 20 new records and remembers where it stopped.

**This client has never run against a real Bullhorn account.** Before relying on it, confirm against Delta's instance (each is marked `CONFIRM` in the code):

- the field lists in the three queries (an unknown field name makes Bullhorn reject the whole request)
- that the API user has accepted the terms of service (step 2 fails until it has)
- the status given to a new web response (`New Lead`)
- which custom fields to write on a candidate (only standard fields are sent until that is agreed)
- that refresh tokens rotate on every use (the code keeps the newest one in the admin-only `integrations` table when signing in by refresh token)

The two `push` functions are not wired to the outbox. If the direct route replaces Staffing Referrals for outbound, `dispatchOutbox` is the place to call them.

## 15. Where the code lives

| File | What it does |
|---|---|
| `lib/integrations/staffing-referrals.ts` | Outbound: `toBullhorn` (the payloads in section 4) and `dispatchOutbox` |
| `lib/integrations/inbound.ts` | Inbound: `applyInboundEvent`, the eight handlers, `receiveInboundEvents` (inbox, repeats, results) |
| `lib/integrations/mapping.ts` | Status tables, field tables, event lists. Edit mappings here |
| `lib/integrations/signature.ts` | HMAC signing and checking |
| `lib/integrations/bullhorn.ts` | Direct Bullhorn REST client |
| `lib/integrations/bullhorn-sync.ts` | Pull runner with cursors |
| `lib/integrations/samples.ts` | Sample events for the simulator |
| `lib/supabase/service.ts` | Server-only database client for the webhook and the scheduler |
| `app/api/integrations/staffing-referrals/route.ts` | The inbound address |
| `app/api/integrations/dispatch/route.ts` | The scheduled delivery address |
| `app/(app)/admin/sync/` | Admin, Integrations screen and its actions |
| `supabase/migrations/0006_*.sql`, `0008_*.sql` | The triggers that queue outbound events, and the `integration_inbox`, `integration_outbox`, `crm_records` tables |

Database tables: `integration_outbox` (queued, sent, failed, skipped), `integration_inbox` (received, applied, ignored, failed), `crm_records` (raw Bullhorn records), `integrations` (one row per provider; holds the Bullhorn pull cursors).
