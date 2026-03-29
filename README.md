# ink-scrollable-box

[![npm version](https://img.shields.io/npm/v/ink-scrollable-box.svg)](https://www.npmjs.com/package/ink-scrollable-box)
[![CI](https://github.com/costajohnt/ink-scrollable-box/actions/workflows/ci.yml/badge.svg)](https://github.com/costajohnt/ink-scrollable-box/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Scrollable container component for Ink with keyboard navigation, vim bindings, and auto-follow.

## Install

```bash
npm install ink-scrollable-box
yarn add ink-scrollable-box
pnpm add ink-scrollable-box
```

Requires `ink >= 4` and `react >= 18` as peer dependencies.

## Quick Start — Lines Mode

Pass an array of strings via `lines` for the simplest scrollable list:

```tsx
import React from 'react';
import {render, Box, Text} from 'ink';
import {ScrollableBox} from 'ink-scrollable-box';

const lines = Array.from({length: 100}, (_, i) => `Item ${i + 1}`);

function App() {
  return (
    <Box flexDirection="column">
      <Text bold>Basic ScrollableBox — 100 items (j/k/g/G to navigate)</Text>
      <ScrollableBox height={15} lines={lines} border />
    </Box>
  );
}

render(<App />);
```

## Children Mode

Pass React nodes as children for full styling control:

```tsx
import React from 'react';
import {render, Box, Text} from 'ink';
import {ScrollableBox} from 'ink-scrollable-box';

const items = [
  {status: 'pass', text: 'Build succeeded'},
  {status: 'fail', text: 'Test: auth.test.ts failed'},
  {status: 'warn', text: 'Coverage: 89% (below 95% threshold)'},
];

const colors = {pass: 'green', warn: 'yellow', fail: 'red'};
const icons = {pass: '✔', warn: '⚠', fail: '✘'};

function App() {
  return (
    <ScrollableBox height={6} border>
      {items.map((item, i) => (
        <Text key={i} color={colors[item.status]}>
          {icons[item.status]} {item.text}
        </Text>
      ))}
    </ScrollableBox>
  );
}

render(<App />);
```

## Log Follower

Use `followOutput` to auto-scroll to new content as it streams in. Scroll up manually to pause following:

```tsx
import React, {useState, useEffect} from 'react';
import {render, Box, Text} from 'ink';
import {ScrollableBox} from 'ink-scrollable-box';

function App() {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLogs(prev => [
        ...prev,
        `[${new Date().toISOString()}] Log entry #${prev.length + 1}`,
      ]);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box flexDirection="column">
      <Text dimColor>{logs.length} entries</Text>
      <ScrollableBox height={15} lines={logs} followOutput border />
    </Box>
  );
}

render(<App />);
```

## useScrollable Hook

Use the standalone hook to build a fully custom scroll UI:

```tsx
import React from 'react';
import {render, Box, Text} from 'ink';
import {useScrollable} from 'ink-scrollable-box';

const data = Array.from({length: 50}, (_, i) => `Record ${i + 1}`);

function App() {
  const scroll = useScrollable({
    contentHeight: data.length,
    viewportHeight: 10,
    scrollStep: 3,
  });

  const visible = data.slice(scroll.offset, scroll.offset + 10);

  return (
    <Box flexDirection="column">
      <Text dimColor>
        Offset: {scroll.offset} | {scroll.percentage}% |{' '}
        {scroll.isAtTop ? 'TOP' : scroll.isAtBottom ? 'BOTTOM' : 'MIDDLE'}
      </Text>
      <Box flexDirection="column" borderStyle="round" borderColor="gray">
        {visible.map((line, i) => (
          <Text key={scroll.offset + i}>{line}</Text>
        ))}
      </Box>
    </Box>
  );
}

render(<App />);
```

## Multi-Pane

Use `id` to identify panes and Tab to cycle focus between them:

```tsx
import React from 'react';
import {render, Box, Text} from 'ink';
import {ScrollableBox} from 'ink-scrollable-box';

const leftLines = Array.from({length: 30}, (_, i) => `Left-${i + 1}`);
const rightLines = Array.from({length: 50}, (_, i) => `Right-${i + 1}`);

function App() {
  return (
    <Box flexDirection="row" gap={2}>
      <Box flexDirection="column">
        <Text dimColor>Panel A</Text>
        <ScrollableBox height={10} lines={leftLines} border id="left" />
      </Box>
      <Box flexDirection="column">
        <Text dimColor>Panel B</Text>
        <ScrollableBox height={10} lines={rightLines} border id="right" />
      </Box>
    </Box>
  );
}

render(<App />);
```

## API Reference

### `<ScrollableBox />`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `height` | `number` | required | Visible row count of the viewport |
| `lines` | `string[]` | — | Content in lines mode |
| `children` | `ReactNode` | — | Content in children mode |
| `followOutput` | `boolean` | `false` | Auto-scroll to bottom when content grows |
| `scrollStep` | `number` | `1` | Rows moved per j/k or arrow key press |
| `border` | `boolean` | `false` | Render a rounded border around the box |
| `showScrollbar` | `boolean` | `true` | Show the proportional scrollbar |
| `showIndicators` | `boolean` | `true` | Show ▲/▼ overflow indicators |
| `focusable` | `boolean` | `true` | Allow keyboard focus via Tab |
| `id` | `string` | — | Focus id for multi-pane Tab cycling |
| `onScroll` | `(state: ScrollState) => void` | — | Called on every scroll position change |
| `scrollbarCharacter` | `string` | `█` | Character for the scrollbar thumb |
| `trackCharacter` | `string` | `░` | Character for the scrollbar track |
| `upIndicator` | `string` | `▲` | Character for the top overflow indicator |
| `downIndicator` | `string` | `▼` | Character for the bottom overflow indicator |
| `scrollbarColor` | `string` | — | Color of the scrollbar thumb |
| `scrollbarDimColor` | `string` | — | Dim color of the scrollbar thumb |
| `trackColor` | `string` | — | Color of the scrollbar track |
| `borderColor` | `string` | — | Border color when focused |
| `borderDimColor` | `string` | `gray` | Border color when unfocused |
| `enableVimBindings` | `boolean` | `true` | Toggle vim-style keybindings (j/k/g/G/u/d) |
| `onFocus` | `() => void` | — | Called when the component gains focus |
| `onBlur` | `() => void` | — | Called when the component loses focus |
| `overscan` | `number` | `0` | Extra items to pre-render above/below viewport |
| `offset` | `number` | — | Controlled scroll offset (makes component controlled) |
| `onOffsetChange` | `(offset: number) => void` | — | Called when offset changes in controlled mode |
| `measureChildren` | `boolean` | `false` | Enable measurement of multi-line children heights |
| `mouseWheel` | `boolean` | `false` | Reserved for future mouse wheel support |
| `mouseWheelLines` | `number` | `3` | Lines per mouse wheel tick (reserved) |

### `useScrollable(options)`

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `contentHeight` | `number` | required | Total number of content rows |
| `viewportHeight` | `number` | required | Visible row count |
| `scrollStep` | `number` | `1` | Rows per scroll action |
| `followOutput` | `boolean` | `false` | Auto-scroll when content grows |
| `initialOffset` | `number` | `0` | Starting scroll position |
| `controlledOffset` | `number` | — | External controlled offset (overrides internal state) |
| `onOffsetChange` | `(offset: number) => void` | — | Called when offset would change (for controlled mode) |

**Returns (`UseScrollableResult`):**

| Field | Type | Description |
|-------|------|-------------|
| `offset` | `number` | Current scroll offset (first visible row index) |
| `contentHeight` | `number` | Total content rows |
| `viewportHeight` | `number` | Visible rows |
| `canScrollUp` | `boolean` | True when not at top |
| `canScrollDown` | `boolean` | True when not at bottom |
| `isAtTop` | `boolean` | True when at first row |
| `isAtBottom` | `boolean` | True when at last row |
| `percentage` | `number` | Scroll position 0–100 |
| `scrollUp()` | `() => void` | Scroll up by `scrollStep` |
| `scrollDown()` | `() => void` | Scroll down by `scrollStep` |
| `scrollTo(n)` | `(n: number) => void` | Jump to absolute offset |
| `scrollToTop()` | `() => void` | Jump to top |
| `scrollToBottom()` | `() => void` | Jump to bottom |
| `pageUp()` | `() => void` | Scroll up one full page |
| `pageDown()` | `() => void` | Scroll down one full page |
| `halfPageUp()` | `() => void` | Scroll up half a page |
| `halfPageDown()` | `() => void` | Scroll down half a page |

### `ScrollableBoxRef`

Use a ref to control scrolling programmatically from a parent component:

```tsx
import {useRef} from 'react';
import {ScrollableBox, ScrollableBoxRef} from 'ink-scrollable-box';

const ref = useRef<ScrollableBoxRef>(null);
<ScrollableBox ref={ref} height={10} lines={lines} />

// Methods available on ref:
ref.current.scrollTo(offset)
ref.current.scrollToTop()
ref.current.scrollToBottom()
ref.current.scrollUp()
ref.current.scrollDown()
ref.current.pageUp()
ref.current.pageDown()
ref.current.halfPageUp()
ref.current.halfPageDown()
ref.current.scrollToIndex(5, {align: 'center'})
ref.current.getScrollState()
```

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
| `scrollToIndex(index, options?)` | Scroll to a specific item index with optional `{align: 'start' \| 'center' \| 'end'}` |
| `getScrollState()` | Returns the current `ScrollState` object |

### `<Scrollbar />`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `offset` | `number` | required | Current scroll offset |
| `contentHeight` | `number` | required | Total content rows |
| `viewportHeight` | `number` | required | Visible rows |
| `scrollbarCharacter` | `string` | `█` | Thumb character |
| `trackCharacter` | `string` | `░` | Track character |
| `scrollbarColor` | `string` | — | Thumb color |
| `scrollbarDimColor` | `string` | — | Thumb dim color |
| `trackColor` | `string` | — | Track color |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| ↑ / k | Scroll up |
| ↓ / j | Scroll down |
| g | Jump to top |
| G (shift+g) | Jump to bottom |
| Page Up / u | Scroll up one page |
| Page Down / d | Scroll down one page |
| Ctrl+U | Scroll up half page |
| Ctrl+D | Scroll down half page |
| Home | Jump to top |
| End | Jump to bottom |

Keys are only active when the component has focus. Use Tab to move focus between panes.

## Controlled Mode

Pass `offset` and `onOffsetChange` to manage scroll position externally:

```tsx
import React, {useState} from 'react';
import {ScrollableBox} from 'ink-scrollable-box';

const lines = Array.from({length: 100}, (_, i) => `Item ${i + 1}`);

function App() {
  const [offset, setOffset] = useState(0);
  return <ScrollableBox height={10} lines={lines} offset={offset} onOffsetChange={setOffset} />;
}
```

## Ref API

Use a ref for programmatic scroll control from a parent component:

```tsx
import React, {useRef} from 'react';
import {render, Box, Text} from 'ink';
import {ScrollableBox, ScrollableBoxRef} from 'ink-scrollable-box';

const lines = Array.from({length: 100}, (_, i) => `Item ${i + 1}`);

function App() {
  const ref = useRef<ScrollableBoxRef>(null);

  return (
    <Box flexDirection="column">
      <ScrollableBox ref={ref} height={10} lines={lines} border />
      <Text dimColor>Use ref.current.scrollToIndex(50) to jump to item 50</Text>
    </Box>
  );
}

render(<App />);
```

## Variable-Height Children

By default, each child is assumed to render as exactly 1 terminal line. If your children span multiple lines (e.g., wrapped text), set `measureChildren` to enable accurate scroll math:

```tsx
<ScrollableBox height={10} measureChildren>
  <Text>This is a short line</Text>
  <Text wrap="wrap">
    This is a much longer line that will wrap across multiple terminal rows,
    which would normally cause scroll math to be incorrect.
  </Text>
</ScrollableBox>
```

When `measureChildren` is `true`, all children are rendered and measured (O(n) rendering). When `false` (the default), only visible children are rendered (O(viewport) rendering). Use `lines` mode for the best performance with large datasets.

## Customization

**Custom scrollbar characters and colors:**

```tsx
<ScrollableBox
  height={20}
  lines={lines}
  scrollbarCharacter="▐"
  trackCharacter="│"
  scrollbarColor="cyan"
  trackColor="gray"
/>
```

**Border styling:**

```tsx
<ScrollableBox
  height={20}
  lines={lines}
  border
  borderColor="blue"
  borderDimColor="gray"
/>
```

**Disable scrollbar or indicators:**

```tsx
<ScrollableBox height={20} lines={lines} showScrollbar={false} showIndicators={false} />
```

## How It Works

`ScrollableBox` slices the content array to render only the rows visible in the viewport (`lines.slice(offset, offset + height)`). This gives O(viewport) render cost regardless of content size — a list of 100,000 lines renders the same as a list of 100.

The `useScrollable` hook manages offset state and exposes action functions. `useScrollableInput` wires Ink's `useInput` to those actions and is used internally by `ScrollableBox`, but is also exported for custom keyboard handling.

## Comparison with Alternatives

| Feature | ink-scrollable-box | ink-scroll-view | ink-scrollbar |
|---------|--------------------|-----------------|---------------|
| Keyboard navigation | ✅ vim + arrows + Page | ❌ | ❌ |
| Focus management | ✅ Tab cycling | ❌ | ❌ |
| followOutput | ✅ | ❌ | ❌ |
| Dual content modes | ✅ lines + children | ❌ children only | N/A |
| Standalone hook | ✅ useScrollable | ❌ | ❌ |
| TypeScript | ✅ first-class | ✅ | ✅ |
| Custom theming | ✅ characters + colors | ❌ | Partial |
| Dependencies | 0 (peer only) | 18 | 3 |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT
