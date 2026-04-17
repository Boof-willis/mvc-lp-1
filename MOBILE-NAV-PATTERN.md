# Mobile Sticky Nav Pattern (VIDL Two-Layer Architecture)

A battle-tested pattern for a sticky navbar that behaves correctly on **iOS
Safari** (Dynamic Island / notch) and **Chrome Android** (dynamic URL bar) at
the same time — with no content bleeding through the status-bar area and no
nav drifting above the viewport when the Chrome toolbar retracts.

Reference implementation in this repo: `fly/index.html`.
Origin reference: `vidl.css` (lines 5928–5959) + `site.js` (lines 71–89).

---

## The problems this pattern solves

1. **iOS Safari** — with `viewport-fit=cover`, the browser paints content all
   the way up to the Dynamic Island. A normal `position: fixed` navbar with
   `padding-top: env(safe-area-inset-top)` reserves the space, but if the
   nav's background is transparent, page content scrolls up through the
   safe-area strip and shows behind the battery icon and dynamic island.
2. **Chrome Android** — when the URL bar retracts, the layout viewport
   expands upward. A `position: fixed` element with `translate3d(0,0,0)`
   applied directly to it can get re-anchored to the layout viewport (not
   the visual viewport), so the nav drifts above the screen during URL-bar
   animations.
3. **Scroll jank** — multiple `position: fixed` elements (nav, progress
   bar, etc.) each fighting the viewport independently produces stutter.

---

## The pattern

### Core idea

Split the nav into **two layers**:

- **`.navigation`** — outer `position: fixed` shell. This is the only
  fixed element. Hardware-accelerated. Sits at true `top: 0` so its
  background fills the safe-area strip edge-to-edge.
- **`.nav-bar`** — inner `position: relative` child. Holds the background
  color, border, padding, and scroll-reactive transitions. Pushed below
  the safe area via `padding-top: env(safe-area-inset-top)`.

Because the visible bar is *relative inside a fixed parent*, it inherits
the stable top anchor but doesn't have its own fixed-positioning
calculation fighting Chrome's viewport engine. That is the entire trick.

### HTML

```html
<div class="navigation">
    <div class="nav-bar">
        <nav class="nav">
            <a href="#" class="nav__logo">…</a>
            <a href="…" class="nav__cta">…</a>
        </nav>
    </div>
</div>
```

### CSS

```css
.navigation {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 50;
    /* Hardware accel lives on the shell, not on the visible bar */
    -webkit-transform: translate3d(0,0,0);
    transform: translate3d(0,0,0);
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
}

.nav-bar {
    position: relative;
    width: 100%;
    background: transparent;
    border-bottom: 1px solid transparent;
    /* Inset padding goes here, NOT on the fixed parent */
    padding-top: env(safe-area-inset-top, 0px);
    transition: background 0.5s cubic-bezier(0.16, 1, 0.3, 1),
                border-color 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
}

.nav-bar.scrolled {
    background: rgba(19, 12, 14, 0.97);
    -webkit-backdrop-filter: blur(12px);
    backdrop-filter: blur(12px);
    border-bottom-color: rgba(201, 168, 76, 0.2);
}

/* On mobile keep the nav solid at all times so the Dynamic Island strip
   is a continuation of the navbar and content never shows above it. */
@media (max-width: 767px) {
    .nav-bar {
        background: var(--ink);
    }
    .nav-bar.scrolled {
        background: var(--ink);
        -webkit-backdrop-filter: none;
        backdrop-filter: none;
    }
}

/* Bulletproof the fixed shell on mobile. !important defends against any
   earlier rule leaking in from frameworks, breakpoint resets, etc. */
@media screen and (max-width: 991px) {
    .navigation {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: auto !important;
    }
    .nav-bar {
        position: relative !important;
        inset: auto !important;
        width: 100% !important;
    }
}
```

### JS — toggle scroll state on BOTH layers

```js
var navBar = document.querySelector('.nav-bar');
var navigation = document.querySelector('.navigation');
var ticking = false;

window.addEventListener('scroll', function () {
    if (ticking) return;
    requestAnimationFrame(function () {
        var scrolled = window.pageYOffset > 80;
        if (navBar)     navBar.classList.toggle('scrolled', scrolled);
        if (navigation) navigation.classList.toggle('scrolled', scrolled);
        ticking = false;
    });
    ticking = true;
}, { passive: true });
```

Toggling the class on both layers lets you style the fixed shell
separately from the visible bar — useful for, e.g., adding a box-shadow
on the shell only once scrolled.

### Required `<head>` meta

```html
<meta name="viewport"
      content="width=device-width, initial-scale=1.0, viewport-fit=cover">
```

`viewport-fit=cover` is what tells iOS Safari to expose
`env(safe-area-inset-top)` with a real value instead of `0px`.

---

## Do-nots (anti-patterns that break this)

### Do NOT put `translate3d(0,0,0)` on the visible bar
Putting transform directly on the `position: fixed` visible element is
what causes Chrome Android to misanchor the bar during URL-bar
animations. Keep it on the outer shell only.

### Do NOT put `padding-top: env(safe-area-inset-top)` on the fixed parent
If you pad the fixed parent with the inset, the background of the fixed
parent moves down with the padding and reveals content above it. Put the
inset padding on the inner relative `.nav-bar` so the bar's background
fills everything from true `top: 0` downward.

### Do NOT have a transparent background on the status-bar strip on mobile
If the navbar is transparent over the hero on mobile, the Dynamic Island
area will show page content scrolling behind it. Force solid on mobile
(`@media (max-width: 767px) .nav-bar { background: var(--ink); }`) or
paint the safe-area strip with an always-solid `::before` pseudo-element
on `.navigation`.

### Do NOT use `100vh` for full-height sections on mobile
Chrome's URL bar show/hide will cause `100vh` to jump. Use `100dvh`
(dynamic) for "fills what the user actually sees right now" or `100svh`
(small) for "fills the smallest viewport so nothing moves."

### Do NOT add multiple independent `position: fixed` elements near the top
If you need a progress bar or announcement banner, nest them *inside*
the single `.navigation` fixed shell as `position: absolute` or
`position: relative` children. Example from `vidl.css`:

```css
.progress-bar {
    position: absolute !important;
    top: auto !important;
    bottom: 0 !important;
    left: 0 !important;
    right: auto !important;
    z-index: 10 !important;
}
```

---

## Checklist before shipping a mobile nav

- [ ] Outer `.navigation` is `position: fixed; top: 0;` with `translate3d`
- [ ] Inner `.nav-bar` is `position: relative` with `padding-top: env(safe-area-inset-top)`
- [ ] Visible bar has a solid background on mobile (not transparent)
- [ ] `<meta viewport>` includes `viewport-fit=cover`
- [ ] Full-height sections use `100dvh` not `100vh`
- [ ] No direct `transform` on any `position: fixed` element near the top
- [ ] Scroll handler toggles class on both `.navigation` and `.nav-bar`
- [ ] No secondary `position: fixed` elements competing at the top — nest
      them inside `.navigation` as `absolute` instead
- [ ] Test on iOS Safari (Dynamic Island device) AND Chrome Android with
      URL bar show/hide

---

## Why it works, in one sentence

The outer `.navigation` takes the fixed-positioning and hardware-accel
hit so the inner `.nav-bar` (which owns the visible paint) doesn't have
to — which means Chrome's visual-viewport anchoring stays consistent,
iOS's safe-area inset is filled by solid background from the true top
edge, and you only manage one fixed element instead of several fighting
each other.
