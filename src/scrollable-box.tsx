import {
	Children,
	forwardRef,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from 'react';
import {Box, Text} from 'ink';
import {useScrollable} from './use-scrollable.js';
import {useScrollableInput} from './use-scrollable-input.js';
import {Scrollbar} from './scrollbar.js';
import {MeasurableItem} from './measurable-item.js';
import type {ScrollableBoxProps, ScrollableBoxRef} from './types.js';

function validateProps(height: number, lines?: string[], children?: React.ReactNode) {
	if (lines !== undefined && children !== undefined) {
		throw new Error('ScrollableBox: Provide either `lines` or `children`, not both.');
	}

	if (!Number.isInteger(height) || height <= 0) {
		throw new Error(`ScrollableBox: \`height\` must be a positive integer, got ${height}.`);
	}

	if (lines !== undefined && !Array.isArray(lines)) {
		throw new Error('ScrollableBox: `lines` must be an array of strings.');
	}
}

function ScrollableBoxRender({
	height,
	lines,
	children,
	followOutput = false,
	scrollStep = 1,
	border = false,
	showScrollbar = true,
	showIndicators = true,
	focusable = true,
	id,
	onScroll,
	scrollbarCharacter,
	trackCharacter,
	upIndicator = '▲',
	downIndicator = '▼',
	scrollbarColor,
	scrollbarDimColor,
	trackColor,
	borderColor,
	borderDimColor = 'gray',
	enableVimBindings = true,
	onFocus,
	onBlur,
	overscan,
	offset,
	onOffsetChange,
	measureChildren = false,
}: ScrollableBoxProps, ref: React.ForwardedRef<ScrollableBoxRef>) {
	validateProps(height, lines, children);

	// Determine content
	const childrenArray = useMemo(
		() => (children ? Children.toArray(children) : []),
		[children],
	);

	// Measurement state for variable-height children
	const heightsRef = useRef<number[]>([]);
	const [measuredHeight, setMeasuredHeight] = useState(childrenArray.length);

	// After all children are measured, update total height
	useEffect(() => {
		if (measureChildren && heightsRef.current.length === childrenArray.length) {
			const total = heightsRef.current.reduce((sum, h) => sum + h, 0);
			if (total !== measuredHeight && total > 0) {
				setMeasuredHeight(total);
			}
		}
	}, [measureChildren, childrenArray.length, measuredHeight]);

	const contentHeight = lines
		? lines.length
		: (measureChildren ? measuredHeight : childrenArray.length);

	// Account for border reducing effective viewport
	const effectiveHeight = border ? Math.max(1, height - 2) : height;

	const scroll = useScrollable({
		contentHeight,
		viewportHeight: effectiveHeight,
		scrollStep,
		followOutput,
		controlledOffset: offset,
		onOffsetChange,
	});

	useImperativeHandle(ref, () => ({
		scrollTo(offset: number) {
			scroll.scrollTo(offset);
		},
		scrollToTop() {
			scroll.scrollToTop();
		},
		scrollToBottom() {
			scroll.scrollToBottom();
		},
		scrollUp() {
			scroll.scrollUp();
		},
		scrollDown() {
			scroll.scrollDown();
		},
		pageUp() {
			scroll.pageUp();
		},
		pageDown() {
			scroll.pageDown();
		},
		halfPageUp() {
			scroll.halfPageUp();
		},
		halfPageDown() {
			scroll.halfPageDown();
		},
		scrollToIndex(index: number, options?: {align?: 'start' | 'center' | 'end'}) {
			const align = options?.align ?? 'start';
			let target: number;
			if (align === 'start') {
				target = index;
			} else if (align === 'end') {
				target = index - effectiveHeight + 1;
			} else {
				// center
				target = index - Math.floor(effectiveHeight / 2);
			}

			scroll.scrollTo(target);
		},
		getScrollState() {
			return {
				offset: scroll.offset,
				contentHeight: scroll.contentHeight,
				viewportHeight: scroll.viewportHeight,
				canScrollUp: scroll.canScrollUp,
				canScrollDown: scroll.canScrollDown,
				isAtTop: scroll.isAtTop,
				isAtBottom: scroll.isAtBottom,
				percentage: scroll.percentage,
			};
		},
	}), [scroll, effectiveHeight]);

	const {isFocused} = useScrollableInput({
		scroll,
		focusable,
		id,
		enableVimBindings,
	});

	// Fire onFocus / onBlur callbacks — keep refs in sync to avoid stale closures
	const onFocusRef = useRef(onFocus);
	useEffect(() => {
		onFocusRef.current = onFocus;
	}, [onFocus]);

	const onBlurRef = useRef(onBlur);
	useEffect(() => {
		onBlurRef.current = onBlur;
	}, [onBlur]);

	const previousFocusedRef = useRef(false);
	useEffect(() => {
		if (isFocused && !previousFocusedRef.current) {
			onFocusRef.current?.();
		} else if (!isFocused && previousFocusedRef.current) {
			onBlurRef.current?.();
		}

		previousFocusedRef.current = isFocused;
	}, [isFocused]);

	// Fire onScroll callback — keep ref in sync via useEffect to avoid
	// writing to a ref during render (react-hooks/refs rule).
	const onScrollRef = useRef(onScroll);
	useEffect(() => {
		onScrollRef.current = onScroll;
	}, [onScroll]);

	useEffect(() => {
		onScrollRef.current?.({
			offset: scroll.offset,
			contentHeight: scroll.contentHeight,
			viewportHeight: scroll.viewportHeight,
			canScrollUp: scroll.canScrollUp,
			canScrollDown: scroll.canScrollDown,
			isAtTop: scroll.isAtTop,
			isAtBottom: scroll.isAtBottom,
			percentage: scroll.percentage,
		});
	}, [
		scroll.offset,
		scroll.contentHeight,
		scroll.viewportHeight,
		scroll.canScrollUp,
		scroll.canScrollDown,
		scroll.isAtTop,
		scroll.isAtBottom,
		scroll.percentage,
	]);

	// Render content slice
	const visibleContent = lines
		? lines
			.slice(scroll.offset, scroll.offset + effectiveHeight)
			.map((line, _i, _array, key = `line-${scroll.offset + _i}`) => (
				<Text key={key}>{line}</Text>
			))
		: (measureChildren
			? undefined // measureChildren mode renders all children below
			: childrenArray.slice(scroll.offset, scroll.offset + effectiveHeight));

	// measureChildren mode: render all children with measurement wrappers
	// and use negative marginTop to position the viewport at the scroll offset
	const measuredContent = measureChildren
		? (
			<Box flexDirection='column' flexGrow={1} marginTop={-scroll.offset}>
				{childrenArray.map((child, i) => (
					<MeasurableItem
						key={i}
						onMeasure={h => {
							heightsRef.current[i] = h;
						}}
					>
						{child}
					</MeasurableItem>
				))}
			</Box>
		)
		: undefined;

	// Overscan: pre-render extra items above and below the viewport in
	// zero-height hidden boxes so they exist in React's VDOM for faster
	// reconciliation when they scroll into view.
	// Overscan is not used in measureChildren mode (all children are already rendered).
	const overscanValue = overscan ?? 0;
	const overscanAboveStart = Math.max(0, scroll.offset - overscanValue);
	const overscanBelowEnd = Math.min(contentHeight, scroll.offset + effectiveHeight + overscanValue);

	const overscanAbove = !measureChildren && overscanValue > 0 && overscanAboveStart < scroll.offset
		? (
			<Box height={0} overflowY='hidden' flexDirection='column'>
				{lines
					? lines.slice(overscanAboveStart, scroll.offset).map((line, _i, _array, key = `os-above-${overscanAboveStart + _i}`) => (
						<Text key={key}>{line}</Text>
					))
					: childrenArray.slice(overscanAboveStart, scroll.offset)}
			</Box>
		)
		: null;

	const overscanBelow = !measureChildren && overscanValue > 0 && scroll.offset + effectiveHeight < overscanBelowEnd
		? (
			<Box height={0} overflowY='hidden' flexDirection='column'>
				{lines
					? lines.slice(scroll.offset + effectiveHeight, overscanBelowEnd).map((line, _i, _array, key = `os-below-${scroll.offset + effectiveHeight + _i}`) => (
						<Text key={key}>{line}</Text>
					))
					: childrenArray.slice(scroll.offset + effectiveHeight, overscanBelowEnd)}
			</Box>
		)
		: null;

	const showBar = showScrollbar && contentHeight > effectiveHeight;
	const hasOverflow = contentHeight > effectiveHeight;

	const activeBorderColor = isFocused
		? (borderColor ?? 'blue')
		: (borderDimColor ?? 'gray');

	return (
		<Box
			flexDirection='column'
			borderStyle={border ? 'round' : undefined}
			borderColor={border ? activeBorderColor : undefined}
		>
			<Box
				height={effectiveHeight}
				flexDirection='row'
				overflowY='hidden'
			>
				<Box flexDirection='column' flexGrow={1}>
					{measureChildren
						? measuredContent
						: (<>
							{overscanAbove}
							{visibleContent}
							{overscanBelow}
						</>)}
				</Box>
				{showBar
					? (
						<Scrollbar
							contentHeight={contentHeight}
							viewportHeight={effectiveHeight}
							offset={scroll.offset}
							isFocused={isFocused}
							thumbCharacter={scrollbarCharacter}
							trackCharacter={trackCharacter}
							thumbColor={scrollbarColor}
							thumbDimColor={scrollbarDimColor}
							trackColor={trackColor}
						/>
					)
					: null}
			</Box>
			{showIndicators && hasOverflow
				? (
					<Box justifyContent='space-between'>
						<Text dimColor>{scroll.canScrollUp ? upIndicator : ' '}</Text>
						<Text dimColor>{scroll.canScrollDown ? downIndicator : ' '}</Text>
					</Box>
				)
				: null}
		</Box>
	);
}

export const ScrollableBox = forwardRef<ScrollableBoxRef, ScrollableBoxProps>(ScrollableBoxRender);
ScrollableBox.displayName = 'ScrollableBox';
