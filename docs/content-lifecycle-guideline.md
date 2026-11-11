# NeuronCx Content Lifecycle Guideline

**Version:** 1.1
**Owner:** Content and Product Marketing
**Applies to:** All written output published under the NeuronCx name or delivered to a client

---

## 1. Purpose

Content at NeuronCx is produced across too many surfaces to be managed by habit. The marketing site, the user training portal, product docs, bot knowledge bases, proposals, specs and social posts are all written by different people at different times, often from the same underlying facts.

This guideline sets one lifecycle for all of them: **Plan, Create, Review, Publish, Maintain, Retire.** Every piece of content moves through these six stages. Nothing gets published without passing through Plan and Review. Nothing stays live forever without passing through Maintain.

Review is not a matter of taste. It runs against a fixed rubric and produces a score, because a one-off evaluation is an opinion while a benchmark is a standing, reproducible standard.

---

## 2. Scope: what counts as content

Content is anything written that a person outside the authoring team will read. At NeuronCx that includes:

| Surface | Audience | Primary system |
|---|---|---|
| Marketing website | Prospects, buyers | Payload CMS (neuroncx-website) |
| Blog and longform articles | Prospects, search | Payload CMS |
| User training portal | Client business users | GitBook |
| Product documentation | Client admins, implementers | Mintlify |
| Bot knowledge base and RAG corpus | Patients, end users | NCX Knowledge Base |
| Proposals, SDDs, one-pagers | Client decision-makers | Docs and PDF |
| Functional specs and ADRs | Internal, engineering | Notion |
| LinkedIn and social | Prospects, market | LinkedIn |

A fact that appears on more than one of these surfaces has one owner and one source of truth. Everything else is a rendering of it.

---

## 3. The single-source principle

Scattered knowledge is the default state. Manuals, articles, forum threads, style guides, blogs, tutorials, feedback and reviews all hold pieces of the same truth, and they drift apart the moment nobody is reconciling them.

The rule: **gather the scattered sources first, resolve the contradictions, then write once.**

Before writing anything, pull from the three research inputs:

1. **Internal knowledge sources.** Specs, ADRs, Notion pages, dashboard behaviour, release notes, support tickets in Freshdesk, and the module skills that already encode product context. If the product already behaves a certain way, the spec is the source, not your memory of it.
2. **Competitor documentation.** How Salesforce, LeadSquared, Zoho, CleverTap and the BSP platforms document the same concept. Read for structure and vocabulary, not for copy. Where NCX differs, say so plainly rather than adopting their framing by default.
3. **Customer interviews and client conversations.** What clients actually ask for, in the words they use. Support tickets and call transcripts count. These decide the vocabulary; internal specs decide the facts.

When two sources contradict each other, that contradiction is a finding. Raise it with the module owner before writing around it.

---

## 4. Stage 1: Plan

No writing starts until three questions have answers. Write them at the top of the draft.

### 4.1 What are we writing?

Pick the piece deliberately, not by whatever was asked for last. Decide based on:

- What question is unanswered on the existing surfaces
- What search demand exists, where keyword research applies
- What a live client or an active deal is blocked on
- What a newly shipped feature now makes true
- What the competitor research lane flagged as a documentation gap (section 6.7)

If the answer already exists somewhere in the NCX content estate, the correct output is an update to that page, not a new one. Duplicate pages are the main cause of content rot.

### 4.2 What structure will it follow?

Structure follows content type, and the type is fixed before drafting:

- **Task-first and step-driven** for user portal pages and how-to docs. One task per page, screenshots in line with the step they illustrate.
- **Concept, then mechanism, then application** for platform and architecture pages.
- **Problem, evidence, approach, outcome** for longform articles and thought leadership.
- **Context, options, decision, consequences** for ADRs.
- **Situation, impact, solution, commercials** for proposals and SDDs.

### 4.3 Who is the audience?

Name the reader, not a segment. "Director of operations at a 6-centre diagnostic chain who has never used a CRM" produces different copy from "hospital IT lead evaluating data residency". Record the reader's prior knowledge, what they need to do after reading, and what vocabulary they already use.

One page serves one reader. A page written for buyers and admins at once serves neither.

### 4.4 Build the content outline

The outline is the deliverable of the Plan stage, and it gets reviewed before any prose is written. It contains:

- **The skeleton of headings.** The H2s and H3s in final order, phrased as they will publish.
- **The subtopics.** What each heading will cover, in a line or two.
- **The key points.** The specific claims, facts, figures and examples that must appear, with their source noted.

An outline that someone else could write the article from is a good outline. An outline that only makes sense to its author is a list of guesses.

**Gate:** the outline is approved by the content owner and, where the piece makes product claims, by the module owner. Do not skip to drafting because the piece feels small.

---

## 5. Stage 2: Create

Draft against the approved outline. If the draft wants to depart from the outline, change the outline and say why.

### 5.1 House voice

NeuronCx writes in plain prose. The four tests, in order:

1. **Simplicity.** Fewest words that carry the meaning.
2. **Clarity.** No jargon. If a term is unavoidable, define it on first use.
3. **Elegance.** Ideas flow from one to the next without the reader reassembling them.
4. **Evocativeness.** Concrete detail over abstraction. Name the workflow, the module, the number.

### 5.2 Non-negotiable writing rules

- No em dashes anywhere. Use a hyphen, a comma, or restructure the sentence.
- No machine-sounding filler. Avoid "leverage", "seamless", "robust", "unlock", "revolutionise", "in today's fast-paced world", "it's not just X, it's Y".
- No client names in published content unless written permission exists. Describe the category instead, for example "a 14-centre diagnostic chain".
- DPDP Act is the compliance frame for India, not HIPAA.
- "Cloud telephony", not "agentic telephony".
- Observation, not criticism, when describing how the market operates today.
- Claims carry evidence. A number without a source does not ship.

### 5.3 Write to the rubric

The rubric in section 6 is not a surprise waiting at review time. Authors have it open while drafting. A draft that was written against the rubric scores well the first time; a draft that meets it by accident does not repeat.

### 5.4 Reuse before writing

Check whether the module skill, an existing spec, or a published page already states the fact correctly. Lift and adapt rather than re-deriving. Re-derived facts drift.

---

## 6. Stage 3: Review and benchmark

Review has two lanes that run together: a **benchmark** that scores the content against a fixed rubric, and a **human sign-off** on the things a rubric cannot judge.

### 6.1 Why a benchmark and not a judgement

Ask three people to assess a page and you get three opinions. Ask the same question of a model three times and you get three answers. Neither is a standard.

A benchmark fixes the criteria once, encodes them, and scores every piece against the same criteria every time it runs. Run it three times on the same content and the result is the same. That reproducibility is the whole point: it makes content quality a number the team can hold itself to, rather than a conversation about taste.

### 6.2 Anatomy of the benchmark

The same four stages, every run:

1. **Criteria.** Sourced once, from two places: industry research (researched documentation standards, competitor review) and company standards (NCX task-based descriptions, product requirements, this guideline's voice rules). Criteria are not re-derived per piece.
2. **Rubric.** The criteria turned into an enumerated checklist, with a pass or fail condition written for each item. If an item cannot be judged pass or fail by two different people reaching the same answer, it is not written sharply enough.
3. **Scoring.** Every item resolves to one of four states: **pass**, **blocker**, **warning**, or **not applicable**.
4. **Verdict.** A percentage, compared against the quality gate for that content type.

### 6.3 The scoring states

| State | Meaning | Effect |
|---|---|---|
| **Pass** | The item is met | Counts toward the score |
| **Blocker** | Failed in a way that makes the content wrong, unsafe or unusable | Fails the run regardless of percentage |
| **Warning** | Failed, but the content is still usable | Lowers the score, does not fail the run |
| **Not applicable** | The item does not apply to this content type | Excluded from the denominator |

Score = passes divided by applicable items, as a percentage.

Any single blocker fails the run. A 94 percent score with one blocker does not publish. Blockers are reserved for: a factually wrong product claim, a client name or patient data exposed, a wrong compliance claim, a broken core task flow, or a screenshot that no longer matches the product.

### 6.4 The rubric: two dimensions

The content engagement rubric scores every piece on two dimensions, both drawn from the NCX documentation standard plus industry best practice.

**AI extractability.** Can a retrieval system answer a question correctly using this page alone? This matters more at NCX than at most companies, because our own bots retrieve from this content.

- Headings phrased as the questions readers ask
- Each section answers its heading without depending on an earlier section
- No "as mentioned above", no orphan pronouns, no context that only exists in the page's visual layout
- Canonical NCX terminology, used consistently, defined on first use
- Lists and tables for enumerable facts rather than prose
- Alt text and captions carry the meaning of every image
- Facts stated once, in the place that owns them

**Human engagement.** Can the named reader finish what they came to do?

- Scannable in under a minute: headings, short paragraphs, no walls
- The task completes on the page, with no undocumented step
- Examples are concrete and NCX-specific, not generic
- Reading level matches the named audience
- The next action is obvious

### 6.5 Quality gates by content type

The gate is the minimum verdict to publish. These are the starting values and get calibrated after the first quarter of runs.

| Content type | Gate |
|---|---|
| Bot knowledge base and RAG corpus | 95% |
| Product documentation and user portal | 90% |
| Marketing and platform pages | 85% |
| Proposals and SDDs | 90% |
| Blog and longform | 80% |
| Specs and ADRs | 85% |

### 6.6 Merge gating

The benchmark is a gate, not a report. Content below its gate does not publish, and content with a blocker does not publish at any score. Below-gate content goes back to the author with the failed items named, and re-runs after the fix.

Overriding a gate is allowed, rarely, and only by the content owner with the reason written into the content register. An override that is not recorded did not happen.

### 6.7 The competitor research lane

A second, separate lane runs alongside the benchmark. It is **advisory, never gating.**

- Peers are named and chosen fresh at the time of the run, not from a fixed list that goes stale.
- Competitor material is fetched live. Never score against a cached or remembered version of someone else's documentation.
- Output separates two findings that look alike and need opposite responses:
  - **Documentation gap.** We have the capability, they document it better or we do not document it at all. This goes into the content plan as a Plan-stage input.
  - **Product gap.** They have a capability we do not. This goes to the module owner as product input. It is not a content problem and content must never paper over it.

Confusing the two is how marketing copy ends up describing things the product does not do.

### 6.8 Human sign-off

The rubric cannot judge everything. These stay with people, and all of them must clear before publish.

| Check | Who |
|---|---|
| Technical accuracy: does the product do this, today, in the released build | Module or product owner |
| Audience fit: written for the named reader at their level | Content owner |
| Compliance and confidentiality: client names, patient data in screenshots, security and regulatory claims | Content owner |
| Positioning: does this match current category language | Content owner |

A review with no comments is usually a review that did not happen.

### 6.9 Changing the rubric

The rubric is versioned and changed deliberately, never per piece. Proposed changes come with the reason and go to the content owner. When the rubric version changes, previously published content keeps its old score until its next scheduled maintenance run, at which point it is re-scored against the new version.

Nobody edits the rubric to make a specific page pass.

---

## 7. Stage 4: Publish

Publishing is a deliberate act with a record, not the moment a draft stops changing.

- Publish into the correct system for the surface. Do not post website content as a PDF, or portal content as a blog.
- Set the metadata: title, description, author, publish date, target term, owner, review date.
- Record the benchmark verdict: score, rubric version, date, and any recorded override.
- Add the internal links in both directions. A new page links out to its related pages, and at least one existing page links to it.
- Announce it where the people who need it will see it, for example the sales channel for a new one-pager, the client success channel for a new portal page.
- Record the publish in the content register with its next review date.

---

## 8. Stage 5: Maintain

Published content is a liability until it is maintained. Most content damage at NCX comes from pages that were true when written.

### 8.1 Review cadence

| Content type | Review every |
|---|---|
| Product documentation and portal pages | At every release that touches the module, and at minimum quarterly |
| Marketing and platform pages | Quarterly |
| Blog and longform | Twice a year |
| Proposals and SDD templates | Twice a year, and after any pricing or packaging change |
| Bot knowledge base content | Monthly, against live conversation logs |
| Specs and ADRs | When superseded, with the superseding record linked |

### 8.2 Triggers that force an immediate review

- A feature ships, changes behaviour, or is renamed
- The dashboard UI changes and screenshots no longer match
- A client reports that documentation is wrong
- Support sees repeat tickets on a topic the docs already cover, which means the docs are unclear rather than absent
- A bot answers a question wrongly from the knowledge base, which is usually an extractability failure rather than a missing fact
- Positioning or category language changes
- The rubric version changes

### 8.3 What a maintenance pass does

Correct the facts, refresh the screenshots, re-check the links, update the examples, and **re-run the benchmark against the current rubric version**. Record the new score next to the old one. A page whose score has fallen since publish has drifted, and the drop tells you where.

A page with a stale review date is treated as unverified. A page that has fallen below its gate and not been fixed is a retirement candidate.

### 8.4 Reading the scores in aggregate

Because every page carries a score from the same rubric, the register can be read as a whole. Look for: surfaces whose average sits below gate, rubric items that fail across many pages (which usually means the standard is unclear rather than the authors careless), and scores trending down since publish.

Fixing a rubric item that fails across thirty pages is worth more than fixing thirty pages.

---

## 9. Stage 6: Retire

Content that no longer serves a reader gets retired on purpose. Leaving it live is a decision too, and usually the wrong one.

Retire when the feature is withdrawn, the page has been superseded by a better one, the positioning no longer holds, or the page has had no meaningful traffic or use across two review cycles and no one owns it.

How to retire:

1. Decide the destination. Redirect to the replacement page where one exists. A page with no replacement and no traffic can be removed; a page with inbound links or traffic is redirected, never deleted outright.
2. Preserve the record. Keep the content in the archive with its retire date, reason and final benchmark score, so the decision is traceable.
3. Clean the graph. Remove internal links pointing at it, and remove it from navigation, sitemaps and the bot knowledge base.
4. Note the retirement in the content register.

For bot knowledge base content, retiring matters more than anywhere else. A retired fact left in the corpus keeps being retrieved and answered with.

---

## 10. Roles

- **Content owner.** Owns the register, the cadence, the rubric and the gates. Final call on publish and the only person who can record an override.
- **Module or product owner.** Owns technical accuracy for their module. Sign-off required for any product claim. Receives product gaps from the competitor lane.
- **Author.** Runs the piece through all six stages, writes to the rubric, and keeps the record current.
- **Reviewer.** Comments against the checklist within the agreed turnaround.

---

## 11. The content register

One register holds every live piece of content with: title, surface, URL, type, audience, owner, publish date, last review date, next review date, target term, status (live, in review, retired), the source it was built from, latest benchmark score, rubric version scored against, and any recorded gate override with its reason.

The register is the control surface for this whole guideline. Without it, Maintain and Retire do not happen, and the benchmark scores cannot be read in aggregate.

---

## 12. Quick checklist

**Before writing**
- [ ] The three research inputs consulted and contradictions resolved
- [ ] What, structure and audience all answered in writing
- [ ] Outline approved, with headings, subtopics and key points
- [ ] Current rubric version open while drafting

**Before publishing**
- [ ] Benchmark run, verdict at or above the gate for this content type
- [ ] Zero blockers
- [ ] Technical accuracy signed off by the module owner
- [ ] Audience fit, compliance and positioning signed off
- [ ] Voice rules applied, no em dashes, no filler language
- [ ] No client names, no patient data in screenshots
- [ ] SEO metadata, internal links both ways
- [ ] Every link and screenshot verified

**After publishing**
- [ ] Entered in the register with owner, score, rubric version and next review date
- [ ] Any competitor-lane product gap routed to the module owner
- [ ] Announced to the teams who need it
