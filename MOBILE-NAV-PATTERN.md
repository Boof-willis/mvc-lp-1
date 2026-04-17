# Mobile Sticky Nav Pattern (VIDL Two-Layer + No-Cover Viewport)

A battle-tested pattern for a transparent-over-hero sticky navbar that
animates to solid on scroll and behaves correctly on **iOS Safari**
(Dynamic Island / notch) and **Chrome Android** (dynamic URL bar) at the
same time — with no content bleeding through the status-bar strip and no
nav drifting above the viewport when the Chrome toolbar retracts.

Reference implementation in this repo: `fly/index.html`.
Origin reference: the VIDL companies site (`VIDL-2/index.html` lines
78–112, `VIDL-2/css/vidl.css` lines 5928–5959, `VIDL-2/js/site.js`
lines 71–89).

---

## The key insight most people get wrong

Everyone reaches for `viewport-fit=cover` + `env(safe-area-inset-top)`
CSS shims to handle the Dynamic Island. **Don't.** That strategy extends
the page under the Dynamic Island and then you have to cover the strip
yourself — which is fragile and fights the OS.

**The real trick is: don't set `viewport-fit=cover`.** iOS Safari then
reserves the Dynamic Island / notch / status-bar strip for itself and
paints it with the `html` background color. You pick a color that
matches your design (dark, light, whatever), and iOS handles the rest.
No CSS insets. No pseudo-element shims. No JS measurements.

This is exactly what VIDL does. Their viewport meta is literally just:

```html
<meta content="width=device-width, initial-scale=1" name="viewport">
```

…and their `body { background-color: var(--primary--white); }` makes
iOS paint the Dynamic Island strip white.

---

## The problems this pattern solves

1. **iOS Safari content bleeding into the Dynamic Island** — page
   content scrolls visibly behind the status-bar icons when you naively
   use `viewport-fit=cover`.
2. **Chrome Android nav drifting above the screen** — when the URL bar
   retracts, a `position: fixed` element that has `translate3d(0,0,0)`
   applied directly to it can become anchored to the layout viewport
   instead of the visual viewport, so it "floats away" during URL-bar
   show/hide animations.
3. **Scroll jank from multiple competing fixed elements** at the top of
   the page.

---

## The pattern

### Two architectural moves

**Move 1 — Viewport meta: do NOT use `viewport-fit=cover`.**
Let iOS paint the Dynamic Island strip itself, using the `html`
background color. Pair it with a matching `theme-color` meta so Chrome
Android's URL bar blends in too.

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#130C0E">
<meta name="apple-mobile-web-app-status-bar-style" content="black">
```

**Move 2 — Two-layer nav.** Split the nav into an outer fixed shell
(`.navigation`) and an inner relative bar (`.nav-bar`). The shell owns
fixed positioning + hardware acceleration. The inner bar owns the
background color and scroll-reactive transitions.

Because the visible bar is `position: relative` inside a fixed parent,
it inherits the stable top anchor but doesn't have its own fixed
positioning calculation fighting Chrome's viewport engine. That is the
entire trick for Chrome Android stability.

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

### CSS — critical baseline

```css
html {
    /* THIS is what paints the iOS Dynamic Island strip. Pick it to
       match your desired "above the nav" color. */
    background-color: #130C0E; /* var(--ink) in this project */
}

body {
    /* body can have any other color; it paints everything BELOW
       the Dynamic Island. */
    background: #F4F4F0;
}
```

### CSS — nav

```css
.navigation {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 50;
    /* Hardware accel lives on the SHELL, never on the visible bar. */
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

@media (max-width: 767px) {
    /* On mobile drop the blur and match the exact html bg color so the
       nav and the Dynamic Island strip above it are a single continuous
       color when scrolled (no hairline seam). */
    .nav-bar.scrolled {
        background: #130C0E; /* var(--ink) — same as html bg */
        -webkit-backdrop-filter: none;
        backdrop-filter: none;
    }
}

/* Bulletproof the fixed shell against any earlier rules on mobile.
   !important defends against frameworks, breakpoint resets, etc. */
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

Toggling the class on both lets you style the fixed shell separately
from the visible bar when needed (e.g., adding a box-shadow only to the
shell once scrolled).

---

## How it renders, step by step

At the top of the page over a dark hero:
- **Dynamic Island strip** — painted solid `--ink` by iOS (from `html`
  bg, because no `viewport-fit=cover`).
- **Nav body** — transparent. Logo sits directly on the hero image.
- Visually a seamless dark top region: `--ink` strip blends with dark
  hero behind transparent nav.

After scrolling past 80px:
- **Dynamic Island strip** — still painted solid `--ink` by iOS.
- **Nav body** — transitioned to solid `--ink`.
- The two are a single continuous dark block because we matched the
  `.nav-bar.scrolled` background color exactly to the `html` bg.

On Chrome Android when the URL bar retracts:
- Outer `.navigation` stays anchored to the visual viewport top (because
  `translate3d` is on it, not on the visible bar).
- Visible `.nav-bar` is `position: relative` inside, so it inherits the
  anchor without having its own fixed-position calculation.
- No drift, no gap above the navbar.

---

## Do-nots (anti-patterns that break this)

### Do NOT use `viewport-fit=cover` unless you actually want to paint under the notch
If you do, you are opting into handling the safe-area strip yourself
with CSS insets, and then you have the bleed-through problem. For a
normal webpage nav, skip `viewport-fit=cover` entirely.

### Do NOT put `translate3d(0,0,0)` on the visible bar
Put it on the outer `.navigation` shell. Putting it on the inner
`.nav-bar` (or on a single-element fixed nav) is what causes Chrome
Android's drifting-above-the-viewport bug.

### Do NOT set `padding-top: env(safe-area-inset-top)` anywhere
Not needed once `viewport-fit=cover` is dropped. Adding it creates
unnecessary top spacing and (worse) can leave the padded region
transparent while the rest of the bar is solid.

### Do NOT leave `<html>` without an explicit background color
That's the color iOS uses for the Dynamic Island strip. If it's
unset, it'll default to white — which likely doesn't match your design.

### Do NOT use `100vh` for full-height sections on mobile
Chrome's URL bar show/hide will cause `100vh` to jump. Use `100dvh`
(dynamic: fills what the user sees right now) or `100svh` (small: fills
the smallest viewport so nothing moves).

### Do NOT add multiple independent `position: fixed` elements near the top
Secondary bars (progress bar, announcement banner) should nest *inside*
`.navigation` as `position: absolute` or `position: relative` children.
Example from `VIDL-2/css/vidl.css`:

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

- [ ] `<meta viewport>` does NOT contain `viewport-fit=cover`
- [ ] `<meta name="theme-color">` matches the `html` background color
- [ ] `html` has an explicit `background-color` matching your intended
      Dynamic Island color
- [ ] Outer `.navigation` is `position: fixed; top: 0;` with
      `translate3d(0,0,0)` on it
- [ ] Inner `.nav-bar` is `position: relative` with NO
      `env(safe-area-inset-top)` padding
- [ ] No `transform` on any `position: fixed` element other than
      `.navigation`
- [ ] Mobile `.nav-bar.scrolled` background exactly equals the `html`
      background (no color hairline at the Dynamic Island boundary)
- [ ] Full-height sections use `100dvh` not `100vh`
- [ ] Scroll handler toggles `.scrolled` on both `.navigation` and
      `.nav-bar`
- [ ] No secondary fixed elements competing at the top — nest them
      inside `.navigation` as `absolute` instead
- [ ] Tested on iOS Safari (Dynamic Island device) AND Chrome Android
      with URL bar show/hide

---

## Why it works, in one sentence

iOS paints the Dynamic Island strip for you using `html` bg whenever
you skip `viewport-fit=cover`, and the outer-fixed / inner-relative
split keeps Chrome's visual-viewport anchoring stable — so you only
manage one fixed element and pick one `html` color, and everything else
is design.
