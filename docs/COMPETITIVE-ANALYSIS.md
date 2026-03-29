# Competitive Analysis: ink-scrollable-box

## The Market

The Ink scrolling ecosystem has **43,000+ weekly downloads** across all packages but **zero complete solutions**. Every existing package makes the user do significant work themselves.

## Head-to-Head Comparison

### By the Numbers

| | ink-scrollable-box | ink-scroll-view | ink-scroll-list | ink-scrollbar |
|---|---|---|---|---|
| **Weekly downloads** | unpublished | 23,102 | 20,020 | 3,331 |
| **Last updated** | Mar 2026 | Feb 2026 | Jan 2026 | May 2022 |
| **Unpacked size** | 69 KB | 470 KB | ~200 KB | ~50 KB |
| **Runtime deps** | 0 | 0 | 1 (ink-scroll-view) | 0 |
| **Ink version** | >=4 | ^5 \|\| ^6 | >=6 | ^0.4 (dead) |
| **React version** | >=18 | ^18 \|\| ^19 | >=19 | ancient |
| **TypeScript** | strict, all types exported | yes | yes | JS only |
| **Tests** | 123 | unknown | unknown | none |
| **Coverage** | 100% stmt/fn/line | unknown | unknown | none |

### Lines of Code for "Scrollable List with Keyboard Navigation"

This is the real benchmark. How much does a user write to get a working scrollable list?

**ink-scrollable-box: 5 lines of JSX**
```tsx
import {ScrollableBox} from 'ink-scrollable-box';

<ScrollableBox height={15} lines={items} border />
// That's it. Keyboard nav, scrollbar, indicators — all included.
```

**ink-scroll-view: 45+ lines**
```tsx
import {useRef, useEffect} from 'react';
import {useInput, useStdout} from 'ink';
import {ScrollView} from 'ink-scroll-view';

const scrollRef = useRef(null);
const {stdout} = useStdout();

// Manual keyboard handler — user must write this
useInput((input, key) => {
  if (key.upArrow) scrollRef.current?.scrollBy(-1);
  if (key.downArrow) scrollRef.current?.scrollBy(1);
  if (key.pageUp) scrollRef.current?.scrollBy(-viewportHeight);
  if (key.pageDown) scrollRef.current?.scrollBy(viewportHeight);
  // No vim bindings, no half-page, no Home/End...
});

// Manual resize handler — user must write this
useEffect(() => {
  const onResize = () => scrollRef.current?.remeasure();
  stdout.on('resize', onResize);
  return () => stdout.off('resize', onResize);
}, [stdout]);

<ScrollView ref={scrollRef}>
  {items.map(item => <Text key={item.id}>{item.text}</Text>)}
</ScrollView>
```

**ink-scroll-list: 40+ lines**
```tsx
import {useState, useRef} from 'react';
import {useInput} from 'ink';
import {ScrollList} from 'ink-scroll-list';

const [selectedIndex, setSelectedIndex] = useState(0);
const scrollRef = useRef(null);

// Manual keyboard + selection handler — user must write this
useInput((input, key) => {
  if (key.upArrow) setSelectedIndex(i => Math.max(0, i - 1));
  if (key.downArrow) setSelectedIndex(i => Math.min(items.length - 1, i + 1));
});

<ScrollList ref={scrollRef} selectedIndex={selectedIndex}>
  {items.map((item, i) => (
    <Text key={item.id} color={i === selectedIndex ? 'blue' : undefined}>
      {item.text}
    </Text>
  ))}
</ScrollList>
```

**The ratio: 5 lines vs 40-45 lines. That's 8-9x less code for the same result.**

## The Five Moats

### 1. Zero-Config Keyboard Navigation

This is the **primary differentiator**. No other Ink scroll package includes keyboard handling.

Every competitor requires users to:
- Import `useInput` from Ink
- Write a keypress handler function
- Map keys to scroll actions manually
- Handle edge cases (clamping, focus gating)

We include:
- Arrow keys (always on)
- Vim bindings j/k/g/G/u/d (toggleable)
- Half-page Ctrl+U/Ctrl+D
- Page Up/Down
- Home/End
- All focus-gated automatically

**Why this matters:** CLI tools live or die by keyboard UX. Developers who use vim, tmux, and less expect j/k navigation in every terminal tool. Making them write 20 lines of boilerplate for something this fundamental is hostile DX.

### 2. Dual Content Modes (lines + children)

ink-scroll-view: children only. Must render all children and measure heights.
ink-scroll-list: children only. Selection-coupled scrolling.

ink-scrollable-box:
- **lines mode**: `string[]` input, O(viewport) slice rendering. Perfect for logs, file content, any text data.
- **children mode**: React nodes, 1-line assumption (or `measureChildren` for variable heights).

**Why this matters:** The #1 use case for terminal scrolling is log viewing. Log viewers work with string arrays, not React components. Being able to pass `lines={logArray}` and get O(viewport) rendering is a performance and ergonomics win that no competitor offers.

### 3. followOutput — The Log Viewer Primitive

No competitor has this.

```tsx
<ScrollableBox lines={logs} followOutput />
```

This single prop:
- Auto-scrolls to bottom when new content arrives
- Pauses auto-scroll when user scrolls up to read history
- Resumes when user returns to bottom

Building this with ink-scroll-view requires:
- Tracking `contentHeight` changes via callback
- Tracking whether user is at bottom
- Conditionally calling `scrollToBottom()` in a useEffect
- Managing the "user scrolled up" / "back at bottom" state

That's ~30 lines of stateful logic that's easy to get wrong. We make it one prop.

### 4. Multi-Pane Focus Management

```tsx
<Box flexDirection="row">
  <ScrollableBox id="left" lines={leftContent} border />
  <ScrollableBox id="right" lines={rightContent} border />
</Box>
```

Tab cycles focus between panes. Focused pane gets blue border and active keyboard. Unfocused pane is gray and ignores keys.

ink-scroll-view has zero focus awareness. Users must build their own focus system, which means:
- Custom focus state
- Conditional `useInput` activation
- Visual feedback for focus state
- Tab key handling

### 5. Composable Hook Architecture

```tsx
// For custom UIs that don't want our component:
const scroll = useScrollable({contentHeight: 1000, viewportHeight: 20});

// Build your own UI with full state access:
scroll.offset      // current position
scroll.percentage  // 0-100
scroll.isAtBottom  // boolean
scroll.scrollDown()  // action
scroll.halfPageUp()  // action
```

ink-scroll-view's API is ref-based and imperative. You call `scrollRef.current?.scrollBy(1)` — there's no reactive state, no derived values, no way to build a custom UI without their component.

Our hook is pure React state. It works with any rendering approach.

## What They Have That We Don't

| Feature | ink-scroll-view | We have it? |
|---------|----------------|-------------|
| Auto-measured child heights | Yes (measureElement) | Yes (`measureChildren` prop) |
| Controlled scroll mode | Yes (ControlledScrollView) | Yes (`offset`/`onOffsetChange`) |
| Remeasure on content change | Yes (remeasure method) | Partial (effect-based) |
| Mouse wheel | No | No (Ink limitation) |
| Horizontal scroll | No | No |

**There's nothing ink-scroll-view can do that we can't.** But there are 5 things we do that they can't.

## Why Users Will Switch

### User profile 1: Building a log viewer
Today: ink-scroll-view + 50 lines of keyboard/follow/resize boilerplate
With us: `<ScrollableBox lines={logs} followOutput border />` — done

### User profile 2: Building a multi-pane TUI
Today: ink-scroll-view + custom focus system + conditional input handlers
With us: Two `<ScrollableBox>` components. Tab works automatically.

### User profile 3: Building a file browser
Today: ink-scroll-list + manual selection state + manual keyboard handler
With us: `<ScrollableBox lines={files} />` + `useScrollable` for custom selection

## Launch Strategy

1. **Comment on ink#222** (6-year-old scrolling request) — "Built this to address this gap"
2. **Publish to npm** with high-quality README (badges, GIFs, comparison table)
3. **Timing advantage** — ink-scroll-view is the only real competitor and its 23K downloads prove demand. Its imperative API is fundamentally at odds with React's declarative model. We're the React-native alternative.
