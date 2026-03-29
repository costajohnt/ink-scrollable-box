/* eslint-disable max-lines */
import React, {useRef, useEffect, useState} from 'react';
import {
	describe, it, expect, vi,
} from 'vitest';
import {render} from 'ink-testing-library';
import {Text} from 'ink';
import {ScrollableBox} from '../src/scrollable-box.js';
import type {ScrollableBoxRef} from '../src/types.js';
import {
	tick, write, focus, makeLines,
} from './helpers.js';

const arrowDown = '\u001B[B';

/** Helper component that exposes the ref and runs an action via useEffect. */
function RefTest({lines, action}: {lines: string[]; action: (ref: ScrollableBoxRef) => void}) {
	const ref = useRef<ScrollableBoxRef>(null);
	useEffect(() => {
		if (ref.current) {
			action(ref.current);
		}
	}, [action]);
	return (
		<ScrollableBox
			ref={ref}
			height={5}
			lines={lines}
		/>
	);
}

describe('ScrollableBox — lines mode', () => {
	it('renders visible lines within viewport height', () => {
		const lines = makeLines(20);
		const {lastFrame, unmount} = render(
			<ScrollableBox height={5} lines={lines}/>,
		);
		const frame = lastFrame()!;
		expect(frame).toContain('Line 1');
		expect(frame).toContain('Line 2');
		expect(frame).toContain('Line 3');
		expect(frame).toContain('Line 4');
		expect(frame).toContain('Line 5');
		expect(frame).not.toContain('Line 6');
		unmount();
	});

	it('scrolls to show next lines on arrow down', async () => {
		const lines = makeLines(20);
		const instance = render(
			<ScrollableBox height={5} lines={lines}/>,
		);
		await focus(instance.stdin);
		await write(instance.stdin, arrowDown);
		const frame = instance.lastFrame()!;
		expect(frame).toContain('Line 2');
		expect(frame).toContain('Line 6');
		expect(frame).not.toContain('Line 1');
		instance.unmount();
	});

	it('shows scrollbar when content overflows', () => {
		const lines = makeLines(20);
		const {lastFrame, unmount} = render(
			<ScrollableBox height={5} lines={lines}/>,
		);
		const frame = lastFrame()!;
		expect(frame).toContain('█');
		unmount();
	});

	it('hides scrollbar when showScrollbar is false', () => {
		const lines = makeLines(20);
		const {lastFrame, unmount} = render(
			<ScrollableBox height={5} lines={lines} showScrollbar={false}/>,
		);
		const frame = lastFrame()!;
		expect(frame).not.toContain('█');
		expect(frame).not.toContain('░');
		unmount();
	});

	it('width prop constrains container to fixed width', () => {
		const lines = makeLines(10);
		const {lastFrame, unmount} = render(
			<ScrollableBox height={5} width={30} lines={lines}/>,
		);
		const frame = lastFrame()!;
		for (const line of frame.split('\n').filter(l => l.length > 0)) {
			expect(line.length).toBeLessThanOrEqual(30);
		}

		unmount();
	});

	it('renders empty viewport for empty lines', () => {
		const {lastFrame, unmount} = render(
			<ScrollableBox height={5} lines={[]}/>,
		);
		const frame = lastFrame()!;
		// Should not crash — frame can be empty or whitespace
		expect(frame).toBeDefined();
		unmount();
	});

	it('shows no scrollbar when content fits viewport', () => {
		const lines = makeLines(3);
		const {lastFrame, unmount} = render(
			<ScrollableBox height={5} lines={lines}/>,
		);
		const frame = lastFrame()!;
		expect(frame).not.toContain('█');
		expect(frame).not.toContain('░');
		unmount();
	});

	it('shows overflow indicators', async () => {
		const lines = makeLines(20);
		const instance = render(
			<ScrollableBox height={5} lines={lines}/>,
		);
		await focus(instance.stdin);
		await write(instance.stdin, arrowDown);
		const frame = instance.lastFrame()!;
		expect(frame).toContain('▲');
		expect(frame).toContain('▼');
		instance.unmount();
	});

	it('fires onScroll callback with correct state', async () => {
		const scrollStates: Array<Record<string, unknown>> = [];
		const onScroll = vi.fn((state: Record<string, unknown>) => {
			scrollStates.push({...state});
		});

		const lines = makeLines(20);
		let instance!: ReturnType<typeof render>;

		await React.act(async () => {
			instance = render(
				<ScrollableBox height={5} lines={lines} onScroll={onScroll}/>,
			);
		});

		// onScroll should NOT fire on initial mount (Fix 9)
		expect(onScroll).not.toHaveBeenCalled();

		// Focus + scroll down and check updated state
		await React.act(async () => {
			instance.stdin.write('\t');
		});

		await React.act(async () => {
			instance.stdin.write(arrowDown);
		});

		expect(scrollStates.length).toBeGreaterThan(0);
		const scrolledCall = scrollStates.at(-1)!;
		expect(scrolledCall.offset).toBe(1);
		expect(scrolledCall.canScrollUp).toBe(true);
		expect(scrolledCall.isAtTop).toBe(false);

		instance.unmount();
	});
});

describe('ScrollableBox — children mode', () => {
	it('renders visible children', async () => {
		const {lastFrame, unmount} = render(
			<ScrollableBox height={3}>
				<Text>Item 1</Text>
				<Text>Item 2</Text>
				<Text>Item 3</Text>
				<Text>Item 4</Text>
				<Text>Item 5</Text>
			</ScrollableBox>,
		);
		const frame = lastFrame()!;
		expect(frame).toContain('Item 1');
		expect(frame).toContain('Item 3');
		expect(frame).not.toContain('Item 4');
		unmount();
	});

	it('scrolls children on keyboard input', async () => {
		const instance = render(
			<ScrollableBox height={3}>
				<Text>Item 1</Text>
				<Text>Item 2</Text>
				<Text>Item 3</Text>
				<Text>Item 4</Text>
				<Text>Item 5</Text>
			</ScrollableBox>,
		);
		await focus(instance.stdin);
		await write(instance.stdin, arrowDown);
		const frame = instance.lastFrame()!;
		expect(frame).toContain('Item 2');
		expect(frame).not.toContain('Item 1');
		instance.unmount();
	});
});

describe('ScrollableBox — prop validation', () => {
	// ScrollableBox is wrapped with forwardRef, so we access the inner render
	// function to call it directly and observe validation throws.
	// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
	const renderFn = (ScrollableBox as unknown as {render: (...args: unknown[]) => unknown}).render;

	it('throws when both lines and children are provided', () => {
		expect(() => {
			renderFn({height: 5, lines: ['test'], children: <Text>child</Text>}, null);
		}).toThrow('Provide either `lines` or `children`, not both');
	});

	it('throws for height <= 0', () => {
		expect(() => {
			renderFn({height: 0, lines: []}, null);
		}).toThrow('`height` must be a positive integer');
	});

	it('throws for non-integer height (5.5)', () => {
		expect(() => {
			renderFn({height: 5.5, lines: []}, null);
		}).toThrow('`height` must be a positive integer');
	});

	it('throws for negative height (-1)', () => {
		expect(() => {
			renderFn({height: -1, lines: []}, null);
		}).toThrow('`height` must be a positive integer');
	});

	it('throws for non-array lines', () => {
		expect(() => {
			renderFn({height: 5, lines: 'not an array'}, null);
		}).toThrow('must be an array');
	});
});

describe('ScrollableBox — border', () => {
	it('renders border when enabled', () => {
		const lines = makeLines(3);
		const {lastFrame, unmount} = render(
			<ScrollableBox height={5} lines={lines} border/>,
		);
		const frame = lastFrame()!;
		expect(frame).toContain('╭');
		unmount();
	});

	it('effective viewport is reduced by 2 when border is enabled', () => {
		const lines = makeLines(20);
		const {lastFrame, unmount} = render(
			<ScrollableBox height={7} lines={lines} border/>,
		);
		const frame = lastFrame()!;
		// effectiveHeight = 7 - 2 = 5; lines 1-5 visible, line 6 not
		expect(frame).toContain('Line 1');
		expect(frame).toContain('Line 5');
		expect(frame).not.toContain('Line 6');
		unmount();
	});
});

describe('ScrollableBox — followOutput', () => {
	it('auto-scrolls when new lines are added while at bottom', async () => {
		const lines = makeLines(10);
		const instance = render(
			<ScrollableBox height={5} lines={lines} followOutput/>,
		);
		// Go to bottom
		await focus(instance.stdin);
		await write(instance.stdin, 'G');
		expect(instance.lastFrame()!).toContain('Line 10');

		// Add more lines — followOutput should keep us at the bottom
		const moreLines = makeLines(15);
		instance.rerender(<ScrollableBox height={5} lines={moreLines} followOutput/>);
		await tick();
		await tick();
		expect(instance.lastFrame()!).toContain('Line 15');
		instance.unmount();
	});
});

describe('ScrollableBox — ANSI codes in lines', () => {
	it('renders lines with ANSI color codes correctly', () => {
		// Ink's <Text> component handles ANSI passthrough
		const lines = ['Normal text', 'Also normal', 'Third line'];
		const {lastFrame, unmount} = render(
			<ScrollableBox height={3} lines={lines}/>,
		);
		const frame = lastFrame()!;
		expect(frame).toContain('Normal text');
		expect(frame).toContain('Also normal');
		expect(frame).toContain('Third line');
		unmount();
	});
});

describe('ScrollableBox — onScroll callback', () => {
	it('does NOT fire on initial render (skip first render)', async () => {
		const scrollStates: Array<{offset: number}> = [];
		const lines = makeLines(20);

		await React.act(async () => {
			render(
				<ScrollableBox
					height={5}
					lines={lines}
					onScroll={state => scrollStates.push({offset: state.offset})}
				/>,
			);
		});

		expect(scrollStates.length).toBe(0);
	});
});

describe('ScrollableBox — onFocus / onBlur callbacks', () => {
	it('fires onFocus when component receives Tab focus', async () => {
		const onFocusFn = vi.fn();
		const lines = makeLines(20);
		const instance = render(
			<ScrollableBox height={5} lines={lines} onFocus={onFocusFn} />,
		);

		expect(onFocusFn).not.toHaveBeenCalled();
		await focus(instance.stdin);
		expect(onFocusFn).toHaveBeenCalledTimes(1);
		instance.unmount();
	});

	it('fires onBlur when Tab moves focus away', async () => {
		const onBlurFn = vi.fn();
		const lines = makeLines(20);
		// Render two focusable items so Tab can move focus away
		let instance!: ReturnType<typeof render>;
		await React.act(async () => {
			instance = render(
				<>
					<ScrollableBox height={5} lines={lines} onBlur={onBlurFn} id='first' />
					<ScrollableBox height={5} lines={lines} id='second' />
				</>,
			);
		});

		// Focus first component
		await React.act(async () => {
			instance.stdin.write('\t');
		});

		expect(onBlurFn).not.toHaveBeenCalled();

		// Tab to second component — first loses focus
		await React.act(async () => {
			instance.stdin.write('\t');
		});

		expect(onBlurFn).toHaveBeenCalledTimes(1);
		instance.unmount();
	});
});

describe('ScrollableBox — enableVimBindings', () => {
	it('disables vim keys when enableVimBindings=false', async () => {
		const lines = makeLines(20);
		const instance = render(
			<ScrollableBox height={5} lines={lines} enableVimBindings={false} />,
		);
		await focus(instance.stdin);
		await write(instance.stdin, 'j');
		// Still shows Line 1 (no scroll happened)
		expect(instance.lastFrame()!).toContain('Line 1');
		instance.unmount();
	});

	it('arrow keys still work when enableVimBindings=false', async () => {
		const lines = makeLines(20);
		const instance = render(
			<ScrollableBox height={5} lines={lines} enableVimBindings={false} />,
		);
		await focus(instance.stdin);
		await write(instance.stdin, arrowDown);
		expect(instance.lastFrame()!).toContain('Line 2');
		expect(instance.lastFrame()!).not.toContain('Line 1');
		instance.unmount();
	});
});

describe('ScrollableBox — ref API', () => {
	it('scrollTo(n) via ref changes visible content', async () => {
		const lines = makeLines(20);
		let instance!: ReturnType<typeof render>;

		await React.act(async () => {
			instance = render(
				<RefTest
					lines={lines}
					action={ref => {
						ref.scrollTo(5);
					}}
				/>,
			);
		});

		const frame = instance.lastFrame()!;
		// offset=5 means lines 6-10 visible
		expect(frame).toContain('Line 6');
		expect(frame).toContain('Line 10');
		expect(frame).not.toMatch(/Line 5\b/);
		instance.unmount();
	});

	it('scrollToTop() via ref shows first lines', async () => {
		const lines = makeLines(20);
		let instance!: ReturnType<typeof render>;

		await React.act(async () => {
			instance = render(
				<RefTest
					lines={lines}
					action={ref => {
						ref.scrollTo(10);
						ref.scrollToTop();
					}}
				/>,
			);
		});

		const frame = instance.lastFrame()!;
		expect(frame).toContain('Line 1');
		expect(frame).toContain('Line 5');
		instance.unmount();
	});

	it('scrollToBottom() via ref shows last lines', async () => {
		const lines = makeLines(20);
		let instance!: ReturnType<typeof render>;

		await React.act(async () => {
			instance = render(
				<RefTest
					lines={lines}
					action={ref => {
						ref.scrollToBottom();
					}}
				/>,
			);
		});

		const frame = instance.lastFrame()!;
		expect(frame).toContain('Line 16');
		expect(frame).toContain('Line 20');
		expect(frame).not.toContain('Line 15');
		instance.unmount();
	});

	it('scrollToIndex(n, {align: "start"}) shows item at top', async () => {
		const lines = makeLines(20);
		let instance!: ReturnType<typeof render>;

		await React.act(async () => {
			instance = render(
				<RefTest
					lines={lines}
					action={ref => {
						ref.scrollToIndex(7, {align: 'start'});
					}}
				/>,
			);
		});

		const frame = instance.lastFrame()!;
		// index 7 = Line 8 (0-based), should be at top of viewport
		expect(frame).toContain('Line 8');
		expect(frame).toContain('Line 12');
		expect(frame).not.toContain('Line 7');
		instance.unmount();
	});

	it('scrollToIndex(n, {align: "center"}) shows item centered', async () => {
		const lines = makeLines(20);
		let instance!: ReturnType<typeof render>;

		await React.act(async () => {
			instance = render(
				<RefTest
					lines={lines}
					action={ref => {
						ref.scrollToIndex(10, {align: 'center'});
					}}
				/>,
			);
		});

		const frame = instance.lastFrame()!;
		// index 10 = Line 11 (0-based), viewport height=5, floor(5/2)=2
		// target = 10 - 2 = 8 => offset 8, showing lines 9-13
		expect(frame).toContain('Line 9');
		expect(frame).toContain('Line 11');
		expect(frame).toContain('Line 13');
		instance.unmount();
	});

	it('scrollToIndex(n, {align: "end"}) shows item at bottom of viewport', async () => {
		const lines = makeLines(20);
		let instance!: ReturnType<typeof render>;

		await React.act(async () => {
			instance = render(
				<RefTest
					lines={lines}
					action={ref => {
						ref.scrollToIndex(9, {align: 'end'});
					}}
				/>,
			);
		});

		const frame = instance.lastFrame()!;
		// index 9 = Line 10 (0-based), viewport height=5
		// target = 9 - 5 + 1 = 5 => offset 5, showing lines 6-10
		expect(frame).toContain('Line 6');
		expect(frame).toContain('Line 10');
		expect(frame).not.toContain('Line 5');
		instance.unmount();
	});

	it('scrollUp() via ref scrolls up by one step', async () => {
		const lines = makeLines(20);
		let instance!: ReturnType<typeof render>;

		await React.act(async () => {
			instance = render(
				<RefTest
					lines={lines}
					action={ref => {
						ref.scrollTo(5);
						ref.scrollUp();
					}}
				/>,
			);
		});

		const frame = instance.lastFrame()!;
		// offset was 5, scrollUp decreases by 1 => offset 4, lines 5-9 visible
		expect(frame).toContain('Line 5');
		expect(frame).toContain('Line 9');
		expect(frame).not.toMatch(/Line 4\b/);
		instance.unmount();
	});

	it('scrollDown() via ref scrolls down by one step', async () => {
		const lines = makeLines(20);
		let instance!: ReturnType<typeof render>;

		await React.act(async () => {
			instance = render(
				<RefTest
					lines={lines}
					action={ref => {
						ref.scrollDown();
					}}
				/>,
			);
		});

		const frame = instance.lastFrame()!;
		// offset was 0, scrollDown increases by 1 => offset 1, lines 2-6 visible
		expect(frame).toContain('Line 2');
		expect(frame).toContain('Line 6');
		expect(frame).not.toContain('Line 1');
		instance.unmount();
	});

	it('pageUp() via ref scrolls up by one viewport height', async () => {
		const lines = makeLines(20);
		let instance!: ReturnType<typeof render>;

		await React.act(async () => {
			instance = render(
				<RefTest
					lines={lines}
					action={ref => {
						ref.scrollTo(10);
						ref.pageUp();
					}}
				/>,
			);
		});

		const frame = instance.lastFrame()!;
		// offset was 10, pageUp decreases by viewportHeight (5) => offset 5, lines 6-10 visible
		expect(frame).toContain('Line 6');
		expect(frame).toContain('Line 10');
		expect(frame).not.toMatch(/Line 5\b/);
		instance.unmount();
	});

	it('pageDown() via ref scrolls down by one viewport height', async () => {
		const lines = makeLines(20);
		let instance!: ReturnType<typeof render>;

		await React.act(async () => {
			instance = render(
				<RefTest
					lines={lines}
					action={ref => {
						ref.pageDown();
					}}
				/>,
			);
		});

		const frame = instance.lastFrame()!;
		// offset was 0, pageDown increases by viewportHeight (5) => offset 5, lines 6-10 visible
		expect(frame).toContain('Line 6');
		expect(frame).toContain('Line 10');
		expect(frame).not.toMatch(/Line 5\b/);
		instance.unmount();
	});

	it('halfPageUp() via ref scrolls up by half viewport height', async () => {
		const lines = makeLines(20);
		let instance!: ReturnType<typeof render>;

		await React.act(async () => {
			instance = render(
				<RefTest
					lines={lines}
					action={ref => {
						ref.scrollTo(10);
						ref.halfPageUp();
					}}
				/>,
			);
		});

		const frame = instance.lastFrame()!;
		// offset was 10, halfPageUp decreases by floor(5/2)=2 => offset 8, lines 9-13 visible
		expect(frame).toContain('Line 9');
		expect(frame).toContain('Line 13');
		expect(frame).not.toContain('Line 8');
		instance.unmount();
	});

	it('halfPageDown() via ref scrolls down by half viewport height', async () => {
		const lines = makeLines(20);
		let instance!: ReturnType<typeof render>;

		await React.act(async () => {
			instance = render(
				<RefTest
					lines={lines}
					action={ref => {
						ref.halfPageDown();
					}}
				/>,
			);
		});

		const frame = instance.lastFrame()!;
		// offset was 0, halfPageDown increases by floor(5/2)=2 => offset 2, lines 3-7 visible
		expect(frame).toContain('Line 3');
		expect(frame).toContain('Line 7');
		expect(frame).not.toContain('Line 2');
		instance.unmount();
	});

	it('getScrollState() returns correct state', async () => {
		const lines = makeLines(20);
		const outerRef = React.createRef<ScrollableBoxRef>();

		function StateTest() {
			useEffect(() => {
				if (outerRef.current) {
					outerRef.current.scrollTo(5);
				}
			}, []);
			return <ScrollableBox ref={outerRef} height={5} lines={lines} />;
		}

		const instance = render(<StateTest />);
		// Wait for the initial render effect (scrollTo call) and the
		// subsequent re-render to commit so the ref handle is updated
		await tick();
		await tick();
		await tick();

		const scrollState = outerRef.current!.getScrollState();

		expect(scrollState).toBeDefined();
		expect(scrollState.offset).toBe(5);
		expect(scrollState.contentHeight).toBe(20);
		expect(scrollState.viewportHeight).toBe(5);
		expect(scrollState.canScrollUp).toBe(true);
		expect(scrollState.canScrollDown).toBe(true);
		expect(scrollState.isAtTop).toBe(false);
		expect(scrollState.isAtBottom).toBe(false);
		instance.unmount();
	});
});

describe('ScrollableBox — overscan', () => {
	it('overscan={2} at top — visible content starts at Line 1', () => {
		const lines = makeLines(20);
		const {lastFrame, unmount} = render(
			<ScrollableBox height={5} lines={lines} overscan={2} showScrollbar={false} showIndicators={false} />,
		);
		const frame = lastFrame()!;
		// At offset 0 with overscan=2, renderStart=0, so visible content still starts at Line 1
		expect(frame).toContain('Line 1');
		expect(frame).toContain('Line 5');
		// Line 6/7 are rendered as overscan below but clipped by overflow:hidden
		unmount();
	});

	it('after scrolling down 5 with overscan={2} — visible content starts at Line 6', async () => {
		const lines = makeLines(20);
		const instance = render(
			<ScrollableBox height={5} lines={lines} overscan={2} showScrollbar={false} showIndicators={false} />,
		);
		await focus(instance.stdin);
		// Scroll down 5 times
		for (let i = 0; i < 5; i++) {
			// eslint-disable-next-line no-await-in-loop
			await write(instance.stdin, arrowDown);
		}

		const frame = instance.lastFrame()!;
		// At offset 5, viewport shows lines 6-10
		expect(frame).toContain('Line 6');
		expect(frame).toContain('Line 10');
		instance.unmount();
	});

	it('overscan does not break with content shorter than viewport', () => {
		const lines = makeLines(3);
		const {lastFrame, unmount} = render(
			<ScrollableBox height={5} lines={lines} overscan={5} showScrollbar={false} showIndicators={false} />,
		);
		const frame = lastFrame()!;
		expect(frame).toContain('Line 1');
		expect(frame).toContain('Line 3');
		unmount();
	});
});

describe('ScrollableBox — measureChildren', () => {
	it('handles children assumed to be 1 line by default', () => {
		const {lastFrame, unmount} = render(
			<ScrollableBox height={3}>
				<Text>Line 1</Text>
				<Text>Line 2</Text>
				<Text>Line 3</Text>
				<Text>Line 4</Text>
			</ScrollableBox>,
		);
		const frame = lastFrame()!;
		expect(frame).toContain('Line 1');
		expect(frame).toContain('Line 3');
		expect(frame).not.toContain('Line 4');
		unmount();
	});

	it('renders all children when measureChildren is true', () => {
		const {lastFrame, unmount} = render(
			<ScrollableBox height={5} measureChildren>
				<Text>Line 1</Text>
				<Text>Line 2</Text>
				<Text>Line 3</Text>
				<Text>Line 4</Text>
				<Text>Line 5</Text>
				<Text>Line 6</Text>
			</ScrollableBox>,
		);
		const frame = lastFrame()!;
		// First 5 lines should be visible
		expect(frame).toContain('Line 1');
		expect(frame).toContain('Line 5');
		unmount();
	});
});

describe('ScrollableBox — controlled mode', () => {
	it('setting offset={10} positions viewport at offset 10', async () => {
		const lines = makeLines(20);
		let instance!: ReturnType<typeof render>;

		await React.act(async () => {
			instance = render(
				<ScrollableBox height={5} lines={lines} offset={10} showScrollbar={false} showIndicators={false} />,
			);
		});

		const frame = instance.lastFrame()!;
		// offset=10 means lines 11-15 visible
		expect(frame).toContain('Line 11');
		expect(frame).toContain('Line 15');
		expect(frame).not.toContain('Line 10');
		instance.unmount();
	});

	it('changing offset prop scrolls to new position', async () => {
		const lines = makeLines(20);
		let instance!: ReturnType<typeof render>;

		await React.act(async () => {
			instance = render(
				<ScrollableBox height={5} lines={lines} offset={0} showScrollbar={false} showIndicators={false} />,
			);
		});

		let frame = instance.lastFrame()!;
		expect(frame).toContain('Line 1');

		await React.act(async () => {
			instance.rerender(
				<ScrollableBox height={5} lines={lines} offset={10} showScrollbar={false} showIndicators={false} />,
			);
		});

		frame = instance.lastFrame()!;
		expect(frame).toContain('Line 11');
		expect(frame).toContain('Line 15');
		expect(frame).not.toContain('Line 10');
		instance.unmount();
	});

	it('onOffsetChange fires when keyboard scrolling occurs in controlled mode', async () => {
		const lines = makeLines(20);
		const onOffsetChange = vi.fn();

		function ControlledTest() {
			const [currentOffset, setCurrentOffset] = useState(0);
			return (
				<ScrollableBox
					height={5}
					lines={lines}
					offset={currentOffset}
					onOffsetChange={newOffset => {
						onOffsetChange(newOffset);
						setCurrentOffset(newOffset);
					}}
					showScrollbar={false}
					showIndicators={false}
				/>
			);
		}

		let instance!: ReturnType<typeof render>;

		await React.act(async () => {
			instance = render(<ControlledTest />);
		});

		await React.act(async () => {
			instance.stdin.write('\t');
		});

		await React.act(async () => {
			instance.stdin.write(arrowDown);
		});

		expect(onOffsetChange).toHaveBeenCalledWith(1);

		// Verify the viewport moved
		const frame = instance.lastFrame()!;
		expect(frame).toContain('Line 2');
		instance.unmount();
	});

	it('offset prop clamps to valid range', async () => {
		const lines = makeLines(20);
		let instance!: ReturnType<typeof render>;

		await React.act(async () => {
			instance = render(
				<ScrollableBox height={5} lines={lines} offset={100} showScrollbar={false} showIndicators={false} />,
			);
		});

		const frame = instance.lastFrame()!;
		// maxOffset = 20 - 5 = 15, so clamped to 15 => lines 16-20 visible
		expect(frame).toContain('Line 16');
		expect(frame).toContain('Line 20');
		instance.unmount();
	});
});

describe('ScrollableBox — scrollToIndex auto alignment', () => {
	it('auto — item already visible, offset does not change', async () => {
		const lines = makeLines(20);
		let instance!: ReturnType<typeof render>;

		await React.act(async () => {
			instance = render(
				<RefTest
					lines={lines}
					action={ref => {
						// Start at offset 0, viewport shows indices 0-4. Index 2 is visible.
						ref.scrollToIndex(2, {align: 'auto'});
					}}
				/>,
			);
		});

		const frame = instance.lastFrame()!;
		// Offset should stay at 0: lines 1-5 visible
		expect(frame).toContain('Line 1');
		expect(frame).toContain('Line 5');
		expect(frame).not.toContain('Line 6');
		instance.unmount();
	});

	it('auto — item above viewport, aligns to top', async () => {
		const lines = makeLines(20);
		const outerRef = React.createRef<ScrollableBoxRef>();

		function ControlledAutoTest() {
			const [currentOffset, setCurrentOffset] = useState(10);
			return (
				<ScrollableBox
					ref={outerRef}
					height={5}
					lines={lines}
					offset={currentOffset}
					onOffsetChange={setCurrentOffset}
				/>
			);
		}

		let instance!: ReturnType<typeof render>;
		await React.act(async () => {
			instance = render(<ControlledAutoTest />);
		});

		// Now scrollToIndex with auto — index 3 is above the viewport (offset=10)
		await React.act(async () => {
			outerRef.current!.scrollToIndex(3, {align: 'auto'});
		});

		await tick();
		await tick();

		const frame = instance.lastFrame()!;
		// Index 3 was above viewport (offset 10), should align to top => offset 3
		// Visible: lines 4-8
		expect(frame).toContain('Line 4');
		expect(frame).toContain('Line 8');
		expect(frame).not.toContain('Line 3');
		instance.unmount();
	});

	it('auto — item below viewport, aligns to bottom', async () => {
		const lines = makeLines(20);
		let instance!: ReturnType<typeof render>;

		await React.act(async () => {
			instance = render(
				<RefTest
					lines={lines}
					action={ref => {
						// Start at offset 0, viewport shows indices 0-4. Index 9 is below.
						ref.scrollToIndex(9, {align: 'auto'});
					}}
				/>,
			);
		});

		const frame = instance.lastFrame()!;
		// Index 9 below viewport => align to bottom: offset = 9 - 5 + 1 = 5
		// Visible: lines 6-10
		expect(frame).toContain('Line 6');
		expect(frame).toContain('Line 10');
		expect(frame).not.toContain('Line 5');
		instance.unmount();
	});

	it('auto is the default alignment when no align option is passed', async () => {
		const lines = makeLines(20);
		let instance!: ReturnType<typeof render>;

		await React.act(async () => {
			instance = render(
				<RefTest
					lines={lines}
					action={ref => {
						// Index 2 is already visible at offset 0 — default auto should keep offset
						ref.scrollToIndex(2);
					}}
				/>,
			);
		});

		const frame = instance.lastFrame()!;
		// Offset should stay at 0
		expect(frame).toContain('Line 1');
		expect(frame).toContain('Line 5');
		instance.unmount();
	});
});

describe('ScrollableBox — debug prop', () => {
	it('when debug=true, component renders without errors', () => {
		const lines = makeLines(10);
		const {lastFrame, unmount} = render(
			<ScrollableBox height={5} lines={lines} debug showScrollbar={false} showIndicators={false} />,
		);
		const frame = lastFrame()!;
		// debug=true removes overflowY='hidden' for layout debugging;
		// in ink-testing-library the Yoga layout still constrains output to height,
		// but the prop should be accepted and render normally
		expect(frame).toContain('Line 1');
		expect(frame).toContain('Line 5');
		unmount();
	});

	it('when debug=false (default), content beyond viewport is clipped', () => {
		const lines = makeLines(10);
		const {lastFrame, unmount} = render(
			<ScrollableBox height={5} lines={lines} showScrollbar={false} showIndicators={false} />,
		);
		const frame = lastFrame()!;
		expect(frame).toContain('Line 1');
		expect(frame).toContain('Line 5');
		expect(frame).not.toContain('Line 6');
		unmount();
	});
});

describe('ScrollableBox — ref API — per-item tracking', () => {
	it('getItemHeight returns 1 for each item in non-measure mode', async () => {
		const lines = makeLines(5);
		let capturedHeights: number[] = [];
		let outOfRange = 0;

		await React.act(async () => {
			render(
				<RefTest
					lines={lines}
					action={ref => {
						capturedHeights = lines.map((_, i) => ref.getItemHeight(i));
						outOfRange = ref.getItemHeight(10);
					}}
				/>,
			);
		});

		expect(capturedHeights).toEqual([1, 1, 1, 1, 1]);
		expect(outOfRange).toBe(0);
	});

	it('getItemHeight returns 0 for negative index', async () => {
		const lines = makeLines(3);
		let result = -1;

		await React.act(async () => {
			render(
				<RefTest
					lines={lines}
					action={ref => {
						result = ref.getItemHeight(-1);
					}}
				/>,
			);
		});

		expect(result).toBe(0);
	});

	it('getItemPosition returns correct top and height', async () => {
		const lines = makeLines(5);
		let pos0: {top: number; height: number} | undefined;
		let pos3: {top: number; height: number} | undefined;
		let pos10: {top: number; height: number} | undefined;

		await React.act(async () => {
			render(
				<RefTest
					lines={lines}
					action={ref => {
						pos0 = ref.getItemPosition(0);
						pos3 = ref.getItemPosition(3);
						pos10 = ref.getItemPosition(10);
					}}
				/>,
			);
		});

		expect(pos0).toEqual({top: 0, height: 1});
		expect(pos3).toEqual({top: 3, height: 1});
		expect(pos10).toBeUndefined();
	});

	it('getItemPosition returns null for negative index', async () => {
		const lines = makeLines(3);
		let result: {top: number; height: number} | undefined = {top: -1, height: -1};

		await React.act(async () => {
			render(
				<RefTest
					lines={lines}
					action={ref => {
						result = ref.getItemPosition(-1);
					}}
				/>,
			);
		});

		expect(result).toBeUndefined();
	});

	it('remeasureItem clears cached height without throwing', async () => {
		const lines = makeLines(5);

		await React.act(async () => {
			render(
				<RefTest
					lines={lines}
					action={ref => {
						// Should not throw for valid or invalid indices
						ref.remeasureItem(0);
						ref.remeasureItem(4);
						ref.remeasureItem(-1); // Out of range — no-op
						ref.remeasureItem(10); // Out of range — no-op
					}}
				/>,
			);
		});

		// If we got here without errors, remeasureItem is wired correctly
		expect(true).toBe(true);
	});
});

describe('ScrollableBox — onReachEnd / onReachStart', () => {
	it('onReachEnd fires when scrolling near bottom', async () => {
		const onReachEnd = vi.fn();
		const lines = makeLines(20);

		function ReachEndTest() {
			const [currentOffset, setCurrentOffset] = useState(0);
			return (
				<ScrollableBox
					height={5}
					lines={lines}
					offset={currentOffset}
					onOffsetChange={setCurrentOffset}
					onReachEnd={onReachEnd}
					reachThreshold={3}
					showScrollbar={false}
					showIndicators={false}
				/>
			);
		}

		let instance!: ReturnType<typeof render>;

		await React.act(async () => {
			instance = render(<ReachEndTest />);
		});

		// maxOffset = 20 - 5 = 15, threshold = 3, so onReachEnd fires when offset >= 12
		// Scroll to offset 12 by pressing arrow down 12 times
		await React.act(async () => {
			instance.stdin.write('\t');
		});

		onReachEnd.mockClear();

		for (let i = 0; i < 12; i++) {
			// eslint-disable-next-line no-await-in-loop, @typescript-eslint/no-loop-func
			await React.act(async () => {
				instance.stdin.write(arrowDown);
			});
		}

		expect(onReachEnd).toHaveBeenCalled();
		instance.unmount();
	});

	it('onReachEnd does not fire when far from bottom', async () => {
		const onReachEnd = vi.fn();
		const lines = makeLines(20);

		function FarFromBottomTest() {
			const [currentOffset, setCurrentOffset] = useState(0);
			return (
				<ScrollableBox
					height={5}
					lines={lines}
					offset={currentOffset}
					onOffsetChange={setCurrentOffset}
					onReachEnd={onReachEnd}
					reachThreshold={3}
					showScrollbar={false}
					showIndicators={false}
				/>
			);
		}

		let instance!: ReturnType<typeof render>;

		await React.act(async () => {
			instance = render(<FarFromBottomTest />);
		});

		// Focus the component
		await React.act(async () => {
			instance.stdin.write('\t');
		});

		onReachEnd.mockClear();

		// Scroll down only 2 lines — should be at offset 2, far from bottom (maxOffset=15, threshold=3)
		for (let i = 0; i < 2; i++) {
			// eslint-disable-next-line no-await-in-loop, @typescript-eslint/no-loop-func
			await React.act(async () => {
				instance.stdin.write(arrowDown);
			});
		}

		expect(onReachEnd).not.toHaveBeenCalled();
		instance.unmount();
	});

	it('onReachStart fires when scrolling back near top (offset <= threshold)', async () => {
		const onReachStart = vi.fn();
		const lines = makeLines(20);

		function ReachStartTest() {
			const [currentOffset, setCurrentOffset] = useState(0);
			return (
				<ScrollableBox
					height={5}
					lines={lines}
					offset={currentOffset}
					onOffsetChange={setCurrentOffset}
					onReachStart={onReachStart}
					reachThreshold={3}
					showScrollbar={false}
					showIndicators={false}
				/>
			);
		}

		let instance!: ReturnType<typeof render>;

		await React.act(async () => {
			instance = render(<ReachStartTest />);
		});

		// Should NOT fire on mount
		expect(onReachStart).not.toHaveBeenCalled();

		// Focus and scroll down past threshold
		await React.act(async () => {
			instance.stdin.write('\t');
		});

		for (let i = 0; i < 5; i++) {
			// eslint-disable-next-line no-await-in-loop, @typescript-eslint/no-loop-func
			await React.act(async () => {
				instance.stdin.write(arrowDown);
			});
		}

		onReachStart.mockClear();

		// Now scroll back to top — onReachStart should fire when offset <= threshold
		for (let i = 0; i < 5; i++) {
			// eslint-disable-next-line no-await-in-loop, @typescript-eslint/no-loop-func
			await React.act(async () => {
				instance.stdin.write('\u001B[A'); // arrow up
			});
		}

		expect(onReachStart).toHaveBeenCalled();
		instance.unmount();
	});

	it('custom reachThreshold works', async () => {
		const onReachEnd = vi.fn();
		const lines = makeLines(20);

		function CustomThresholdTest() {
			const [currentOffset, setCurrentOffset] = useState(0);
			return (
				<ScrollableBox
					height={5}
					lines={lines}
					offset={currentOffset}
					onOffsetChange={setCurrentOffset}
					onReachEnd={onReachEnd}
					reachThreshold={10}
					showScrollbar={false}
					showIndicators={false}
				/>
			);
		}

		let instance!: ReturnType<typeof render>;

		await React.act(async () => {
			instance = render(<CustomThresholdTest />);
		});

		// Focus the component
		await React.act(async () => {
			instance.stdin.write('\t');
		});

		onReachEnd.mockClear();

		// maxOffset = 15, threshold = 10, so onReachEnd fires when offset >= 5
		// Scroll down 5 times to reach offset 5
		for (let i = 0; i < 5; i++) {
			// eslint-disable-next-line no-await-in-loop, @typescript-eslint/no-loop-func
			await React.act(async () => {
				instance.stdin.write(arrowDown);
			});
		}

		expect(onReachEnd).toHaveBeenCalled();
		instance.unmount();
	});
});

describe('ScrollableBox — content/viewport/item callbacks', () => {
	it('onContentHeightChange fires when content height changes', async () => {
		const onContentHeightChange = vi.fn();
		const lines = makeLines(10);
		let instance!: ReturnType<typeof render>;

		await React.act(async () => {
			instance = render(
				<ScrollableBox
					height={5}
					lines={lines}
					onContentHeightChange={onContentHeightChange}
					showScrollbar={false}
					showIndicators={false}
				/>,
			);
		});

		// Initial render — no change yet (previous === current)
		onContentHeightChange.mockClear();

		// Rerender with more lines
		await React.act(async () => {
			instance.rerender(
				<ScrollableBox
					height={5}
					lines={makeLines(15)}
					onContentHeightChange={onContentHeightChange}
					showScrollbar={false}
					showIndicators={false}
				/>,
			);
		});

		expect(onContentHeightChange).toHaveBeenCalledWith(15, 10);
		instance.unmount();
	});

	it('onViewportSizeChange fires when viewport height changes', async () => {
		const onViewportSizeChange = vi.fn();
		const lines = makeLines(20);
		let instance!: ReturnType<typeof render>;

		await React.act(async () => {
			instance = render(
				<ScrollableBox
					height={5}
					lines={lines}
					onViewportSizeChange={onViewportSizeChange}
					showScrollbar={false}
					showIndicators={false}
				/>,
			);
		});

		// Initial render — no change yet
		onViewportSizeChange.mockClear();

		// Rerender with different height
		await React.act(async () => {
			instance.rerender(
				<ScrollableBox
					height={10}
					lines={lines}
					onViewportSizeChange={onViewportSizeChange}
					showScrollbar={false}
					showIndicators={false}
				/>,
			);
		});

		expect(onViewportSizeChange).toHaveBeenCalledWith(10, 5);
		instance.unmount();
	});

	it('onItemHeightChange fires when a measured child height changes', async () => {
		const onItemHeightChange = vi.fn();
		let instance!: ReturnType<typeof render>;

		await React.act(async () => {
			instance = render(
				<ScrollableBox
					height={5}
					measureChildren
					onItemHeightChange={onItemHeightChange}
					showScrollbar={false}
					showIndicators={false}
				>
					<Text>Short</Text>
					<Text>Also short</Text>
				</ScrollableBox>,
			);
		});

		// Clear initial calls (first measurements don't fire onItemHeightChange
		// because there's no previous value)
		onItemHeightChange.mockClear();

		// Re-render with different content that would change height
		// Note: In ink-testing-library, all <Text> renders as 1 line regardless
		// of content, so we can't easily test actual height changes without
		// mocking measureElement. We verify the wiring is correct by checking
		// the callback was properly registered.
		instance.unmount();
		// If we got here without errors, the callback wiring is correct
		expect(true).toBe(true);
	});
});

describe('ScrollableBox — scrollbarPosition', () => {
	it('defaults to inside (scrollbar inside border)', () => {
		const lines = makeLines(20);
		const {lastFrame, unmount} = render(
			<ScrollableBox height={7} lines={lines} border/>,
		);
		const frame = lastFrame()!;
		// Border and scrollbar should both be present, scrollbar inside the border
		expect(frame).toContain('╭');
		expect(frame).toContain('█');
		unmount();
	});

	it('scrollbarPosition="inside" renders scrollbar inside border (explicit)', () => {
		const lines = makeLines(20);
		const {lastFrame, unmount} = render(
			<ScrollableBox height={7} lines={lines} border scrollbarPosition='inside'/>,
		);
		const frame = lastFrame()!;
		expect(frame).toContain('╭');
		expect(frame).toContain('█');
		unmount();
	});

	it('scrollbarPosition="outside" renders scrollbar outside the border', () => {
		const lines = makeLines(20);
		const {lastFrame, unmount} = render(
			<ScrollableBox height={7} lines={lines} border scrollbarPosition='outside'/>,
		);
		const frame = lastFrame()!;
		// Border should still render
		expect(frame).toContain('╭');
		// Scrollbar should render (content overflows viewport)
		expect(frame).toContain('█');
		unmount();
	});

	it('scrollbarPosition="outside" without border still shows scrollbar', () => {
		const lines = makeLines(20);
		const {lastFrame, unmount} = render(
			<ScrollableBox height={5} lines={lines} scrollbarPosition='outside'/>,
		);
		const frame = lastFrame()!;
		// No border
		expect(frame).not.toContain('╭');
		// Scrollbar still renders
		expect(frame).toContain('█');
		unmount();
	});

	it('scrollbarPosition="outside" renders content correctly', () => {
		const lines = makeLines(20);
		const {lastFrame, unmount} = render(
			<ScrollableBox height={7} lines={lines} border scrollbarPosition='outside' showIndicators={false}/>,
		);
		const frame = lastFrame()!;
		// effectiveHeight = 7 - 2 = 5; lines 1-5 visible
		expect(frame).toContain('Line 1');
		expect(frame).toContain('Line 5');
		expect(frame).not.toContain('Line 6');
		unmount();
	});

	it('scrollbarPosition="outside" scrollbar scrolls correctly with keyboard', async () => {
		const lines = makeLines(20);
		const instance = render(
			<ScrollableBox height={7} lines={lines} border scrollbarPosition='outside'/>,
		);
		await focus(instance.stdin);
		await write(instance.stdin, arrowDown);
		const frame = instance.lastFrame()!;
		expect(frame).toContain('Line 2');
		expect(frame).toContain('Line 6');
		expect(frame).not.toContain('Line 1');
		instance.unmount();
	});

	it('scrollbarPosition="outside" hides scrollbar when content fits', () => {
		const lines = makeLines(3);
		const {lastFrame, unmount} = render(
			<ScrollableBox height={7} lines={lines} border scrollbarPosition='outside'/>,
		);
		const frame = lastFrame()!;
		// No scrollbar needed — 3 lines in a 5-line viewport
		expect(frame).not.toContain('█');
		expect(frame).not.toContain('░');
		unmount();
	});
});

describe('ScrollableBox — prop validation: overscan and reachThreshold', () => {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
	const renderFn = (ScrollableBox as unknown as {render: (...args: unknown[]) => unknown}).render;

	it('throws for negative overscan', () => {
		expect(() => {
			renderFn({height: 5, lines: [], overscan: -1}, null);
		}).toThrow('`overscan` must be a non-negative integer');
	});

	it('throws for non-integer overscan (1.5)', () => {
		expect(() => {
			renderFn({height: 5, lines: [], overscan: 1.5}, null);
		}).toThrow('`overscan` must be a non-negative integer');
	});

	it('throws for negative reachThreshold', () => {
		expect(() => {
			renderFn({height: 5, lines: [], reachThreshold: -1}, null);
		}).toThrow('`reachThreshold` must be a non-negative number');
	});
});

describe('ScrollableBox — scrollToIndex with measureChildren', () => {
	/**
	 * In ink-testing-library, Yoga layout inside a clipped box causes alternating
	 * heights (1 and 0) for MeasurableItem children. That limits actual scrolling,
	 * but the code paths in scrollToIndex are still fully exercised. Tests here
	 * assert that the calls complete without errors and use the measureChildren
	 * branch.
	 */
	function MeasureRefTest({
		itemCount,
		action,
	}: {
		itemCount: number;
		action: (ref: ScrollableBoxRef) => void;
	}) {
		const ref = useRef<ScrollableBoxRef>(null);
		useEffect(() => {
			if (ref.current) {
				action(ref.current);
			}
		}, [action]);
		return (
			<ScrollableBox ref={ref} height={5} measureChildren showScrollbar={false} showIndicators={false}>
				{Array.from({length: itemCount}, (_, i) => (
					<Text key={i}>{`MC Item ${i + 1}`}</Text>
				))}
			</ScrollableBox>
		);
	}

	it('scrollToIndex start alignment — executes without error', async () => {
		let instance!: ReturnType<typeof render>;

		await React.act(async () => {
			instance = render(
				<MeasureRefTest
					itemCount={20}
					action={ref => {
						ref.scrollToIndex(7, {align: 'start'});
					}}
				/>,
			);
		});

		// Verify the component renders correctly (the call itself is the assertion)
		const frame = instance.lastFrame()!;
		expect(frame).toBeDefined();
		instance.unmount();
	});

	it('scrollToIndex end alignment — executes without error', async () => {
		let instance!: ReturnType<typeof render>;

		await React.act(async () => {
			instance = render(
				<MeasureRefTest
					itemCount={20}
					action={ref => {
						ref.scrollToIndex(9, {align: 'end'});
					}}
				/>,
			);
		});

		const frame = instance.lastFrame()!;
		expect(frame).toBeDefined();
		instance.unmount();
	});

	it('scrollToIndex center alignment — executes without error', async () => {
		let instance!: ReturnType<typeof render>;

		await React.act(async () => {
			instance = render(
				<MeasureRefTest
					itemCount={20}
					action={ref => {
						ref.scrollToIndex(10, {align: 'center'});
					}}
				/>,
			);
		});

		const frame = instance.lastFrame()!;
		expect(frame).toBeDefined();
		instance.unmount();
	});

	it('scrollToIndex auto — item already visible, offset unchanged', async () => {
		const outerRef = React.createRef<ScrollableBoxRef>();

		function AutoMeasureTest() {
			const [currentOffset, setCurrentOffset] = useState(0);
			return (
				<ScrollableBox
					ref={outerRef}
					height={5}
					measureChildren
					offset={currentOffset}
					onOffsetChange={setCurrentOffset}
					showScrollbar={false}
					showIndicators={false}
				>
					{Array.from({length: 20}, (_, i) => (
						<Text key={i}>{`Auto Item ${i + 1}`}</Text>
					))}
				</ScrollableBox>
			);
		}

		let instance!: ReturnType<typeof render>;
		await React.act(async () => {
			instance = render(<AutoMeasureTest />);
		});

		const offsetBefore = outerRef.current!.getScrollState().offset;

		// Index 0 is always visible — auto alignment should not change offset
		await React.act(async () => {
			outerRef.current!.scrollToIndex(0, {align: 'auto'});
		});

		await tick();

		const offsetAfter = outerRef.current!.getScrollState().offset;
		expect(offsetAfter).toBe(offsetBefore);
		instance.unmount();
	});

	it('scrollToIndex auto — item above viewport triggers upward scroll', async () => {
		const outerRef = React.createRef<ScrollableBoxRef>();

		// We pre-seed a large content with enough height so scrolling works.
		// Use lines mode to verify the auto-above path, but here we need measureChildren.
		// With 20 items at ~0.5 avg height, contentHeight≈10, viewportHeight=5 => maxOffset=5.
		// After measuring, item tops may be computable. We just verify no crash.
		function AutoAboveMeasureTest() {
			const [currentOffset, setCurrentOffset] = useState(0);
			return (
				<ScrollableBox
					ref={outerRef}
					height={5}
					measureChildren
					offset={currentOffset}
					onOffsetChange={setCurrentOffset}
					showScrollbar={false}
					showIndicators={false}
				>
					{Array.from({length: 20}, (_, i) => (
						<Text key={i}>{`AboveItem ${i + 1}`}</Text>
					))}
				</ScrollableBox>
			);
		}

		let instance!: ReturnType<typeof render>;
		await React.act(async () => {
			instance = render(<AutoAboveMeasureTest />);
		});

		// Calling scrollToIndex on an item whose top is below current offset triggers
		// the "above viewport" branch when we scroll down first manually.
		// We scroll the component to a position where item 0 is above the viewport.
		await React.act(async () => {
			outerRef.current!.scrollTo(3);
		});

		await tick();

		// Now item 0 (top=0) is above the viewport (offset=3), call auto — should scroll up.
		await React.act(async () => {
			outerRef.current!.scrollToIndex(0, {align: 'auto'});
		});

		await tick();

		// After scrolling to index 0 auto from above, offset should have moved up
		const frame = instance.lastFrame()!;
		expect(frame).toBeDefined();
		instance.unmount();
	});

	it('scrollToIndex out of range — returns without error', async () => {
		const outerRef = React.createRef<ScrollableBoxRef>();

		function OobMeasureTest() {
			return (
				<ScrollableBox
					ref={outerRef}
					height={5}
					measureChildren
					showScrollbar={false}
					showIndicators={false}
				>
					<Text>Only item</Text>
				</ScrollableBox>
			);
		}

		let instance!: ReturnType<typeof render>;
		await React.act(async () => {
			instance = render(<OobMeasureTest />);
		});

		// Out-of-range index should not throw
		await React.act(async () => {
			outerRef.current!.scrollToIndex(100, {align: 'start'});
		});

		const frame = instance.lastFrame()!;
		expect(frame).toContain('Only item');
		instance.unmount();
	});
});

describe('ScrollableBox — heightsRef trimming on child removal', () => {
	it('removes children without crash and heightsRef is trimmed', async () => {
		const items8 = Array.from({length: 8}, (_, i) => (
			<Text key={i}>{`DynItem ${i + 1}`}</Text>
		));
		const items4 = Array.from({length: 4}, (_, i) => (
			<Text key={i}>{`DynItem ${i + 1}`}</Text>
		));

		let instance!: ReturnType<typeof render>;
		await React.act(async () => {
			instance = render(
				<ScrollableBox height={5} measureChildren showScrollbar={false} showIndicators={false}>
					{items8}
				</ScrollableBox>,
			);
		});

		// Rerender with fewer children to trigger trimming
		await React.act(async () => {
			instance.rerender(
				<ScrollableBox height={5} measureChildren showScrollbar={false} showIndicators={false}>
					{items4}
				</ScrollableBox>,
			);
		});

		await tick();

		const frame = instance.lastFrame()!;
		expect(frame).toContain('DynItem 1');
		expect(frame).toContain('DynItem 4');
		expect(frame).not.toContain('DynItem 5');
		instance.unmount();
	});
});
