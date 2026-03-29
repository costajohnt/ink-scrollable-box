import React from 'react';
import {
	describe, it, expect,
} from 'vitest';
import {render} from 'ink-testing-library';
import {ScrollableBox} from '../src/scrollable-box.js';
import {useLinkedScroll} from '../src/use-linked-scroll.js';

/** Wait for a microtask/macrotask cycle to flush React state and effects. */
async function tick() {
	await new Promise<void>(resolve => {
		setImmediate(resolve);
	});
}

const arrowDown = '\u001B[B';

function makeLines(n: number, prefix = 'Line'): string[] {
	return Array.from({length: n}, (_, i) => `${prefix} ${i + 1}`);
}

describe('useLinkedScroll', () => {
	it('two ScrollableBoxes with linked scroll — scrolling one updates the other', async () => {
		const leftLines = makeLines(20, 'Left');
		const rightLines = makeLines(20, 'Right');

		function LinkedTest() {
			const linked = useLinkedScroll();
			return (
				<>
					<ScrollableBox
						height={5}
						lines={leftLines}
						offset={linked.offset}
						onOffsetChange={linked.onOffsetChange}
						showScrollbar={false}
						showIndicators={false}
					/>
					<ScrollableBox
						height={5}
						lines={rightLines}
						offset={linked.offset}
						onOffsetChange={linked.onOffsetChange}
						showScrollbar={false}
						showIndicators={false}
					/>
				</>
			);
		}

		let instance!: ReturnType<typeof render>;

		await React.act(async () => {
			instance = render(<LinkedTest />);
		});

		// Both start at offset 0
		let frame = instance.lastFrame()!;
		expect(frame).toContain('Left 1');
		expect(frame).toContain('Right 1');

		// Focus the first ScrollableBox and scroll down
		await React.act(async () => {
			instance.stdin.write('\t');
		});

		await React.act(async () => {
			instance.stdin.write(arrowDown);
		});

		await tick();
		await tick();

		frame = instance.lastFrame()!;
		// Both boxes should have scrolled to offset 1
		expect(frame).toContain('Left 2');
		expect(frame).toContain('Right 2');

		instance.unmount();
	});

	it('both boxes show the same content offset', async () => {
		const leftLines = makeLines(20, 'A');
		const rightLines = makeLines(20, 'B');

		function LinkedOffsetTest() {
			const linked = useLinkedScroll();
			return (
				<>
					<ScrollableBox
						height={5}
						lines={leftLines}
						offset={linked.offset}
						onOffsetChange={linked.onOffsetChange}
						showScrollbar={false}
						showIndicators={false}
					/>
					<ScrollableBox
						height={5}
						lines={rightLines}
						offset={linked.offset}
						onOffsetChange={linked.onOffsetChange}
						showScrollbar={false}
						showIndicators={false}
					/>
				</>
			);
		}

		let instance!: ReturnType<typeof render>;

		await React.act(async () => {
			instance = render(<LinkedOffsetTest />);
		});

		// Focus and scroll down several times
		await React.act(async () => {
			instance.stdin.write('\t');
		});

		for (let i = 0; i < 5; i++) {
			// eslint-disable-next-line no-await-in-loop, @typescript-eslint/no-loop-func
			await React.act(async () => {
				instance.stdin.write(arrowDown);
			});
		}

		await tick();
		await tick();

		const frame = instance.lastFrame()!;
		// Both boxes at offset 5: first visible line is 6
		expect(frame).toContain('A 6');
		expect(frame).toContain('B 6');
		// Line 5 should not be visible (above viewport)
		expect(frame).not.toMatch(/A 5\b/);
		expect(frame).not.toMatch(/B 5\b/);

		instance.unmount();
	});
});
