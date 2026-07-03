# 大喜利Pocket Design System

## Overview

Japanese oogiri (improvisational comedy) party game app.
Visual identity: traditional Japanese festival (縁日) meets modern mobile UI.
Target: mobile-first PWA, max-width 448px (max-w-sm).

---

## Color Tokens

All colors defined in `app/globals.css` via `@theme {}` (Tailwind v4).

### Core

| Token         | Hex       | Tailwind Class   | Usage                        |
|---------------|-----------|------------------|------------------------------|
| paper         | `#FBF7EC` | `bg-paper`       | Page background, text-on-dark |
| board         | `#EFE6D2` | `bg-board`       | Card backgrounds (alt)       |
| ink (legacy)  | `#FBF7EC` | `bg-ink`         | Alias for paper (legacy)     |
| text          | `#1A1714` | `text-text`      | Primary text                 |
| text-sub      | `#52493A` | `text-text-sub`  | Secondary text               |
| sub           | `#7A6F5C` | `text-sub`       | Muted labels                 |
| sub2          | `#B6AC97` | `text-sub2`      | Faintest text                |
| line          | `rgba(0,0,0,0.07)` | `border-line` | Borders, dividers       |

### Accent / Pop Colors

| Token      | Hex       | Usage                                    |
|------------|-----------|------------------------------------------|
| red        | `#E5402F` | CTA buttons, FAB, noren, primary accent  |
| vermilion  | `#EE4F3A` | Daruma body, gradients                   |
| orange     | `#F0552E` | Tai (fish) body, hashtag rail gradient   |
| green      | `#2BA35F` | Active state pills, toggle-on, nav active |
| greenDk    | `#1F8A4F` | Darker green variant                     |
| gold       | `#F4C422` | Koban, cat bell, mallet, highlights      |
| goldLine   | `#E0A93B` | Gold borders, aikotoba card border       |
| blue       | `#5BA9D6` | Fuku hat, mask crown                     |
| navy       | `#2C3E63` | Fuku kimono                              |
| cream      | `#FFEED6` | Daruma face, fuku face                   |
| blush      | `#F4A0A8` | Cheek blush on characters                |
| catline    | `#E7DDC7` | Cat outline stroke                       |

### Semantic Surface Colors

| Token      | Hex       | Usage                          |
|------------|-----------|--------------------------------|
| surface    | `#ffffff` | Cards, input backgrounds       |
| surface-2  | `#EBE2CF` | Segmented control track, chips |
| parchment  | `#EFE6D2` | Alias for board                |

### Pop Palette (Ranking / Gamification)

| Token      | Hex       |
|------------|-----------|
| pop-red    | `#E5402F` |
| pop-green  | `#2BA35F` |
| pop-gold   | `#F4C422` |
| pop-orange | `#F0922B` |
| pop-blue   | `#00B4FF` |
| pop-purple | `#BF5FFF` |
| pop-teal   | `#3DDC84` |
| pop-pink   | `#E5402F` |
| pop-amber  | `#F4A52C` |

---

## Typography

Fonts loaded in `app/layout.tsx` via `next/font/google`.

| CSS Variable      | Font Family           | Tailwind Class  | Usage                      |
|--------------------|-----------------------|-----------------|----------------------------|
| `--font-mincho`    | Shippori Mincho B1    | `font-mincho`   | Display, headings, titles  |
| `--font-kaku`      | Zen Kaku Gothic New   | `font-gothic`   | Body text, labels, buttons |
| `--font-maru-nf`   | Zen Maru Gothic       | `font-maru`     | Soft labels, status pills  |

### Weight Usage

| Weight             | Tailwind           | Where                          |
|--------------------|--------------------|--------------------------------|
| 400                | `font-normal`      | Body paragraphs (gothic)       |
| 500                | `font-medium`      | Subtle emphasis                |
| 700 / `font-bold`  | `font-bold`        | Labels, genre chips            |
| 800 / `font-extrabold` | `font-extrabold` | Headings, CTA text, all mincho |
| 900 / `font-black` | `font-black`       | Status pills (maru)            |

### Common Font Sizes (inline style)

| Size    | Usage                                |
|---------|--------------------------------------|
| 10-11px | Captions, timestamps, sub-labels     |
| 12-13px | Buttons, pills, segmented controls   |
| 15px    | Card titles, room names              |
| 18-19px | CTA button text                      |
| 21-22px | Page titles (mincho)                 |
| 28px    | Hero text, aikotoba input            |

---

## Border Radius

| Token       | Value  | Usage                              |
|-------------|--------|------------------------------------|
| radius-card | 18px   | Room cards, input cards, CTAs      |
| radius-btn  | 18px   | Large buttons                      |
| radius-pill | 999px  | Pills, FABs, toggle, genre chips   |
| radius-phone| 42px   | Phone mockup frame                 |

Other common values:
- `borderRadius: 14` — Segmented controls, inputs
- `borderRadius: 16` — Engimono avatar containers
- `borderRadius: 13` — Small icon buttons (back, plus)
- `borderRadius: 12` — AD placeholder, slider input
- `borderRadius: 11` — Segmented control active item

---

## Shadows

| Token        | Value                                         | Usage        |
|--------------|-----------------------------------------------|--------------|
| shadow-phone | `0 30px 70px -30px rgba(40,30,10,0.5)`        | Phone mockup |
| shadow-cta   | `0 14px 26px -10px rgba(229,64,47,0.6)`       | Red CTA / FAB |

Card shadow: `0 10px 30px -18px rgba(40,30,10,.35)` (inline style on cards)

---

## Animations

All keyframes defined in `app/globals.css`.

| Token        | Tailwind Class       | Duration | Usage                        |
|--------------|----------------------|----------|------------------------------|
| pop-in       | `animate-pop-in`     | 0.5s     | Card/page entrance           |
| flip-in      | `animate-flip-in`    | 0.55s    | Card flip reveal             |
| rise         | `animate-rise`       | 0.45s    | Slide-up entrance            |
| floaty       | `animate-floaty`     | 4s loop  | Floating engimono decoration |
| tap-pop      | `animate-tap-pop`    | 0.42s    | Button press feedback        |
| confetti     | `animate-confetti`   | 2.4s     | Celebration particles        |
| spotlight    | `animate-spotlight`  | 2.4s loop| Pulsing opacity              |
| blink        | `animate-blink`      | 1s loop  | Blinking indicator           |
| bar-grow     | `animate-bar-grow`   | 0.8s     | Progress bar fill            |
| crown-bob    | `animate-crown-bob`  | 2s loop  | Winner crown bounce          |
| pulse-glow   | `animate-pulse-glow` | 1.8s loop| Gold glow ring               |
| green-glow   | `animate-green-glow` | 1.8s loop| Green glow ring              |
| spinslow     | `animate-spinslow`   | 16s loop | Slow rotation                |
| railup       | `animate-railup`     | 14s loop | Vertical marquee scroll      |

Inline keyframe: `railleft 20s linear infinite` — horizontal hashtag rail.

Interaction: `active:scale-[0.98] transition-transform` on tappable cards.

---

## Background Patterns

Defined as utility classes in `globals.css`:

| Class         | Pattern   | Description                                |
|---------------|-----------|--------------------------------------------|
| `bg-asanoha`  | 麻の葉    | Subtle gold diamond lattice (32x32px)      |
| `bg-seigaiha` | 青海波    | Subtle red wave arcs (30x15px)             |

---

## Engimono (Mascot Illustrations)

SVG component: `components/Engimono.tsx`
Also defined as `<symbol>` in `app/layout.tsx` for `<use href="#c-{name}">`.

| Name    | viewBox         | Description           | Primary Colors          |
|---------|-----------------|-----------------------|-------------------------|
| daruma  | `0 0 100 112`   | Red daruma doll       | #EE4F3A, #FFEED6        |
| cat     | `0 0 112 120`   | Maneki-neko           | #FFFFFF, #E7DDC7, #EE4F3A |
| tai     | `0 0 124 84`    | Red sea bream         | #F0552E, #F6A623        |
| fuku    | `0 0 100 116`   | Fukuwarai face        | #FFEED6, #2C3E63, #5BA9D6 |
| koban   | `0 0 66 100`    | Gold coin (vertical)  | #F4C422, #E0A93B        |
| mallet  | `0 0 110 110`   | Uchide no kozuchi     | #F4C422, #E8B45C        |
| mask    | `0 0 100 104`   | Festival mask         | #F0552E, #5BA9D6        |

Usage:
```tsx
<Engimono name="daruma" width={44} height={48} />
<Engimono name="cat" width={68} height={73} style={{ opacity: 0.85 }} />
```

---

## Icon System

SVG stroke icons: `components/Icon.tsx`

| Name    | Default Size | Stroke Width | Description      |
|---------|-------------|-------------|------------------|
| home    | 23          | 2.1         | House             |
| grid    | 23          | 2.1         | 4-square grid     |
| banzuke | 23          | 2.1         | Bar chart         |
| person  | 23          | 2.1         | Person silhouette |
| search  | 18          | 2.2         | Magnifying glass  |
| back    | 18          | 2.4         | Chevron left      |
| refresh | 22          | 2.1         | Circular arrow    |
| plus    | 18          | 2.2         | Plus sign         |

Usage:
```tsx
<Icon name="plus" size={17} color="#1A1714" strokeWidth={2.2} />
```

---

## Noren Component

Decorative Japanese curtain header: `components/Noren.tsx`

```tsx
<Noren text="入室" />              // 3-panel noren, red
<Noren text="大喜利" color="#2BA35F" height={62} />
```

Each character is displayed vertically on one panel. Max 3 characters.

---

## Common UI Patterns

### Segmented Control
```
background: #EBE2CF, borderRadius: 14, padding: 4px, gap: 4px
Active:   bg #1A1714, color #FBF7EC, fontWeight 700, borderRadius: 11
Inactive: bg transparent, color #7A6F5C, fontWeight 600
```

### Status Pill
```
font-maru font-black, fontSize: 10, padding: 2px 7px, borderRadius: 999
waiting:  bg #EFE8DA, color #7A6F5C
active:   bg #E6F5EC, color #2BA35F
finished: bg #EFE8DA, color #B6AC97
```

### CTA Button (Primary)
```
font-mincho font-extrabold text-paper
fontSize: 18-19, padding: 16px 0, borderRadius: 18
background: linear-gradient(180deg, #EE4F3A, #E5402F)  or  #E5402F
boxShadow: 0 14px 26px -10px rgba(229,64,47,0.6)
disabled: opacity-40
```

### FAB (Floating Action Button)
```
fixed, right: 22, bottom: 96
font-gothic font-extrabold text-paper
fontSize: 14, padding: 13px 18px, borderRadius: 999
background: #E5402F
boxShadow: 0 14px 26px -10px rgba(229,64,47,0.6)
```

### Room Card
```
bg-white, borderRadius: 18, border: 1px solid rgba(0,0,0,.07), padding: 14px
Layout: [Engimono 54x54] [text flex-1] [action button]
active:scale-[0.98] transition-transform
```

### Aikotoba (Invite Code) Card
```
borderRadius: 18, border: 1.5px dashed #E0A93B, padding: 14px
background: linear-gradient(100deg, #FFFDF5, #FFF9E8)
Engimono: koban (width 22 height 34)
```

### Input Field
```
bg-white, border: 1px solid rgba(0,0,0,.07), borderRadius: 14
padding: 13px 15px, fontSize: 15, font-gothic font-bold
```

### Aikotoba Input (Large)
```
bg-[#FBF7EC], border: 1.5px solid #E0A93B, borderRadius: 12
fontSize: 28, font-mincho font-extrabold, letterSpacing: 0.3em
text-center
```

### Section Divider
```
<span style={{ height: 1, flex: 1, background: "rgba(0,0,0,.1)" }} />
<p font-mincho font-extrabold text-sub fontSize: 11>◆ Label</p>
<span style={{ height: 1, flex: 1, background: "rgba(0,0,0,.1)" }} />
```

### Small Icon Button
```
bg-white, width: 38, height: 38, borderRadius: 13
border: 1px solid rgba(0,0,0,.07)
grid place-items-center
```

### Genre / Tag Chip
```
font-gothic font-bold, fontSize: 12.5, padding: 7px 13px, borderRadius: 999
Selected: bg #2BA35F, color #ffffff
Unselected: bg #ffffff, color #52493A, border: 1px solid rgba(0,0,0,.07)
```

### Toggle Switch
```
width: 46, height: 27, borderRadius: 999
On:  background #2BA35F, knob right: 3
Off: background #E4DCCF, knob left: 3
Knob: width: 21, height: 21, bg-white, rounded-full, absolute top: 3
```

### Hashtag Rail (Marquee)
```
height: 22, background: linear-gradient(90deg, #E5402F, #F0922B)
font-gothic font-extrabold text-paper
fontSize: 11, letterSpacing: 0.24em
animation: railleft 20s linear infinite
```

### Loading Spinner
```
w-6 h-6 rounded-full border-2 border-red border-t-transparent animate-spin
```

### Empty State
```
borderRadius: 20, border: 1.5px dashed rgba(0,0,0,.12)
background: rgba(255,255,255,.4)
Engimono (opacity 0.35) + message + action link
```

### AD Placeholder
```
height: 60, borderRadius: 12, border: 1.5px dashed rgba(0,0,0,.12)
font-gothic text-sub fontSize: 12, centered "AD"
```

---

## Navigation

### Bottom Nav (`components/BottomNav.tsx`)

3 tabs, fixed bottom, height 78px, white background.

| Route     | Label  | Icon   |
|-----------|--------|--------|
| /rooms    | 寄合所 | home   |
| /engawa   | 縁側   | grid   |
| /mypage   | 自分   | person |

Active: `#2BA35F`, Inactive: `#B6AC97`
Hidden on: `/game`, `/summary`, `/` (splash)

### App Bar Pattern
```
px-[20px] pt-[10px] pb-[10px-14px] flex items-center gap-[10-12px]
[Back button or Engimono] [Title flex-1] [Action button]
```

---

## Page Structure

All pages use `min-h-screen flex flex-col bg-paper`.
Room-related pages add `bg-asanoha` pattern.
Bottom padding `pb-[78px]` to clear BottomNav (or `pb-[100px]` for sticky footers).
Max width constrained by `max-w-sm mx-auto` wrapper in layout.

### Route Map

| Route                    | Page                     |
|--------------------------|--------------------------|
| `/`                      | Splash / Landing         |
| `/auth/login`            | Login                    |
| `/rooms`                 | Room list (寄合所)       |
| `/rooms/new`             | Create room              |
| `/rooms/join`            | Join by aikotoba         |
| `/rooms/[id]`            | Waiting room             |
| `/rooms/[id]/invite`     | Share invite code        |
| `/rooms/[id]/game`       | Gameplay (answering)     |
| `/rooms/[id]/game/vote`  | Voting                   |
| `/rooms/[id]/game/result`| Round results            |
| `/rooms/[id]/summary`    | Game summary             |
| `/rooms/[id]/analysis`   | AI analysis              |
| `/engawa`                | Community feed           |
| `/engawa/[id]`           | Single engawa post       |
| `/mypage`                | Profile                  |
| `/admin`                 | Admin moderation         |
| `/invite/[code]`         | Deep-link invite         |

---

## Data Model Summary

See `lib/types.ts` for full TypeScript interfaces.

- **UserDoc** — nickname, avatarUrl
- **RoomDoc** — name, hostId, inviteCode, mode (realtime/async), topicMode (omakase/custom/mochiyori), status (waiting/active/finished), capacity, memberIds, judges
- **SessionDoc** — roomId, currentRound, totalRounds, status
- **RoundDoc** — question (text, genre, difficulty, imageUrl), status, deadlines
- **AnswerDoc** — userId, text, displayOrder
- **VoteDoc** — answerId, voterId, reaction (funny/smart/crazy)
- **AiReviewDoc** — answerId, persona (王道/辛口), score, comment

---

## Gradients

| Name              | Value                                          | Usage              |
|-------------------|------------------------------------------------|--------------------|
| CTA               | `linear-gradient(180deg, #EE4F3A, #E5402F)`    | Primary buttons    |
| Hashtag rail      | `linear-gradient(90deg, #E5402F, #F0922B)`     | Top marquee bar    |
| Aikotoba card     | `linear-gradient(100deg, #FFFDF5, #FFF9E8)`    | Gold invite card   |
| Aikotoba input bg | `linear-gradient(100deg, #FFF7E0, #FCEAC6)`    | Gold input section |
| Aikotoba avatar   | `linear-gradient(135deg, #FFF7E0, #FCEAC6)`    | Koban container    |
| SVG g-flame       | `#F6CE3E → #F0922B → #E5402F`                  | Fire gradient      |
| SVG g-leaf        | `#3FC07A → #86CE38 → #F4C422`                  | Leaf gradient      |
| SVG g-gold        | `#FBE08C → #F4C422 → #EF9C24`                  | Gold gradient      |

---

## Key Design Principles

1. **和 (Wa)** — Japanese traditional aesthetics: noren curtains, engimono mascots, mincho headings, asanoha patterns
2. **Mobile-first** — Everything designed for thumb-reachable, single-column 375px layout
3. **Warm paper palette** — Cream/parchment base (#FBF7EC) instead of white, for a soft, inviting feel
4. **Bold red accents** — Vermillion red (#E5402F) for all primary actions and energy
5. **Playful motion** — Subtle scale transforms on tap, floating/bobbing decorative elements
6. **Hierarchy via font pairing** — Mincho for authority/titles, Gothic for readability, Maru for softness
