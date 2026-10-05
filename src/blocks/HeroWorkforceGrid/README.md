# Hero — Workforce Grid

A hero with copy on the left and a grid of small "agent" cards on the right.
Each column of cards scrolls slowly up or down on its own infinite loop — a
"team at work" feel rather than a static screenshot or photo.

## Fields

| Field | Type | Notes |
|---|---|---|
| `eyebrow` | text | Optional small label above the headline. |
| `headline` | text, required | Becomes the page's H1. Set the page hero to "None" when this block is used. |
| `subhead` | textarea | Optional, one or two sentences. |
| `cta` | link group | The one button under the subhead. Internal page/post link or a custom URL, with an "open in new tab" option. Required — this block always shows a button. |
| `theme` | select, required | `Dark blue`, `Red`, or `White`. Changes the whole block's colours, including the card style (bordered on dark, translucent white on red, shadowed white on white) — not just a recolour. |
| `speed` | select | `Slow`, `Medium` (default), `Fast`. Scales every column's scroll speed by the same amount. |
| `columns` | select | `2`, `3` (default), or `4` — desktop column count. Below 980px this is always 2; below 640px it becomes a single swipeable row. |
| `cards` | array, min 6 | Each card has an icon (the shared icon picker), a small label (e.g. "AI agent"), a title, and a one-to-two-line description. |

Cards are handed to the website in the order you enter them and spread
round-robin across the columns (card 1 → column 1, card 2 → column 2, card 3
→ column 3, card 4 → column 1, and so on). Add at least 2 cards per column —
9 to 12 cards total reads well for 3 columns.

## Known gap — not fixed as part of this block

The site's header is always dark navy, regardless of this block's theme. On
the **White** theme, this creates a visible hard seam where the dark header
meets the light hero. This was a deliberate choice for this task — making the
header theme-aware is a separate decision affecting every page, not just this
block, so it's left for later rather than done quietly here.
