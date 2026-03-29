import React from 'react';
import {
	describe, it, expect, vi,
} from 'vitest';
import {render} from 'ink-testing-library';
import {renderToString, Text} from 'ink';
import {useScrollable} from '../src/use-scrollable.js';
import type {UseScrollableOptions} from '../src/types.js';

// Use a ref object to access scroll actions from tests
const scrollRef: {current: ReturnType<typeof useScrollable> | undefined} = {current: undefined};

function HookTest({options}: {readonly options: UseScrollableOptions}) {
	const scroll = useScrollable(options);
	React.useEffect(() => {
		scrollRef.current = scroll;
	});
	return (
		<Text>
			{JSON.stringify({
				offset: scroll.offset,
				canScrollUp: scroll.canScrollUp,
				canScrollDown: scroll.canScrollDown,
				isAtTop: scroll.isAtTop,
				isAtBottom: scroll.isAtBottom,
				percentage: scroll.percentage,
				contentHeight: scroll.contentHeight,
				viewportHeight: scroll.viewportHeight,
			})}
		</Text>
	);
}

function getState(instance: ReturnType<typeof render>) {
	return JSON.parse(instance.lastFrame()!.trim());
}

describe('useScrollable', () => {
	describe('scrollStep validation', () => {
		it('throws for scrollStep of 0', () => {
			expect(() => {
				renderToString(<HookTest options={{contentHeight: 20, viewportHeight: 10, scrollStep: 0}} />);
			}).toThrow('positive number');
		});

		it('throws for negative scrollStep', () => {
			expect(() => {
				renderToString(<HookTest options={{contentHeight: 20, viewportHeight: 10, scrollStep: -5}} />);
			}).toThrow('positive number');
		});
	});

	describe('Initial state', () => {
		it('starts at offset 0 with correct derived state when content > viewport', () => {
			const instance = render(
				<HookTest options={{contentHeight: 20, viewportHeight: 10}}/>,
			);
			const state = getState(instance);
			expect(state).toEqual({
				offset: 0,
				canScrollUp: false,
				canScrollDown: true,
				isAtTop: true,
				isAtBottom: false,
				percentage: 0,
				contentHeight: 20,
				viewportHeight: 10,
			});
			instance.unmount();
		});

		it('reports no scrolling when content fits viewport (content < viewport)', () => {
			const instance = render(
				<HookTest options={{contentHeight: 5, viewportHeight: 10}}/>,
			);
			const state = getState(instance);
			expect(state).toEqual({
				offset: 0,
				canScrollUp: false,
				canScrollDown: false,
				isAtTop: true,
				isAtBottom: true,
				percentage: 100,
				contentHeight: 5,
				viewportHeight: 10,
			});
			instance.unmount();
		});

		it('reports no scrolling when content equals viewport', () => {
			const instance = render(
				<HookTest options={{contentHeight: 10, viewportHeight: 10}}/>,
			);
			const state = getState(instance);
			expect(state).toEqual({
				offset: 0,
				canScrollUp: false,
				canScrollDown: false,
				isAtTop: true,
				isAtBottom: true,
				percentage: 100,
				contentHeight: 10,
				viewportHeight: 10,
			});
			instance.unmount();
		});

		it('respects initialOffset', () => {
			const instance = render(
				<HookTest
					options={{contentHeight: 20, viewportHeight: 10, initialOffset: 5}}
				/>,
			);
			const state = getState(instance);
			expect(state.offset).toBe(5);
			expect(state.canScrollUp).toBe(true);
			expect(state.canScrollDown).toBe(true);
			expect(state.isAtTop).toBe(false);
			expect(state.isAtBottom).toBe(false);
			expect(state.percentage).toBe(50);
			instance.unmount();
		});

		it('clamps initialOffset to maxOffset', () => {
			const instance = render(
				<HookTest
					options={{contentHeight: 20, viewportHeight: 10, initialOffset: 100}}
				/>,
			);
			const state = getState(instance);
			expect(state.offset).toBe(10);
			expect(state.isAtBottom).toBe(true);
			instance.unmount();
		});

		it('handles contentHeight of 0', () => {
			const instance = render(
				<HookTest options={{contentHeight: 0, viewportHeight: 10}}/>,
			);
			const state = getState(instance);
			expect(state).toEqual({
				offset: 0,
				canScrollUp: false,
				canScrollDown: false,
				isAtTop: true,
				isAtBottom: true,
				percentage: 100,
				contentHeight: 0,
				viewportHeight: 10,
			});
			instance.unmount();
		});
	});

	describe('Scroll methods', () => {
		it('scrollDown increments offset by scrollStep (default 1)', () => {
			const instance = render(
				<HookTest options={{contentHeight: 20, viewportHeight: 10}}/>,
			);
			React.act(() => {
				scrollRef.current!.scrollDown();
			});
			const state = getState(instance);
			expect(state.offset).toBe(1);
			expect(state.canScrollUp).toBe(true);
			instance.unmount();
		});

		it('scrollUp decrements offset by scrollStep', () => {
			const instance = render(
				<HookTest
					options={{contentHeight: 20, viewportHeight: 10, initialOffset: 5}}
				/>,
			);
			React.act(() => {
				scrollRef.current!.scrollUp();
			});
			const state = getState(instance);
			expect(state.offset).toBe(4);
			instance.unmount();
		});

		it('scrollDown respects custom scrollStep (3)', () => {
			const instance = render(
				<HookTest
					options={{contentHeight: 20, viewportHeight: 10, scrollStep: 3}}
				/>,
			);
			React.act(() => {
				scrollRef.current!.scrollDown();
			});
			const state = getState(instance);
			expect(state.offset).toBe(3);
			instance.unmount();
		});

		it('scrollTo jumps to specific offset', () => {
			const instance = render(
				<HookTest options={{contentHeight: 20, viewportHeight: 10}}/>,
			);
			React.act(() => {
				scrollRef.current!.scrollTo(7);
			});
			const state = getState(instance);
			expect(state.offset).toBe(7);
			instance.unmount();
		});

		it('scrollToTop sets offset to 0', () => {
			const instance = render(
				<HookTest
					options={{contentHeight: 20, viewportHeight: 10, initialOffset: 5}}
				/>,
			);
			React.act(() => {
				scrollRef.current!.scrollToTop();
			});
			const state = getState(instance);
			expect(state.offset).toBe(0);
			expect(state.isAtTop).toBe(true);
			instance.unmount();
		});

		it('scrollToBottom sets offset to maxOffset', () => {
			const instance = render(
				<HookTest options={{contentHeight: 20, viewportHeight: 10}}/>,
			);
			React.act(() => {
				scrollRef.current!.scrollToBottom();
			});
			const state = getState(instance);
			expect(state.offset).toBe(10);
			expect(state.isAtBottom).toBe(true);
			instance.unmount();
		});

		it('pageDown moves by viewportHeight', () => {
			const instance = render(
				<HookTest options={{contentHeight: 30, viewportHeight: 10}}/>,
			);
			React.act(() => {
				scrollRef.current!.pageDown();
			});
			const state = getState(instance);
			expect(state.offset).toBe(10);
			instance.unmount();
		});

		it('pageUp moves by viewportHeight', () => {
			const instance = render(
				<HookTest
					options={{contentHeight: 30, viewportHeight: 10, initialOffset: 15}}
				/>,
			);
			React.act(() => {
				scrollRef.current!.pageUp();
			});
			const state = getState(instance);
			expect(state.offset).toBe(5);
			instance.unmount();
		});

		it('halfPageDown moves by half viewportHeight', () => {
			const instance = render(
				<HookTest options={{contentHeight: 30, viewportHeight: 10}} />,
			);
			React.act(() => {
				scrollRef.current!.halfPageDown();
			});
			const state = getState(instance);
			// Math.floor(10 / 2) = 5
			expect(state.offset).toBe(5);
			instance.unmount();
		});

		it('halfPageUp moves by half viewportHeight', () => {
			const instance = render(
				<HookTest
					options={{contentHeight: 30, viewportHeight: 10, initialOffset: 15}}
				/>,
			);
			React.act(() => {
				scrollRef.current!.halfPageUp();
			});
			const state = getState(instance);
			// 15 - Math.floor(10 / 2) = 10
			expect(state.offset).toBe(10);
			instance.unmount();
		});

		it('halfPageDown clamps to maxOffset', () => {
			const instance = render(
				<HookTest
					options={{contentHeight: 30, viewportHeight: 10, initialOffset: 18}}
				/>,
			);
			React.act(() => {
				scrollRef.current!.halfPageDown();
			});
			const state = getState(instance);
			// maxOffset = 20; 18 + 5 = 23 => clamped to 20
			expect(state.offset).toBe(20);
			expect(state.isAtBottom).toBe(true);
			instance.unmount();
		});

		it('halfPageUp clamps to 0', () => {
			const instance = render(
				<HookTest
					options={{contentHeight: 30, viewportHeight: 10, initialOffset: 3}}
				/>,
			);
			React.act(() => {
				scrollRef.current!.halfPageUp();
			});
			const state = getState(instance);
			// 3 - 5 = -2 => clamped to 0
			expect(state.offset).toBe(0);
			expect(state.isAtTop).toBe(true);
			instance.unmount();
		});
	});

	describe('Clamping', () => {
		it('scrollDown at maxOffset stays at maxOffset', () => {
			const instance = render(
				<HookTest
					options={{contentHeight: 20, viewportHeight: 10, initialOffset: 10}}
				/>,
			);
			React.act(() => {
				scrollRef.current!.scrollDown();
			});
			const state = getState(instance);
			expect(state.offset).toBe(10);
			expect(state.isAtBottom).toBe(true);
			instance.unmount();
		});

		it('scrollUp at 0 stays at 0', () => {
			const instance = render(
				<HookTest options={{contentHeight: 20, viewportHeight: 10}}/>,
			);
			React.act(() => {
				scrollRef.current!.scrollUp();
			});
			const state = getState(instance);
			expect(state.offset).toBe(0);
			expect(state.isAtTop).toBe(true);
			instance.unmount();
		});

		it('scrollTo with negative value clamps to 0', () => {
			const instance = render(
				<HookTest options={{contentHeight: 20, viewportHeight: 10}}/>,
			);
			React.act(() => {
				scrollRef.current!.scrollTo(-5);
			});
			const state = getState(instance);
			expect(state.offset).toBe(0);
			instance.unmount();
		});

		it('scrollTo beyond maxOffset clamps to maxOffset', () => {
			const instance = render(
				<HookTest options={{contentHeight: 20, viewportHeight: 10}}/>,
			);
			React.act(() => {
				scrollRef.current!.scrollTo(100);
			});
			const state = getState(instance);
			expect(state.offset).toBe(10);
			expect(state.isAtBottom).toBe(true);
			instance.unmount();
		});

		it('pageDown near bottom clamps to maxOffset', () => {
			const instance = render(
				<HookTest
					options={{contentHeight: 20, viewportHeight: 10, initialOffset: 8}}
				/>,
			);
			React.act(() => {
				scrollRef.current!.pageDown();
			});
			const state = getState(instance);
			expect(state.offset).toBe(10);
			expect(state.isAtBottom).toBe(true);
			instance.unmount();
		});
	});

	describe('dynamic size changes', () => {
		it('clamps offset when viewportHeight increases', () => {
			const instance = render(
				<HookTest options={{contentHeight: 50, viewportHeight: 10, initialOffset: 35}} />,
			);

			// Increase viewport — maxOffset drops to 50-30=20, offset should clamp from 35 to 20
			React.act(() => {
				instance.rerender(
					<HookTest options={{contentHeight: 50, viewportHeight: 30, initialOffset: 35}} />,
				);
			});

			const state = getState(instance);
			expect(state.offset).toBe(20);
			instance.unmount();
		});

		it('clamps offset when contentHeight shrinks', () => {
			const instance = render(
				<HookTest options={{contentHeight: 50, viewportHeight: 10, initialOffset: 30}} />,
			);

			// Shrink content — maxOffset drops to 20-10=10
			React.act(() => {
				instance.rerender(
					<HookTest options={{contentHeight: 20, viewportHeight: 10, initialOffset: 30}} />,
				);
			});

			const state = getState(instance);
			expect(state.offset).toBe(10);
			instance.unmount();
		});

		it('maintains offset when content grows and offset still valid', () => {
			const instance = render(
				<HookTest options={{contentHeight: 50, viewportHeight: 10, initialOffset: 5}} />,
			);

			React.act(() => {
				instance.rerender(
					<HookTest options={{contentHeight: 100, viewportHeight: 10, initialOffset: 5}} />,
				);
			});

			const state = getState(instance);
			expect(state.offset).toBe(5);
			instance.unmount();
		});
	});

	describe('rapid scrolling', () => {
		it('handles many sequential scrollDown calls without crash', () => {
			const instance = render(
				<HookTest options={{contentHeight: 50, viewportHeight: 10}} />,
			);

			React.act(() => {
				for (let i = 0; i < 100; i++) {
					scrollRef.current!.scrollDown();
				}
			});

			const state = getState(instance);
			expect(state.offset).toBe(40); // maxOffset
			expect(state.isAtBottom).toBe(true);
			instance.unmount();
		});
	});

	describe('followOutput', () => {
		it('auto-scrolls to bottom when content grows while at bottom', () => {
			const instance = render(
				<HookTest
					options={{
						contentHeight: 20,
						viewportHeight: 10,
						followOutput: true,
						initialOffset: 10,
					}}
				/>,
			);
			// Verify at bottom initially
			let state = getState(instance);
			expect(state.offset).toBe(10);
			expect(state.isAtBottom).toBe(true);

			// Rerender with more content
			React.act(() => {
				instance.rerender(
					<HookTest
						options={{
							contentHeight: 25,
							viewportHeight: 10,
							followOutput: true,
							initialOffset: 10,
						}}
					/>,
				);
			});
			state = getState(instance);
			// New maxOffset = 25 - 10 = 15
			expect(state.offset).toBe(15);
			expect(state.isAtBottom).toBe(true);
			instance.unmount();
		});

		it('does NOT auto-scroll when user is not at bottom', () => {
			const instance = render(
				<HookTest
					options={{
						contentHeight: 20,
						viewportHeight: 10,
						followOutput: true,
						initialOffset: 3,
					}}
				/>,
			);
			let state = getState(instance);
			expect(state.offset).toBe(3);

			// Rerender with more content
			React.act(() => {
				instance.rerender(
					<HookTest
						options={{
							contentHeight: 25,
							viewportHeight: 10,
							followOutput: true,
							initialOffset: 3,
						}}
					/>,
				);
			});
			state = getState(instance);
			// Should not move
			expect(state.offset).toBe(3);
			expect(state.isAtBottom).toBe(false);
			instance.unmount();
		});

		it('auto-scrolls when content grows from 0', () => {
			const instance = render(
				<HookTest
					options={{
						contentHeight: 0,
						viewportHeight: 10,
						followOutput: true,
					}}
				/>,
			);
			let state = getState(instance);
			expect(state.offset).toBe(0);

			// Rerender with content that exceeds viewport
			React.act(() => {
				instance.rerender(
					<HookTest
						options={{
							contentHeight: 20,
							viewportHeight: 10,
							followOutput: true,
						}}
					/>,
				);
			});
			state = getState(instance);
			// MaxOffset = 20 - 10 = 10
			expect(state.offset).toBe(10);
			expect(state.isAtBottom).toBe(true);
			instance.unmount();
		});

		it('does NOT auto-scroll when followOutput is false', () => {
			const instance = render(
				<HookTest
					options={{
						contentHeight: 20,
						viewportHeight: 10,
						followOutput: false,
						initialOffset: 10,
					}}
				/>,
			);
			let state = getState(instance);
			expect(state.offset).toBe(10);
			expect(state.isAtBottom).toBe(true);

			// Rerender with more content
			React.act(() => {
				instance.rerender(
					<HookTest
						options={{
							contentHeight: 25,
							viewportHeight: 10,
							followOutput: false,
							initialOffset: 10,
						}}
					/>,
				);
			});
			state = getState(instance);
			// Offset 10 is still valid (maxOffset = 15), stays at 10
			expect(state.offset).toBe(10);
			expect(state.isAtBottom).toBe(false);
			instance.unmount();
		});
	});

	describe('controlled mode', () => {
		it('uses controlledOffset instead of internal state', () => {
			const instance = render(
				<HookTest
					options={{contentHeight: 20, viewportHeight: 10, controlledOffset: 5}}
				/>,
			);
			const state = getState(instance);
			expect(state.offset).toBe(5);
			expect(state.canScrollUp).toBe(true);
			expect(state.canScrollDown).toBe(true);
			instance.unmount();
		});

		it('clamps controlledOffset to valid range', () => {
			const instance = render(
				<HookTest
					options={{contentHeight: 20, viewportHeight: 10, controlledOffset: 100}}
				/>,
			);
			const state = getState(instance);
			expect(state.offset).toBe(10); // maxOffset = 20 - 10 = 10
			expect(state.isAtBottom).toBe(true);
			instance.unmount();
		});

		it('updates when controlledOffset changes', () => {
			const instance = render(
				<HookTest
					options={{contentHeight: 20, viewportHeight: 10, controlledOffset: 0}}
				/>,
			);
			let state = getState(instance);
			expect(state.offset).toBe(0);

			React.act(() => {
				instance.rerender(
					<HookTest
						options={{contentHeight: 20, viewportHeight: 10, controlledOffset: 7}}
					/>,
				);
			});
			state = getState(instance);
			expect(state.offset).toBe(7);
			instance.unmount();
		});

		it('fires onOffsetChange on scrollDown in controlled mode', () => {
			const onOffsetChange = vi.fn();
			const instance = render(
				<HookTest
					options={{
						contentHeight: 20,
						viewportHeight: 10,
						controlledOffset: 0,
						onOffsetChange,
					}}
				/>,
			);
			React.act(() => {
				scrollRef.current!.scrollDown();
			});
			expect(onOffsetChange).toHaveBeenCalledWith(1);
			// In controlled mode, displayed offset stays at 0 since parent didn't update
			const state = getState(instance);
			expect(state.offset).toBe(0);
			instance.unmount();
		});

		it('fires onOffsetChange on scrollTo in controlled mode', () => {
			const onOffsetChange = vi.fn();
			const instance = render(
				<HookTest
					options={{
						contentHeight: 20,
						viewportHeight: 10,
						controlledOffset: 0,
						onOffsetChange,
					}}
				/>,
			);
			React.act(() => {
				scrollRef.current!.scrollTo(5);
			});
			expect(onOffsetChange).toHaveBeenCalledWith(5);
			instance.unmount();
		});

		it('fires onOffsetChange on scrollToBottom in controlled mode', () => {
			const onOffsetChange = vi.fn();
			const instance = render(
				<HookTest
					options={{
						contentHeight: 20,
						viewportHeight: 10,
						controlledOffset: 0,
						onOffsetChange,
					}}
				/>,
			);
			React.act(() => {
				scrollRef.current!.scrollToBottom();
			});
			expect(onOffsetChange).toHaveBeenCalledWith(10);
			instance.unmount();
		});

		it('fires onOffsetChange on scrollToTop in controlled mode', () => {
			const onOffsetChange = vi.fn();
			const instance = render(
				<HookTest
					options={{
						contentHeight: 20,
						viewportHeight: 10,
						controlledOffset: 5,
						onOffsetChange,
					}}
				/>,
			);
			React.act(() => {
				scrollRef.current!.scrollToTop();
			});
			expect(onOffsetChange).toHaveBeenCalledWith(0);
			instance.unmount();
		});
	});
});
