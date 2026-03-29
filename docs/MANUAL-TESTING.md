# Manual Testing Strategy

Run each section in order. Every test is a concrete action with an expected result.

Prerequisites:
```bash
cd /Users/johncosta/dev/ink-scrollable-box
npm install  # if not already done
```

---

## 1. Smoke Test — Basic Rendering

### 1.1 Basic lines mode
```bash
npx tsx examples/basic.tsx
```
**Verify:**
- [ ] 15-line viewport with border renders
- [ ] "Item 1" through ~"Item 15" visible
- [ ] Scrollbar (█/░) on the right edge
- [ ] ▼ indicator at bottom (content below)
- [ ] No ▲ indicator (already at top)

**Exit:** Ctrl+C

### 1.2 Empty lines
```bash
npx tsx -e "
import React from 'react';
import {render, Box, Text} from 'ink';
import {ScrollableBox} from './src/index.js';
function App() { return <ScrollableBox height={5} lines={[]} />; }
render(<App />);
"
```
**Verify:**
- [ ] No crash
- [ ] Empty viewport renders (may be blank)
- [ ] No scrollbar, no indicators

### 1.3 Content fits viewport (no overflow)
```bash
npx tsx -e "
import React from 'react';
import {render, Text} from 'ink';
import {ScrollableBox} from './src/index.js';
const lines = ['One', 'Two', 'Three'];
function App() { return <ScrollableBox height={10} lines={lines} border />; }
render(<App />);
"
```
**Verify:**
- [ ] All 3 lines visible
- [ ] No scrollbar
- [ ] No indicators
- [ ] j/k keys do nothing (no content to scroll)

---

## 2. Keyboard Navigation

### 2.1 All keybindings
```bash
npx tsx examples/basic.tsx
```

Press Tab to ensure focus, then test each key:

| Key | Expected | Verify |
|-----|----------|--------|
| `j` | Scroll down 1 line | [ ] "Item 2" at top |
| `k` | Scroll up 1 line | [ ] "Item 1" at top again |
| `↓` (arrow) | Scroll down 1 line | [ ] Same as `j` |
| `↑` (arrow) | Scroll up 1 line | [ ] Same as `k` |
| `G` (shift+g) | Jump to bottom | [ ] "Item 100" visible, ▲ at top |
| `g` | Jump to top | [ ] "Item 1" at top, ▼ at bottom |
| `d` | Page down (full viewport) | [ ] Jumps ~15 items |
| `u` | Page up (full viewport) | [ ] Jumps ~15 items back |
| `Ctrl+D` | Half-page down | [ ] Jumps ~7 items |
| `Ctrl+U` | Half-page up | [ ] Jumps ~7 items back |
| `End` | Jump to bottom | [ ] Same as `G` |
| `Home` | Jump to top | [ ] Same as `g` |
| `Page Down` | Full page down | [ ] Same as `d` |
| `Page Up` | Full page up | [ ] Same as `u` |

### 2.2 Scrollbar tracks position
While in `examples/basic.tsx`:
- [ ] At top: thumb (█) at very top of scrollbar track
- [ ] Press `G` (bottom): thumb at very bottom
- [ ] Press `g` then scroll halfway: thumb roughly centered
- [ ] Scrollbar thumb size is proportional (small for 100 items in 15-line viewport)

### 2.3 Overflow indicators
- [ ] At top: only ▼ visible
- [ ] In middle: both ▲ and ▼ visible
- [ ] At bottom: only ▲ visible

---

## 3. Children Mode

### 3.1 Styled children
```bash
npx tsx examples/children-mode.tsx
```
**Verify:**
- [ ] Colored text renders (green ✔, yellow ⚠, red ✘)
- [ ] Scrolling works same as lines mode
- [ ] Colors persist after scrolling (not stripped)

---

## 4. followOutput (Log Streaming)

### 4.1 Auto-scroll behavior
```bash
npx tsx examples/log-follower.tsx
```
**Verify:**
- [ ] New log entries appear at bottom automatically
- [ ] Viewport auto-scrolls to show newest entry
- [ ] Counter increments in header

### 4.2 Pause on manual scroll
While log-follower is running:
- [ ] Press `k` or `↑` to scroll up — auto-scroll STOPS
- [ ] New entries still appear (counter increments) but viewport stays put
- [ ] Press `G` to jump to bottom — auto-scroll RESUMES
- [ ] Verify auto-scroll only resumes when you're actually at the bottom

---

## 5. Multi-Pane Focus

### 5.1 Tab cycling
```bash
npx tsx examples/multi-pane.tsx
```
**Verify:**
- [ ] Two panels render side by side with borders
- [ ] Press `Tab` — first panel gets focus (border turns blue)
- [ ] `j`/`k` scrolls Panel A only, Panel B unchanged
- [ ] Press `Tab` — focus moves to Panel B (border turns blue, A turns gray)
- [ ] `j`/`k` scrolls Panel B only, Panel A unchanged
- [ ] Press `Tab` again — focus cycles back to Panel A

### 5.2 Independent scroll state
- [ ] Scroll Panel A to middle
- [ ] Tab to Panel B, scroll to bottom
- [ ] Tab back to Panel A — it's still at middle position (not reset)

---

## 6. Theming

### 6.1 Custom characters and colors
```bash
npx tsx examples/themed.tsx
```
**Verify:**
- [ ] Scrollbar uses ▓ (not default █)
- [ ] Track uses ░
- [ ] Border is cyan colored (when focused)
- [ ] Indicators say "↑ more" / "↓ more" (not default ▲/▼)
- [ ] Colors change when unfocused (Tab away if another component exists)

---

## 7. Performance

### 7.1 Large dataset
```bash
npx tsx examples/large-dataset.tsx
```
**Verify:**
- [ ] Renders instantly (< 1 second to first frame)
- [ ] `G` (jump to bottom) is instant — shows line [099999]
- [ ] `g` (jump to top) is instant — shows line [000000]
- [ ] Scrolling with `j`/`k` is smooth, no perceptible lag
- [ ] Hold down `j` — rapid scrolling is smooth, no jank

### 7.2 Memory (eyeball test)
While large-dataset is running:
- [ ] Terminal is responsive
- [ ] No growing memory (if you have Activity Monitor open, Node process stays stable)

---

## 8. Border Behavior

### 8.1 Border with height accounting
```bash
npx tsx -e "
import React from 'react';
import {render, Text} from 'ink';
import {ScrollableBox} from './src/index.js';
const lines = Array.from({length: 20}, (_, i) => 'Line ' + (i+1));
function App() { return <ScrollableBox height={7} lines={lines} border />; }
render(<App />);
"
```
**Verify:**
- [ ] Border renders (╭╮╰╯ characters visible)
- [ ] 5 lines visible inside border (height=7, minus 2 for border = 5)
- [ ] Scrollbar inside the border

---

## 9. Edge Cases

### 9.1 height=1 (minimum viewport)
```bash
npx tsx -e "
import React from 'react';
import {render} from 'ink';
import {ScrollableBox} from './src/index.js';
const lines = Array.from({length: 10}, (_, i) => 'Line ' + (i+1));
function App() { return <ScrollableBox height={1} lines={lines} />; }
render(<App />);
"
```
**Verify:**
- [ ] Single line visible
- [ ] Scrolling works (j/k changes the visible line)
- [ ] No crash

### 9.2 Single line of content
```bash
npx tsx -e "
import React from 'react';
import {render} from 'ink';
import {ScrollableBox} from './src/index.js';
function App() { return <ScrollableBox height={5} lines={['Only line']} />; }
render(<App />);
"
```
**Verify:**
- [ ] "Only line" renders
- [ ] No scrollbar, no indicators
- [ ] j/k do nothing

### 9.3 Unicode and emoji in lines
```bash
npx tsx -e "
import React from 'react';
import {render} from 'ink';
import {ScrollableBox} from './src/index.js';
const lines = ['🚀 Launch', '✅ Pass', '❌ Fail', '⚠️ Warn', '📦 Package', '🔧 Fix', '🎯 Target', '💡 Idea', '🐛 Bug', '🔒 Secure'];
function App() { return <ScrollableBox height={5} lines={lines} border />; }
render(<App />);
"
```
**Verify:**
- [ ] Emoji render correctly
- [ ] Scrolling works, no layout corruption
- [ ] Scrollbar aligned properly

---

## 10. Controlled Mode

### 10.1 External offset control
```bash
npx tsx -e "
import React, {useState, useEffect} from 'react';
import {render, Box, Text, useInput} from 'ink';
import {ScrollableBox} from './src/index.js';
const lines = Array.from({length: 50}, (_, i) => 'Line ' + (i+1));
function App() {
  const [offset, setOffset] = useState(0);
  useInput((input) => {
    if (input === 'n') setOffset(o => Math.min(o + 5, 40));
    if (input === 'p') setOffset(o => Math.max(o - 5, 0));
  });
  return (
    <Box flexDirection='column'>
      <Text>Controlled mode — press n/p to jump by 5 (offset: {offset})</Text>
      <ScrollableBox height={8} lines={lines} offset={offset} onOffsetChange={setOffset} border />
    </Box>
  );
}
render(<App />);
"
```
**Verify:**
- [ ] `n` jumps forward 5 lines
- [ ] `p` jumps back 5 lines
- [ ] Arrow keys / j/k also work (update offset through onOffsetChange)
- [ ] Offset counter in header updates for all scroll methods

---

## 11. Ref API

### 11.1 Programmatic scrolling
```bash
npx tsx -e "
import React, {useRef} from 'react';
import {render, Box, Text, useInput} from 'ink';
import {ScrollableBox} from './src/index.js';
const lines = Array.from({length: 50}, (_, i) => 'Line ' + (i+1));
function App() {
  const ref = useRef(null);
  useInput((input) => {
    if (input === '1') ref.current?.scrollToIndex(0, {align: 'start'});
    if (input === '5') ref.current?.scrollToIndex(24, {align: 'center'});
    if (input === '9') ref.current?.scrollToIndex(49, {align: 'end'});
    if (input === 's') { const st = ref.current?.getScrollState(); console.log(JSON.stringify(st)); }
  });
  return (
    <Box flexDirection='column'>
      <Text>Ref API — 1=top, 5=center Line 25, 9=bottom Line 50</Text>
      <ScrollableBox ref={ref} height={8} lines={lines} border />
    </Box>
  );
}
render(<App />);
"
```
**Verify:**
- [ ] Press `1` — jumps to top
- [ ] Press `5` — Line 25 centered in viewport
- [ ] Press `9` — Line 50 at bottom of viewport

---

## 12. Vim Toggle

### 12.1 Disable vim bindings
```bash
npx tsx -e "
import React from 'react';
import {render, Box, Text} from 'ink';
import {ScrollableBox} from './src/index.js';
const lines = Array.from({length: 30}, (_, i) => 'Line ' + (i+1));
function App() { return (
  <Box flexDirection='column'>
    <Text>Vim bindings DISABLED — arrows work, j/k/g/G do nothing</Text>
    <ScrollableBox height={8} lines={lines} enableVimBindings={false} border />
  </Box>
); }
render(<App />);
"
```
**Verify:**
- [ ] `j`, `k`, `g`, `G`, `u`, `d` have NO effect
- [ ] Arrow keys still work
- [ ] Page Up/Down still work
- [ ] Ctrl+U/D still work
- [ ] Home/End still work

---

## 13. Package Installation Test

### 13.1 Install as dependency
```bash
cd /tmp && mkdir scroll-test && cd scroll-test
npm init -y
npm install /Users/johncosta/dev/ink-scrollable-box ink react
```

Create `test.tsx`:
```tsx
import React from 'react';
import {render, Text} from 'ink';
import {ScrollableBox} from 'ink-scrollable-box';
const lines = Array.from({length: 20}, (_, i) => `Item ${i + 1}`);
function App() { return <ScrollableBox height={10} lines={lines} />; }
render(<App />);
```

```bash
npx tsx test.tsx
```

**Verify:**
- [ ] Imports resolve correctly
- [ ] Component renders
- [ ] Scrolling works
- [ ] Clean up: `cd /Users/johncosta/dev && rm -rf /tmp/scroll-test`

---

## Summary Checklist

| Section | Tests | Status |
|---------|-------|--------|
| 1. Smoke test | 3 | [ ] |
| 2. Keyboard | 3 | [ ] |
| 3. Children mode | 1 | [ ] |
| 4. followOutput | 2 | [ ] |
| 5. Multi-pane | 2 | [ ] |
| 6. Theming | 1 | [ ] |
| 7. Performance | 2 | [ ] |
| 8. Border | 1 | [ ] |
| 9. Edge cases | 3 | [ ] |
| 10. Controlled mode | 1 | [ ] |
| 11. Ref API | 1 | [ ] |
| 12. Vim toggle | 1 | [ ] |
| 13. Package install | 1 | [ ] |
| **Total** | **22 test scenarios** | |
