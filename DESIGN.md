# Design System

## Style

- Modern SaaS
- Glassmorphism
- Flat Design
- Rounded Corners
- Soft Shadows
- Smooth Animations
- Clean Layout
- Mobile Responsive

---

## Theme

- Support Light Mode
- Support Dark Mode
- Default Theme: Dark
- Use CSS Variables for all colors
- Never hardcode hex colors in components

---

## Colors

Use Tailwind CSS theme tokens.

| Token | Light | Dark |
|-------|--------|--------|
| Primary | #FF2056 | #FF2056 |
| Primary Foreground | #FFFFFF | #FFFFFF |
| Background | #FFFFFF | #09090B |
| Foreground | #09090B | #FDFDFD |
| Card | #FFFFFF | #111111 |
| Card Foreground | #111827 | #FDFDFD |
| Surface | #F8FAFC | #18181B |
| Border | #E5E7EB | #2A2A2A |
| Input | #F9FAFB | #1F1F23 |
| Muted | #F3F4F6 | #27272A |
| Muted Foreground | #6B7280 | #A1A1AA |
| Success | #22C55E | #22C55E |
| Warning | #F59E0B | #F59E0B |
| Danger | #EF4444 | #EF4444 |
| Info | #3B82F6 | #3B82F6 |

---

## Border Radius

| Token | Value |
|-------|-------|
| Small | 8px |
| Medium | 12px |
| Large | 16px |
| Extra Large | 20px |

---

## Shadows

Small
- Soft shadow for inputs

Medium
- Cards

Large
- Dropdown
- Modal

---

## Typography

Font
- Geist

Heading
- font-bold

Body
- font-normal

Caption
- text-sm

Small
- text-xs

---

## Layout

Container
- max-w-7xl

Content
- max-w-5xl

Dashboard
- Sidebar + Content

Gap
- 24px

Section Padding
- py-20

---

## Components

### Button

Variants
- Filled
- Outline
- Ghost
- Danger

Style
- Rounded XL
- Height 44px
- Transition 200ms

---

### Input

- Rounded XL
- Height 48px
- Focus Ring uses Primary
- Full Width

---

### Card

- Rounded XL
- Soft Border
- Soft Shadow
- Background uses Card Token

---

### Modal

- Rounded XL
- Backdrop Blur
- Fade + Scale Animation

---

### Sonner (Toast)

Library
- Sonner

Position
- Top Center

Theme
- Follow current Light/Dark theme

Content
- Icon
- Text
- Close Button

Behavior
- Stack multiple toasts
- Auto dismiss after 3–5 seconds
- Pause timer on hover

Variants
- Success
- Error
- Warning
- Info
---

## Animation

Library
- Motion

Duration
- 200ms

Hover
- Scale 1.02

Cards
- Fade Up

Modal
- Scale + Fade

Page Transition
- Fade

---

## Icons

Library
- Hugeicons

Sizes
- 18
- 20
- 24

---

## AI Rules

- Always support both Light and Dark mode.
- Always use design tokens.
- Never hardcode colors.
- Never create new color palettes.
- Never create new button styles.
- Reuse existing components whenever possible.
- Keep spacing and typography consistent.
- Use Tailwind CSS utilities only.