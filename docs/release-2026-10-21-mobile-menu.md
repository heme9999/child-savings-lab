# October 21 mobile menu layering fix

## Scope and cause

The user supplied an iPhone screenshot showing homepage content painted over the expanded mobile navigation. After a read-only diagnosis, the user explicitly approved fixing it, synchronizing GitHub, and deploying the existing Cloudflare Pages site.

The same failure was reproduced in the browser at 390×844: homepage elements were in front of all five menu links at their center points. In the mobile breakpoint, `.site-header` changed from `sticky` to `static` while retaining `z-index: 20` and `backdrop-filter`. Its dropdown's own `z-index: 21` did not lift the header's stacking context above the later positioned hero.

`src/styles/global.css` now uses `position: relative` for the mobile header. This keeps the header non-sticky, makes its existing z-index effective, and retains an opaque dropdown without altering its size, targets, or native disclosure behavior. Desktop navigation is unchanged. The mobile-native guidance informed this CSS-first, no-device-sniffing fix and the explicit physical-device verification boundary.

No content, financial rules, calculator formulas, routes, verification dates, privacy settings, dependencies, or Search Console configuration changed. Sitemap resubmission was not part of this fix.

## Regression checks

- Added a style contract requiring the non-sticky mobile header to remain positioned with a positive layer, while the desktop header remains sticky. This test failed against the original `static` declaration before the fix and passed afterward.
- Added checks for an opaque, positioned dropdown with no clipping on its relevant containers, plus native summary open/close behavior after enhancement. Existing Escape/focus-return and outside-pointer tests remain passing.
- `npm run verify` passed: 80 Astro files with zero diagnostics, 211 tests in 17 files, static build, 19 public routes with sitemap/internal-link/real-404 checks, and HTML validation. The style/DOM tests are not browser layout tests.
- Local built-preview HTTP checks passed 72 GET/HEAD requests, including public pages, three missing paths, sitemap/robots resources, and 11 CSS/JS/social assets with matching MIME and SHA-256.
- Local browser: at 320, 390, and 820px the homepage dropdown stayed in the viewport and all five links were foreground hit targets; at 821px desktop navigation remained visible and sticky. The three core tools passed menu foreground checks at both 320 and 390px without horizontal overflow. At 390px each link was checked at left, center, and right sample points. Escape returned focus to the summary; an outside press closed the menu.

## Publication and live acceptance

- Application commit: `7d42d91bd40e80946067b162ebfc3452e572db8d`, pushed to `main`.
- [GitHub CI](https://github.com/heme9999/child-savings-lab/actions/runs/39562082807) passed before deployment.
- Production: https://child-savings-lab-mvp.pages.dev/
- Immutable deployment: https://865f2b8e.child-savings-lab-mvp.pages.dev/
- Both hosts passed their full HTTP regression on the first attempt: 72 GET/HEAD checks per host, 144 total, with matching HTML and asset content, MIME, and hashes. Three negative paths remain genuine HTTP 404s.
- Live homepage at 390×844: menu background fully covers the heading; all five 44px-high links passed left/center/right hit checks. Each of the five links was actually clicked and reached its expected page; the new document's menu was closed.
- Live Escape/focus-return and outside-press closing passed. At 320×740 all five homepage links remained foreground hit targets without horizontal overflow. The three live core-tool pages also passed left/center/right menu checks at 390×844, without overflow. No browser warnings/errors were captured.
- Before/after screenshots are local chat visualization artifacts: `child-savings-menu-overlap-2026-10-21.jpg` and `child-savings-menu-fixed-2026-10-21.jpg`. They are not published to the website or repository.
- Temporary browser overrides/tabs were cleared, and the local preview server was stopped.

These are browser-viewport and automated checks, not a physical-iPhone or assistive-technology certification. The user should refresh the original iPhone page and verify opening, selecting, and closing the menu. This record is documentation-only; the published application remains the commit above.
