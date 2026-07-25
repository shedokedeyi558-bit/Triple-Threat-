# Win Receipt Visual Guide

## On-Screen Receipt (Web UI)

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                                           ┃
┃  BITLYFE                    [25 Jul 2026] ┃
┃  RCPT-1P4K9R2J2X9          [14:32:45 WAT] ┃
┃                                           ┃
┃            ◎ ✓                            ┃
┃         Verified Win                      ┃
┃                                           ┃
┃  ╔════════════════════════════════════╗  ┃
┃  ║  Amount Won                        ║  ┃
┃  ║  ₦50,000                           ║  ┃
┃  ║  Credited to Wallet                ║  ┃
┃  ╚════════════════════════════════════╝  ┃
┃                                           ┃
┃  Correct Answer                           ┃
┃  "Lagos"                                  ┃
┃                                           ┃
┃  [GENERAL KNOWLEDGE]                      ┃
┃                                           ┃
┃  ─────────────────────────────────────   ┃
┃  ✓ Verified win · bitlyfe.app             ┃
┃  [📥 Save receipt]                        ┃
┃                                           ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

  [ PLAY MORE → ] [ WITHDRAW ]
```

## Downloadable Certificate Receipt (PNG)

When user taps "Save receipt", this PNG is generated (800×1000px):

```
╔════════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║  BITLYFE                                                   [25 Jul 2026]   ║
║  RCPT-1P4K9R2J2X9                                    [14:32:45]           ║
║                                                                            ║
║                                                                            ║
║                           ◉━━━━━━━━━┓                                     ║
║                          ╱    ✓      ╲                                     ║
║                         ╱            ╲                                     ║
║                         ╲            ╱                                     ║
║                          ╲          ╱                                      ║
║                           ◉━━━━━━━━━┛                                     ║
║                                                                            ║
║                        VERIFIED WIN                                       ║
║                                                                            ║
║                                                                            ║
║  ╔════════════════════════════════════════════════════════════════════╗  ║
║  ║                                                                    ║  ║
║  ║                        AMOUNT WON                                 ║  ║
║  ║                                                                    ║  ║
║  ║                         ₦50,000                                   ║  ║
║  ║                                                                    ║  ║
║  ║                     Credited to Wallet                            ║  ║
║  ║                                                                    ║  ║
║  ╚════════════════════════════════════════════════════════════════════╝  ║
║                                                                            ║
║  CORRECT ANSWER                                                           ║
║  "Lagos"                                                                   ║
║                                                                            ║
║  ┌──────────────────────────────────┐                                    ║
║  │    GENERAL KNOWLEDGE             │                                    ║
║  └──────────────────────────────────┘                                    ║
║                                                                            ║
║  Player: Adebayo O. | 14:32:45                                            ║
║                                                                            ║
║  ════════════════════════════════════════════════════════════════════    ║
║                                                                            ║
║                    ✓ Verified win receipt                                 ║
║                                                                            ║
║              bitlyfe.app · Your skills, your winnings                    ║
║                                                                            ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝
```

## Key Elements

| Element | Details |
|---------|---------|
| **BITLYFE** | Wordmark at top-left, gold color |
| **Serial** | RCPT-XXXXXX format, unique per win, monospace |
| **Date/Time** | Top-right corner, ISO format, Nigerian timezone |
| **Verified Badge** | Gold circle (64×64px) with centered checkmark |
| **Prize Box** | Gradient background, gold border, centered |
| **Prize Amount** | 52pt gold monospace, largest text on screen |
| **Correct Answer** | Shown in italics with quotation marks |
| **Category** | Gold pill badge below answer |
| **Footer** | "✓ Verified win · bitlyfe.app" |
| **Border** | Double gold line, diagonal texture overlay |

## Color Scheme

```
Primary Gold:      #E8A33D  (BITLYFE, border, accents)
Bright Gold:       #FFE082  (Prize amount)
Light Gold:        #FFD700  (Gradient highlights)
Dark Brown:        #1a1100  (Background base)
Black:             #0d0d0d  (Background accent)
White:             #FFFFFF  (Text, faded at 30-85%)
Transparent Gold:  rgba(232,163,61, 0.02-0.6)
```

## Typography

| Usage | Font | Size | Weight |
|-------|------|------|--------|
| BITLYFE | Monospace | 12pt | Bold (800) |
| Serial | Monospace | 11pt | Bold (700) |
| Badge Label | Sans-serif | 10pt | Bold (800) |
| Amount | Monospace | 52pt | Black (900) |
| Answer | Sans-serif | 14pt | Semi-bold (600) |
| Category | Sans-serif | 10pt | Bold (700) |
| Footer | Monospace | 10pt | Semi-bold (600) |

## Animations

| Element | Trigger | Animation |
|---------|---------|-----------|
| Entire receipt | Page load | Fade in + scale (0.92 → 1.0) |
| Verified badge | After receipt appears | Scale (0 → 1) + rotate (-30° → 0°) |
| Prize box | After badge | Scale (0.9 → 1.0) + fade in |

## Download Flow

### Mobile (iOS/Android)
1. User taps "Save receipt"
2. Web Share API activates
3. Native share sheet appears
4. User selects "Save to Photos"
5. PNG saved to device gallery
6. Automatic close

### Desktop (Chrome/Safari/Firefox)
1. User clicks "Save receipt"
2. Canvas generates PNG
3. Blob URL created
4. Hidden link triggers download
5. File saved to Downloads folder
6. Filename: `bitlyfe-win-RCPT-XXXXXX.png`

## Responsive Behavior

| Breakpoint | Width | Changes |
|-----------|-------|---------|
| Mobile | 320px+ | Full width with padding, touch-friendly |
| Tablet | 640px+ | Centered, max-width maintained |
| Desktop | 1024px+ | Centered card on page |

## Accessibility

- ✅ Color contrast: Gold text on dark background (WCAG AAA)
- ✅ Clear hierarchy: Prize is unmissably large
- ✅ Button labels: "Save receipt" is clear and concise
- ✅ Time format: Uses Nigerian timezone (WAT) for clarity
- ✅ No critical info in color alone (verified badge has checkmark + text)

## Next Improvements (Future)

1. **QR Code** — Link to win verification page
2. **Shareable link** — Generate unique proof-of-win URL
3. **High-res version** — Optional 4K download
4. **Custom branding** — Add referral code/player name watermark
5. **Email delivery** — Auto-send receipt to registered email
