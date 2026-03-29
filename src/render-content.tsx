import {Box, Text} from 'ink';
import {MeasurableItem} from './measurable-item.js';

type ScrollContentProps = {
	lines?: string[];
	childrenArray: React.ReactNode[];
	measureChildren: boolean;
	scrollOffset: number;
	effectiveHeight: number;
	contentHeight: number;
	overscan: number;
	onItemMeasure: (index: number, height: number) => void;
};

export function ScrollContent({
	lines,
	childrenArray,
	measureChildren,
	scrollOffset,
	effectiveHeight,
	contentHeight,
	overscan,
	onItemMeasure,
}: ScrollContentProps) {
	if (measureChildren) {
		return (
			<Box flexDirection='column' flexGrow={1} marginTop={-scrollOffset}>
				{childrenArray.map((child, i) => (
					<MeasurableItem
						key={i}
						onMeasure={h => {
							onItemMeasure(i, h);
						}}
					>
						{child}
					</MeasurableItem>
				))}
			</Box>
		);
	}

	const visibleContent = lines
		? lines
			.slice(scrollOffset, scrollOffset + effectiveHeight)
			.map((line, _i, _array, key = `line-${scrollOffset + _i}`) => (
				<Text key={key}>{line}</Text>
			))
		: childrenArray.slice(scrollOffset, scrollOffset + effectiveHeight);

	// Overscan: pre-render extra items above and below the viewport in
	// zero-height hidden boxes so they exist in React's VDOM for faster
	// reconciliation when they scroll into view.
	const overscanAboveStart = Math.max(0, scrollOffset - overscan);
	const overscanBelowEnd = Math.min(contentHeight, scrollOffset + effectiveHeight + overscan);

	const overscanAbove = overscan > 0 && overscanAboveStart < scrollOffset
		? (
			<Box height={0} overflowY='hidden' flexDirection='column'>
				{lines
					? lines.slice(overscanAboveStart, scrollOffset).map((line, _i, _array, key = `os-above-${overscanAboveStart + _i}`) => (
						<Text key={key}>{line}</Text>
					))
					: childrenArray.slice(overscanAboveStart, scrollOffset)}
			</Box>
		)
		: null;

	const overscanBelow = overscan > 0 && scrollOffset + effectiveHeight < overscanBelowEnd
		? (
			<Box height={0} overflowY='hidden' flexDirection='column'>
				{lines
					? lines.slice(scrollOffset + effectiveHeight, overscanBelowEnd).map((line, _i, _array, key = `os-below-${scrollOffset + effectiveHeight + _i}`) => (
						<Text key={key}>{line}</Text>
					))
					: childrenArray.slice(scrollOffset + effectiveHeight, overscanBelowEnd)}
			</Box>
		)
		: null;

	return (
		<>
			{overscanAbove}
			{visibleContent}
			{overscanBelow}
		</>
	);
}
