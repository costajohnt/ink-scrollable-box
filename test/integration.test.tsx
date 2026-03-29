import React from 'react';
import {describe, it, expect} from 'vitest';
import {render} from 'ink-testing-library';
import {Box} from 'ink';
import {ScrollableBox} from '../src/scrollable-box.js';
import {makeLines, write, focus} from './helpers.js';

const arrowDown = '\u001B[B';
const tab = '\t';

describe('integration', () => {
	it('two ScrollableBox instances with independent scroll via Tab', async () => {
		const {lastFrame, stdin, unmount} = render(
			<Box flexDirection='row' gap={1}>
				<ScrollableBox height={3} lines={makeLines(10, 'A')} id='pane-a'/>
				<ScrollableBox height={3} lines={makeLines(10, 'B')} id='pane-b'/>
			</Box>,
		);

		await focus(stdin);
		await write(stdin, arrowDown);

		let frame = lastFrame()!;
		expect(frame).toContain('A 2'); // Pane A scrolled
		expect(frame).toContain('B 1'); // Pane B unchanged

		// Tab to second pane
		await write(stdin, tab);
		await write(stdin, arrowDown);
		await write(stdin, arrowDown);

		frame = lastFrame()!;
		expect(frame).toContain('B 3'); // Pane B scrolled

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

		await focus(stdin);
		await write(stdin, 'G'); // Jump to bottom

		const frame = lastFrame()!;
		expect(frame).toContain('Line 9999');
		unmount();
	});
});
