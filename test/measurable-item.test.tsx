import React from 'react';
import {describe, it, expect, vi} from 'vitest';
import {render} from 'ink-testing-library';
import {Text} from 'ink';
import {MeasurableItem} from '../src/measurable-item.js';
import {tick} from './helpers.js';

vi.mock('ink', async importOriginal => {
	const original = await importOriginal<typeof import('ink')>();
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
		// Import the mocked module so we can control the mock
		const ink = await import('ink');
		// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
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

		// The catch block calls onMeasure(1) as fallback
		expect(onMeasure).toHaveBeenCalledWith(1);
		unmount();
	});
});
