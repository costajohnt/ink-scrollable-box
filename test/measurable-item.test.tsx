import React from 'react';
import {
	describe, it, expect, vi,
} from 'vitest';
import {render} from 'ink-testing-library';
import {Text} from 'ink';
import {MeasurableItem} from '../src/measurable-item.js';
import {tick} from './helpers.js';

vi.mock('ink', async importOriginal => {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- vi.mock factory requires cast
	const original = await importOriginal() as Record<string, unknown>;
	return {
		...original,
		measureElement: vi.fn(original.measureElement),
	};
});

describe('MeasurableItem', () => {
	it('calls onMeasure with measured height on render', async () => {
		const onMeasure = vi.fn();
		const {unmount} = render(
			<MeasurableItem onMeasure={onMeasure}>
				<Text>Hello</Text>
			</MeasurableItem>,
		);
		await tick();
		expect(onMeasure).toHaveBeenCalled();
		unmount();
	});

	it('falls back to height=1 when measureElement throws', async () => {
		const ink = await import('ink');
		const mockMeasureElement = ink.measureElement as ReturnType<typeof vi.fn>;
		mockMeasureElement.mockImplementationOnce(() => {
			throw new Error('yoga node not ready');
		});

		const onMeasure = vi.fn();
		const {unmount} = render(
			<MeasurableItem onMeasure={onMeasure}>
				<Text>Test</Text>
			</MeasurableItem>,
		);
		await tick();

		expect(onMeasure).toHaveBeenCalledWith(1);
		unmount();
	});
});
