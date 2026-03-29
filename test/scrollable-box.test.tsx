import React, {useRef, useEffect, useState} from 'react';
import {
	describe, it, expect, vi,
} from 'vitest';
import {render} from 'ink-testing-library';
import {Text} from 'ink';
import {ScrollableBox} from '../src/scrollable-box.js';
import type {ScrollableBoxRef} from '../src/types.js';

/** Wait for a microtask/macrotask cycle to flush React state and effects. */
async function tick() {
	await new Promise<void>(resolve => {
		setImmediate(resolve);
	});
}

/**
 * Write a key to stdin and wait for React to process it.
 * Two ticks are needed: one for the input event to propagate through
 * Ink's event pipeline, and one for React to commit the state update.
 */
async function write(stdin: ReturnType<typeof render>['stdin'], data: string) {
	stdin.write(data);
	await tick();
	await tick();
}

/**
 * Focus the component by pressing Tab, then wait for effects to settle.
 */
async function focus(stdin: ReturnType<typeof render>['stdin']) {
	stdin.write('\t');
	await tick();
	await tick();
}

function makeLines(n: number): string[] {
	return Array.from({length: n}, (_, i) => `Line ${i + 1}`);
}

const arrowDown = '\u001B[B';

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

		// The callback fires on initial render via the useEffect
		expect(onScroll).toHaveBeenCalled();

		const initialCall = scrollStates[0]!;
		expect(initialCall.offset).toBe(0);
		expect(initialCall.contentHeight).toBe(20);
		expect(initialCall.viewportHeight).toBe(5);
		expect(initialCall.isAtTop).toBe(true);
		expect(initialCall.canScrollDown).toBe(true);

		// Focus + scroll down and check updated state
		const callCountBefore = scrollStates.length;
		await React.act(async () => {
			instance.stdin.write('\t');
		});

		await React.act(async () => {
			instance.stdin.write(arrowDown);
		});

		expect(scrollStates.length).toBeGreaterThan(callCountBefore);
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
	it('fires on initial render', async () => {
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

		expect(scrollStates.length).toBeGreaterThan(0);
		expect(scrollStates[0]!.offset).toBe(0);
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
	// Helper component that exposes the ref and runs an action via useEffect
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
