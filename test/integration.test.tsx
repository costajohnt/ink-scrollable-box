import React from 'react';
import {describe, it, expect} from 'vitest';
import {render} from 'ink-testing-library';
import {Box} from 'ink';
import {ScrollableBox} from '../src/scrollable-box.js';

const arrowDown = '\u001B[B';
const tab = '\t';

function makeLines(prefix: string, n: number): string[] {
	return Array.from({length: n}, (_, i) => `${prefix}-${i + 1}`);
}

describe('integration', () => {
	it('two ScrollableBox instances with independent scroll via Tab', async () => {
		const {lastFrame, stdin, unmount} = render(
			<Box flexDirection='row' gap={1}>
				<ScrollableBox height={3} lines={makeLines('A', 10)} id='pane-a'/>
				<ScrollableBox height={3} lines={makeLines('B', 10)} id='pane-b'/>
			</Box>,
		);

		// Tab to focus first pane
		stdin.write(tab);
		await new Promise<void>(resolve => {
			setTimeout(resolve, 50);
		});

		// Scroll pane A
		stdin.write(arrowDown);
		await new Promise<void>(resolve => {
			setTimeout(resolve, 50);
		});

		let frame = lastFrame()!;
		expect(frame).toContain('A-2'); // Pane A scrolled
		expect(frame).toContain('B-1'); // Pane B unchanged

		// Tab to second pane
		stdin.write(tab);
		await new Promise<void>(resolve => {
			setTimeout(resolve, 50);
		});

		stdin.write(arrowDown);
		stdin.write(arrowDown);
		await new Promise<void>(resolve => {
			setTimeout(resolve, 50);
		});

		frame = lastFrame()!;
		expect(frame).toContain('B-3'); // Pane B scrolled

		unmount();
	});

	it('handles large dataset without hanging', async () => {
		const lines = Array.from({length: 10_000}, (_, i) => `Line ${i}`);
		const start = Date.now();
		const {lastFrame, stdin, unmount} = render(
			<ScrollableBox height={20} lines={lines}/>,
		);
		const elapsed = Date.now() - start;
		expect(elapsed).toBeLessThan(1000);

		stdin.write(tab);
		await new Promise<void>(resolve => {
			setTimeout(resolve, 50);
		});

		stdin.write('G'); // Jump to bottom
		await new Promise<void>(resolve => {
			setTimeout(resolve, 50);
		});

		const frame = lastFrame()!;
		expect(frame).toContain('Line 9999');
		unmount();
	});
});
