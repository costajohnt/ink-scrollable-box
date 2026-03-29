import React from 'react';
import {describe, it, expect} from 'vitest';
import {render} from 'ink-testing-library';
import {Text} from 'ink';
import {useScrollable} from '../src/use-scrollable.js';
import {useScrollableInput} from '../src/use-scrollable-input.js';

function ScrollableWithInput({
	contentHeight,
	viewportHeight,
	focusable = true,
	id,
	enableVimBindings = true,
}: {
	contentHeight: number;
	viewportHeight: number;
	focusable?: boolean;
	id?: string;
	enableVimBindings?: boolean;
}) {
	const scroll = useScrollable({contentHeight, viewportHeight});
	useScrollableInput({
		scroll,
		focusable,
		id,
		enableVimBindings,
	});
	return (
		<Text>
			{JSON.stringify({
				offset: scroll.offset,
				isAtTop: scroll.isAtTop,
				isAtBottom: scroll.isAtBottom,
			})}
		</Text>
	);
}

function getState(instance: ReturnType<typeof render>) {
	return JSON.parse(instance.lastFrame()!.trim());
}

/** Wait for a microtask/macrotask cycle to flush React state and effects. */
async function tick() {
	await new Promise<void>(resolve => setImmediate(resolve));
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
 * Ink's useFocus doesn't autoFocus by default, so Tab is needed.
 */
async function focus(stdin: ReturnType<typeof render>['stdin']) {
	stdin.write('\t');
	await tick();
	await tick();
}

describe('useScrollableInput', () => {
	it('arrow down scrolls down', async () => {
		const instance = render(
			<ScrollableWithInput contentHeight={20} viewportHeight={5} />,
		);
		await focus(instance.stdin);
		await write(instance.stdin, '\x1B[B');
		expect(getState(instance).offset).toBe(1);
		instance.unmount();
	});

	it('arrow up scrolls up', async () => {
		const instance = render(
			<ScrollableWithInput contentHeight={20} viewportHeight={5} />,
		);
		await focus(instance.stdin);
		await write(instance.stdin, '\x1B[B');
		await write(instance.stdin, '\x1B[B');
		await write(instance.stdin, '\x1B[A');
		expect(getState(instance).offset).toBe(1);
		instance.unmount();
	});

	it('j scrolls down', async () => {
		const instance = render(
			<ScrollableWithInput contentHeight={20} viewportHeight={5} />,
		);
		await focus(instance.stdin);
		await write(instance.stdin, 'j');
		expect(getState(instance).offset).toBe(1);
		instance.unmount();
	});

	it('k scrolls up', async () => {
		const instance = render(
			<ScrollableWithInput contentHeight={20} viewportHeight={5} />,
		);
		await focus(instance.stdin);
		await write(instance.stdin, 'j');
		await write(instance.stdin, 'j');
		await write(instance.stdin, 'k');
		expect(getState(instance).offset).toBe(1);
		instance.unmount();
	});

	it('g jumps to top', async () => {
		const instance = render(
			<ScrollableWithInput contentHeight={20} viewportHeight={5} />,
		);
		await focus(instance.stdin);
		await write(instance.stdin, 'j');
		await write(instance.stdin, 'j');
		await write(instance.stdin, 'j');
		await write(instance.stdin, 'g');
		const state = getState(instance);
		expect(state.offset).toBe(0);
		expect(state.isAtTop).toBe(true);
		instance.unmount();
	});

	it('G (shift+g) jumps to bottom', async () => {
		const instance = render(
			<ScrollableWithInput contentHeight={20} viewportHeight={5} />,
		);
		await focus(instance.stdin);
		await write(instance.stdin, 'G');
		const state = getState(instance);
		expect(state.isAtBottom).toBe(true);
		instance.unmount();
	});

	it('u pages up', async () => {
		const instance = render(
			<ScrollableWithInput contentHeight={20} viewportHeight={5} />,
		);
		await focus(instance.stdin);
		await write(instance.stdin, 'G');
		await write(instance.stdin, 'u');
		const state = getState(instance);
		// maxOffset = 20 - 5 = 15; pageUp from 15 => 15 - 5 = 10
		expect(state.offset).toBe(10);
		expect(state.isAtBottom).toBe(false);
		instance.unmount();
	});

	it('d pages down', async () => {
		const instance = render(
			<ScrollableWithInput contentHeight={20} viewportHeight={5} />,
		);
		await focus(instance.stdin);
		await write(instance.stdin, 'd');
		const state = getState(instance);
		expect(state.offset).toBe(5);
		instance.unmount();
	});

	it('Page Up key pages up', async () => {
		const instance = render(
			<ScrollableWithInput contentHeight={20} viewportHeight={5} />,
		);
		await focus(instance.stdin);
		await write(instance.stdin, 'G');
		await write(instance.stdin, '\x1B[5~');
		const state = getState(instance);
		// maxOffset = 15; pageUp from 15 => 15 - 5 = 10
		expect(state.offset).toBe(10);
		expect(state.isAtBottom).toBe(false);
		instance.unmount();
	});

	it('Page Down key pages down', async () => {
		const instance = render(
			<ScrollableWithInput contentHeight={20} viewportHeight={5} />,
		);
		await focus(instance.stdin);
		await write(instance.stdin, '\x1B[6~');
		const state = getState(instance);
		expect(state.offset).toBe(5);
		instance.unmount();
	});

	it('Home key jumps to top', async () => {
		const instance = render(
			<ScrollableWithInput contentHeight={20} viewportHeight={5} />,
		);
		await focus(instance.stdin);
		await write(instance.stdin, 'G');
		await write(instance.stdin, '\x1B[H');
		const state = getState(instance);
		expect(state.offset).toBe(0);
		expect(state.isAtTop).toBe(true);
		instance.unmount();
	});

	it('End key jumps to bottom', async () => {
		const instance = render(
			<ScrollableWithInput contentHeight={20} viewportHeight={5} />,
		);
		await focus(instance.stdin);
		await write(instance.stdin, '\x1B[F');
		const state = getState(instance);
		expect(state.isAtBottom).toBe(true);
		instance.unmount();
	});

	it('ignores input when focusable is false', async () => {
		const instance = render(
			<ScrollableWithInput
				contentHeight={20}
				viewportHeight={5}
				focusable={false}
			/>,
		);
		// No tab focus needed — focusable=false means no focus participation
		await write(instance.stdin, 'j');
		await write(instance.stdin, '\x1B[B');
		await write(instance.stdin, 'd');
		const state = getState(instance);
		expect(state.offset).toBe(0);
		expect(state.isAtTop).toBe(true);
		instance.unmount();
	});

	it('unmapped keys have no effect', async () => {
		const instance = render(
			<ScrollableWithInput contentHeight={20} viewportHeight={5} />,
		);
		await focus(instance.stdin);
		await write(instance.stdin, 'x');
		await write(instance.stdin, 'z');
		await write(instance.stdin, 'a');
		const state = getState(instance);
		expect(state.offset).toBe(0);
		expect(state.isAtTop).toBe(true);
		instance.unmount();
	});

	it('Ctrl+D scrolls down by half a page', async () => {
		const instance = render(
			<ScrollableWithInput contentHeight={20} viewportHeight={10} />,
		);
		await focus(instance.stdin);
		// Ctrl+D is \x04
		await write(instance.stdin, '\x04');
		// Math.floor(10 / 2) = 5
		expect(getState(instance).offset).toBe(5);
		instance.unmount();
	});

	it('Ctrl+U scrolls up by half a page', async () => {
		const instance = render(
			<ScrollableWithInput contentHeight={20} viewportHeight={10} />,
		);
		await focus(instance.stdin);
		await write(instance.stdin, 'G'); // Go to bottom (offset 10)
		// Ctrl+U is \x15
		await write(instance.stdin, '\x15');
		// 10 - Math.floor(10 / 2) = 5
		expect(getState(instance).offset).toBe(5);
		instance.unmount();
	});

	describe('enableVimBindings=false', () => {
		it('j/k/g/G/u/d have no effect', async () => {
			const instance = render(
				<ScrollableWithInput contentHeight={20} viewportHeight={5} enableVimBindings={false} />,
			);
			await focus(instance.stdin);
			await write(instance.stdin, 'j');
			expect(getState(instance).offset).toBe(0);
			await write(instance.stdin, 'k');
			expect(getState(instance).offset).toBe(0);
			await write(instance.stdin, 'G');
			expect(getState(instance).offset).toBe(0);
			await write(instance.stdin, 'g');
			expect(getState(instance).offset).toBe(0);
			await write(instance.stdin, 'd');
			expect(getState(instance).offset).toBe(0);
			await write(instance.stdin, 'u');
			expect(getState(instance).offset).toBe(0);
			instance.unmount();
		});

		it('arrow keys still work when vim bindings disabled', async () => {
			const instance = render(
				<ScrollableWithInput contentHeight={20} viewportHeight={5} enableVimBindings={false} />,
			);
			await focus(instance.stdin);
			await write(instance.stdin, '\x1B[B'); // Arrow down
			expect(getState(instance).offset).toBe(1);
			await write(instance.stdin, '\x1B[A'); // Arrow up
			expect(getState(instance).offset).toBe(0);
			instance.unmount();
		});

		it('Ctrl+U/D still work when vim bindings disabled', async () => {
			const instance = render(
				<ScrollableWithInput contentHeight={20} viewportHeight={10} enableVimBindings={false} />,
			);
			await focus(instance.stdin);
			await write(instance.stdin, '\x04'); // Ctrl+D
			expect(getState(instance).offset).toBe(5);
			await write(instance.stdin, '\x15'); // Ctrl+U
			expect(getState(instance).offset).toBe(0);
			instance.unmount();
		});

		it('Page Up/Down still work when vim bindings disabled', async () => {
			const instance = render(
				<ScrollableWithInput contentHeight={20} viewportHeight={5} enableVimBindings={false} />,
			);
			await focus(instance.stdin);
			await write(instance.stdin, '\x1B[6~'); // Page Down
			expect(getState(instance).offset).toBe(5);
			await write(instance.stdin, '\x1B[5~'); // Page Up
			expect(getState(instance).offset).toBe(0);
			instance.unmount();
		});

		it('Home/End still work when vim bindings disabled', async () => {
			const instance = render(
				<ScrollableWithInput contentHeight={20} viewportHeight={5} enableVimBindings={false} />,
			);
			await focus(instance.stdin);
			await write(instance.stdin, '\x1B[F'); // End
			expect(getState(instance).isAtBottom).toBe(true);
			await write(instance.stdin, '\x1B[H'); // Home
			expect(getState(instance).isAtTop).toBe(true);
			instance.unmount();
		});
	});
});
