import React from 'react';
import {describe, it, expect} from 'vitest';
import {render} from 'ink-testing-library';
import {Scrollbar} from '../src/scrollbar.js';

describe('Scrollbar', () => {
	it('renders nothing when content fits viewport', () => {
		const {lastFrame, unmount} = render(
			<Scrollbar
				contentHeight={5}
				viewportHeight={10}
				offset={0}
				isFocused={false}
			/>,
		);
		expect(lastFrame()).toBe('');
		unmount();
	});

	it('renders nothing when content equals viewport', () => {
		const {lastFrame, unmount} = render(
			<Scrollbar
				contentHeight={10}
				viewportHeight={10}
				offset={0}
				isFocused={false}
			/>,
		);
		expect(lastFrame()).toBe('');
		unmount();
	});

	it('renders track with thumb at top when offset is 0', () => {
		const {lastFrame, unmount} = render(
			<Scrollbar
				contentHeight={20}
				viewportHeight={5}
				offset={0}
				isFocused={false}
			/>,
		);
		const frame = lastFrame()!;
		// Should contain both thumb and track characters
		expect(frame).toContain('█');
		expect(frame).toContain('░');
		// First character should be thumb (at top)
		const lines = frame.split('\n');
		expect(lines[0]).toContain('█');
		unmount();
	});

	it('renders thumb at bottom when at max offset', () => {
		// contentHeight=20, viewportHeight=5, maxScrollOffset=15
		// thumbHeight = max(1, round(5 * (5/20))) = max(1, round(1.25)) = max(1, 1) = 1
		// maxThumbOffset = 5 - 1 = 4
		// thumbOffset = round((15/15) * 4) = 4
		// thumb is at line 4 (last line)
		const {lastFrame, unmount} = render(
			<Scrollbar
				contentHeight={20}
				viewportHeight={5}
				offset={15}
				isFocused={false}
			/>,
		);
		const frame = lastFrame()!;
		expect(frame).toContain('█');
		expect(frame).toContain('░');
		const lines = frame.split('\n');
		// Last line should be thumb
		expect(lines[lines.length - 1]).toContain('█');
		// First line should be track
		expect(lines[0]).toContain('░');
		unmount();
	});

	it('thumb height minimum is 1 for very large content', () => {
		const {lastFrame, unmount} = render(
			<Scrollbar
				contentHeight={100_000}
				viewportHeight={10}
				offset={0}
				isFocused={false}
			/>,
		);
		const frame = lastFrame()!;
		// Should render at least one thumb character
		expect(frame).toContain('█');
		// Count thumb characters - should be at least 1
		const thumbCount = (frame.match(/█/g) ?? []).length;
		expect(thumbCount).toBeGreaterThanOrEqual(1);
		unmount();
	});

	it('uses custom thumb and track characters', () => {
		const {lastFrame, unmount} = render(
			<Scrollbar
				contentHeight={20}
				viewportHeight={5}
				offset={0}
				isFocused={false}
				thumbCharacter="■"
				trackCharacter="·"
			/>,
		);
		const frame = lastFrame()!;
		expect(frame).toContain('■');
		expect(frame).toContain('·');
		expect(frame).not.toContain('█');
		expect(frame).not.toContain('░');
		unmount();
	});

	it('thumb is proportional to viewport/content ratio', () => {
		// viewport=10, content=20 → thumbHeight = max(1, round(10 * (10/20))) = max(1, round(5)) = 5
		const {lastFrame, unmount} = render(
			<Scrollbar
				contentHeight={20}
				viewportHeight={10}
				offset={0}
				isFocused={false}
			/>,
		);
		const frame = lastFrame()!;
		const thumbCount = (frame.match(/█/g) ?? []).length;
		expect(thumbCount).toBe(5);
		unmount();
	});

	it('renders full thumb when content is only slightly larger than viewport', () => {
		// viewport=10, content=11 → thumbHeight = max(1, round(10 * (10/11))) = max(1, round(9.09)) = 9
		const {lastFrame, unmount} = render(
			<Scrollbar
				contentHeight={11}
				viewportHeight={10}
				offset={0}
				isFocused={false}
			/>,
		);
		const frame = lastFrame()!;
		const thumbCount = (frame.match(/█/g) ?? []).length;
		expect(thumbCount).toBe(9);
		unmount();
	});

	it('renders viewportHeight lines total', () => {
		const viewportHeight = 8;
		const {lastFrame, unmount} = render(
			<Scrollbar
				contentHeight={20}
				viewportHeight={viewportHeight}
				offset={0}
				isFocused={false}
			/>,
		);
		const frame = lastFrame()!;
		const lines = frame.split('\n');
		expect(lines).toHaveLength(viewportHeight);
		unmount();
	});
});
