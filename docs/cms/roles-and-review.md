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

API keys, including MCP keys, save drafts only, whatever their owner's role.

## The review workflow

Switched on and off by an admin in Content standards: "Authors need review to publish". While it is on, on Pages, Posts, Industries, Industry topics and Bot swarm:

- Authors see no Publish, Schedule or Unpublish button, and a publish or unpublish from an author is refused with the reason (src/fields/publishStatus.ts, src/review/unpublish.ts).
- An author ticks Ready for review, with an optional note. Every content owner and admin is emailed through SES with the entry, who marked it, the note, the benchmark verdict and a link comparing the draft with the live version.
- The Review queue (admin, /admin/review) lists everything marked ready, oldest first.
- Publishing clears Ready for review and its note.

While it is off, anyone signed in can publish, and no review emails are sent. The code is in src/review.

## Known exceptions

### content-promote@neuroncx.in is a Content owner

`scripts/promote-page.mjs --publish` signs in as this account to publish promoted content on the live CMS, so it has the Content owner role (decided 11 Nov 2026). As a result it can also **override the benchmark gate**, which section 10 of the guideline reserves to the content owner. Anyone holding its password (in `.env.promote`, not committed) has that power.

- The password is kept only in `.env.promote` and is changed when someone who had it leaves.
- An override set by this account shows in History under its name, so it can be told apart from one set by a person.
- If promote-page stops publishing (promoting as drafts, with an owner publishing in the admin), set the account back to Author.
