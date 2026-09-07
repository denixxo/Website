# QNS color coding

Source: QNS Corporate Design guideline (slide 6, colour scheme) and the "QNS colors" Office theme colour scheme embedded in the QNS PPTX templates. All values below are the actual brand hex/RGB codes — nothing invented.

## Brand palette

| Name | Token | Hex | RGB |
|---|---|---|---|
| Teal deep | `--qns-teal-deep` | `#006760` | 0, 103, 96 |
| Teal (primary) | `--qns-teal` | `#01877e` | 1, 135, 126 |
| Cyan (highlight) | `--qns-cyan` | `#00efdf` | 0, 239, 223 |
| Maroon | `--qns-maroon` | `#670007` | 103, 0, 7 |
| Red deep | `--qns-red-deep` | `#87010a` | 135, 1, 10 |
| Red | `--qns-red` | `#ef0010` | 239, 0, 16 |
| Blue deep | `--qns-blue-deep` | `#234c7f` | 35, 76, 127 |
| Blue | `--qns-blue` | `#3c77b1` | 60, 119, 177 |
| Purple | `--qns-purple` | `#714c8b` | 113, 76, 139 |
| Orange | `--qns-orange` | `#f7901e` | 247, 144, 30 |
| Navy (beamer) | `--qns-navy` | `#004678` | 0, 70, 120 |
| Navy deep (beamer) | `--qns-navy-deep` | `#002846` | 0, 40, 70 |
| Steel (beamer) | `--qns-steel` | `#bebec8` | 190, 190, 200 |
| Black | `--qns-black` | `#000000` | 0, 0, 0 |
| Ink | `--qns-ink` | `#111517` | 17, 21, 23 |
| Graphite | `--qns-graphite` | `#2a3134` | 42, 49, 52 |
| Slate | `--qns-slate` | `#5b686d` | 91, 104, 109 |
| Grey | `--qns-grey` | `#8e9a9e` | 142, 154, 158 |
| Mist | `--qns-mist` | `#d7dedf` | 215, 222, 223 |
| Fog | `--qns-fog` | `#eef2f2` | 238, 242, 242 |
| White | `--qns-white` | `#ffffff` | 255, 255, 255 |

## Groupings

**Main — teal (use this first, everywhere):**
- Deep `#006760` — dark backgrounds, section dividers, headings in light mode
- Primary `#01877e` — default accent, buttons, links, rules
- Cyan `#00efdf` — highlight, focus rings, dark-mode headings/accents

**Complementary — red (rare, warnings/emphasis only):**
- Maroon `#670007`
- Red deep `#87010a`
- Red `#ef0010`

**Additional — categorical set (charts, poster boxes, tags):**
- Blue deep `#234c7f`
- Blue `#3c77b1`
- Purple `#714c8b`
- Orange `#f7901e`

**LaTeX/beamer extras** (from the QNS beamer example deck only):
- Navy `#004678`
- Navy deep `#002846`
- Steel `#bebec8`

**Neutrals:**
- Black `#000000`
- Ink `#111517` — body text
- Graphite `#2a3134`
- Slate `#5b686d` — muted/secondary text
- Grey `#8e9a9e`
- Mist `#d7dedf` — hairline borders
- Fog `#eef2f2` — subtle backgrounds
- White `#ffffff`

## Semantic tokens — light mode (default)

| Token | Value |
|---|---|
| `--bg-page` | white |
| `--bg-subtle` | fog `#eef2f2` |
| `--surface-card` | white |
| `--surface-raised` | white |
| `--surface-inverse` | teal deep `#006760` |
| `--border-hairline` | mist `#d7dedf` |
| `--border-strong` | slate `#5b686d` |
| `--text-body` | ink `#111517` |
| `--text-muted` | slate `#5b686d` |
| `--text-heading` | teal deep `#006760` |
| `--text-on-accent` | white |
| `--text-link` | teal `#01877e` |
| `--text-link-hover` | teal deep `#006760` |
| `--accent-primary` | teal `#01877e` |
| `--accent-primary-hover` | teal deep `#006760` |
| `--accent-highlight` | cyan `#00efdf` |
| `--rule-brand` | teal `#01877e` |
| `--focus-ring` | cyan `#00efdf` |
| `--status-danger` | red `#ef0010` |
| `--status-warning` | orange `#f7901e` |
| `--status-info` | blue `#3c77b1` |
| `--status-note` | purple `#714c8b` |

## Semantic tokens — dark mode

| Token | Value |
|---|---|
| `--bg-page` | `#05100f` |
| `--bg-subtle` | `#0c1a19` |
| `--surface-card` | `#0f211f` |
| `--surface-raised` | `#142a28` |
| `--surface-inverse` | cyan `#00efdf` |
| `--border-hairline` | `#1f3b38` |
| `--border-strong` | `#33534f` |
| `--text-body` | `#e8f2f0` |
| `--text-muted` | `#9db3af` |
| `--text-heading` | cyan `#00efdf` |
| `--text-on-accent` | `#05100f` |
| `--text-link` | cyan `#00efdf` |
| `--text-link-hover` | `#7ffff2` |
| `--accent-primary` | teal `#01877e` |
| `--accent-primary-hover` | cyan `#00efdf` |
| `--accent-highlight` | cyan `#00efdf` |
| `--rule-brand` | cyan `#00efdf` |
| `--focus-ring` | cyan `#00efdf` |
| `--status-danger` | `#ff5a4e` |
| `--status-warning` | orange `#f7901e` |
| `--status-info` | `#6ea5dc` |
| `--status-note` | `#a583bd` |

## Usage rules

- Maximum two background colours per deck or document: white, and either deep teal or near-black teal.
- Monitors are not colour-calibrated — print a full colour set on one printer with one piece of software before relying on print colour matching.
- The "white" QNS logo lockups are two-colour (white + teal `#01877e`, plus a red dot) and must sit on black or near-black — never on brand teal `#006760`, where "QUANTUM" drops to roughly 1.4:1 contrast and disappears.
- Teal-field slides carry no logo; the colour itself is the brand cue.
