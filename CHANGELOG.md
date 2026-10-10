# Changelog

## [1.1.3](https://github.com/costajohnt/ink-scrollable-box/compare/v1.1.2...v1.1.3) (2026-10-10)


### Bug Fixes

* keep batched scroll steps in controlled mode ([#20](https://github.com/costajohnt/ink-scrollable-box/issues/20)) ([a377d1b](https://github.com/costajohnt/ink-scrollable-box/commit/a377d1b3dbbba7ea8938d4cac2d2c252e76a174a)), closes [#19](https://github.com/costajohnt/ink-scrollable-box/issues/19)

## [1.1.2](https://github.com/costajohnt/ink-scrollable-box/compare/v1.1.1...v1.1.2) (2026-07-25)


### Bug Fixes

* cover measured auto-alignment math and harden release workflow ([dd99392](https://github.com/costajohnt/ink-scrollable-box/commit/dd993925fcc6bb4384974f067b4ce7d4ef4d28e6))

## 1.1.1

Bug fixes and maintenance.

### Fixed

- Require `ink >= 6` and `react >= 19` as peer dependencies. The component calls Ink 6's `useIsScreenReaderEnabled` hook, which does not exist in Ink 4/5 and crashed at runtime.
- `measureChildren`: recompute total content height when a child's measured height changes in place at a stable child count (previously `contentHeight` stayed stale).
- `onReachEnd` / `onReachStart` now fire only on the transition into the threshold zone and re-arm on leaving, instead of firing on every scroll tick inside the zone.
- CJS consumers now resolve their own type declarations (`dist/index.d.cts`) via per-condition `exports`.

### Added

- `initialOffset` prop on `ScrollableBox` to set the starting scroll position in uncontrolled mode.

## 1.1.0 (2026-03-31)

Accessibility.

### Added

- Screen-reader support: scroll position announcements (via Ink's `useIsScreenReaderEnabled`), an accessible label for the scrollable region (`ariaLabel` prop), and `aria-hidden` on decorative scrollbar and indicator elements.

## 1.0.0

Initial release.

### Features

**Core**
- `<ScrollableBox />` component with lines and children content modes
- `useScrollable()` standalone hook for custom scroll UIs
- `<Scrollbar />` proportional scrollbar component
- `useLinkedScroll()` hook for synchronized scrolling between panes
- TypeScript-first with full type exports
- ESM + CJS dual output

**Keyboard Navigation**
- Arrow keys, Page Up/Down, Home/End
- Vim bindings: j/k/g/G/u/d (toggleable via `enableVimBindings`)
- Half-page navigation: Ctrl+U / Ctrl+D
- Focus-gated input via Ink's Tab cycling
- `autoFocus` prop for immediate keyboard activation

**Scrollbar**
- 4 visual styles: block, line, thick, dots (`scrollbarStyle` prop)
- Half-line precision using Unicode half-block characters
- Custom thumb/track characters and colors
- Overflow indicators (▲/▼, customizable)

**Scroll Behavior**
- `followOutput` auto-scroll for log streaming (pauses on manual scroll, resumes at bottom)
- Controlled mode (`offset` / `onOffsetChange`)
- Proportional scroll position preservation on viewport resize
- Overscan for pre-rendering items above/below viewport
- `scrollToIndex` with auto/start/center/end alignment

**Ref API**
- `scrollTo`, `scrollToTop`, `scrollToBottom`, `scrollUp`, `scrollDown`
- `pageUp`, `pageDown`, `halfPageUp`, `halfPageDown`
- `scrollToIndex` with alignment options
- `getScrollState`, `getItemHeight`, `getItemPosition`, `remeasureItem`

**Callbacks**
- `onScroll`, `onFocus`, `onBlur`
- `onContentHeightChange`, `onViewportSizeChange`, `onItemHeightChange`
- `onReachEnd`, `onReachStart` with configurable `reachThreshold` (infinite scroll)

**Measurement**
- Variable-height children measurement (`measureChildren` prop)
- Per-item height and position querying via ref

**Focus**
- Tab cycling between multiple `ScrollableBox` instances
- Focus/blur callbacks
- Border color changes on focus state
