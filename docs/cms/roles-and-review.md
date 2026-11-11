# Roles and the review workflow

How the CMS carries out section 10 (Roles) and section 7 (Publish) of the [content lifecycle guideline](../content-lifecycle-guideline.md).

## Roles

Every user has one role, set on their record in Users. Only an admin can change a role; a new user starts as Author.

| | Admin | Content owner | Author |
|---|---|---|---|
| Edit content and save drafts | Yes | Yes | Yes |
| Publish, schedule a publish, unpublish (Pages, Posts, Industries, Industry topics, Bot swarm), while the review workflow is on | Yes | Yes | No: ticks Ready for review |
| Override the benchmark gate on an entry, with a reason (logged in History) | Yes | Yes | No |
| Edit Rubrics and Content standards | Yes | No | No |
| Manage users and roles | Yes | No | No |

API keys, including MCP keys, cannot publish or unpublish an entry, whatever their owner's role: a publish sent with a key is refused (src/fields/publishStatus.ts). That is not the same as "drafts only": see Known exceptions and open gaps below for what a key can still do.

## The review workflow

Switched on and off by an admin in Content standards: "Authors need review to publish". While it is on, on Pages, Posts, Industries, Industry topics and Bot swarm:

- Authors see no Publish, Schedule or Unpublish button, and a publish or unpublish from an author is refused with the reason (src/fields/publishStatus.ts, src/review/unpublish.ts).
- An author ticks Ready for review, with an optional note. Every content owner and admin is emailed through SES with the entry, who marked it, the note, the benchmark verdict and a link comparing the draft with the live version.
- The Review queue (admin, /admin/review) lists everything marked ready, oldest first.
- Publishing clears Ready for review and its note.

While it is off, anyone signed in can publish, and no review emails are sent. The code is in src/review.

## Known exceptions and open gaps

### Fixed: API keys could publish through the jobs API (until 11 Nov 2026)

Until commit 279da24 (11 Nov 2026), Payload's jobs collection had no access rules of its own, so anyone signed in, API keys included, could create a scheduled-publish job through the REST API. Created with no user, such a job ran with full access and published. That went round the API-key rule above, the review workflow and the roles on the benchmark gate. Jobs can now only be read through the API (src/access/jobsCollection.ts); Payload's own scheduling is unaffected. Tested in tests/int/jobsAccess.int.spec.ts.

### Open: what a signed-in author or an API key can still do (audit, 11 Nov 2026)

Not fixed yet. An API key acts as its owner, so each of these is open to a key as well as to the person:

- **Create user accounts.** Users allows create to anyone signed in. A key can create an account with a password, sign in with it, and do anything an author can, including publishing while the review workflow is off.
- **Change its owner's password.** A user may edit their own record, and a key is its owner, so a key can set a new password and sign in as its owner, with the owner's role.
- **Delete published content and media**, and **create redirects**, which go live at once (Redirects and Media have no drafts).
- **Create, read and edit MCP keys** (payload-mcp-api-keys), including linking one to another user, an admin included. MCP requests run as the linked user. Today MCP can only find Pages and Media and read the Header and Footer, so this gives no more than an author already has. It would become an escalation if MCP writes are enabled.
- **Read, create and record benchmark runs** for any entry, with any results: a run can be made to pass. The gate only warns for now.
- **Delete edit locks** (payload-locked-documents), move media between folders (payload-folders), edit any user's admin preferences by id (payload-preferences), and edit the migrations log (payload-migrations; this project runs no migrations).
- **Read every enquiry**, with names, emails and phone numbers.

### content-promote@neuroncx.in is a Content owner

`scripts/promote-page.mjs --publish` signs in as this account to publish promoted content on the live CMS, so it is to have the Content owner role (decided 11 Nov 2026). **Not applied yet:** by then the account no longer existed under this email (production had author@neuroncx.in instead), and the role waits until the account is confirmed. Once applied, it can also **override the benchmark gate**, which section 10 of the guideline reserves to the content owner. Anyone holding its password (in `.env.promote`, not committed) has that power.

- The password is kept only in `.env.promote` and is changed when someone who had it leaves.
- An override set by this account shows in History under its name, so it can be told apart from one set by a person.
- If promote-page stops publishing (promoting as drafts, with an owner publishing in the admin), set the account back to Author.
