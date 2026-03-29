# ink-scrollable-box

[![npm version](https://img.shields.io/npm/v/ink-scrollable-box.svg)](https://www.npmjs.com/package/ink-scrollable-box)
[![CI](https://github.com/costajohnt/ink-scrollable-box/actions/workflows/ci.yml/badge.svg)](https://github.com/costajohnt/ink-scrollable-box/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Scrollable container component for [Ink](https://github.com/vadimdemedes/ink) with keyboard navigation, vim bindings, scrollbar styles, and auto-follow.

## Install

```bash
npm install ink-scrollable-box
yarn add ink-scrollable-box
pnpm add ink-scrollable-box
```

Requires `ink >= 4` and `react >= 18` as peer dependencies.

## Quick Start

```tsx
import {render} from 'ink';
import {ScrollableBox} from 'ink-scrollable-box';

const lines = Array.from({length: 100}, (_, i) => `Item ${i + 1}`);

render(<ScrollableBox height={15} lines={lines} autoFocus border />);
```

## Features

- Two content modes: `lines` (string array, virtualized) and `children` (React nodes)
- Keyboard navigation with arrow keys, Page Up/Down, Home/End
- Vim bindings (j/k/g/G/u/d, Ctrl+U/D)
- Auto-follow output (log tailing) with manual scroll-to-pause
- Proportional scrollbar with 4 built-in styles (block, line, thick, dots)
- Half-line precision scrollbar rendering for block style
- Tab-based focus management across multiple panes
- `autoFocus` for immediate keyboard control on mount
- Controlled mode via `offset` / `onOffsetChange`
- Ref API for programmatic scrolling (`scrollTo`, `scrollToIndex`, etc.)
- Linked scroll via `useLinkedScroll` hook
- Infinite scroll callbacks (`onReachEnd`, `onReachStart`)
- Variable-height child measurement (`measureChildren`)
- Overscan for pre-rendering items above/below viewport
- Fully customizable scrollbar characters, colors, and border styling
- Standalone `useScrollable` and `useScrollableInput` hooks
- Zero runtime dependencies (peer deps only)
- TypeScript-first with full type exports

## Examples

### Lines Mode (basic)

```tsx
import {render, Box, Text} from 'ink';
import {ScrollableBox} from 'ink-scrollable-box';

const lines = Array.from({length: 100}, (_, i) => `Item ${i + 1}`);

render(
  <Box flexDirection="column">
    <Text bold>100 items -- j/k/g/G to navigate</Text>
    <ScrollableBox height={15} lines={lines} autoFocus border />
  </Box>
);
```

### Children Mode (styled React nodes)

```tsx
import {render, Text} from 'ink';
import {ScrollableBox} from 'ink-scrollable-box';

const items = [
  {color: 'green', text: 'Build succeeded'},
  {color: 'red', text: 'Test: auth.test.ts failed'},
  {color: 'yellow', text: 'Coverage: 89%'},
];

render(
  <ScrollableBox height={6} autoFocus border>
    {items.map((item, i) => (
      <Text key={i} color={item.color}>{item.text}</Text>
    ))}
  </ScrollableBox>
);
```

### Log Follower (followOutput)

```tsx
import {useState, useEffect} from 'react';
import {render, Text} from 'ink';
import {ScrollableBox} from 'ink-scrollable-box';

function App() {
  const [logs, setLogs] = useState<string[]>([]);
  useEffect(() => {
    const id = setInterval(() => {
      setLogs(prev => [...prev, `[${new Date().toISOString()}] Entry #${prev.length + 1}`]);
    }, 200);
    return () => clearInterval(id);
  }, []);

  return <ScrollableBox height={15} lines={logs} followOutput autoFocus border />;
}

render(<App />);
```

### Multi-Pane (Tab focus)

```tsx
import {render, Box, Text} from 'ink';
import {ScrollableBox} from 'ink-scrollable-box';

const left = Array.from({length: 30}, (_, i) => `Left-${i + 1}`);
const right = Array.from({length: 50}, (_, i) => `Right-${i + 1}`);

render(
  <Box flexDirection="row" gap={2}>
    <ScrollableBox height={10} lines={left} border id="left" autoFocus />
    <ScrollableBox height={10} lines={right} border id="right" />
  </Box>
);
```

### Controlled Mode

```tsx
import {useState} from 'react';
import {render} from 'ink';
import {ScrollableBox} from 'ink-scrollable-box';

const lines = Array.from({length: 100}, (_, i) => `Item ${i + 1}`);

function App() {
  const [offset, setOffset] = useState(0);
  return <ScrollableBox height={10} lines={lines} offset={offset} onOffsetChange={setOffset} autoFocus />;
}

render(<App />);
```

### Ref API (programmatic scrolling)

```tsx
import {useRef} from 'react';
import {render, Box, Text} from 'ink';
import {ScrollableBox, ScrollableBoxRef} from 'ink-scrollable-box';

const lines = Array.from({length: 100}, (_, i) => `Item ${i + 1}`);

function App() {
  const ref = useRef<ScrollableBoxRef>(null);
  // Call ref.current.scrollToIndex(50, {align: 'center'}) to jump to item 50
  return <ScrollableBox ref={ref} height={10} lines={lines} autoFocus border />;
}

render(<App />);
```

### Linked Scroll (useLinkedScroll)

Synchronize scroll position across multiple panes:

```tsx
import {render, Box} from 'ink';
import {ScrollableBox, useLinkedScroll} from 'ink-scrollable-box';

const left = Array.from({length: 100}, (_, i) => `Left-${i + 1}`);
const right = Array.from({length: 100}, (_, i) => `Right-${i + 1}`);

function App() {
  const linked = useLinkedScroll({mode: 'absolute'});
  return (
    <Box flexDirection="row" gap={2}>
      <ScrollableBox height={10} lines={left} offset={linked.offset} onOffsetChange={linked.onOffsetChange} autoFocus border />
      <ScrollableBox height={10} lines={right} offset={linked.offset} onOffsetChange={linked.onOffsetChange} border />
    </Box>
  );
}

render(<App />);
```

### Infinite Scroll (onReachEnd)

```tsx
import {useState, useCallback} from 'react';
import {render} from 'ink';
import {ScrollableBox} from 'ink-scrollable-box';

function App() {
  const [lines, setLines] = useState(Array.from({length: 50}, (_, i) => `Item ${i + 1}`));
  const loadMore = useCallback(() => {
    setLines(prev => [...prev, ...Array.from({length: 20}, (_, i) => `Item ${prev.length + i + 1}`)]);
  }, []);

  return <ScrollableBox height={15} lines={lines} onReachEnd={loadMore} reachThreshold={5} autoFocus border />;
}

render(<App />);
```

## API Reference

### `<ScrollableBox />`

#### Core Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `height` | `number` | **required** | Viewport height in terminal lines |
| `width` | `number` | -- | Viewport width in terminal columns. When set, fixes the container width. |
| `lines` | `string[]` | -- | String content (mutually exclusive with `children`) |
| `children` | `ReactNode` | -- | React node content (mutually exclusive with `lines`) |
| `followOutput` | `boolean` | `false` | Auto-scroll to bottom when content grows |
| `scrollStep` | `number` | `1` | Lines per arrow key / j/k press |
| `border` | `boolean` | `false` | Render a rounded border around the viewport |
| `overscan` | `number` | `0` | Extra items to pre-render above/below viewport |
| `measureChildren` | `boolean` | `false` | Measure actual heights of multi-line children (O(n) render) |
| `debug` | `boolean` | `false` | Disable overflow clipping for layout debugging |

#### Scrollbar Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showScrollbar` | `boolean` | `true` | Show the proportional scrollbar |
| `scrollbarPosition` | `'inside' \| 'outside'` | `'inside'` | `inside` renders the scrollbar alongside content within the border; `outside` renders it to the right of the border, saving 1 column of content width |
| `showIndicators` | `boolean` | `true` | Show overflow indicators above/below content |
| `scrollbarStyle` | `'block' \| 'line' \| 'thick' \| 'dots'` | `'block'` | Built-in scrollbar visual style |
| `scrollbarCharacter` | `string` | per style | Override the scrollbar thumb character |
| `trackCharacter` | `string` | per style | Override the scrollbar track character |
| `upIndicator` | `string` | `▲` | Top overflow indicator character |
| `downIndicator` | `string` | `▼` | Bottom overflow indicator character |
| `scrollbarColor` | `string` | -- | Thumb color when focused |
| `scrollbarDimColor` | `string` | -- | Thumb color when unfocused |
| `trackColor` | `string` | -- | Track color |

#### Focus and Keyboard Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `focusable` | `boolean` | `true` | Participate in Tab focus cycle |
| `autoFocus` | `boolean` | `false` | Auto-focus on mount |
| `id` | `string` | -- | Focus ID for programmatic focus / multi-pane |
| `enableVimBindings` | `boolean` | `true` | Enable vim-style keys (j/k/g/G/u/d) |

#### Border Styling Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `borderColor` | `string` | `'blue'` | Border color when focused |
| `borderDimColor` | `string` | `'gray'` | Border color when unfocused |

#### Callback Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onScroll` | `(state: ScrollState) => void` | -- | Called on every scroll position change |
| `onFocus` | `() => void` | -- | Called when the component gains focus |
| `onBlur` | `() => void` | -- | Called when the component loses focus |
| `onContentHeightChange` | `(height: number, previousHeight: number) => void` | -- | Called when total content height changes |
| `onViewportSizeChange` | `(height: number, previousHeight: number) => void` | -- | Called when viewport height changes |
| `onItemHeightChange` | `(index: number, height: number, previousHeight: number) => void` | -- | Called when a measured child's height changes (requires `measureChildren`) |
| `onReachEnd` | `() => void` | -- | Called when scroll is within `reachThreshold` of the bottom |
| `onReachStart` | `() => void` | -- | Called when scroll is within `reachThreshold` of the top |
| `reachThreshold` | `number` | `5` | Lines from edge to trigger `onReachEnd` / `onReachStart` |

#### Controlled Mode Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `offset` | `number` | -- | Controlled scroll offset (makes the component controlled) |
| `onOffsetChange` | `(offset: number) => void` | -- | Called when offset changes in controlled mode |

---

### `useScrollable(options)`

Standalone scroll state hook. Use this to build a fully custom scroll UI.

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `contentHeight` | `number` | **required** | Total number of content rows |
| `viewportHeight` | `number` | **required** | Visible row count |
| `scrollStep` | `number` | `1` | Rows per scroll action |
| `followOutput` | `boolean` | `false` | Auto-scroll when content grows |
| `initialOffset` | `number` | `0` | Starting scroll position |
| `controlledOffset` | `number` | -- | External controlled offset (overrides internal state) |
| `onOffsetChange` | `(offset: number) => void` | -- | Called when offset would change (for controlled mode) |

**Returns (`UseScrollableResult = ScrollState & ScrollActions`):**

| Field | Type | Description |
|-------|------|-------------|
| `offset` | `number` | Current scroll offset (first visible row index) |
| `contentHeight` | `number` | Total content rows |
| `viewportHeight` | `number` | Visible rows |
| `canScrollUp` | `boolean` | True when not at top |
| `canScrollDown` | `boolean` | True when not at bottom |
| `isAtTop` | `boolean` | True when at first row |
| `isAtBottom` | `boolean` | True when at last row |
| `percentage` | `number` | Scroll position 0--100 |
| `scrollUp()` | `() => void` | Scroll up by `scrollStep` |
| `scrollDown()` | `() => void` | Scroll down by `scrollStep` |
| `scrollTo(n)` | `(n: number) => void` | Jump to absolute offset |
| `scrollToTop()` | `() => void` | Jump to top |
| `scrollToBottom()` | `() => void` | Jump to bottom |
| `pageUp()` | `() => void` | Scroll up one full page |
| `pageDown()` | `() => void` | Scroll down one full page |
| `halfPageUp()` | `() => void` | Scroll up half a page |
| `halfPageDown()` | `() => void` | Scroll down half a page |

---

### `useScrollableInput(options)`

Wires Ink's `useInput` to a `UseScrollableResult`. Used internally by `ScrollableBox` but exported for custom UIs.

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `scroll` | `UseScrollableResult` | **required** | The scroll state object from `useScrollable` |
| `focusable` | `boolean` | `true` | Participate in Tab focus cycle |
| `autoFocus` | `boolean` | `false` | Auto-focus on mount |
| `id` | `string` | -- | Focus ID for programmatic focus |
| `enableVimBindings` | `boolean` | `true` | Enable vim-style keys |

**Returns:**

| Field | Type | Description |
|-------|------|-------------|
| `isFocused` | `boolean` | Whether the component currently has focus |

---

### `useLinkedScroll(options?)`

Synchronize scroll position across multiple `ScrollableBox` instances.

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mode` | `'absolute' \| 'proportional'` | `'absolute'` | `absolute` = same line offset, `proportional` = same percentage |
| `initialOffset` | `number` | `0` | Starting offset |

**Returns:**

| Field | Type | Description |
|-------|------|-------------|
| `offset` | `number` | Shared scroll offset |
| `onOffsetChange` | `(offset: number) => void` | Spread onto each `ScrollableBox` |
| `mode` | `'absolute' \| 'proportional'` | The active sync mode |

---

### `<Scrollbar />`

Standalone scrollbar component. Used internally but exported for custom layouts.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `offset` | `number` | **required** | Current scroll offset |
| `contentHeight` | `number` | **required** | Total content rows |
| `viewportHeight` | `number` | **required** | Visible rows |
| `isFocused` | `boolean` | **required** | Whether the parent is focused (affects color) |
| `scrollbarStyle` | `'block' \| 'line' \| 'thick' \| 'dots'` | `'block'` | Built-in visual style |
| `thumbCharacter` | `string` | per style | Override thumb character |
| `trackCharacter` | `string` | per style | Override track character |
| `thumbColor` | `string` | -- | Thumb color when focused |
| `thumbDimColor` | `string` | -- | Thumb color when unfocused |
| `trackColor` | `string` | -- | Track color |

---

### `ScrollableBoxRef`

All methods available on a ref obtained via `useRef<ScrollableBoxRef>()`.

| Method | Description |
|--------|-------------|
| `scrollTo(offset)` | Jump to a specific offset (clamped to valid range) |
| `scrollToTop()` | Jump to the top |
| `scrollToBottom()` | Jump to the bottom |
| `scrollUp()` | Scroll up by `scrollStep` lines |
| `scrollDown()` | Scroll down by `scrollStep` lines |
| `pageUp()` | Scroll up by one viewport height |
| `pageDown()` | Scroll down by one viewport height |
| `halfPageUp()` | Scroll up by half viewport height |
| `halfPageDown()` | Scroll down by half viewport height |
| `scrollToIndex(index, options?)` | Scroll to a specific item index with optional `{align: 'start' \| 'center' \| 'end' \| 'auto'}` |
| `getScrollState()` | Returns the current `ScrollState` object |
| `getItemHeight(index)` | Get the height of a child in terminal lines (returns 1 in non-measure mode) |
| `getItemPosition(index)` | Get `{top, height}` of a child, or `undefined` if out of range |
| `remeasureItem(index)` | Force re-measurement of a child (requires `measureChildren`) |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Up / k | Scroll up |
| Down / j | Scroll down |
| g | Jump to top |
| G (Shift+G) | Jump to bottom |
| Page Up / u | Scroll up one page |
| Page Down / d | Scroll down one page |
| Ctrl+U | Scroll up half page |
| Ctrl+D | Scroll down half page |
| Home | Jump to top |
| End | Jump to bottom |
| Tab | Move focus to next pane |

Vim bindings (j, k, g, G, u, d) can be disabled with `enableVimBindings={false}`. Arrow keys, Page Up/Down, Home/End, and Ctrl+U/D are always active when focused.

## Scrollbar Styles

Set `scrollbarStyle` to change the built-in look:

| Style | Thumb | Track |
|-------|-------|-------|
| `block` (default) | `█` | `░` |
| `line` | `│` | ` ` (space) |
| `thick` | `┃` | `╏` |
| `dots` | `●` | `·` |

The `block` style uses half-line precision rendering (▀/▄ characters) for smoother positioning. Override individual characters with `scrollbarCharacter` and `trackCharacter`.

## How It Works

**Lines mode** slices the content array to render only visible rows (`lines.slice(offset, offset + height)`). Render cost is O(viewport) regardless of content size -- 100,000 lines renders the same as 100.

**Children mode** renders only the visible subset of React children. When `measureChildren` is enabled, all children are rendered and measured for accurate scroll math with multi-line content (O(n) rendering).

The `useScrollable` hook manages offset state and exposes scroll actions. `useScrollableInput` wires Ink's `useInput` to those actions. `ScrollableBox` composes both internally.

## Comparison with Alternatives

| Feature | ink-scrollable-box | ink-scroll-view | ink-scrollbar |
|---------|--------------------|-----------------|---------------|
| Keyboard navigation | vim + arrows + Page + Home/End | -- | -- |
| Focus management | Tab cycling + autoFocus | -- | -- |
| followOutput | yes | -- | -- |
| Dual content modes | lines + children | children only | N/A |
| Scrollbar styles | 4 built-in + custom | -- | partial |
| Controlled mode | yes | -- | -- |
| Linked scroll | useLinkedScroll hook | -- | -- |
| Infinite scroll | onReachEnd / onReachStart | -- | -- |
| Standalone hooks | useScrollable, useScrollableInput | -- | -- |
| Ref API | scrollToIndex, getItemHeight, etc. | -- | -- |
| TypeScript | first-class | yes | yes |
| Dependencies | 0 (peer only) | 18 | 3 |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT
