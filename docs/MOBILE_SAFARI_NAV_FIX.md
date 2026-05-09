# Mobile Safari Navbar Fix

Use this pattern when iOS Safari shows page content or an inconsistent translucent strip above a mobile navbar while scrolling.

## The Problem

The issue was not one single safe-area rule. The working fix came from removing things that made Safari sample/composite the wrong layers, then rebuilding the mobile nav like the BHI placeholder pattern.

The main culprits were:

- JS mutating `<meta name="theme-color">` on scroll.
- A closed mobile menu that was still a full-screen `position: fixed` layer, hidden with `transform: translateY(-100%)`.
- A fixed full-screen `body::after` noise overlay on mobile.
- The mobile nav being fixed/out of flow while the page content was expected to sit behind it.

## The Fix

Use a sticky mobile nav in normal document flow, keep hidden fixed layers out of Safari's sampling path, and pull `main` up underneath the transparent nav so the top-of-page visual still works.

### Viewport Meta

Use the normal viewport meta. `viewport-fit=cover` was not needed for this regular-Safari fix.

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#130C0E">
<meta name="theme-color" content="#130C0E" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="#130C0E" media="(prefers-color-scheme: light)">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black">
```

### Scroll State

Expose the same scroll state on both the inner bar and outer wrapper. Do not mutate `theme-color` in JS.

```js
var isScrolled = window.pageYOffset > 80;
var scrollMax = document.documentElement.scrollHeight - window.innerHeight;
var scrollProgress = scrollMax > 0 ? Math.min(window.pageYOffset / scrollMax, 1) : 0;
navBar.classList.toggle('scrolled', isScrolled);
navigation.classList.toggle('is-scrolled', isScrolled);
document.documentElement.classList.toggle('nav-scrolled', isScrolled);
document.documentElement.style.setProperty('--scroll-progress', scrollProgress);
```

### CSS

```css
html,
body {
  background: #130C0E;
}

main {
  background: var(--paper);
}

.navigation::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 3px;
  background: var(--gold);
  opacity: 0;
  pointer-events: none;
  transform: scaleX(var(--scroll-progress, 0));
  transform-origin: left center;
  transition: opacity 0.3s ease;
  z-index: 2;
}

.navigation.is-scrolled::after {
  opacity: 1;
}

@media (max-width: 520px) {
  body::after {
    display: none;
  }

  body > main {
    margin-top: -81px;
  }

  .navigation {
    position: sticky;
    top: 0;
    left: auto;
    right: auto;
    width: 100%;
    z-index: 999;
    background: transparent;
    -webkit-transform: translate3d(0, 0, 0);
    transform: translate3d(0, 0, 0);
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
  }

  .navigation.is-scrolled {
    background: var(--ink);
  }

  .nav-bar {
    background: transparent;
    border-bottom-color: transparent;
  }

  .nav-bar.scrolled {
    background: var(--ink);
    border-bottom-color: rgba(201, 168, 76, 0.22);
  }
}
```

### Mobile Menu

Closed fixed drawers should not remain offscreen with transforms. Use `display: none` until open.

```css
.mobile-menu {
  position: fixed;
  inset: 0;
  display: none;
  transform: translateY(0);
}

.mobile-menu.open {
  display: flex;
}
```

## Why This Works

- The mobile nav is sticky, like BHI, so it participates in normal document flow.
- `main` is pulled up by the mobile nav height, so the transparent page-load state still shows hero/content behind the nav.
- The nav turns dark on scroll using regular `.scrolled` / `.is-scrolled` classes.
- The yellow progress bar is a `.navigation::after` element that stays hidden until `.is-scrolled`, then fills left-to-right from `--scroll-progress`.
- Hidden fixed layers are removed from Safari's sampling/compositing path.
- `theme-color` stays stable instead of changing on scroll.
- The fixed noise overlay is disabled on mobile so it cannot affect browser tinting or top-layer compositing.

## Checklist

- Do not mutate `theme-color` on scroll.
- Do not hide full-screen fixed drawers with offscreen transforms.
- Disable decorative fixed full-screen overlays on mobile.
- Keep mobile nav `position: sticky`.
- Keep `body > main { margin-top: -81px; }` if the mobile nav height remains 81px.
- Keep `--scroll-progress` updated from JS if the footer progress bar is enabled.
- Test on a real iPhone in Safari, not only Chrome desktop emulation.
