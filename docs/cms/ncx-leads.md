# Website enquiries → NCX leads

**Repo:** neuroncx-cms (Payload) → NCX cron carrierv2 API
**Code:** `src/collections/enquiries/ncxLead.ts`, `src/collections/Enquiries.ts`

## What it does

- Every new enquiry from the neuroncx.in contact form creates a lead (user + transaction) in the NCX dashboard, IID 4.
- The enquiry is still saved in the CMS and the email still goes out, whatever NCX answers.
- The outcome is stored on the enquiry, sidebar group **NCX lead**: Created, Duplicate, Failed or Not sent, with a note.

## Flow

- Website `/api/enquiry` → CMS `POST /api/enquiries` → `beforeChange` hook → `POST {NCX_LEAD_URL}` with `Authorization: Bearer {NCX_LEAD_TOKEN}`.
- NCX side: cron `routes/externalCarrierV2.js` → `actions/createExternalLead.js`. The examId in the URL picks the ExternalApiMaster row, which sets institution, school, transaction type, channel, stage and source.
- Body sent: `name`, `phone`, `email`, `company`, `message`, `sourcePage`. `message` is "Company: … / Wants to automate: … / Submitted from: …".

## Rules

- A lead needs a mobile number. No mobile, or one that is not a number → Not sent.
- Mobile is sent as digits with the country code (`+91 98863 99991` → `919886399991`). A 10 digit number is taken as Indian.
- The same number again within an hour → NCX answers 409, stored as Duplicate, no second lead.
- NCX down, slow (10 s timeout) or refusing the token → Failed, with the reason in the note. Nothing retries; create the lead by hand from the enquiry.

## Setup

- **NCX:** ExternalApiMaster row for IID 4 / school 25 (ExAMId 34, "NeuronCx"). Give it a strong `PermanentToken` and a `SourceMasterId` (for example 6 Form or 14 Web Organic; empty means 17 Web Hook).
- **CMS env** (Amplify):
  - `NCX_LEAD_URL` = `https://prodcron.askadmissionsone.in/external/carrierv2/neuroncx-website/34`
  - `NCX_LEAD_TOKEN` = that row's `PermanentToken`
  - With either unset nothing is sent.
- Never commit the token or paste it in group chats.

## Checking

- CMS admin → Enquiries → open one → NCX lead group.
- NCX: `RawExternalWebhookLogs` / `ExternalApiLogMaster` for EXAMId 34, then the lead in the Transaction console.
