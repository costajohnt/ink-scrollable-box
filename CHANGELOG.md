# Changelog

## 1.0.0

Initial release.

### Features

- `<ScrollableBox />` component with lines and children modes
- `useScrollable()` standalone hook for custom scroll UIs
- `<Scrollbar />` proportional scrollbar component
- Keyboard navigation: vim bindings (j/k/g/G/u/d), arrow keys, Page Up/Down
- Focus-gated input via Ink's Tab cycling
- `followOutput` auto-scroll for log streaming
- Customizable scrollbar characters, colors, and border styling
- Overflow indicators (▲/▼)
- `onScroll` callback
- TypeScript-first with full type exports
- ESM + CJS dual output
- Half-page navigation (Ctrl+U/Ctrl+D)
- Home/End key support
- Vim keybindings toggle (`enableVimBindings`)
- Focus callbacks (`onFocus`/`onBlur`)
- Ref API for programmatic scrolling (`scrollTo`, `scrollToIndex`, `getScrollState`, etc.)
- Controlled mode (`offset`/`onOffsetChange`)
- Overscan support for pre-rendering items above/below the viewport
- Variable-height children measurement (`measureChildren`)
- Proportional scroll position preservation on viewport resize
