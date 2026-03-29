# Changelog

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
