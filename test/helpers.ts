import type {render} from 'ink-testing-library';

/** Wait for a microtask/macrotask cycle to flush React state and effects. */
export async function tick(): Promise<void> {
	await new Promise<void>(resolve => {
		setImmediate(resolve);
	});
}

/**
 * Write a key to stdin and wait for React to process it.
 * Two ticks are needed: one for the input event to propagate through
 * Ink's event pipeline, and one for React to commit the state update.
 */
export async function write(stdin: ReturnType<typeof render>['stdin'], data: string): Promise<void> {
	stdin.write(data);
	await tick();
	await tick();
}

/**
 * Focus the component by pressing Tab, then wait for effects to settle.
 * Ink's useFocus doesn't autoFocus by default, so Tab is needed.
 */
export async function focus(stdin: ReturnType<typeof render>['stdin']): Promise<void> {
	stdin.write('\t');
	await tick();
	await tick();
}

export function makeLines(n: number, prefix = 'Line'): string[] {
	return Array.from({length: n}, (_, i) => `${prefix} ${i + 1}`);
}

export function getState(instance: ReturnType<typeof render>): Record<string, unknown> {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON.parse returns any
	return JSON.parse(instance.lastFrame()!.trim()) as Record<string, unknown>;
}
