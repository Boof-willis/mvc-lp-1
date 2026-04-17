# Mobile Sticky Nav Pattern

A pattern for a transparent-over-hero sticky navbar that animates to
solid on scroll and behaves correctly on **iOS Safari** (Dynamic Island
/ notch, compact bottom URL bar) and **Chrome Android** (dynamic URL
bar) at the same time — with no content bleeding through the Dynamic
Island strip and no nav drifting above the viewport during URL-bar
show/hide.

Reference implementation: `fly/index.html`.

---

## The two things most people get wrong

### 1. Thinking dropping `viewport-fit=cover` fixes iOS Dynamic Island
**It doesn't, on modern iOS Safari.** In compact-bottom-URL-bar mode
(iOS 15+) Safari extends the viewport under the Dynamic Island
regardless of whether `viewport-fit=cover` is set. You still have to
cover the strip yourself. The correct move is to **set**
`viewport-fit=cover` so `env(safe-area-inset-top)` becomes available,
then extend the nav's own background up through that inset with
`padding-top: env(safe-area-inset-top)`.

### 2. Adding `translate3d(0,0,0)` to the fixed nav for "hardware acceleration"
**On iOS Safari this makes the nav hide during downward scroll.** The
transform de-anchors the element from the visual viewport during the
URL-bar show/hide transition — the nav drifts above the screen on
scroll down and reappears on scroll up. Don't put `translate3d` on any
`position: fixed` element.

---

## The pattern

### Two architectural moves

**Move 1 — Two-layer nav.** Split into an outer fixed shell
(`.navigation`) and an inner relative bar (`.nav-bar`).

- Outer `.navigation` owns the fixed positioning. Plain `position: fixed`
  — no transforms, no backface-visibility hacks.
- Inner `.nav-bar` owns the background color, border, and scroll-reactive
  transitions. It is `position: relative` so it inherits the stable top
  anchor without having its own fixed-positioning calculation fighting
  the browser's visual viewport math.

**Move 2 — Extend nav-bar upward through the safe-area inset.** Give
`.nav-bar` `padding-top: env(safe-area-inset-top, 0px)`. The bar's
background now paints the Dynamic Island strip. Transparent when over
hero, solid when scrolled — matching the nav color at all times.

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

### `<head>` metas

```html
<meta name="viewport"
      content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="theme-color" content="#130C0E">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
```

`viewport-fit=cover` is required so `env(safe-area-inset-top)` resolves
to a real value on iOS devices with a Dynamic Island or notch.
`theme-color` makes Chrome Android's URL bar match. The status-bar meta
is only for PWA mode; `black-translucent` lets our nav paint the top
strip itself when installed to home screen.

### CSS

```css
.navigation {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 50;
    /* NO translate3d, NO backface-visibility. They break iOS Safari. */
}

.nav-bar {
    position: relative;
    width: 100%;
    background: transparent;
    border-bottom: 1px solid transparent;
    /* Extend the bar upward through the iOS Dynamic Island strip so
       the nav's background (transparent or solid) covers it. */
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

@media (max-width: 767px) {
    /* Mobile: drop the backdrop blur and use solid ink so the Dynamic
       Island strip and the nav below it are a single continuous color
       with no hairline seam. */
    .nav-bar.scrolled {
        background: #130C0E;  /* exact --ink, no alpha */
        -webkit-backdrop-filter: none;
        backdrop-filter: none;
    }
}

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

---

## How it renders, step by step

**At top of page over a dark hero:**
- Dynamic Island strip — transparent `.nav-bar` padding; hero image
  shows through. Looks seamless because the hero is dark.
- Nav body — transparent. Logo sits directly on the hero.

**After scrolling past 80px:**
- Dynamic Island strip — `.nav-bar` padding is now solid `--ink` (on
  mobile) or `rgba(19,12,14,0.97)` with blur (on desktop).
- Nav body — same solid color. One continuous block from the top of the
  screen to the bottom of the nav. No content shows through.

**iOS Safari URL bar animation:**
- `.navigation` has no transform, so its `position: fixed` stays
  correctly anchored to the visual viewport during URL-bar show/hide.
  No drifting above the screen.

**Chrome Android URL bar animation:**
- Outer `.navigation` is plain `position: fixed`. Inner `.nav-bar` is
  `position: relative`. The two-layer split means the visible paint
  doesn't have its own fixed calculation to fight Chrome's visual
  viewport engine.

---

## Anti-patterns that break this

### Do NOT put `translate3d` or `will-change: transform` on any `position: fixed` element near the top
This is the single biggest trap. iOS Safari will hide the nav during
downward scroll. It looks like a toggle effect but it's really the nav
drifting above the visual viewport.

### Do NOT try to "let iOS paint the Dynamic Island via html bg"
It doesn't work in compact-bottom-URL-bar mode. iOS extends the content
region under the Dynamic Island regardless. You must cover the strip
explicitly with nav padding.

### Do NOT put `padding-top: env(safe-area-inset-top)` on the outer fixed shell
Put it on the inner relative `.nav-bar`. If you put it on the fixed
parent, the padding pushes the visible bar down and the region between
`top:0` and the padded start is left transparent (the exact bug you're
trying to avoid).

### Do NOT use `100vh` for full-height sections on mobile
Use `100dvh` (dynamic viewport height) so the section adapts when the
URL bar shows/hides.

### Do NOT add multiple independent `position: fixed` elements near the top
Secondary bars (progress bars, announcements) should nest *inside*
`.navigation` as `position: absolute` children so there's only one
fixed element to manage.

### Do NOT forget to match the mobile `.scrolled` background color exactly to the color you want in the Dynamic Island strip
Any mismatch produces a visible horizontal hairline seam at the boundary
between the safe-area padding and the rest of the bar.

---

## Checklist

- [ ] `<meta viewport>` includes `viewport-fit=cover`
- [ ] `<meta name="theme-color">` is set to match the scrolled nav color
- [ ] Outer `.navigation` has plain `position: fixed` with NO `transform`
- [ ] Inner `.nav-bar` is `position: relative` with
      `padding-top: env(safe-area-inset-top, 0px)`
- [ ] Mobile `.nav-bar.scrolled` background matches the intended
      Dynamic Island color exactly (no alpha mismatch)
- [ ] Scroll handler toggles `.scrolled` on both `.navigation` and
      `.nav-bar`
- [ ] Full-height sections use `100dvh` not `100vh`
- [ ] No secondary fixed elements competing at the top
- [ ] Tested on iOS Safari with compact bottom URL bar (scroll both
      directions) AND on Chrome Android

---

## Why it works, in one sentence

Two-layer split keeps the visible bar `position: relative` inside a
plain `position: fixed` shell (no transforms anywhere), while the inner
bar's `padding-top: env(safe-area-inset-top)` makes the nav tall
enough to cover the iOS Dynamic Island strip with its own background —
transparent over hero, solid when scrolled, continuous color at every
moment.
