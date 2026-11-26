# NeuronCx CMS: page block reference

Generated 2026-11-25 from the block configs by `neuroncx-cms/scripts/block-reference.ts`. Re-run it after any field change rather than editing this file by hand.

Read this with `ncx-content-notes.md`, which holds the writing rules and the publishing workflow. This file says what each block is for and exactly what it accepts.

## How to read an entry

- `blockType` is the value that goes in each `layout` item. Field names are exact and case-sensitive.
- **required** fields must be filled or the page will not publish. Lists give their allowed number of items.
- Selects and radios take only the listed values. The text in brackets is the label editors see; the value is what is stored.
- Quoted text after a field name is its label in the admin. Text after the colon is the editor guidance written into the CMS: treat it as the brief for that field.
## Rules for the whole page

- **One H1.** These blocks render the page's main heading: `conversationHero`, `statHero`, `heroFullBackground`, `heroRightPlacement`, `heroWorkforceGrid`, `agenticHero`, `heroCustom`, `heroHarness`, `heroStack`, `integrationsLanding`. Use exactly one of them, as the first block, and set the page hero to `none`.
- **One highlight.** `background: navy` ("Highlight (navy)") marks the single section the page most wants read. Only one block per page may use it; a second one stops the page saving. There is no crimson background.
- **Appearance fields.** Most blocks accept the optional set below. Leave every one at its default unless asked; the blocks are designed to look right as they are.

| Field | Values | Notes |
|---|---|---|
| `background` | `default`, `white`, `cloud` (pale grey), `navy` (Highlight) | One `navy` per page at most. |
| `width` | `default`, `narrow` (long text), `wide`, `full` (full bleed) | |
| `spacingTop`, `spacingBottom` | `default`, `none`, `sm`, `lg` | |
| `align` | `default`, `left`, `center` | |
| `hidden` | `true` / `false` | Keeps the block but takes it off the page. |
| `htmlId` | text | An anchor for links like `#how-it-works`: lowercase words and dashes, no `#`. |

Each block says which set it takes: **full** (all of the above), **minimal** (`hidden` and `htmlId` only: blocks that draw their own ground, so a background would do nothing), or **own** (the block carries its own equivalents, listed in its fields).

## The page hero field

Separate from the blocks: every page has a `hero` group. When the first block is one of the H1 heroes above, set its `type` to `none`.

- `type` (select, **required**): one of: `none` (None), `highImpact` (High Impact), `mediumImpact` (Medium Impact), `lowImpact` (Low Impact); default `lowImpact`
- `richText` (rich text)
- `links` (list): up to 2 items
  - `link` (link, **required**)
    - `type`: `reference` (an internal page or post, set in `reference`) or `custom` (a URL or site path in `url`); `label` (required): the visible text; `newTab`: open in a new tab; `appearance`: `default` or `outline`
- `media` (upload from `media`, **required**): only when `type` is `highImpact` or `mediumImpact`

## Icon library

Icon fields take one of these names. The text in brackets is what each one is for. Never invent a name.

`message` (conversational, enquiry), `chat` (follow-up, replies), `check` (confirmation, qualify), `calendar` (booking, scheduling), `card` (payment, transaction), `document` (record, report, fulfilment), `refresh` (recover, retry), `bolt` (workflows, automation), `layers` (context, knowledge), `gauge` (quality, analytics), `plug` (integrations), `shield` (private cloud, isolation), `shieldCheck` (governance, oversight), `lock` (data ownership), `globe` (standards, interoperability), `server` (infrastructure, hosting), `eye` (audit, observability), `users` (team, patients, customers), `user` (one person, profile), `phone` (voice, calls), `smartphone` (mobile, WhatsApp), `mail` (email), `messageCircle` (chat, messaging), `send` (outbound, campaigns), `inbox` (incoming, queue), `headphones` (support, agent handover), `mic` (voice input), `video` (video consult), `bell` (reminders, alerts), `handshake` (partnership, onboarding), `stethoscope` (doctor, consultation), `heartPulse` (health, vitals), `hospital` (hospitals, facilities), `activity` (monitoring, live status), `flask` (lab, diagnostics), `pill` (pharmacy, prescriptions), `graduationCap` (education, admissions), `building` (organisation, campus), `mapPin` (location, branch), `database` (records, data store), `cloud` (cloud, hosted), `workflow` (process, orchestration), `bot` (AI agent), `sparkles` (AI, generated), `search` (retrieval, lookup), `chart` (reporting, dashboards), `trendingUp` (growth, conversion), `target` (goals, targeting), `rocket` (go-live, launch), `key` (access, credentials), `fileText` (documents, notes), `clipboardList` (tasks, checklist), `link` (connection), `settings` (configuration), `puzzle` (modules, extensions), `timer` (speed, turnaround), `clock` (time, schedule), `badgeCheck` (verified, certified), `star` (rating, highlight), `briefcase` (business, enterprise)

## Heroes (open the page; each renders the page H1)

### Hero with stats

blockType: `statHero` · appearance: **full** · renders the page H1

Hero on the light stage with a headline, subhead, two buttons and a row of headline figures.

- `eyebrow` (text): max 60 characters. Small line above the headline. A short category statement, e.g. "AI automation for patient journeys".
- `headline` (text, **required**): max 120 characters. The main statement. Six to nine words works best.
- `subhead` (textarea): max 300 characters. One or two sentences explaining what the platform does and for whom.
- `primaryLabel` (text): max 40 characters; default `Book a demo`
- `primaryLink` (text): max 300 characters; default `/contact`
- `secondaryLabel` (text): max 40 characters. Leave empty to hide the second button.
- `secondaryLink` (text): max 300 characters
- `stats` (list): up to 4 items. Headline numbers. Use real, defensible figures - three works best.
  - `value` (text, **required**): max 20 characters. e.g. 40%, 2.5x, 14+
  - `label` (text, **required**): max 40 characters. What the number means, in three or four words.

### Hero (Full Background)

blockType: `heroFullBackground` · appearance: **minimal** · renders the page H1

Hero over a full-bleed background image or video with a dark overlay for legibility, or with the media placed on the right. Suits photos and textures; for a diagram with its own text use Media placement Right, or Hero (Right Placement).

- `eyebrow` (text) "Small label above the headline": max 60 characters. Optional. Short, e.g. "AI automation for patient journeys".
- `headline` (text, **required**): max 120 characters. This becomes the page’s main heading (the H1), so use it only once per page. Set the page hero above to "None" when this block is on the page.
- `subhead` (textarea): max 300 characters. One or two sentences under the headline. Optional.
- `primaryCta` (link) "Primary button": Optional. Leave the label empty to hide this button.
  - `type`: `reference` (an internal page or post, set in `reference`) or `custom` (a URL or site path in `url`); `label`: the visible text; `newTab`: open in a new tab
- `secondaryCta` (link) "Secondary button": Optional. Leave the label empty to hide this button.
  - `type`: `reference` (an internal page or post, set in `reference`) or `custom` (a URL or site path in `url`); `label`: the visible text; `newTab`: open in a new tab
- `metaItems` (list) "Short facts under the buttons": up to 3 items. Optional. Up to three short lines, e.g. "New guide every two weeks". Shown with a small dot between them.
  - `text` (text, **required**): max 60 characters
- `media` (upload from `media`, **required**) "Background image or video": Works best with photos, textures or abstract images that have a calm area on the left for the text. For diagrams or screenshots with their own text, set Media placement to Right. Use MP4 or WebM for moving backgrounds. GIFs work but load much slower, so keep them short and small.
- `mediaPlacement` (select) "Media placement": one of: `fullBleed` (Full bleed (fills the hero)), `right` (Right (image on the right, text on plain navy)); default `fullBleed`. Right suits a diagram, screenshot or infographic that already has its own text or busy detail.
- `mediaFit` (select) "Media fit": one of: `contain` (Contain (shows the whole image)), `cover` (Cover (fills the space, may crop)); default `contain`; only when `mediaPlacement` is `right`. Right placement only. Contain suits a diagram; Cover suits a photo.
- `mediaAlt` (text) "What the picture shows (optional)": max 200 characters. Leave empty for a purely decorative background, the usual choice for a full-bleed hero. Fill this in only when the picture itself carries meaning a screen reader user needs to know.
- `videoPoster` (upload from `media`) "Video poster image": images only. Only used when the background is a video. Shown while the video loads and when motion is off.
- `mobileMedia` (upload from `media`) "Background for small screens (optional)": Replaces the background above on phones and small tablets. Leave empty to use the same file on every screen size. Has no effect when Media placement is set to Right, because that layout already changes to a stacked image on phones.
- `focalPoint` (select) "Focal point": one of: `center` (Centre), `left` (Left), `right` (Right), `top` (Top), `bottom` (Bottom); default `center`. Which part of the picture to keep in view when it gets cropped.
- `overlayStrength` (select) "Dark overlay": one of: `light` (Light), `medium` (Medium), `strong` (Strong); default `strong`. Darkens the picture so the text stays readable. Strong is the safest default for a full-bleed photo.
- `animation` (select) "Motion": one of: `off` (Off), `subtle` (Subtle), `lively` (Lively); default `subtle`. How the text and background enter. Always off for a visitor whose device asks for reduced motion.
- `height` (select): one of: `tall` (Tall), `medium` (Medium); default `tall`. On a phone the hero always fits its content.

### Hero (Right Placement)

blockType: `heroRightPlacement` · appearance: **minimal** · renders the page H1

Hero with copy on the left and an image or video on the right, on the light stage. The picture is always shown whole, never cropped; its left, top and bottom edges fade into the page. Suits a diagram, screenshot or product shot.

- `eyebrow` (text) "Small label above the headline": max 60 characters. Optional. Short, e.g. "Bot swarm".
- `headline` (text, **required**): max 120 characters. This becomes the page’s main heading (the H1), so use it only once per page. Set the page hero above to "None" when this block is on the page.
- `subhead` (textarea): max 300 characters. One or two sentences under the headline. Optional.
- `primaryCta` (link) "Primary button": Optional. Leave the label empty to hide this button.
  - `type`: `reference` (an internal page or post, set in `reference`) or `custom` (a URL or site path in `url`); `label`: the visible text; `newTab`: open in a new tab
- `secondaryCta` (link) "Secondary button": Optional. Leave the label empty to hide this button.
  - `type`: `reference` (an internal page or post, set in `reference`) or `custom` (a URL or site path in `url`); `label`: the visible text; `newTab`: open in a new tab
- `media` (upload from `media`, **required**) "Image or video": Aim for 16:10. 2560 x 1600 is ideal. Nothing is ever cropped: the picture is fitted whole and pinned to the right, so a diagram or screenshot stays readable. But its left edge and its top and bottom edges fade out into the page, so keep labels and text clear of the left quarter and of the top and bottom tenth. Upload at least 2304 px wide so it stays sharp on a 2x screen; anything wider than 2560 px is scaled down to that width. WebP or PNG for diagrams and screenshots. For moving media use MP4 or WebM. A GIF is served at its original size with no resizing, so it looks soft when stretched across the panel and loads slowly.
- `mediaAlt` (text) "What the picture shows (optional)": max 200 characters. Leave empty when the picture is purely illustrative. Fill this in when it carries meaning a screen reader user needs to know.
- `videoPoster` (upload from `media`) "Video poster image": images only. Only used when the media above is a video. Shown while the video loads and when motion is off.
- `animation` (select) "Motion": one of: `on` (On), `off` (Off); default `on`. The headline words fade in and the image slowly breathes. Always off for a visitor whose device asks for reduced motion.

### Hero (custom CSS)

blockType: `heroCustom` · appearance: **minimal** · renders the page H1

A hero whose visual is your own HTML and CSS. Everything else is fixed and built like the other heroes: the eyebrow, the heading (the page's H1), the subhead, two optional buttons, the breadcrumbs, the room under the header, the page widths and the phone layout. Only the visual is free. The website draws the visual in a sealed box of its own, so its CSS cannot change the rest of the page and nothing in it can cover the header. Its animations stop for visitors who ask for reduced motion. Code that runs, and files from other sites, are refused on save (visualRules.ts).

- `eyebrow` (text) "Small label above the headline": max 60 characters. Optional.
- `headline` (text, **required**): max 120 characters. This becomes the page's main heading (the H1), so use it only once per page. Set the page hero above to None when this block is on the page.
- `subhead` (textarea): max 400 characters. One or two sentences under the headline. Optional.
- `primaryCta` (link) "Primary button": Optional. Leave the label empty to hide this button.
  - `type`: `reference` (an internal page or post, set in `reference`) or `custom` (a URL or site path in `url`); `label`: the visible text; `newTab`: open in a new tab
- `secondaryCta` (link) "Secondary button": Optional. Leave the label empty to hide this button.
  - `type`: `reference` (an internal page or post, set in `reference`) or `custom` (a URL or site path in `url`); `label`: the visible text; `newTab`: open in a new tab
- `visualPosition` (select, **required**) "Visual": one of: `right` (Right of the text), `left` (Left of the text), `below` (Below the text), `background` (Behind the text (background)); default `right`
- `split` (select, **required**) "Text and visual widths": one of: `50` (Half and half), `40` (Narrower text, wider visual); default `50`; shown only in some states
- `height` (select, **required**): one of: `natural` (As tall as its content), `tall` (Tall (most of the screen)); default `natural`
- `phoneVisual` (select, **required**) "On phones": one of: `below` (Show the visual below the text), `hide` (Hide the visual); default `below`. Phones and small tablets, below 900px wide.
- `background` (select, **required**): one of: `cloud` (Pale grey), `white` (White), `navy` (Navy); default `cloud`. Navy switches the text to light colours.
- `visualHtml` (code) "HTML": The markup only, no <style> or <script>. Text in it is read by search engines.
- `visualCss` (code) "CSS": Styles for the HTML above. Use @media or @container visual (max-width: 480px) for small screens. Images and fonts must come from the media library.
- `visualAlt` (text) "Description for screen readers": max 200 characters. What the visual shows, in a sentence. Leave empty if it is only decoration.
- `aspect` (select, **required**) "Shape": one of: `auto` (As tall as its content), `16/9` (Wide (16:9)), `4/3` (Landscape (4:3)), `1/1` (Square (1:1)), `3/4` (Portrait (3:4)); default `auto`; only when `visualPosition` is not `background`
- `maxWidth` (number) "Widest it gets (px, optional)": min 120; max 1440; only when `visualPosition` is not `background`. Empty fills its column.

### Hero (harness loop)

blockType: `heroHarness` · appearance: **minimal** · renders the page H1

- `textLayout` (select, **required**) "Text layout": one of: `centred` (Centred: title and intro centred above the cards and drawing), `stack` (Stacked: title, then the intro, left aligned), `grid` (Grid: the intro lines up with the drawing), `stackWithLabel` (Stacked, with a small label above the title); default `centred`. How the title and intro sit above the cards and drawing. Centred is the approved home page layout. Grid starts the intro where the drawing starts and runs it to the drawing's right edge.
- `textBlock` (select, **required**) "Text block": one of: `centred` (Centred), `leftCentred` (Left, block centred), `leftStage` (Left, on the stage edge); default `centred`; only when `textLayout` is `centred`. Centred centres every line. Left, block centred starts every line on one left edge with the block itself centred on the page. Left, on the stage edge lines the text up with the left edge of the cards and drawing below.
- `eyebrow` (text) "Small label above the title": max 40 characters. A short line in a pill above the title, with a red dot. Shown in every text layout. Leave empty to show none.
- `headline` (textarea, **required**) "Title": max 100 characters; default `An agentic rethink of CRM,
marketing automation and omnichannel CX.`. The page's main heading (the H1), so use this hero once per page. Press Enter where the line should break on laptops and desktops; phones ignore the break and wrap on their own.
- `intro` (textarea, **required**): max 420 characters; default `NeuronCx is a captive AI harness that goes beyond SaaS silos, built for customer acquisition, engagement and retention. It is grounded in your enterprise ontology, so agents act on your own locations, services and rules, and hand over to your team when a person is needed. Your data layer and custom workflows run in your own cloud and change at your own pace.`. One paragraph under the title. Line breaks are joined into one paragraph on the page.
- `buttons` (list): up to 2 items. Optional, up to 2, shown under the intro. Empty shows no buttons.
  - `type` (radio): one of: `reference` (Internal link), `custom` (Custom URL), `section` (Section on this page); default `custom`. Link to a page or post on this site, type any address, or jump to a section further down this page.
  - `newTab` (checkbox) "Open in new tab": shown only in some states. Opens the link in a new browser tab.
  - `reference` (relationship to `pages` or `posts`) "Document to link to": only when `type` is `reference`. The page or post the button opens.
  - `url` (text) "Custom URL": max 300 characters; shown only in some states. The address the button opens, such as /contact.
  - `section` (text) "Section to jump to": max 60 characters; only when `type` is `section`. The block further down this page that the button scrolls to. Lists the blocks that have an Anchor ID, set in each block's Appearance panel.
  - `label` (text) "Button text": max 40 characters. The words on the button. Empty hides the button.
  - `appearance` (select) "Style": one of: `primary` (Primary), `secondary` (Secondary). Primary is the solid red button; Secondary is the plain grey one. Left empty, the first button is Primary and the second Secondary.
- `cardsPosition` (select, **required**) "Cards position": one of: `left` (Left of the drawing), `above` (Above the drawing); default `left`. Where the cards sit on laptops and desktops. On phones they always sit below the drawing, in a row that scrolls sideways.
- `cards` (list, **required**): 3 to 6 items. 3 to 6 cards beside the drawing. Each one works like a tab: selecting it lights up its parts of the drawing and shows its explanation under the drawing.
  - `title` (text, **required**): max 60 characters. The only text on the card. 60 characters keeps it to two lines.
  - `body` (textarea) "Explanation": max 160 characters. Shown under the drawing while this card is selected. 160 characters keeps the caption to two lines.
  - `highlights` (select, several allowed, **required**) "Lights up": one of: `trigger` (Customer event), `boundary` (BYOC box (your own cloud)), `ontology` (Enterprise ontology), `policy` (Policy framework), `guardrails` (Guardrails), `orchestration` (Orchestration), `actions` (Agent actions), `handover` (Team steps in), `customer360` (Customer 360), `loop` (Learning loop). The parts of the drawing this card lights up in red; the rest fade. The BYOC box lights the dashed box and keeps everything inside it at full strength.
- `triggerLabel` (text, **required**) "Heading": max 15 characters; default `Customer event`. The small heading on the event card. 15 characters keeps it inside the card.
- `triggerEvents` (list, **required**) "Events": 1 to 4 items. The events the card shows, one at a time as the loop runs. 1 to 4; 14 characters each keeps them inside the card.
  - `label` (text, **required**): max 14 characters. Up to 14 characters, so it fits its place in the drawing.
- `boundaryLabel` (text, **required**) "Box label": max 24 characters; default `BYOC`. The small label in the top corner of the dashed box. 24 characters keeps it clear of the boxes below it.
- `ontologyLabel` (text, **required**) "Ontology heading": max 19 characters; default `Enterprise ontology`. The heading of the ontology box. 19 characters keeps it on one line in the narrow phone drawing.
- `ontologyItems` (list) "Ontology chips": up to 3 items. Up to 3 small chips in the ontology box. They wrap onto two rows at most; the box has no room for a third.
  - `label` (text, **required**): max 18 characters. Up to 18 characters, so it fits its place in the drawing.
- `policyLabel` (text, **required**) "Policy heading": max 18 characters; default `Policy framework`. The heading of the policy box. 18 characters keeps it on one line in both layouts.
- `policySub` (text, **required**) "Policy line": max 19 characters; default `Set by your team`. The small line under the policy heading. 19 characters keeps it inside the box.
- `orchestrationLabel` (text, **required**) "Orchestration heading": max 16 characters; default `Orchestration`. The large text in the navy box at the centre. 16 characters keeps it inside the box.
- `orchestrationSubLabel` (text, **required**) "Orchestration line": max 18 characters; default `Agents`. The small capitals under the orchestration heading. 18 characters keeps it inside the box.
- `guardrailsLabel` (text, **required**) "Guardrails label": max 12 characters; default `Guardrails`. The small label above the gate every action passes. 12 characters keeps it clear of the lines beside it.
- `actions` (list, **required**) "Agent actions": 2 to 5 items. What the agents do, one box each, after the guardrails. 2 to 5; 16 characters each keeps them inside their boxes.
  - `label` (text, **required**): max 16 characters. Up to 16 characters, so it fits its place in the drawing.
- `handoverLabel` (text, **required**) "Hand-over box": max 16 characters; default `Team steps in`. The box for cases your team takes over. 16 characters keeps it inside the box.
- `customer360Label` (text, **required**) "Customer 360 heading": max 16 characters; default `Customer 360`. The heading of the record box. 16 characters keeps it clear of the chips beside it.
- `customer360Fields` (list) "Customer 360 chips": up to 4 items. Up to 4 chips in the record box, on one row. Together they must fit the narrow phone drawing.
  - `label` (text, **required**): max 12 characters. Up to 12 characters, so it fits its place in the drawing.
- `loopLabel` (text, **required**) "Loop label": max 34 characters; default `Learns from every outcome`. The label on the loop back into the box. On wide screens it splits into two lines beside the drawing, so each half must stay short.
- `actionsName` (text, **required**) "Name for the actions": max 24 characters; default `Agent actions`. How the caption names the action boxes when a card lights them. 24 characters keeps the tag on one line.
- `loopName` (text, **required**) "Name for the loop": max 24 characters; default `Learning loop`. How the caption names the loop back into the box when a card lights it. 24 characters keeps the tag on one line.
- `headingSize` (number, **required**) "Title size (px)": min 32; max 56; default `44`. The title size on screens 1440px wide and up. It shrinks with the screen below that; phones and small tablets use a set size.
- `spacing` (select, **required**): one of: `roomy` (Roomy), `compact` (Compact); default `roomy`. The space above the title, between the title and intro, and above the cards and drawing. Compact brings more of the drawing above the fold.
- `introWidth` (number, **required**) "Intro width (px)": min 560; max 900; default `720`; only when `textLayout` is `stack` or `stackWithLabel`. The widest the intro gets in the two stacked layouts. Centred has its own width setting; grid fills its column.
- `introMaxWidth` (select, **required**) "Intro width (px)": one of: `620` (620px), `720` (720px), `860` (860px), `1020` (1020px); default `620`; only when `textLayout` is `centred`. Controls how many characters fit on a line. 620 lands near 69 characters, which is the comfortable range. Wider means fewer lines but a harder read. 1020 puts the live home passage on three lines at about 119 characters, and is the widest setting offered on purpose.
- `background` (select, **required**): one of: `cloud` (Pale grey), `white` (White); default `cloud`. The colour behind the whole hero.
- `blockWidth` (select, **required**) "Width": one of: `site` (Site column, like the blocks below it), `header` (Match the header: from under the logo to under the last header button); default `site`. How wide the title, cards and drawing run on laptops and desktops. Below 760px both use the normal phone margins.
- `frame` (select, **required**): one of: `plain` (Plain), `framed` (Framed); default `plain`. Framed wraps the cards and the drawing in one bordered panel instead of two separate pieces.
- `motion` (select) "Animation": one of: `follow` (Follow the page), `on` (On), `reduced` (Reduced (a simple fade)), `off` (Off (no animation)); default `follow`. How much this hero moves. Reduced keeps the card highlights but stops the dots. Off shows a still drawing.
- `autoplay` (checkbox) "Play on its own": default `true`. Moves through the cards on its own, one after another. It pauses while a visitor points at or tabs into the hero, and stops once they click a card.
- `loop` (checkbox): default `true`. Keeps the dots running around the drawing while it is on screen. Off runs the loop once.
- `speed` (select): one of: `slower` (Slower), `normal` (Normal), `faster` (Faster); default `normal`. How fast the dots travel around the drawing.
- `autoplaySeconds` (number, **required**) "Seconds per card": min 4; max 12; default `6`. How long each card stays selected while the hero moves through them on its own.
- `showStatus` (checkbox) "Show the live status line": default `true`. The short line on the drawing that names each step as the dots move.
- `showCaption` (checkbox) "Show the caption": default `true`. The selected card's explanation and the names of the lit parts, under the drawing.
- `screenReaderDescription` (text) "Drawing description for screen readers": max 400 characters; default `A diagram of the NeuronCx harness: customer events flow into orchestrated agents that work from your ontology, policies and guardrails, act or hand over to your team, write to Customer 360, and learn from each outcome. The agents run in your own cloud (BYOC).`. Read out in place of the drawing by screen readers. Say what the drawing shows in a sentence or two.

### Hero (Workforce Grid)

blockType: `heroWorkforceGrid` · appearance: **minimal** · renders the page H1

A hero with copy on the left and a grid of small "agent" cards on the right, each column scrolling slowly up or down on its own infinite loop — a "team at work" feel rather than a static screenshot.

- `eyebrow` (text) "Small label above the headline": max 60 characters. Optional. Short, e.g. "The workforce".
- `headline` (text, **required**): max 120 characters. This becomes the page’s main heading (the H1), so use it only once per page. Set the page hero above to "None" when this block is on the page.
- `subhead` (textarea): max 300 characters. One or two sentences under the headline. Optional.
- `cta` (link, **required**) "Button"
  - `type`: `reference` (an internal page or post, set in `reference`) or `custom` (a URL or site path in `url`); `label` (required): the visible text; `newTab`: open in a new tab
- `speed` (select) "Scroll speed": one of: `slow` (Slow), `medium` (Medium), `fast` (Fast); default `medium`. Applies to every column.
- `columns` (select) "Columns (desktop)": one of: `2`, `3`, `4`; default `3`
- `cards` (list) "Agent cards": at least 6 items. Distributed evenly across columns in the order you add them. Add at least 2 per column so the loop doesn’t feel short. Between 9 and 12 cards works well.
  - `icon` (icon name from the icon library): default `bot`
  - `label` (text) "Small label on the card": max 24 characters; default `AI agent`. Short, e.g. "AI agent".
  - `title` (text, **required**): max 90 characters
  - `description` (textarea): max 160 characters. One or two short lines.

### Agentic Hero

blockType: `agenticHero` · appearance: **minimal** · renders the page H1

Hero on the light stage with a word-by-word headline reveal and an animated network of agents and people around a central point. Built for agentic CRM and workflow pages.

- `headline` (text, **required**): max 120 characters. Shown large across the top of the hero.
- `accentWords` (text) "Words to highlight": max 120 characters. Comma-separated words from the headline to underline in the accent colour, e.g. "agentic, workflows".
- `intro` (textarea): max 300 characters
- `ctaLabel` (text) "Button text": max 40 characters
- `ctaUrl` (text) "Button address": max 300 characters
- `nodes` (list) "Network nodes": up to 6 items. Up to six nodes around the diagram. Leave empty to hide the diagram.
  - `label` (text, **required**): max 30 characters
  - `kind` (select): one of: `agent` (Virtual agent), `human` (Human team), `system` (Connected system); default `agent`

### Conversation Hero

blockType: `conversationHero` · appearance: **minimal** · renders the page H1

Hero on the light stage: headline, subhead, two buttons and capability chips on the left; a chat transcript card on the right, with optional workflow steps and a row of stats. Leaving the conversation empty leaves the right half of the hero blank.

- `eyebrow` (text) "Small label above the headline": max 60 characters. Optional. Short, e.g. "Omnichannel automation and reasoning".
- `headline` (text, **required**): max 120 characters. Short and direct works best: around six to eight words.
- `subhead` (textarea, **required**): max 300 characters. One or two sentences explaining what the product does, in plain language.
- `headingSize` (number) "Heading size (px)": min 24; max 64; default `44`. Sets the hero heading's font size in pixels. Keep it under about 48px for longer headlines so they don't wrap awkwardly.
- `primaryButtonLabel` (text) "Primary button text": max 40 characters
- `primaryButtonLink` (text) "Primary button address": max 300 characters
- `secondaryButtonLabel` (text) "Secondary button text": max 40 characters
- `secondaryButtonLink` (text) "Secondary button address": max 300 characters
- `chips` (list) "Chips under the buttons": up to 4 items. Short capability labels, e.g. "WhatsApp · Voice · Web". Two or three works best.
  - `label` (text, **required**): max 24 characters
- `conversationLabel` (text) "Label above the conversation": max 60 characters. For example "WhatsApp · Ayurvaid Hospitals · 11:42".
- `conversation` (textarea) "The conversation": max 600 characters. One message per line. Start a line with "them:" for the customer, "us:" for the agent, and "tag:" for a system note at the end.
- `workflowSteps` (list) "Workflow steps under the conversation": up to 5 items. Optional. What fires behind the scenes, e.g. Booked, Paid, Reminder sent.
  - `label` (text, **required**): max 40 characters
  - `icon` (icon name from the icon library): default `calendar`
- `stats` (list) "Stats strip": up to 4 items. Optional. These sit directly under the hero, so use real, defensible figures only.
  - `value` (text, **required**): max 20 characters. e.g. 40%, 2.5x, 14+
  - `label` (text, **required**): max 40 characters. What the number means, in three or four words.

### Hero Stack

blockType: `heroStack` · appearance: **minimal** · renders the page H1

- `eyebrow` (text) "Small label above the heading": max 60 characters. Optional. For example "Acquire · Engage · Retain".
- `heading` (text, **required**): max 140 characters
- `intro` (textarea): max 300 characters. Optional. One or two sentences under the heading. Hidden on phones to keep the hero short.
- `primaryCta` (group) "Primary button"
  - `label` (text) "Button text": max 40 characters
  - `href` (text) "Button address": max 300 characters. A full address, a page path such as /contact, or #section-id for a section on this page.
- `secondaryCta` (group) "Secondary button"
  - `label` (text) "Button text": max 40 characters
  - `href` (text) "Button address": max 300 characters. A full address, a page path such as /contact, or #section-id for a section on this page.
- `products` (list, **required**): 2 to 6 items. Each product is one screenshot card in the stack. The first one sits on top; scrolling deals them away in this order.
  - `label` (text, **required**) "Tab label (one or two words)": max 24 characters
  - `caption` (text) "Caption (one line, shown under the tabs)": max 110 characters
  - `screenshot` (upload from `media`, **required**): Shown in a 16:10 card. Upload at 1600 x 1000 (16:10) so nothing is trimmed. A taller image is trimmed at the bottom, a wider one at the right.
- `showFrame` (checkbox) "Browser frame (a thin bar with three dots above each screenshot)": default `true`

### Integrations landing

blockType: `integrationsLanding` · appearance: **minimal** · renders the page H1

Integrations landing: the whole integrations landing page in one block, built from an Integrations master record, the integration categories and the live integration items. Nothing is typed into the block itself: edit the master record, the categories or the items, and every page using this block follows. Covers the page edge to edge with its own hero, so it gets the minimal presentation options (hide and anchor), like the hero blocks.

- `master` (relationship to `integrationsMaster`) "Master record": Leave empty to use the main record (the one with Is main on). The page shows its hero, the integrations by category, its sections, FAQ and closing. Set the page hero to None.

## Agentic set (built for /crm-for-agentic-workflows)

### Agentic Flow Demo

blockType: `agenticFlowDemo` · appearance: **full**

An interactive trigger -> route -> resolve walkthrough. Editors define a handful of events; the page lets a visitor pick one and watch it travel through the three stages. In Agent features mode it explains the bot swarm agents instead: a visitor picks a family, then an agent, and sees what it does, its features and what it saves. Nothing about the agents is typed here; the website reads them from the agents themselves (microApps). It also had up to three static step cards below the demo; the field was removed on 24 Oct 2026. A page saved before then keeps its cards in the database, unused, until it is next saved.

- `heading` (text, **required**): max 140 characters
- `intro` (textarea): max 600 characters
- `mode` (select, **required**): one of: `flow` (Flow), `agentFeatures` (Agent features), `groups` (Groups (typed on this block)); default `flow`. Flow walks an event through trigger, route and resolve. Agent features shows what each bot swarm agent does, read from the agents. Groups shows the same explorer with groups and items typed on this block.
- `agentsFor` (select) "Show agents for": one of: `all` (All agents), `industries` (Chosen industries); default `all`; only when `mode` is `agentFeatures`. Chosen industries shows only the agents used in at least one of them.
- `industries` (select, several allowed, **required**): one of: `healthcare` (Healthcare), `diagnostics` (Diagnostics), `education` (Education), `hospitality` (Hospitality); only when `mode` is `agentFeatures`. An agent shows when its Verticals include at least one of these. Families with no such agent are left out.
- `families` (relationship to `lists`, several allowed) "Families (optional)": only when `mode` is `agentFeatures`. The families to offer, in this order. Leave empty for every family, by their order.
- `pickFamilyLabel` (text) "Family buttons label": max 40 characters; default `Pick a family`; only when `mode` is `agentFeatures`. Agent features: above the family buttons. Groups: above the group buttons.
- `pickAgentLabel` (text) "Agent buttons label": max 40 characters; default `Agents`; only when `mode` is `agentFeatures`. Agent features: above the agent buttons. Groups: above the item buttons.
- `youSetLabel` (text) "Label before the last line of the third card": max 24 characters; default `You set:`; only when `mode` is `agentFeatures`. Shown in bold before what the team controls.
- `groups` (list, **required**): 1 to 6 items; only when `mode` is `groups`. Each group is one button; its items are the buttons under it.
  - `label` (text, **required**) "Group button": max 40 characters
  - `items` (list, **required**): 1 to 8 items
    - `name` (text, **required**): max 60 characters. The item button, and the heading of the first card.
    - `chip` (text) "Chip (optional)": max 24 characters. A small label on the item button, such as New.
    - `summary` (textarea, **required**): max 240 characters. The first card.
    - `tags` (list) "Tags (optional)": up to 2 items. Small pills under the summary.
      - `label` (text, **required**) "Tag": max 32 characters
    - `features` (list, **required**): 1 to 5 items. The second card, as ticks.
      - `line` (text, **required**): max 80 characters
    - `handlerTags` (select, several allowed) "Handler tags (optional)": one of: `agent` (Virtual agent), `human` (Human team). Pills in the second card. Empty draws none. Their words are set on the Design tab.
    - `icon` (icon name from the icon library): The third card. Empty draws no icon.
    - `lands` (textarea, **required**) "Where it lands": max 240 characters. The third card: where the item's work ends up, such as on the customer record. Every item needs one.
    - `youSet` (text) "What the team controls": max 180 characters. The last line of the third card, after the label above.
    - `link` (link) "Link under the third card (optional)": Shown only when it has both a text and somewhere to go.
      - `type`: `reference` (an internal page or post, set in `reference`) or `custom` (a URL or site path in `url`); `label`: the visible text; `newTab`: open in a new tab
- `events` (list, **required**): 1 to 4 items; only when `mode` is `flow`. Each event is one button a visitor can pick. The first one is shown on load.
  - `label` (text, **required**) "Button label": max 40 characters
  - `triggerTitle` (text, **required**) "Trigger title": max 60 characters
  - `triggerText` (text, **required**) "Trigger text": max 140 characters
  - `routeText` (text, **required**) "Route text": max 180 characters
  - `routePoints` (list) "Route points (optional)": up to 6 items. Named items listed under the route text, as ticks. Leave empty for a plain text card.
    - `line` (text, **required**): max 80 characters
  - `handlers` (select, several allowed) "Who handles it": one of: `agent` (Virtual agent), `human` (Human team); default `["agent"]`
  - `resolveTitle` (text, **required**) "Resolve title": max 60 characters
  - `resolveText` (text, **required**) "Resolve text": max 180 characters
  - `link` (link) "Link under the resolve card (optional)": Shown only when it has both a text and somewhere to go.
    - `type`: `reference` (an internal page or post, set in `reference`) or `custom` (a URL or site path in `url`); `label`: the visible text; `newTab`: open in a new tab
- `footnote` (text) "Note under the demo": max 120 characters; default `Illustrative run, not live data.`; only when `mode` is `flow`
- `motion` (select) "Animation": one of: `follow` (Follow the page), `on` (On), `reduced` (Reduced (a simple fade)), `off` (Off (no animation)); default `follow`. Reduced keeps a simple fade. Off shows the block with no animation.
- `promptLabel` (text) "Line above the buttons": max 80 characters; default `Pick an event and watch it travel through.`; only when `mode` is `flow`. Empty hides it.
- `stageLabels` (group) "Card eyebrows": Empty uses Trigger, Route and Resolve in Flow mode, or What it does, Features and Saves to your systems in Agent features and Groups modes.
  - `trigger` (text) "First card": max 20 characters
  - `route` (text) "Second card": max 20 characters
  - `resolve` (text) "Third card": max 20 characters
- `handlerLabels` (group) "Handler tags"
  - `agent` (text) "Virtual agent tag": max 20 characters; default `Virtual agent`
  - `human` (text) "Human team tag": max 20 characters; default `Human team`
- `showFootnote` (checkbox) "Show the note under the demo": default `true`; only when `mode` is `flow`
- `accents` (group) "Card colours": Each card's border, eyebrow and shadow.
  - `card1` (select, **required**) "First card": one of: `crimson` (Crimson), `navy` (Navy), `teal` (Teal), `grey` (Grey); default `crimson`
  - `card2` (select, **required**) "Second card": one of: `crimson` (Crimson), `navy` (Navy), `teal` (Teal), `grey` (Grey); default `crimson`
  - `card3` (select, **required**) "Third card": one of: `crimson` (Crimson), `navy` (Navy), `teal` (Teal), `grey` (Grey); default `teal`
- `cardShadow` (checkbox) "Coloured shadow under the cards": default `true`
- `equalHeights` (checkbox) "Cards the same height": default `true`
- `lineStyle` (select) "Line between the cards": one of: `animated` (Animated), `static` (Still), `none` (None). Empty: animated in Flow mode, still in Agent features and Groups modes.
- `lineColor` (select) "Line colour": one of: `grey` (Grey), `crimson` (Crimson), `navy` (Navy). Empty: grey in Flow mode, crimson in Agent features and Groups modes.
- `selectedStyle` (select, **required**) "Selected button": one of: `solidCrimson` (Solid crimson), `solidNavy` (Solid navy), `outline` (Outline); default `solidCrimson`
- `buttonSize` (select, **required**) "Button size": one of: `regular` (Regular), `compact` (Compact); default `regular`
- `panelBackground` (select, **required**) "Panel background": one of: `cloud` (Pale grey), `white` (White), `none` (None); default `cloud`
- `panelBorder` (checkbox) "Border around the panel": default `true`
- `autoplay` (select, **required**) "Play the events by themselves": one of: `off` (Off), `6` (Every 6 seconds), `8` (Every 8 seconds), `10` (Every 10 seconds); default `off`. Stops for good once a visitor clicks a button. Never runs for visitors who ask for reduced motion.
- `startEvent` (number, **required**) "Event shown first": min 1; max 4; default `1`. 1 is the first event. A number past the last event shows the first.

### Agentic Stats

blockType: `agenticStats` · appearance: **full**

A row of headline numbers. Any number can be a count-up (animates from 0 to its value on view). Tick "Pending" for a figure not yet confirmed: it is left out for visitors (src/content/pending.ts), so a band whose figures are all pending does not appear, and draft preview shows it with a "figure to confirm" tag.

- `eyebrow` (text): max 80 characters
- `heading` (text): max 140 characters
- `stats` (list): 1 to 4 items
  - `value` (number): The number, without a % or + sign.
  - `suffix` (text): max 6 characters. For example %, +, k or x.
  - `label` (text, **required**): max 120 characters
  - `pending` (checkbox) "Pending (figure not yet confirmed)": default `false`

### Carts Demo

blockType: `agenticCartsDemo` · appearance: **full**

"One transaction, many carts": a toggle between a leads-and-opportunities model and the NeuronCx model, plus a list of carts that visitors can add to.

- `heading` (text, **required**): max 140 characters
- `intro` (textarea): max 800 characters
- `modelALabel` (text) "Left toggle label": max 40 characters; default `Leads-and-opportunities model`
- `modelBLabel` (text) "Right toggle label": max 40 characters; default `NeuronCx`
- `carts` (list) "Starting carts": 1 to 6 items. The carts shown on load, in order. Visitors can add more up to six.
  - `name` (text, **required**) "Cart name": max 60 characters
  - `historyCount` (number) "Earlier carts in history": min 0; max 10; default `0`
- `addLabel` (text) "Add button label": max 40 characters; default `Open a new cart`
- `noteB` (text) "Note (NeuronCx mode)": max 160 characters; default `The cart carries the lifecycle and the transaction carries the relationship.`
- `noteA` (text) "Note (other model)": max 160 characters; default `Each new opportunity starts a fresh row and arrives as a stranger.`

### Transaction Orbit

blockType: `agenticOrbit` · appearance: **full**

"One transaction, many users": a list of related roles on the left and an orbit diagram on the right where each role circles a central transaction.

- `heading` (text, **required**): max 140 characters
- `intro` (textarea): max 800 characters
- `centreLabel` (text) "Centre label": max 30 characters; default `One transaction`
- `roles` (list): 2 to 4 items. Each role orbits the centre. Hover or tap one to read its caption.
  - `label` (text, **required**) "Role": max 30 characters
  - `subLabel` (text) "Sub-label (optional)": max 80 characters
  - `caption` (text, **required**) "Caption shown on hover": max 120 characters

### Episode Timeline

blockType: `agenticEpisode` · appearance: **full**

"Some relationships run for months": a horizontal episode bar with points along it. The bar fills on view; tapping a point shows what attaches there.

- `heading` (text, **required**): max 140 characters
- `intro` (list) "Intro paragraphs": up to 4 items
  - `text` (textarea, **required**) "Paragraph": max 500 characters
- `startLabel` (text) "Start label": max 30 characters; default `Episode open`
- `endLabel` (text) "End label": max 30 characters; default `Episode closes`
- `points` (list) "Points along the episode": 2 to 8 items. Evenly spaced from start to end, in the order entered.
  - `label` (text, **required**) "Point label": max 40 characters
  - `caption` (text, **required**) "What attaches here": max 140 characters
  - `isBranch` (checkbox) "Only happens in some cases, such as a lost or expired link": default `false`
  - `branchLabel` (text) "Branch note": max 24 characters; default `Only if needed`
- `closing` (text) "Caption under the bar": max 160 characters
- `motion` (select) "Animation": one of: `follow` (Follow the page), `on` (On), `reduced` (Reduced (a simple fade)), `off` (Off (no animation)); default `follow`. Reduced keeps a simple fade. Off shows the block with no animation.
- `autoplay` (checkbox) "Play on its own": default `true`. Plays once when it comes into view. Off shows the finished state.
- `speed` (select): one of: `slower` (Slower), `normal` (Normal), `faster` (Faster); default `normal`

### Case Cards

blockType: `agenticCases` · appearance: **full**

"Where it is running today": a row of case cards with a mouse-tracking tilt and glow. Each can be marked as a client name still to confirm.

- `heading` (text, **required**): max 140 characters
- `hoverGlow` (checkbox) "Hover glow (gradient border and cursor spotlight)": default `true`
- `cases` (list): 1 to 6 items
  - `title` (text, **required**): max 80 characters
  - `text` (textarea, **required**) "Description": max 260 characters
  - `linkLabel` (text) "Link text (optional)": max 60 characters
  - `linkUrl` (text) "Link address (optional)": max 300 characters
  - `clientPending` (checkbox) "Client name still to confirm": default `false`

### Agentic Closing CTA

blockType: `agenticClosing` · appearance: **full**

Closing call to action on a soft animated gradient, with a button that gently follows the cursor when it is near.

- `heading` (text, **required**): max 120 characters
- `ctaLabel` (text, **required**) "Button text": max 40 characters
- `ctaUrl` (text, **required**) "Button address": max 300 characters

## Everything else

### Partner Strip

blockType: `partnerStrip` · appearance: **full**

- `intro` (text) "Opening line": max 160 characters. For example: Powering conversational commerce across industries.
- `populateBy` (select) "Show": one of: `all` (All live integrations), `filter` (Filter by category or product), `selection` (Hand-picked), `manual` (Manual list, old style); default `manual`
- `categories` (relationship to `integrationCategories`, several allowed): shown only in some states
- `products` (relationship to `products`, several allowed): shown only in some states
- `featuredOnly` (checkbox) "Featured only": default `false`; shown only in some states
- `selectedDocs` (relationship to `integrations`, several allowed) "Integrations": shown only in some states
- `limit` (number) "How many": min 1; max 8; default `8`; shown only in some states
- `partners` (list) "Platforms": up to 8 items; shown only in some states. Systems you connect to, such as DocPulse, LeadSquared and WhatsApp Business API, set as text rather than logos. This is not the client logo wall.
  - `name` (text, **required**): max 40 characters
- `badges` (list) "Standards badges": up to 4 items. Only claim a standard you actually meet. Hospital IT teams read these closely.
  - `name` (text, **required**): max 24 characters. e.g. ABDM
  - `suffix` (text): max 24 characters; default `ready`. e.g. ready

### Logo Wall

blockType: `logoWall` · appearance: **full**

- `label` (text) "Small label above the heading": max 40 characters. Short and plain, e.g. "Trusted by". Leave empty to hide.
- `heading` (text): max 140 characters
- `intro` (textarea) "Intro line": max 200 characters. One or two sentences. Leave empty to hide.
- `display` (radio) "How to show clients": one of: `wordmarks` (Client names as text), `logos` (Client logos); default `wordmarks`. Logos are more convincing, but every file needs a transparent background. Switch to logos once you have proper assets for all of them.
- `logos` (list) "Clients": 1 to 12 items. The name is always used. A logo file is only needed when the display mode above is set to logos.
  - `name` (text, **required**) "Client name": max 40 characters. Shown as text in wordmark mode, and used as the image alt text in logo mode. Keep it short; long names crowd the row.
  - `logo` (upload from `media`) "Logo file": Transparent PNG or SVG. Only used in logo mode.
  - `scale` (number) "Size adjustment (%)": min 50; max 200; default `100`. Logo mode only. Leave at 100 unless a logo looks too big or small next to the others. Round crests usually need 130–150.

### Problem Statement

blockType: `problemStatement` · appearance: **full**

- `eyebrow` (text) "Small label": max 60 characters. e.g. The problem
- `heading` (text, **required**): max 140 characters
- `intro` (textarea) "Intro line": max 300 characters
- `problems` (list): 1 to 5 items
  - `title` (text, **required**): max 60 characters. The short name of the problem, e.g. "Siloed systems".
  - `description` (textarea, **required**): max 160 characters. One sentence on what it costs them.
- `note` (text) "Closing note": max 160 characters. Small italic line under the list. Optional.
- `systems` (list) "Systems in the diagram": up to 4 items. The disconnected systems shown in the panel, e.g. Ops, CRM, Payments.
  - `name` (text, **required**): max 40 characters
  - `detail` (text): max 40 characters. e.g. Orders · status
- `gapLine` (text) "What is wrong, under the systems": max 80 characters. e.g. records unlinked · context lost between steps
- `resolutionLine` (text) "The resolution line": max 70 characters. e.g. NeuronCx unifies them into
- `resolutionHighlight` (text) "Highlighted phrase at the end": max 40 characters. Shown in green, e.g. one customer context

### Journey Engine

blockType: `journeyEngine` · appearance: **full**

- `eyebrow` (text) "Small label": max 60 characters. e.g. A live journey
- `heading` (text, **required**): max 140 characters
- `intro` (textarea) "Intro line": max 300 characters
- `stages` (list): 2 to 8 items. The stages of the journey, defined once. Every industry below uses these same stages in this same order.
  - `label` (text, **required**): max 24 characters. e.g. Enquiry
  - `icon` (icon name from the icon library): default `message`
- `industries` (list): 1 to 5 items. One tab per industry. Add one detail per stage, in the same order as the stages above: the first detail belongs to the first stage.
  - `name` (text, **required**): max 30 characters. Tab label, e.g. Diagnostics
  - `details` (list) "What happens at each stage": up to 8 items
    - `title` (text, **required**): max 60 characters. e.g. Recovery
    - `description` (textarea, **required**): max 200 characters

### Context Engine

blockType: `contextEngine` · appearance: **full**

- `eyebrow` (text) "Small label": max 60 characters. e.g. Why NeuronCx
- `heading` (text, **required**): max 140 characters
- `intro` (textarea) "Intro paragraph": max 300 characters
- `points` (list): up to 5 items
  - `title` (text, **required**): max 60 characters. e.g. Grounded, not scripted.
  - `description` (textarea, **required**): max 140 characters
- `calloutTerm` (text) "Callout term": max 40 characters. e.g. Customer 360
- `calloutText` (text) "Callout definition": max 160 characters. e.g. is the shared memory every agent and channel reads from.
- `centreLabel` (text) "Centre of the diagram": max 40 characters; default `Context Engine`
- `satellites` (list) "Nodes around the centre": 3 to 9 items. Spaced evenly around the centre automatically. Six to eight looks best; more than that and the labels crowd.
  - `label` (text, **required**): max 20 characters

### Solution Grid

blockType: `solutionGrid` · appearance: **full**

- `eyebrow` (text) "Small label": max 60 characters. e.g. Solutions
- `heading` (text, **required**): max 140 characters
- `intro` (textarea) "Intro line": max 300 characters
- `groups` (list): 1 to 3 items. Each group is a row of cards under its own small heading, e.g. By journey.
  - `title` (text, **required**): max 40 characters. e.g. By journey
  - `items` (list) "Cards": 1 to 8 items
    - `label` (text, **required**): max 60 characters
    - `href` (text) "Link address": max 300 characters. Optional. Leave empty and the card is plain text rather than a link, which is better than linking to a page that does not exist yet.

### Product Suite

blockType: `productSuite` · appearance: **full**

- `label` (text) "Small label above the heading": max 40 characters
- `heading` (text): max 140 characters
- `intro` (textarea) "Intro line": max 300 characters
- `products` (list): 1 to 6 items. Keep these matched to the main navigation so the site says one thing.
  - `name` (text, **required**) "Product name": max 60 characters
  - `cardStyle` (select) "Card style": one of: `tags` (Tags (small card in a grid)), `steps` (Steps (full width card with a numbered list)); default `tags`. Use Steps when the card explains a process. Use Tags for short labels.
  - `summary` (textarea) "What it does": max 200 characters. One or two plain sentences. Say what it does, not why it is good.
  - `points` (list) "Capabilities": up to 5 items. Tags style: short labels. Steps style: 3 to 5 steps, one line each, about 80 characters.
    - `text` (text, **required**): max 120 characters
  - `image` (upload from `media`): Optional. Without an image the card shows text only.
  - `size` (select) "Card size": one of: `standard` (Standard), `wide` (Wide (two columns)), `tall` (Tall (two rows)); default `standard`; only when `cardStyle` is not `steps`. Only for the Tags style. It is ignored on small screens.
  - `tint` (select) "Image background colour": one of: `none` (None), `violet` (Cool (lightest)), `cyan` (Teal), `rose` (Rose), `grey` (Grey); default `none`; only when `image` is on
  - `teamControls` (textarea) "What your team controls": max 160 characters; only when `cardStyle` is `steps`. Shown in a small box under the steps.
  - `note` (text) "Small note under the card": max 120 characters; only when `cardStyle` is `steps`
  - `linkLabel` (text) "Link text": max 40 characters; default `Read more`
  - `linkHref` (text) "Link address": max 300 characters. For example /omnichannel-cx

### Card Grid (Product Suite 2)

blockType: `productSuite2` · appearance: **full**

A general-purpose card grid: a heading, an intro line, and 2 to 4 cards in an even row. Not tied to any one product line — use it anywhere a short "here's what this does" grid is needed. For the product navigation grid specifically, use Product Suite instead. The cards use the same options as Bento Grid cards (number, eyebrow, points, colour, border, accent line), plus an optional icon.

- `eyebrow` (text) "Small label above the heading": max 60 characters. Optional. Short, e.g. "Reports and prescriptions".
- `heading` (text): max 140 characters
- `intro` (textarea) "Intro line": max 300 characters
- `cards` (list): 2 to 4 items
  - `cardColor` (select) "Card colour": one of: `grey` (Grey), `lavender` (Lavender), `white` (White with shadow); default `white`
  - `border` (select) "Border style": one of: `none` (None), `solid` (Solid), `gradient` (Gradient (violet to blue)); default `none`
  - `borderColor` (select) "Border colour": one of: `blue` (Blue), `violet` (Violet), `crimson` (Crimson), `navy` (Navy); default `blue`; only when `border` is `solid`
  - `accentLine` (checkbox) "Show accent line at bottom": default `false`. A thin rule under the content, matches the border color.
  - `icon` (icon name from the icon library)
  - `showNumber` (checkbox) "Show number": default `false`
  - `showEyebrow` (checkbox) "Show eyebrow": default `true`
  - `showPoints` (checkbox) "Show points": default `false`
  - `numberText` (text) "Number text": max 8 characters; only when `showNumber` is on. Leave empty to count automatically (01, 02, ...) across the cards that show a number. Fill in to show your own, e.g. "A" or "Step 1"; that card is then skipped in the count.
  - `tag` (text) "Eyebrow text": max 40 characters; only when `showEyebrow` is on. Small pill label above the title, e.g. "Tier 1 core".
  - `title` (text, **required**): max 90 characters
  - `description` (textarea): max 200 characters
  - `points` (list): up to 8 items; only when `showPoints` is on. Short lines shown under the text, as pills or as a bulleted list.
    - `text` (text, **required**): max 120 characters
  - `listStyle` (select) "Points shown as": one of: `pills` (Pills), `bullets` (Bullets); default `pills`; only when `showPoints` is on
  - `link` (group) "Link (optional)": Optional. Leave the address empty to show the card with no link.
    - `label` (text) "Link text": max 40 characters
    - `url` (text) "Link address": max 300 characters
    - `newTab` (checkbox) "Open in new tab": default `false`

### Custom Visual (HTML/CSS)

blockType: `customVisual` · appearance: **full**

A section drawn entirely by the editor's own HTML and CSS, under an optional eyebrow, heading and intro. The visual fields are the Hero (custom CSS) ones, as they are: the same checks on save (htmlProblems and cssProblems, HeroCustom/visualRules.ts), the same preview, description, shape and widest size, and the same sealed box on the website.

- `eyebrow` (text) "Small label above the heading (optional)": max 60 characters
- `heading` (text) "Heading (optional)": max 140 characters
- `intro` (textarea) "Intro (optional)": max 300 characters
- `visualHtml` (code) "HTML": The markup only, no <style> or <script>. Text in it is read by search engines.
- `visualCss` (code) "CSS": Styles for the HTML above. Use @media or @container visual (max-width: 480px) for small screens. Images and fonts must come from the media library.
- `visualAlt` (text) "Description for screen readers": max 200 characters. What the visual shows, in a sentence. Leave empty if it is only decoration.
- `aspect` (select, **required**) "Shape": one of: `auto` (As tall as its content), `16/9` (Wide (16:9)), `4/3` (Landscape (4:3)), `1/1` (Square (1:1)), `3/4` (Portrait (3:4)); default `auto`; only when `visualPosition` is not `background`
- `maxWidth` (number) "Widest it gets (px, optional)": min 120; max 1440; only when `visualPosition` is not `background`. Empty fills its column.

### Product in Action

blockType: `productInAction` · appearance: **full**

A section of large product cards: text on one side, a screenshot on the other. On large screens the cards stack as the reader scrolls (CSS only), and below that they are a plain vertical list.

- `eyebrow` (text): max 60 characters
- `heading` (text, **required**): max 140 characters
- `intro` (textarea): max 500 characters
- `layout` (select): one of: `stacked` (Stacked (cards pile up on scroll)), `plain` (Plain (normal vertical list)); default `stacked`. Stacked makes the cards pile up on scroll. Plain is a normal vertical list.
- `alternateSides` (checkbox) "Alternate sides": default `false`. Flips the image to the other side on every second card
- `theme` (select): one of: `light` (Light), `tinted` (Tinted); default `light`
- `anchorId` (text) "Anchor ID": max 60 characters. Optional. Lets a link such as #product-in-action jump to this block.
- `cards` (list, **required**): 2 to 5 items
  - `icon` (icon name from the icon library)
  - `title` (text, **required**): max 90 characters
  - `description` (textarea, **required**): max 300 characters. One or two sentences
  - `bullets` (list) "Benefit bullets": up to 4 items
    - `text` (text, **required**): max 120 characters
  - `image` (upload from `media`, **required**) "Screenshot": Use screenshots from the demo tenant only. No real patient names, phone numbers, call recordings or client branding. This page is public.
  - `imageAlt` (text, **required**) "Screenshot description (alt text)": max 200 characters. Describe what the screen shows. This is read by search engines and screen readers.
  - `imageCaption` (text) "Caption under the screenshot": max 160 characters
  - `link` (group) "Link (optional)": Optional. Leave the address empty to show the card with no link.
    - `label` (text) "Link text": max 40 characters
    - `url` (text) "Link address": max 300 characters
    - `newTab` (checkbox) "Open in new tab": default `false`

### Testimonial

blockType: `testimonial` · appearance: **full**

A customer quote, shown alone or as a carousel. A quote can link to its full case study. Photo and logo are optional; the initials are shown when there's no photo.

- `eyebrow` (text): max 60 characters
- `heading` (text): max 100 characters
- `layout` (select): one of: `single` (Single quote), `carousel` (Carousel (several quotes)); default `single`
- `quotes` (list, **required**): 1 to 6 items
  - `quote` (textarea, **required**): max 400 characters
  - `attributionName` (text, **required**) "Name": max 80 characters
  - `attributionRole` (text) "Role": max 100 characters
  - `organisation` (text, **required**): max 100 characters
  - `photo` (upload from `media`) "Photo (optional)": Leave empty to show initials.
  - `logo` (upload from `media`) "Organisation logo (optional)"
  - `linkedStory` (relationship to `customers`) "Linked customer (optional)"

### Customer grid

blockType: `caseStudyGrid` · appearance: **full**

A row of customer cards. Pulls the newest customers, filtered by sector, or a hand-picked selection. The block slug stays caseStudyGrid so existing page data is untouched. Uncleared names arrive already anonymised from the CMS (see collections/Customers).

- `eyebrow` (text): max 60 characters
- `heading` (text): max 100 characters
- `intro` (textarea): max 300 characters
- `populateBy` (select) "Show": one of: `collection` (Latest customers (optionally by sector)), `selection` (Hand-picked customers); default `collection`
- `sectors` (relationship to `sectors`, several allowed) "Sectors (optional)": only when `populateBy` is `collection`. Leave empty to show all sectors.
- `limit` (number) "How many": min 1; max 6; default `6`; only when `populateBy` is `collection`
- `selectedDocs` (relationship to `customers`, several allowed) "Customers": only when `populateBy` is `selection`
- `cardStyle` (select) "Card style": one of: `tilt` (Tilt (mouse-tracking)), `plain` (Plain); default `tilt`

### Customer Directory

blockType: `customerDirectory` · appearance: **full**

A directory of customers, one row per case study, filtered by sector on the page. Rows come from the case studies collection. Nothing is entered per row.

- `eyebrow` (text): max 60 characters
- `heading` (text): max 100 characters
- `intro` (textarea): max 300 characters
- `sectors` (relationship to `sectors`, several allowed) "Sectors to include (optional)": Leave empty to show every sector.
- `showFilters` (checkbox) "Show sector filters": default `true`
- `layout` (select): one of: `list` (List), `grid` (Grid); default `list`
- `emptyStateText` (text) "Text when nothing matches": max 120 characters; default `More stories coming soon.`

### Bento Grid

blockType: `bentoGrid` · appearance: **full**

A bento-style card grid on a 12 column grid. Editors control layout with grid spans (1/4, 1/3, 1/2, ...) rather than pixel sizes, so a card can be made tall or wide and smaller cards stack beside it. Card order in the array is the drag-to-reorder order; with "dense" packing on, the browser may still place a smaller card into an earlier gap, so the visual order can differ from the list order. What a card contains (number, eyebrow, points, image) and how it looks (colour, border, accent line) are separate choices, so any mix is possible.

- `gap` (select) "Gap between cards": one of: `small` (Small), `medium` (Medium), `large` (Large); default `medium`
- `rowHeight` (number) "Row height (px, desktop)": min 120; max 600; default `240`. The height of one grid row on desktop.
- `dense` (checkbox) "Fill empty gaps automatically": default `false`. Lets smaller cards move up into gaps. Visual order may differ from the list order.
- `framed` (checkbox) "Show outer frame": default `true`
- `eyebrow` (text): max 60 characters
- `title` (text): max 100 characters
- `description` (textarea): max 300 characters
- `cards` (list): 1 to 12 items
  - `colSpan` (select) "Column span": one of: `3` (1/4 width), `4` (1/3 width), `6` (1/2 width), `8` (2/3 width), `9` (3/4 width), `12` (Full width); default `4`
  - `rowSpan` (select) "Row span": one of: `1` (1 row), `2` (2 rows), `3` (3 rows); default `1`
  - `tabletColSpan` (select) "Column span (tablet)": one of: `auto` (Auto), `6` (Half), `12` (Full); default `auto`. Auto uses half width for cards up to 1/2, full width otherwise.
  - `cardColor` (select) "Card colour": one of: `grey` (Grey), `lavender` (Lavender), `white` (White with shadow), `red` (Red); default `grey`
  - `border` (select) "Border style": one of: `none` (None), `solid` (Solid), `gradient` (Gradient (violet to blue)); default `none`
  - `borderColor` (select) "Border colour": one of: `blue` (Blue), `violet` (Violet), `crimson` (Crimson), `navy` (Navy); default `blue`; only when `border` is `solid`
  - `accentLine` (checkbox) "Show accent line at bottom": default `false`. A thin rule under the content, matches the border color.
  - `icon` (icon name from the icon library)
  - `showNumber` (checkbox) "Show number": default `false`
  - `showEyebrow` (checkbox) "Show eyebrow": default `true`
  - `showPoints` (checkbox) "Show points": default `false`
  - `numberText` (text) "Number text": max 8 characters; only when `showNumber` is on. Leave empty to count automatically (01, 02, ...) across the cards that show a number. Fill in to show your own, e.g. "A" or "Step 1"; that card is then skipped in the count.
  - `tag` (text) "Eyebrow text": max 40 characters; only when `showEyebrow` is on. Small pill label above the title, e.g. "Tier 1 core".
  - `title` (text, **required**): max 90 characters
  - `titleSize` (select) "Title size": one of: `large` (Large), `regular` (Regular); default `regular`
  - `body` (textarea) "Body text": max 400 characters
  - `points` (list): up to 8 items; only when `showPoints` is on. Short lines shown under the text, as pills or as a bulleted list.
    - `text` (text, **required**): max 120 characters
  - `listStyle` (select) "Points shown as": one of: `pills` (Pills), `bullets` (Bullets); default `pills`; only when `showPoints` is on
  - `image` (upload from `media`)
  - `imagePosition` (select) "Image position": one of: `middle` (Between title and text), `top` (Top), `bottom` (Bottom), `background` (Background with text on top); default `middle`; only when `image` is on
  - `link` (group) "Link (optional)"
    - `label` (text) "Link text": max 40 characters
    - `url` (text) "Link address": max 300 characters
    - `newTab` (checkbox) "Open in new tab": default `false`

### Detailed Product Suite

blockType: `detailedProductSuite` · appearance: **full**

Large-format "solution spotlight" cards — bigger and richer than Bento Grid or Product Suite 2. Each card gets its own eyebrow, title, tagline, description, an oversized watermark icon, a capped set of highlighted points, and a CTA button. This format does not scale past 4 cards on a page, so the array is capped at 4 rows.

- `eyebrow` (text): max 60 characters
- `title` (text): max 100 characters
- `description` (textarea): max 300 characters
- `columns` (select) "Cards per row": one of: `2` (2 per row), `1` (1 per row); default `2`
- `cards` (list): 1 to 4 items. This format does not scale past 4 cards on a page.
  - `eyebrow` (text): max 40 characters. Short, e.g. "Ready to deploy".
  - `title` (text, **required**): max 90 characters
  - `tagline` (text): max 80 characters. The bold one-liner under the title, distinct from the description below.
  - `description` (textarea): max 300 characters
  - `watermarkIcon` (icon name from the icon library) "Watermark icon": The large icon that floats above the card, drawn from the shared icon library.
  - `accentColor` (select) "Accent color": one of: `crimson` (Crimson), `navy` (Navy); default `crimson`. Drives the card's gradient tint, icon colors, and CTA button color together.
  - `highlights` (list): up to 8 items. First 4 show as icon tiles in a grid. Anything beyond that renders as a plain list below the grid instead. Order matters: put your strongest points first.
    - `icon` (icon name from the icon library)
    - `label` (text, **required**): max 60 characters
  - `cta` (group) "CTA button"
    - `label` (text) "Button text": max 40 characters; default `Explore the workflow`
    - `url` (text) "Link address": max 300 characters
    - `newTab` (checkbox) "Open in new tab": default `false`

### Swarm Diagram

blockType: `swarmDiagram` · appearance: **full**

The bot swarm diagram: every live and pilot agent on a ring around the shared customer record (docs/motion/bot-swarm-motion-demo.html, the swarm section). The website reads the data (neuroncx-website src/components/swarmDiagram/); this block holds only the heading, the optional facts and the caption shown when motion is off.

- `eyebrow` (text): max 40 characters
- `heading` (text, **required**): max 70 characters
- `intro` (textarea): max 300 characters
- `facts` (list) "Facts (optional)": up to 3 items. Up to 3 figures above the diagram. Leave a value empty to count it from the live and pilot agents: the first from how many there are, the second from how many families they fall into, the third is always 1, for the one shared customer record.
  - `value` (text) "Value (optional)": max 12 characters
  - `label` (text, **required**): max 40 characters
- `caption` (textarea): max 140 characters. Shown under the diagram when motion is off, in place of the handover it would otherwise name.
- `motion` (select) "Animation": one of: `follow` (Follow the page), `on` (On), `reduced` (Reduced (a simple fade)), `off` (Off (no animation)); default `follow`. Reduced keeps a simple fade. Off shows the block with no animation.
- `autoplay` (checkbox) "Play on its own": default `true`. Plays once when it comes into view. Off shows the finished state.
- `loop` (checkbox): default `true`. Plays again while it stays on screen. Off plays it once.

### Integrations Marquee

blockType: `integrationsMarquee` · appearance: **full**

A compact trust strip: integration logos scrolling continuously in two opposite-direction rows, pausing on hover. For the top or bottom of a page, e.g. "Works with the tools you already pay for". The "Show" switch picks logos from the Integrations collection or the list typed into the block; see fields/integrationSource.ts. Either way it needs 4 to 40 logos: the website renders nothing with fewer than 4.

- `eyebrow` (text): max 60 characters
- `title` (text): max 100 characters
- `description` (textarea): max 300 characters
- `populateBy` (select) "Show": one of: `all` (All live integrations), `filter` (Filter by category or product), `selection` (Hand-picked), `manual` (Manual list, old style); default `manual`
- `categories` (relationship to `integrationCategories`, several allowed): shown only in some states
- `products` (relationship to `products`, several allowed): shown only in some states
- `featuredOnly` (checkbox) "Featured only": default `false`; shown only in some states
- `selectedDocs` (relationship to `integrations`, several allowed) "Integrations": shown only in some states
- `limit` (number) "How many": min 4; max 40; default `40`; shown only in some states
- `logos` (list): 4 to 40 items; shown only in some states. Order matters. Roughly the first half renders in the top row scrolling one direction, the rest in the bottom row scrolling the other direction.
  - `logo` (upload from `media`): If left empty, a plain colored monogram using the first letter of the name is shown instead, which is useful while real logos are still being collected.
  - `name` (text, **required**): max 40 characters

### Use Cases

blockType: `useCases` · appearance: **full**

- `label` (text) "Small label above the heading": max 40 characters
- `heading` (text): max 140 characters
- `intro` (textarea) "Intro line": max 300 characters
- `cases` (list) "Use cases": 1 to 8 items
  - `sector` (text): max 30 characters. For example Hospitals, Diagnostics, Universities.
  - `title` (text, **required**) "What the agent handles": max 80 characters. Name the job, e.g. "Appointment booking and rescheduling".
  - `description` (textarea): max 160 characters
  - `outcome` (text): max 80 characters. A result, ideally measured. Leave empty rather than inventing one.

### Benefits

blockType: `benefits` · appearance: **full**

- `label` (text) "Small label above the heading": max 40 characters
- `heading` (text): max 140 characters
- `items` (list) "Benefits": 2 to 6 items. Say what changes for the customer, not what the software contains.
  - `title` (text, **required**) "Benefit": max 60 characters
  - `description` (textarea): max 140 characters

### Integrations

blockType: `integrations` · appearance: **full**

A grid of integrations. The "Show" switch picks entries from the Integrations collection or falls back to the old list typed into the block itself; see fields/integrationSource.ts. The fields sit in three tabs. The tabs have no name, so they only arrange the edit screen: every field is stored at the top of the block, as before.

- `label` (text) "Small label above the heading": max 40 characters
- `heading` (text): max 140 characters
- `intro` (textarea) "Intro line": max 300 characters
- `footnote` (text): max 160 characters. For example: anything else connects over the NeuronCx REST API and webhooks.
- `populateBy` (select) "Show": one of: `all` (All live integrations), `filter` (Filter by category or product), `selection` (Hand-picked), `manual` (Manual list, old style); default `manual`
- `categories` (relationship to `integrationCategories`, several allowed): shown only in some states
- `products` (relationship to `products`, several allowed): shown only in some states
- `featuredOnly` (checkbox) "Featured only": default `false`; shown only in some states
- `selectedDocs` (relationship to `integrations`, several allowed) "Integrations": shown only in some states
- `limit` (number) "How many": min 1; max 24; default `24`; shown only in some states
- `items` (list) "Manual list (being retired)": 1 to 24 items; shown only in some states
  - `name` (text, **required**): max 60 characters
  - `summary` (text) "One line": max 120 characters. What flows between the two systems, in plain words.
  - `logo` (upload from `media`) "Logo (optional)": Transparent PNG or SVG. Leave empty to show the name only.
- `cardDesign` (group) "Card design"
  - `design` (select, **required**): one of: `grid` (Grid), `logoCard` (Logo card), `directory` (Directory with filters), `feature` (Feature card), `story` (Story card), `pill` (Pill); default `grid`
  - `allowItemDesigns` (checkbox) "Let integrations and categories use their own design": default `true`; shown only in some states. When off, every card uses the design above.
  - `columns` (select) "Cards per row": one of: `2`, `3`, `4`; shown only in some states. Leave empty to fit as many as the width allows. If integrations use different designs and this is empty, every group shows 3 per row.
  - `lastRow` (select) "Last row": one of: `stretch` (Stretch to fill), `center` (Centre), `leave` (Leave as is); default `leave`; shown only in some states
  - `groupByCategory` (checkbox) "Group by category": default `false`. Show a heading for each category.
  - `linkLabel` (text) "Link text": max 30 characters; shown only in some states. Used only for integrations that have their own page.
  - `showKeyPoints` (checkbox) "Show key points": default `false`; shown only in some states. Lists the entry's key points under the description, up to 3.
  - `look` (group): shown only in some states
    - `cardColor` (select) "Card colour": one of: `grey` (Grey), `lavender` (Lavender), `white` (White with shadow); default `white`
    - `border` (select) "Border style": one of: `none` (None), `solid` (Solid), `gradient` (Gradient (violet to blue)); default `none`
    - `borderColor` (select) "Border colour": one of: `blue` (Blue), `violet` (Violet), `crimson` (Crimson), `navy` (Navy); default `blue`; only when `border` is `solid`
    - `accentLine` (checkbox) "Show accent line at bottom": default `false`. A thin rule under the content, matches the border color.

### Contact Form

blockType: `contactForm` · appearance: **full**

- `label` (text) "Small label above the heading": max 40 characters
- `heading` (text): max 140 characters
- `intro` (textarea) "Intro line": max 300 characters
- `buttonLabel` (text) "Button text": max 40 characters; default `Submit enquiry`
- `successMessage` (textarea) "Message shown after submitting": max 200 characters; default `Thanks, we've got your enquiry and will be in touch shortly.`
- `showMessageField` (checkbox) "Include a free-text message field": default `true`

### How it works

blockType: `howItWorks` · appearance: **full**

- `label` (text): max 40 characters; default `How it works`. Small line above the heading.
- `heading` (text, **required**): max 140 characters. The section heading.
- `intro` (textarea): max 260 characters
- `steps` (list): 2 to 5 items. Numbered automatically. Three steps is the readable maximum for most visitors.
  - `title` (text, **required**): max 60 characters
  - `description` (textarea, **required**): max 260 characters
- `ctaLabel` (text): max 40 characters. Leave empty to hide the button.
- `ctaLink` (text): max 300 characters; default `/contact`

### How it works 2

blockType: `howItWorks2` · appearance: **full**

How it works 2: numbered circles on a line, one column per step. The original How it works block (blocks/HowItWorks) stays as it is. This one never shows a button.

- `eyebrow` (text) "Eyebrow (optional)": max 40 characters. Small line above the heading.
- `heading` (text, **required**): max 70 characters. The section heading.
- `intro` (textarea) "Intro (optional)": max 200 characters
- `steps` (list): 2 to 5 items. 2 to 5 steps, in order. The numbers 01, 02 and so on come from the order, so leave them out of the titles.
  - `title` (text, **required**): max 30 characters
  - `description` (textarea, **required**): max 140 characters
- `motion` (select) "Animation": one of: `follow` (Follow the page), `on` (On), `reduced` (Reduced (a simple fade)), `off` (Off (no animation)); default `follow`. Reduced keeps a simple fade. Off shows the block with no animation.
- `autoplay` (checkbox) "Play on its own": default `true`. Plays once when it comes into view. Off shows the finished state.
- `speed` (select): one of: `slower` (Slower), `normal` (Normal), `faster` (Faster); default `normal`

### Comparison table

blockType: `comparisonTable` · appearance: **full**

Comparison table: NeuronCx beside other types of system, on one page. A real table: column labels across the top (one column can be highlighted, usually NeuronCx), a row label down the side, and plain-word cells. On phones the table scrolls sideways with the row labels pinned on the left.

- `eyebrow` (text): max 60 characters. Optional. The small line above the heading.
- `heading` (text, **required**): max 140 characters
- `intro` (textarea): max 300 characters. Optional. One or two sentences under the heading.
- `columns` (list, **required**): 2 to 4 items. The systems being compared, left to right. Highlight one column at most, usually NeuronCx.
  - `label` (text, **required**) "Column label": max 40 characters
  - `highlight` (checkbox) "Highlight this column": default `false`
- `rows` (list, **required**): 2 to 10 items. Describe what each system typically covers, in plain words. No ticks or crosses, and no claims about a named product.
  - `label` (text, **required**) "Row label": max 60 characters
  - `cells` (list): up to 4 items. One cell per column, in the same order as the columns.
    - `text` (text) "Cell": max 140 characters
- `footnote` (text): max 160 characters. Optional. A short note under the table.

### Audience tabs

blockType: `audienceTabs` · appearance: **full**

Audience tabs: one section that gives each reader group (leadership, operations, IT) its own short summary and links. A row of tabs; each tab opens a panel with a title, an intro, links and capability points. Every panel is in the page's HTML, so search engines read all of them.

- `eyebrow` (text): max 60 characters. Optional. The small line above the heading.
- `heading` (text, **required**): max 140 characters
- `intro` (textarea): max 300 characters. Optional. One or two sentences under the heading.
- `tabs` (list, **required**): 2 to 4 items. One tab per reader group, left to right. The first tab is shown when the page opens.
  - `label` (text, **required**) "Tab name": max 30 characters. The reader group, for example Leadership, Operations or IT.
  - `title` (text): max 70 characters. Optional. The heading inside the panel.
  - `intro` (textarea): max 240 characters. Optional. A short summary for this group.
  - `points` (list, **required**): 2 to 5 items. One capability per line, stated as what the platform does. No stories or invented figures.
    - `text` (text, **required**) "Point": max 160 characters
  - `links` (list): up to 3 items. Optional. Shown under the intro.
    - `label` (text, **required**) "Link text": max 40 characters
    - `url` (text, **required**) "Link address (/page, #section or https://)": max 300 characters

### Record anatomy

blockType: `recordAnatomy` · appearance: **full**

Record anatomy: shows technical readers what a record holds and which system fills each field. A grid of entities (Fees, Admissions, Contacts) on the left; picking one shows its fields and their sources in a table on the right, under a path such as "Student record › Fees".

- `eyebrow` (text): max 60 characters. Optional. The small line above the heading.
- `heading` (text, **required**): max 140 characters
- `intro` (textarea): max 300 characters. Optional. One or two sentences under the heading.
- `recordLabel` (text) "Record name": max 40 characters; default `Customer record`. Shown before the entity name in the panel, such as "Student record › Fees".
- `fieldColumnLabel` (text) "Field column heading": max 30 characters; default `Field`
- `sourceColumnLabel` (text) "Source column heading": max 30 characters; default `Filled by`
- `entities` (list, **required**): 2 to 10 items. The parts of the record, such as Contacts, Admissions or Fees. The first one is shown when the page opens.
  - `label` (text, **required**) "Entity name": max 40 characters
  - `icon` (icon name from the icon library): Optional. Shown beside the entity name.
  - `description` (text): max 200 characters. Optional. One line on what this part of the record is for.
  - `fields` (list, **required**): 1 to 8 items
    - `name` (text, **required**) "Field name": max 60 characters
    - `source` (text, **required**) "Filled by": max 80 characters. The system or step that fills the field, such as Lead management system, ERP or Qualification form. Only sources that are live.

### Cluster links

blockType: `clusterLinks` · appearance: **full**

Cluster links: on a pillar page, a card for every published page under it (its cluster pages), grouped by stage and in stage order. Extra pages that belong to the cluster but keep their own address can be added, each with its own stage. The block is not drawn when there is nothing to list.

- `eyebrow` (text): max 60 characters. Optional. The small line above the heading.
- `heading` (text): max 140 characters
- `intro` (textarea): max 300 characters. Optional. One or two sentences under the heading.
- `extraPages` (list) "Extra pages": Optional. Pages that belong to this cluster but keep their own address. The pages under this page are listed without being added here.
  - `page` (relationship to `pages`, **required**)
  - `stage` (text): max 30 characters. Such as Qualification.
  - `stageOrder` (number) "Stage order": min 0
- `cardDesign` (group) "Card design"
  - `design` (select, **required**): one of: `grid` (Grid), `logoCard` (Logo card), `directory` (Directory with filters), `feature` (Feature card), `story` (Story card), `pill` (Pill); default `feature`
  - `columns` (select) "Cards per row": one of: `2`, `3`, `4`; shown only in some states. Leave empty to fit as many as the width allows.
  - `lastRow` (select) "Last row": one of: `stretch` (Stretch to fill), `center` (Centre), `leave` (Leave as is); default `leave`; shown only in some states
  - `groupByCategory` (checkbox) "Group by category": default `false`. Show a heading for each category.
  - `linkLabel` (text) "Link text": max 30 characters; shown only in some states. Used only for integrations that have their own page.
  - `showKeyPoints` (checkbox) "Show key points": default `false`; shown only in some states. Lists the entry's key points under the description, up to 3.
  - `look` (group): shown only in some states
    - `cardColor` (select) "Card colour": one of: `grey` (Grey), `lavender` (Lavender), `white` (White with shadow); default `white`
    - `border` (select) "Border style": one of: `none` (None), `solid` (Solid), `gradient` (Gradient (violet to blue)); default `none`
    - `borderColor` (select) "Border colour": one of: `blue` (Blue), `violet` (Violet), `crimson` (Crimson), `navy` (Navy); default `blue`; only when `border` is `solid`
    - `accentLine` (checkbox) "Show accent line at bottom": default `false`. A thin rule under the content, matches the border color.

### Closing call to action

blockType: `closingCta` · appearance: **full**

- `heading` (text, **required**): max 140 characters. The last thing a visitor reads. Make it a clear ask.
- `subhead` (textarea): max 300 characters
- `primaryLabel` (text) "Primary button text": max 40 characters
- `primaryLink` (text) "Primary button address": max 300 characters; default `/contact`
- `secondaryLabel` (text) "Secondary button text": max 40 characters
- `secondaryLink` (text) "Secondary button address": max 300 characters
- `tagline` (text) "Tagline under the buttons": max 80 characters. Optional, shown in italics. Keep it to a line, not a sentence.
- `motion` (select) "Animation": one of: `follow` (Follow the page), `on` (On), `reduced` (Reduced (a simple fade)), `off` (Off (no animation)); default `follow`. Reduced keeps a simple fade. Off shows the block with no animation.

### Feature Thread

blockType: `featureThread` · appearance: **full**

- `heading` (text): max 140 characters. Optional. Leave empty to show the features with no heading.
- `categories` (select, several allowed) "Categories to show": one of: `omnichannel-cx` (Omnichannel CX), `knowledge-base` (Knowledge base), `user-intelligence` (User intelligence), `integrations` (Integrations). Leave empty to show all four. Pick one when this sits on a product page.
- `limitPerCategory` (number) "How many per category": min 1; max 8; default `1`. Only published features are shown, in the order set on each feature. One per category suits the home page; three or four suits a product page.
- `hideCategoryLinks` (checkbox) "Hide the "More on ..." links": default `false`. Tick this when the block is on the category page it would link to. Otherwise every entry links back to the page the visitor is already reading.

### Article grid

blockType: `articleGrid` · appearance: **full**

- `heading` (text): max 140 characters; default `From the team`. Heading above the articles.
- `intro` (textarea): max 200 characters. Optional line under the heading.
- `limit` (number): default `3`. How many articles to show. The most recently published appear first.

### Call to Action

blockType: `cta` · appearance: **full**

- `richText` (rich text)
- `links` (list): up to 2 items
  - `link` (link, **required**)
    - `type`: `reference` (an internal page or post, set in `reference`) or `custom` (a URL or site path in `url`); `label` (required): the visible text; `newTab`: open in a new tab; `appearance`: `default` or `outline`

### content

blockType: `content` · appearance: **full**

- `documentStyle` (select) "Layout (Legal document adds the page title, a contents list and the date)": one of: `standard` (Standard), `legal` (Legal document); default `standard`. Legal document is for long pages such as the terms or privacy policy. The contents list is built from the section headings, so it never needs editing. The page title is shown as the heading when the page has no hero.
- `lastUpdated` (date) "Last updated (shown under the title)": only when `documentStyle` is `legal`. Change this only when the wording changes, not for every save.
- `columns` (list)
  - `size` (select): one of: `oneThird` (One Third), `half` (Half), `twoThirds` (Two Thirds), `full` (Full); default `oneThird`
  - `richText` (rich text)
  - `enableLink` (checkbox)
  - `link` (link, **required**)
    - `type`: `reference` (an internal page or post, set in `reference`) or `custom` (a URL or site path in `url`); `label` (required): the visible text; `newTab`: open in a new tab; `appearance`: `default` or `outline`

### mediaBlock

blockType: `mediaBlock` · appearance: **full**

- `media` (upload from `media`, **required**)

### Archive

blockType: `archive` · appearance: **full**

- `introContent` (rich text) "Intro Content"
- `populateBy` (select): one of: `collection` (Collection), `selection` (Individual Selection); default `collection`
- `relationTo` (select) "Collections To Show": one of: `posts` (Posts); default `posts`; only when `populateBy` is `collection`
- `categories` (relationship to `categories`, several allowed) "Categories To Show": only when `populateBy` is `collection`
- `limit` (number): default `10`; only when `populateBy` is `collection`
- `selectedDocs` (relationship to `posts`, several allowed) "Selection": only when `populateBy` is `selection`

### Platform Layers (Sticky Stage)

blockType: `platformLayers` · appearance: **minimal**

- `eyebrow` (text) "Small label": max 60 characters. e.g. The platform
- `heading` (text, **required**): max 140 characters
- `intro` (text) "Intro line": max 200 characters. e.g. Scroll to move through the stack. Each layer builds on the one before it.
- `layers` (list): 2 to 6 items. Each one takes a screen as the visitor scrolls, so keep the list short.
  - `title` (text, **required**): max 60 characters
  - `description` (textarea, **required**): max 200 characters
  - `tag` (text) "Tag pill": max 40 characters. Optional, e.g. Core or Adjacent.
  - `icon` (icon name from the icon library): default `message`

### Trust Panel

blockType: `trustPanel` · appearance: **minimal**

- `eyebrow` (text) "Small label": max 60 characters. e.g. Deployment & trust
- `heading` (text, **required**): max 140 characters
- `intro` (textarea) "Intro paragraph": max 300 characters
- `buttonLabel` (text) "Button text": max 40 characters
- `buttonHref` (text) "Button address": max 300 characters; default `/contact`
- `cards` (list): 2 to 6 items. Claims here are read closely during procurement, so only state what you can evidence.
  - `title` (text, **required**): max 60 characters
  - `description` (textarea, **required**): max 200 characters
  - `icon` (icon name from the icon library): default `shield`

### Stat Band

blockType: `statBand` · appearance: **minimal**

- `stats` (list) "Figures": 2 to 4 items. Use figures you could defend if a prospect asked how you measured them. Three or four works best.
  - `value` (text, **required**): max 20 characters. e.g. 4 industries, 1,300+
  - `label` (text, **required**): max 40 characters. What the number means.
- `note` (text) "Footnote": max 160 characters. Optional. Use it to say how the figures are measured or over what period, not to disclaim them.

### Expanding Card CTA

blockType: `expandingCardCta` · appearance: **minimal**

Closing call to action as a navy card that starts small on the light page and opens out to full bleed, revealing a centred heading (one or two lines), a description and one button. Navy by design: it counts as the page's one Highlight (navy) block (collections/Pages/hooks/validateHighlight.ts, fields/layout.ts navyProblem).

- `headingLine1` (text, **required**) "Heading (first line)": max 48 characters. First line of the heading. It is revealed on its own line, so break the sentence where it reads well.
- `headingLine2` (text) "Heading (second line)": max 48 characters. Second line. Leave empty for a one line heading.
- `description` (textarea): max 260 characters. Optional. One short paragraph under the heading. Leave empty to go straight from the heading to the button.
- `ctaLabel` (text, **required**) "Button text": max 28 characters. The words on the button, such as Book a demo.
- `ctaUrl` (text, **required**) "Button address": max 300 characters. A page on this site such as /contact, a section on this page such as #pricing, or an address starting https://.
- `startShape` (select, **required**) "Start shape": one of: `square` (Square), `portrait` (Tall square), `wide` (Wide card); default `square`. The shape of the closed card before it opens out. Ignored when motion is off.
- `motion` (select) "Animation": one of: `follow` (Follow the page), `on` (On), `reduced` (Reduced (a simple fade)), `off` (Off (no animation)); default `follow`. Reduced keeps a simple fade. Off shows the block with no animation.

### WhatsApp widget

blockType: `whatsappWidget` · appearance: **minimal**

A floating "Chat with us" button fixed to the bottom-right corner that opens WhatsApp. It appears once the visitor scrolls, and hides while the closing call to action is on screen. Not a section: it takes no space in the page.

- `enabled` (checkbox) "Show the widget on this page": default `false`
- `phone` (text) "WhatsApp number": max 20 characters; only when `enabled` is on. In E.164 form, e.g. +919876543210. Used to build the chat link; the number itself is not shown on the page.
- `label` (text) "Button text": max 40 characters; default `Chat with us`; only when `enabled` is on
- `prefill` (text) "Prefilled message": max 160 characters; default `Hi NeuronCx, I would like to know more.`; only when `enabled` is on. What the visitor sends. The page reference is appended to it.
- `includeRef` (checkbox) "Add the page reference to the message": default `true`; only when `enabled` is on. Appends [ref: page-slug] so the enquiry arrives already routed.
- `hoursNote` (text) "Hours note (optional)": max 60 characters; only when `enabled` is on. For example "Mon–Sat, 9am–7pm IST". Not shown yet; reserved for a panel.

### FAQ

blockType: `faq` · appearance: **own**

A reusable FAQ list: a heading, an optional intro line, and a set of question/answer pairs rendered as native <details>/<summary>. With no script, or motion off, opening one is still instant, driven by the [open] attribute alone; at level on, a click is caught and played as an animation instead. Answers are intentionally restricted to short, simply formatted text, as the admin description on the array below explains. Self-contained, not wrapped with withPresentation/withMinimalPresentation: its own `background` (white/cloud) and `anchorId` fields cover the same ground as those wrappers' `background` and `htmlId`, and having both would mean two fields writing the same concept. See Pages/index.ts where this block is registered unwrapped.

- `heading` (text, **required**): max 140 characters; default `Frequently asked questions`
- `intro` (textarea): max 300 characters. Optional. One short paragraph above the list.
- `items` (list, **required**) "Questions": 2 to 12 items. Keep answers short, roughly 40 to 60 words each. If one needs to run long, it should be the exception, not the pattern.
  - `question` (text, **required**): max 140 characters
  - `answer` (rich text, **required**)
  - `defaultOpen` (checkbox) "Open by default": default `false`
- `background` (select): one of: `white` (White), `cloud` (Pale grey); default `cloud`
- `anchorId` (text) "Anchor ID": max 60 characters. Optional id for deep linking, e.g. faq
- `emitSchema` (checkbox) "Output FAQPage structured data": default `true`
- `motion` (select) "Animation": one of: `follow` (Follow the page), `on` (On), `reduced` (Reduced (a simple fade)), `off` (Off (no animation)); default `follow`. Reduced keeps a simple fade. Off shows the block with no animation.

### Platform Layers 2 (Scroll Stack)

blockType: `platformLayersTwo` · appearance: **own**

A two-column section: a sticky left column (eyebrow, heading, intro and an optional numbered indicator list) beside a vertical stack of numbered cards. The card nearest the middle of the viewport becomes active as the reader scrolls. The active state is decoration only; no content is hidden by it.

- `eyebrow` (text): max 60 characters. Short uppercase label above the heading. Optional.
- `heading` (text, **required**): max 140 characters
- `intro` (textarea): max 500 characters
- `theme` (select): one of: `light` (Light), `navy` (Navy); default `light`. Navy inverts the heading and body text. Cards stay light.
- `showIndicators` (checkbox) "Show indicators": default `true`. Shows the numbered list in the sticky left column on large screens
- `anchorId` (text) "Anchor ID": max 60 characters. Optional. Lets a link such as #platform-stack jump to this block.
- `layers` (list, **required**): 3 to 6 items. Numbered in the order listed. Three to six layers.
  - `title` (text, **required**): max 90 characters
  - `tag` (text) "Tag pill": max 40 characters. Short pill label such as "Unified Ingestion". Optional.
  - `description` (textarea, **required**): max 300 characters. One or two sentences, roughly 20 to 35 words
  - `footnote` (text): max 120 characters. Small line with a tick icon under the description. Optional.
  - `link` (group): Optional link shown in the card foot.
    - `label` (text) "Link text": max 60 characters
    - `type` (radio) "Link type": one of: `internal` (Internal page), `external` (External URL); default `internal`
    - `page` (relationship to `pages`): only when `type` is `internal`
    - `url` (text): max 300 characters; only when `type` is `external`

### Stack Comparison

blockType: `stackComparison` · appearance: **full**

Legacy stack vs NeuronCx: a row of cards (one of them, usually NeuronCx, highlighted in navy), then an optional full comparison table that opens and closes under them. Highlight (navy) is already spent by the highlighted card, so this block does not offer it as a background — see withPresentationExceptNavy.

- `eyebrow` (text): max 40 characters
- `heading` (text, **required**): max 90 characters
- `intro` (textarea): max 300 characters
- `cards` (list): 2 to 4 items. One card per system being compared. Highlight one at most — usually NeuronCx.
  - `title` (text, **required**): max 40 characters
  - `tagline` (text): max 110 characters
  - `audienceLabel` (text) "Audience pill": max 40 characters. Shown as a pill on the card, e.g. "Used by: sales team".
  - `highlighted` (checkbox) "This is the NeuronCx card": default `false`. Shows the card in navy with white text. At most one card can be highlighted.
  - `badge` (text): max 20 characters; only when `highlighted` is on. Small label on the card corner, e.g. "Recommended".
  - `cta` (group) "Button": only when `highlighted` is on
    - `label` (text) "Button text": max 30 characters
    - `url` (text) "Button address": max 300 characters
  - `groups` (list) "Capability groups": 1 to 2 items. The card's own capability list, split into up to two groups (for example "Includes" and "Does not include").
    - `heading` (text) "Group heading": max 50 characters
    - `tone` (select): one of: `included` (Included (tick)), `missing` (Missing (cross)), `plus` (Plus (sparkle)); default `included`. The icon shown beside every item in this group.
    - `items` (list): 1 to 10 items
      - `text` (text, **required**) "Item": max 120 characters
- `table` (group) "Full comparison table": An optional table under the cards that opens and closes. Leave it off to show just the cards.
  - `enabled` (checkbox) "Show the table": default `true`
  - `startOpen` (checkbox) "Open by default": default `false`; only when `enabled` is on
  - `openLabel` (text) "Text when closed": max 40 characters; default `Compare all capabilities`
  - `closeLabel` (text) "Text when open": max 40 characters; default `Hide full comparison`
  - `cellStyle` (select) "Cell style": one of: `tint` (Tint (coloured background)), `dot` (Dot (small coloured dot)), `compact` (Compact (text only)); default `tint`; only when `enabled` is on
  - `showLegend` (checkbox) "Show the rating legend": default `true`; only when `enabled` is on
  - `columns` (list): 2 to 5 items; only when `enabled` is on. The systems across the top of the table, left to right. Highlight one at most, usually NeuronCx.
    - `label` (text, **required**) "Column label": max 30 characters
    - `highlighted` (checkbox) "Highlight": default `false`
    - `defaultRating` (select) "Default rating for this column": one of: `strong` (Strong), `partial` (Partial), `missing` (Missing), `roadmap` (Roadmap), `none` (None (no colour)); default `none`. Used by any cell in this column left on Inherit, below.
  - `rows` (list): up to 15 items; only when `enabled` is on. One row per capability. Give each row exactly one cell per column above, in the same order.
    - `capability` (text, **required**): max 50 characters
    - `cells` (list): up to 5 items. One cell per column, in the same order as the columns above.
      - `text` (text) "Cell text": max 80 characters
      - `rating` (select): one of: `inherit` (Inherit (use the column default)), `strong` (Strong), `partial` (Partial), `missing` (Missing), `roadmap` (Roadmap), `none` (None (no colour)); default `inherit`. Rating sets the cell colour. Inherit uses the column's default.
  - `footnote` (text): max 200 characters; only when `enabled` is on

## Site-wide settings (globals)

Not blocks: these are edited once and apply to every page.

### header

slug: `header`

- `logo` (upload from `media`): Shown in the header. Leave empty to use the default NeuronCx logo.
- `announcement` (group) "Announcement bar": A thin strip above the header. A visitor who dismisses it will not see it again until they open a new browser session.
  - `enabled` (checkbox) "Show the announcement bar": default `false`
  - `text` (text) "Message": only when `enabled` is on
  - `ctaLabel` (text) "Link text (optional)": only when `enabled` is on
  - `ctaHref` (text) "Link address (optional)": only when `enabled` is on
- `navItems` (list) "Menu": up to 7 items. Each item is either a plain link or a mega menu. Only add links to pages that exist. A menu full of dead links is worse than a short menu.
  - `label` (text, **required**) "Menu label": max 30 characters
  - `type` (select, **required**) "What this item does": one of: `link` (Link (goes straight to a page)), `megaMenu` (Mega menu (opens a panel of links)); default `link`
  - `link` (link, **required**)
    - `type`: `reference` (an internal page or post, set in `reference`) or `custom` (a URL or site path in `url`); `label`: the visible text; `newTab`: open in a new tab
  - `groups` (list): only when `type` is `megaMenu`. The menu panel sizes itself. A single group hides its label. A group on Auto rows wraps into 2 columns once it has 4 or more items; set 3 or 4 rows to fill each column to that many before starting the next. The featured card only shows when the menu has 5 or more items in total.
    - `label` (text) "Group label (optional)": max 24 characters. Such as Modules or Agents. Hidden when the menu has a single group.
    - `rows` (select) "Rows per column": one of: `auto` (Auto), `3` (3 rows), `4` (4 rows); default `auto`. Auto: 4 or more items wrap into 2 columns. 3 or 4 rows: items fill each column to that many, then start the next.
    - `items` (list): at least 1 items
      - `icon` (select): one of: `message` (Message (conversational, enquiry)), `chat` (Chat (follow-up, replies)), `bolt` (Bolt (workflows, automation)), `layers` (Layers (context, knowledge)), `gauge` (Gauge (quality, analytics)), `plug` (Plug (integrations)), `shield` (Shield (private cloud, isolation)), `shieldCheck` (Shield check (governance, oversight)), `lock` (Lock (data ownership)), `globe` (Globe (standards, interoperability)), `users` (Users (team, patients, customers)), `headphones` (Headphones (support, agent handover)), `stethoscope` (Stethoscope (doctor, consultation)), `hospital` (Hospital (hospitals, facilities)), `graduationCap` (Graduation cap (education, admissions)), `building` (Building (organisation, campus)), `database` (Database (records, data store)), `workflow` (Workflow (process, orchestration)), `bot` (Bot (AI agent)), `sparkles` (Sparkles (AI, generated)), `search` (Search (retrieval, lookup)), `chart` (Chart (reporting, dashboards)), `target` (Target (goals, targeting)), `rocket` (Rocket (go-live, launch)), `fileText` (File text (documents, notes)), `clipboardList` (Clipboard list (tasks, checklist)), `link` (Link (connection)), `settings` (Settings (configuration)), `puzzle` (Puzzle (modules, extensions)), `briefcase` (Briefcase (business, enterprise))
      - `label` (text, **required**): max 30 characters
      - `description` (text) "Description (optional)": max 50 characters. One short line naming what this does
      - `link` (link, **required**)
        - `type`: `reference` (an internal page or post, set in `reference`) or `custom` (a URL or site path in `url`); `label`: the visible text; `newTab`: open in a new tab
      - `badge` (select): one of: `none` (None), `new` (New), `beta` (Beta); default `none`
  - `featured` (group) "Featured card": only when `type` is `megaMenu`. A card in the last column of the panel. It only shows when the menu has 5 or more items in total.
    - `enabled` (checkbox) "Show the featured card": default `false`
    - `eyebrow` (text): max 20 characters; only when `enabled` is on
    - `title` (text): max 50 characters; only when `enabled` is on
    - `image` (upload from `media`) "Image (optional)": only when `enabled` is on
    - `link` (link, **required**)
      - `type`: `reference` (an internal page or post, set in `reference`) or `custom` (a URL or site path in `url`); `label`: the visible text; `newTab`: open in a new tab
    - `linkLabel` (text) "Link text": max 24 characters; only when `enabled` is on
- `supportLabel` (text) "Support link text": default `Support`. Sits to the left of the sign in link. Leave either field empty to hide it.
- `supportHref` (text) "Support address": For example /contact, or a help centre address.
- `signInLabel` (text) "Sign in link text": default `Sign in`
- `signInHref` (text) "Sign in address": default `https://dash.neuroncx.in`
- `ctaLabel` (text) "Button text": default `Book a demo`
- `ctaHref` (text) "Button address": default `/contact`

### footer

slug: `footer`

- `tagline` (textarea): max 300 characters. One or two sentences under the logo describing what NeuronCx does.
- `columns` (list): up to 3 items. Groups of links on the right side of the footer, e.g. Platform and Company.
  - `title` (text, **required**): Heading for this group of links.
  - `navItems` (list): up to 8 items
    - `link` (link, **required**)
      - `type`: `reference` (an internal page or post, set in `reference`) or `custom` (a URL or site path in `url`); `label` (required): the visible text; `newTab`: open in a new tab
- `contactHeading` (text): max 30 characters; default `Contact`. Heading above the contact details. Left empty, it reads Contact.
- `linkContactHeading` (checkbox) "Link the contact heading": default `false`. Turns the heading itself into a link, usually to the Contact page. Off, it is plain text.
- `contactLink` (link, **required**) "Contact heading goes to"
  - `type`: `reference` (an internal page or post, set in `reference`) or `custom` (a URL or site path in `url`); `label`: the visible text; `newTab`: open in a new tab
- `email` (text): Contact email shown in the footer.
- `phone` (text): Contact phone number shown in the footer.
- `legalItems` (list): up to 4 items. Small links on the bottom line, e.g. Terms and Privacy.
  - `link` (link, **required**)
    - `type`: `reference` (an internal page or post, set in `reference`) or `custom` (a URL or site path in `url`); `label` (required): the visible text; `newTab`: open in a new tab

### Site Settings

slug: `siteSettings`

- `animations` (select, **required**): one of: `on` (On), `reduced` (Reduced (a simple fade)), `off` (Off (no animation)); default `on`. Turns animations on, down or off across the whole site. Reduced keeps a simple fade. Off shows every block with no animation.
- `whatsappButton` (group) "WhatsApp button": One button on every page. While it is on, any WhatsApp widget block placed on a page shows nothing.
  - `enabled` (checkbox) "Show the button": default `false`
  - `phone` (text) "WhatsApp number (E.164)": only when `enabled` is on. For example +919876543210. Used to build the chat link; the number itself is not shown on the page.
  - `message` (textarea) "Prefilled message": only when `enabled` is on. What the visitor sends. The page reference is appended to it.
  - `label` (text) "Button text (up to 20 characters)": max 20 characters; default `Chat`; only when `enabled` is on
  - `hideOnPages` (relationship to `pages`, several allowed) "Hide on these pages (optional)": only when `enabled` is on. CMS pages only. Pages from other collections always show the button.
- `faviconSvg` (upload from `media`) "Favicon (SVG)": Main tab icon for modern browsers. Use a simple SVG with a square viewBox.
- `faviconIco` (upload from `media`) "Favicon (ICO)": For older browsers and Windows shortcuts. 32×32 or 48×48.
- `favicon32` (upload from `media`) "Favicon (PNG 32×32)": PNG alternative for browsers that support it.
- `appleTouchIcon` (upload from `media`) "Apple touch icon (PNG 180×180)": Used when someone adds the site to an iPhone or iPad home screen.
- `androidIcon` (upload from `media`) "Android icon (PNG 192×192)": Used by the web app manifest on Android home screens.
- `largeIcon` (upload from `media`) "Large icon (PNG 512×512)": High-resolution icon for the web app manifest and splash screens.
- `maskableIcon` (upload from `media`) "Maskable icon (PNG 512×512)": Keep the logo inside the centre 80%. Android crops this icon to different shapes, so the edges can be cut off.
- `themeColor` (text) "Theme colour": max 9 characters. Hex colour, e.g. #1A2035. Sets the browser toolbar colour on phones.
- `siteName` (text) "Site name": max 60 characters. For example NeuronCx. Used in the web app manifest.
- `defaultTitle` (text) "Default page title": max 70 characters. Used when a page has no SEO title of its own. Replaces the "Blog" title.
- `titleSuffix` (text) "Title suffix": max 40 characters. Added to the end of every page title, e.g. " | NeuronCx".
- `defaultDescription` (textarea) "Default description": max 160 characters. Used when a page has no meta description of its own. Keep it under 160 characters.
- `defaultShareImage` (upload from `media`) "Default share image": Shown when a link is shared on LinkedIn, WhatsApp and similar. 1200×630 works best.
- `twitterCardType` (select) "Social card type": one of: `summary_large_image` (Large image), `summary` (Small image); default `summary_large_image`
- `organisation` (group): Describes the company to search engines (schema.org Organization) on every page. Leave a field empty to leave it out.
  - `legalName` (text) "Legal name (as registered)": max 120 characters
  - `logo` (upload from `media`) "Logo for search results (PNG, at least 112×112)": Empty uses the logo the website ships with.
  - `profiles` (list) "Social profiles": up to 10 items. The company pages on LinkedIn, YouTube, X and similar.
    - `url` (text, **required**) "Profile link (full address)"
- `manifestShortName` (text) "Short name": max 12 characters. Up to 12 characters, shown under the home screen icon.
- `manifestDisplay` (select) "Display mode": one of: `browser` (Browser (normal tab)), `standalone` (Standalone (opens like an app)); default `browser`
- `manifestBackground` (text) "Splash background colour": max 9 characters. Hex colour, e.g. #FFFFFF.
