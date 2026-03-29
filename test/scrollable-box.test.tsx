import React from 'react';
import {
	describe, it, expect, vi,
} from 'vitest';
import {render} from 'ink-testing-library';
import {ScrollableBox} from '../src/scrollable-box.js';

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
