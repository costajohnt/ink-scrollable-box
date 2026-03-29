import {describe, it, expect} from 'vitest';
import {render} from 'ink-testing-library';
import {Scrollbar} from '../src/scrollbar.js';
import {ScrollableBox} from '../src/scrollable-box.js';

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
		// Should render at least one thumb character (could be full or half block)
		// Should render at least one thumb character (could be full or half block)
		const hasFullBlock = frame.includes('█');
		const hasUpperHalf = frame.includes('▀');
		const hasLowerHalf = frame.includes('▄');
		expect(hasFullBlock || hasUpperHalf || hasLowerHalf).toBe(true); // eslint-disable-line @typescript-eslint/prefer-nullish-coalescing
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
		// viewport=10, content=20 → halfThumbHeight = max(1, round(20 * (10/20))) = 10 half-lines = 5 full lines
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
		// viewport=10, content=11 → halfThumbHeight = max(1, round(20 * (10/11))) = max(1, round(18.18)) = 18 half-lines = 9 full lines
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

	// Scrollbar style tests

	it('scrollbarStyle=line renders │ and spaces', () => {
		const {lastFrame, unmount} = render(
			<Scrollbar
				contentHeight={20}
				viewportHeight={5}
				offset={0}
				isFocused={false}
				scrollbarStyle="line"
			/>,
		);
		const frame = lastFrame()!;
		expect(frame).toContain('│');
		// Track is space, so we just check no block characters
		expect(frame).not.toContain('█');
		expect(frame).not.toContain('░');
		unmount();
	});

	it('scrollbarStyle=thick renders ┃ and ╏', () => {
		const {lastFrame, unmount} = render(
			<Scrollbar
				contentHeight={20}
				viewportHeight={5}
				offset={0}
				isFocused={false}
				scrollbarStyle="thick"
			/>,
		);
		const frame = lastFrame()!;
		expect(frame).toContain('┃');
		expect(frame).toContain('╏');
		unmount();
	});

	it('scrollbarStyle=dots renders ● and ·', () => {
		const {lastFrame, unmount} = render(
			<Scrollbar
				contentHeight={20}
				viewportHeight={5}
				offset={0}
				isFocused={false}
				scrollbarStyle="dots"
			/>,
		);
		const frame = lastFrame()!;
		expect(frame).toContain('●');
		expect(frame).toContain('·');
		unmount();
	});

	it('scrollbarStyle=block (default) uses half-line precision with half-block chars at thumb edges', () => {
		// With half-line precision and specific ratios, half-block characters appear at edges
		// contentHeight=30, viewportHeight=10, offset=7
		// halfViewport=20, halfThumbHeight=max(1,round(20*(10/30)))=max(1,round(6.67))=7
		// halfMaxThumbOffset=20-7=13, halfMaxScrollOffset=20
		// halfThumbOffset=round((7/20)*13)=round(4.55)=5
		// Thumb occupies half-lines 5..11
		// Cell 0: top=0, bottom=1 → track
		// Cell 1: top=2, bottom=3 → track
		// Cell 2: top=4, bottom=5 → bottom in thumb → ▄
		// Cell 3: top=6, bottom=7 → both in thumb → █
		// Cell 4: top=8, bottom=9 → both in thumb → █
		// Cell 5: top=10, bottom=11 → top in thumb → ▀
		// Cell 6: top=12, bottom=13 → track
		// ...
		const {lastFrame, unmount} = render(
			<Scrollbar
				contentHeight={30}
				viewportHeight={10}
				offset={7}
				isFocused={false}
			/>,
		);
		const frame = lastFrame()!;
		const hasUpperHalf = frame.includes('▀');
		const hasLowerHalf = frame.includes('▄');
		expect(hasUpperHalf || hasLowerHalf).toBe(true); // eslint-disable-line @typescript-eslint/prefer-nullish-coalescing
		unmount();
	});

	it('custom thumbCharacter overrides style default', () => {
		const {lastFrame, unmount} = render(
			<Scrollbar
				contentHeight={20}
				viewportHeight={5}
				offset={0}
				isFocused={false}
				scrollbarStyle="dots"
				thumbCharacter="X"
			/>,
		);
		const frame = lastFrame()!;
		expect(frame).toContain('X');
		// Track should still be from dots style
		expect(frame).toContain('·');
		// Should not contain dots thumb
		expect(frame).not.toContain('●');
		unmount();
	});

	it('custom trackCharacter overrides style default', () => {
		const {lastFrame, unmount} = render(
			<Scrollbar
				contentHeight={20}
				viewportHeight={5}
				offset={0}
				isFocused={false}
				scrollbarStyle="thick"
				trackCharacter="-"
			/>,
		);
		const frame = lastFrame()!;
		// Thumb should still be from thick style
		expect(frame).toContain('┃');
		expect(frame).toContain('-');
		// Should not contain thick track
		expect(frame).not.toContain('╏');
		unmount();
	});

	it('scrollbarStyle prop works on ScrollableBox', () => {
		const lines = Array.from({length: 20}, (_, i) => `Line ${i}`);
		const {lastFrame, unmount} = render(
			<ScrollableBox height={5} scrollbarStyle="dots" lines={lines} />,
		);
		const frame = lastFrame()!;
		expect(frame).toContain('●');
		expect(frame).toContain('·');
		unmount();
	});

	it('custom thumbCharacter with block style disables half-line precision', () => {
		// When a custom thumbCharacter is set, half-line precision should be disabled
		// even for block style (since half-block chars wouldn't match the custom character)
		const {lastFrame, unmount} = render(
			<Scrollbar
				contentHeight={30}
				viewportHeight={10}
				offset={7}
				isFocused={false}
				scrollbarStyle="block"
				thumbCharacter="X"
			/>,
		);
		const frame = lastFrame()!;
		// Should not contain half-block characters
		expect(frame).not.toContain('▀');
		expect(frame).not.toContain('▄');
		expect(frame).toContain('X');
		unmount();
	});
});
