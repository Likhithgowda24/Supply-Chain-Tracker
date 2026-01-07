# Network Error Page Design Spec

## Overview
A full-screen network-error loading page for the "Supply Chain Tracker" web app. This screen appears when the app detects a network failure or server-timeout.

## Visual Style & Palette

### Colors
- **Primary Background**: Deep Navy `#020617` (Slate 950)
- **Card Background**: Dark Slate `#0f172a` (Slate 900) with 90% opacity and blur
- **Primary Accent**: Electric Teal/Cyan `#06b6d4` (Cyan 500)
- **Secondary Accent**: Warm Gold `#E8B85B`
- **Text Primary**: Slate 200 `#e2e8f0`
- **Text Secondary**: Slate 400 `#94a3b8`

### Typography
- **Font Family**: Sans-serif (Inter/Geist)
- **Title**: 24px (1.5rem), Bold, Tracking-tight
- **Body**: 14px (0.875rem), Medium
- **Microcopy**: 12px (0.75rem)

## Layout
- **Container**: Full-screen fixed overlay, z-index 50.
- **Card**: Centered, max-width 28rem (448px), rounded-xl, bordered.
- **Background**: Animated SVG network nodes (low opacity).

## Animations

### Entrance
- **Screen**: Fade in 0% -> 100% opacity (300ms).
- **Card**: Slide up 20px -> 0px, Fade in (400ms ease-out, 100ms delay).

### Glowing Effect
- **Icon Halo**: Box-shadow pulse.
  - Duration: 2s
  - Easing: Ease-in-out
  - Loop: Infinite
  - Colors: `rgba(6, 182, 212, 0.1)` -> `rgba(6, 182, 212, 0.2)`

### Node/Chain Animation
- **Nodes**: Scale and Opacity pulse.
  - Duration: 2s
  - Staggered delay: 0.2s per node
- **Lines**: Path drawing animation.

### Retry Visual
- **Ring**: Circular progress SVG.
  - Stroke: Cyan 500
  - Animation: Stroke-dashoffset countdown (10s linear).
- **Ripple**: Scale and Fade out on retry trigger.
  - Duration: 800ms

## Accessibility
- **ARIA**: Status updates announced via live regions (implied by content changes).
- **Keyboard**: All buttons focusable with visible focus rings.
- **Reduced Motion**: Animations use standard Framer Motion `AnimatePresence` which respects system settings if configured globally (can be enhanced with `useReducedMotion`).

## Behavior
- **Trigger**: `window.offline` event or API failure.
- **Auto-Retry**: 10s countdown, max 5 attempts.
- **Manual Actions**: "Retry Now" (immediate), "Go Offline" (dismiss).

## Implementation Details
- **Component**: `NetworkError.tsx`
- **Hook**: `useNetworkStatus.ts`
- **Integration**: `App.tsx` (Global overlay)
