# Roles and the review workflow

How the CMS carries out section 10 (Roles) and section 7 (Publish) of the [content lifecycle guideline](../content-lifecycle-guideline.md).

## Roles

Every user has one role, set on their record in Users. Only an admin can change a role; a new user starts as Author.

| | Admin | Content owner | Author |
|---|---|---|---|
| Edit content and save drafts | Yes | Yes | Yes |
| Publish, schedule a publish, unpublish (Pages, Posts, Industries, Industry topics, Bot swarm), while the review workflow is on | Yes | Yes | No: ticks Ready for review |
| Override the benchmark gate on an entry, with a reason (logged in History) | Yes | Yes | No |
| Edit Rubrics and Content standards (in person, never with a key) | Yes | No | No |
| Edit the Header, Footer, Site settings and WhatsApp lists (in person, never with a key) | Yes | Yes | No |
| Add users, manage users and roles (signed in as themselves, never with a key) | Yes | No | No |

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

### Fixed: a key could get a full sign-in (until 11 Nov 2026)

Until wave 1 (11 Nov 2026), a key could create a user account with a password (Users allowed create to anyone signed in), or set a new password on its own owner (a user may edit their own record, and a key acts as its owner), then sign in with it: a full session with that account's role. Now only an admin signed in as themselves can add users, never a key, an admin's included, and a key cannot change anyone's password, email or API key settings (src/collections/Users/signIn.ts). A key cannot turn itself into a session through refresh either: Payload refuses a refresh with no session. Tested in tests/int/accessMatrix.int.spec.ts.

### Fixed: enquiries were open to anyone signed in (until 11 Nov 2026)

Until wave 2 (11 Nov 2026), anyone signed in, API keys included, could read, change and delete every enquiry (names, emails, phone numbers, messages), and create enquiries, each of which also creates an NCX lead and sends an email. Now an enquiry is read, changed or deleted only by an admin signed in as themselves, never with a key, and created only by the website's form (with ENQUIRY_SECRET) or such an admin (src/collections/Enquiries.ts, src/access/adminInPerson.ts). Who could read them before is not recorded: the CMS keeps no log of reads.

### Fixed: a key could change the globals, the review switch included (until 11 Nov 2026)

Until wave 3 (11 Nov 2026), anyone signed in, keys included, could change the Header, Footer, Site settings and WhatsApp lists, which have no drafts, so each change was live at once. An admin's key could also change Content standards, which holds the review switch: a key could turn the review workflow off and then publish. Now the Header, Footer, Site settings and WhatsApp lists are changed by a content owner or admin in person, and Content standards by an admin in person, never with a key (src/access/adminInPerson.ts). Tested in tests/int/accessMatrix.int.spec.ts.

### Fixed: anyone signed in could make redirects, to anywhere (until 11 Nov 2026)

Redirects go live as soon as they are saved. Until wave 2 (11 Nov 2026) anyone signed in, keys included, could make one, and a custom redirect could send visitors to any website. Now redirects are made, changed and removed by a content owner or admin in person, never an author or a key; a custom redirect goes to a path on this site, the site itself, or an https host listed in Content standards (Redirect destinations), added by an admin (src/redirects/destination.ts). Each redirect has a type, permanent (308) unless marked temporary (307); one with no type is permanent. Redirects the CMS writes when an entry moves are saved by the server and are not affected. Tested in tests/int/redirects.int.spec.ts.

### The enquiry read log (from 11 Nov 2026)

Every enquiry a signed-in person or key reads is recorded in Enquiry reads (admin, System): who, whether it was listed among others or opened on its own, when, from which IP address and browser, and with a key or signed in (src/collections/EnquiryReads.ts). Only an admin in person can read the log; nobody can write, change or delete an entry through the API. Reads by server code with nobody signed in are not recorded. If writing an entry fails, the read still goes through and the failure is in the server log.

### Enquiries on developers' machines

Copies of the database on a developer's machine keep enquiries without the people in them: names, emails, phone numbers, companies and messages are replaced with placeholders (scripts/blank-enquiries.mjs). The tests' database blanks them as it copies, and the dev database pull leaves enquiries out of the production dump altogether. Older dumps in `db-backups/` still hold them.

### Open: what a signed-in author or an API key can still do (audit, 11 Nov 2026)

Not fixed yet. An API key acts as its owner, so each of these is open to a key as well as to the person. tests/int/accessMatrix.int.spec.ts holds the full table and marks each one "Open", so closing a gap means changing it there.

- **Delete published content and media**, which is live at once (Media has no drafts).
- **Create, read and edit MCP keys** (payload-mcp-api-keys), including linking one to another user, an admin included. MCP requests run as the linked user. Today MCP can only find Pages and Media and read the Header and Footer, so this gives no more than an author already has. It would become an escalation if MCP writes are enabled.
- **Read, create and record benchmark runs** for any entry, with any results: a run can be made to pass. The gate only warns for now.
- **Delete edit locks** (payload-locked-documents), move media between folders (payload-folders), edit any user's admin preferences by id (payload-preferences), and edit the migrations log (payload-migrations; this project runs no migrations).

### promote-page.mjs saves drafts only, as promote@neuroncx.in

`scripts/promote-page.mjs` writes to the live CMS with one API key, `PROMOTE_API_KEY` in `.env.promote` (not committed). The key belongs to promote@neuroncx.in: an Author, with an API key and no password anyone knows. So promoting can only ever save drafts. On Pages, Posts, Industries, Industry topics and Bot swarm each promoted draft is marked Ready for review with the note "promoted from local", and appears in the Review queue for a content owner or admin to publish. `--publish` is gone: the script refuses it and says why.

Until 11 Nov 2026 the script signed in as the admin, digital@neuroncx.in, with its email and password for `--publish` and the admin's API key for drafts, all kept in `.env.promote`. Those were removed from the file that day, and the admin's password and key were changed. (An earlier version of this page said a content-promote@neuroncx.in Content owner account did the publishing; that was wrong, and that account no longer exists.)

`scripts/migrate-header-nav-remote.mjs` reads the same key, but can no longer write: no key can change a global.
