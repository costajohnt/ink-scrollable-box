import {
	Children,
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from 'react';
import {Box, Text, useIsScreenReaderEnabled} from 'ink';
import {useScrollable} from './use-scrollable.js';
import {useScrollableInput} from './use-scrollable-input.js';
import {useScrollCallbacks} from './use-scroll-callbacks.js';
import {ScrollContent} from './render-content.js';
import {Scrollbar} from './scrollbar.js';
import type {ScrollableBoxProps, ScrollableBoxRef, UseScrollableResult} from './types.js';

type ValidatePropsInput = {
	height: number;
	lines?: string[];
	children?: React.ReactNode;
	overscan?: number;
	reachThreshold?: number;
	initialOffset?: number;
};

function validateProps({height, lines, children, overscan, reachThreshold, initialOffset}: ValidatePropsInput) {
	if (lines !== undefined && children !== undefined) {
		throw new Error('ScrollableBox: Provide either `lines` or `children`, not both.');
	}

	if (!Number.isInteger(height) || height <= 0) {
		throw new Error(`ScrollableBox: \`height\` must be a positive integer, got ${height}.`);
	}

	if (lines !== undefined && !Array.isArray(lines)) {
		throw new Error('ScrollableBox: `lines` must be an array of strings.');
	}

	if (overscan !== undefined && (overscan < 0 || !Number.isInteger(overscan))) {
		throw new Error(`ScrollableBox: \`overscan\` must be a non-negative integer, got ${overscan}.`);
	}

	if (reachThreshold !== undefined && (reachThreshold < 0 || !Number.isFinite(reachThreshold))) {
		throw new Error(`ScrollableBox: \`reachThreshold\` must be a non-negative number, got ${reachThreshold}.`);
	}

	if (initialOffset !== undefined && (initialOffset < 0 || !Number.isFinite(initialOffset))) {
		throw new Error(`ScrollableBox: \`initialOffset\` must be a non-negative finite number, got ${initialOffset}.`);
	}
}

function computeScrollToIndex(
	index: number,
	effectiveHeight: number,
	align: 'start' | 'center' | 'end' | 'auto',
	currentOffset: number,
): number {
	if (align === 'auto') {
		// Already visible — don't scroll
		if (index >= currentOffset && index < currentOffset + effectiveHeight) {
			return currentOffset;
		}

		// Above viewport — align to top
		if (index < currentOffset) {
			return index;
		}

		// Below viewport — align to bottom
		return index - effectiveHeight + 1;
	}

	if (align === 'end') {
		return index - effectiveHeight + 1;
	}

	if (align === 'center') {
		return index - Math.floor(effectiveHeight / 2);
	}

	return index; // 'start'
}

// Exported for tests: pure alignment math for the measureChildren scrollToIndex
// path. Returns undefined when the item is already fully visible (no scroll).
export function computeMeasuredScrollTarget(
	item: {top: number; height: number},
	currentOffset: number,
	effectiveHeight: number,
	align: 'start' | 'center' | 'end' | 'auto',
): number | undefined {
	const itemTop = item.top;
	const itemHeight = item.height;
	switch (align) {
		case 'auto': {
			if (itemTop >= currentOffset && itemTop + itemHeight <= currentOffset + effectiveHeight) {
				return undefined; // already visible
			}

			return itemTop < currentOffset ? itemTop : itemTop + itemHeight - effectiveHeight;
		}

		case 'center': {
			return itemTop - Math.floor((effectiveHeight - itemHeight) / 2);
		}

		case 'end': {
			return itemTop + itemHeight - effectiveHeight;
		}

		case 'start': {
			return itemTop;
		}
	}
}

type RefHandleContext = {
	scroll: UseScrollableResult;
	effectiveHeight: number;
	heightsRef: React.RefObject<number[]>;
	itemCount: number;
	measureChildren: boolean;
};

function buildRefHandle(context: RefHandleContext): ScrollableBoxRef {
	const {scroll, effectiveHeight, heightsRef, itemCount, measureChildren} = context;
	const heights = heightsRef.current;
	return {
		scrollTo(offset: number) {
			scroll.scrollTo(offset);
		},
		scrollBy(delta: number) {
			scroll.scrollTo(scroll.offset + delta);
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
		scrollToIndex(index: number, options?: {align?: 'start' | 'center' | 'end' | 'auto'}) {
			let targetOffset: number;
			if (measureChildren) {
				const pos = this.getItemPosition(index);
				if (!pos) {
					return;
				}

				// Use the item's actual top position for alignment
				const target = computeMeasuredScrollTarget(
					pos,
					scroll.offset,
					effectiveHeight,
					options?.align ?? 'auto',
				);
				if (target === undefined) {
					return; // already visible
				}

				targetOffset = target;
			} else {
				targetOffset = computeScrollToIndex(index, effectiveHeight, options?.align ?? 'auto', scroll.offset);
			}

			scroll.scrollTo(targetOffset);
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
		getBottomOffset() {
			return Math.max(0, scroll.contentHeight - scroll.viewportHeight);
		},
		getItemHeight(index: number): number {
			if (index < 0 || index >= itemCount) {
				return 0;
			}

			return measureChildren ? (heights[index] ?? 1) : 1;
		},
		getItemPosition(index: number): {top: number; height: number} | undefined {
			if (index < 0 || index >= itemCount) {
				return undefined;
			}

			let top = 0;
			for (let i = 0; i < index; i++) {
				top += measureChildren ? (heights[i] ?? 1) : 1;
			}

			const height = measureChildren ? (heights[index] ?? 1) : 1;
			return {top, height};
		},
		remeasureItem(index: number): void {
			if (index >= 0 && index < itemCount) {
				// Clear cached height — next MeasurableItem effect will re-measure.
				// Setting to undefined so `heights[index] ?? 1` falls back to 1.
				// eslint-disable-next-line @typescript-eslint/no-dynamic-delete, @typescript-eslint/no-array-delete
				delete heightsRef.current[index];
			}
		},
	};
}

const defaultProps = {
	followOutput: false,
	scrollStep: 1,
	border: false,
	showScrollbar: true,
	showIndicators: true,
	focusable: true,
	upIndicator: '▲',
	downIndicator: '▼',
	borderDimColor: 'gray',
	enableVimBindings: true,
	measureChildren: false,
	overscan: 0,
	scrollbarPosition: 'inside',
} as const;

function resolveProps(props: ScrollableBoxProps) {
	return {
		...props,
		followOutput: props.followOutput ?? defaultProps.followOutput,
		scrollStep: props.scrollStep ?? defaultProps.scrollStep,
		border: props.border ?? defaultProps.border,
		showScrollbar: props.showScrollbar ?? defaultProps.showScrollbar,
		showIndicators: props.showIndicators ?? defaultProps.showIndicators,
		focusable: props.focusable ?? defaultProps.focusable,
		upIndicator: props.upIndicator ?? defaultProps.upIndicator,
		downIndicator: props.downIndicator ?? defaultProps.downIndicator,
		borderDimColor: props.borderDimColor ?? defaultProps.borderDimColor,
		enableVimBindings: props.enableVimBindings ?? defaultProps.enableVimBindings,
		measureChildren: props.measureChildren ?? defaultProps.measureChildren,
		overscan: props.overscan ?? defaultProps.overscan,
		scrollbarPosition: props.scrollbarPosition ?? defaultProps.scrollbarPosition,
	};
}

function useContentHeight(
	lines: string[] | undefined,
	measureChildren: boolean,
	measuredHeight: number,
	childrenLength: number,
): number {
	if (lines) {
		return lines.length;
	}

	return measureChildren ? measuredHeight : childrenLength;
}

// True only when every child index 0..count-1 has a numeric measured height.
// Index-based (not `heights.every`) so a hole left by remeasureItem counts as
// unmeasured rather than being skipped.
function allChildrenMeasured(heights: number[], count: number): boolean {
	if (heights.length !== count) {
		return false;
	}

	for (let i = 0; i < count; i++) {
		if (typeof heights[i] !== 'number') {
			return false;
		}
	}

	return true;
}

type IndicatorsProps = {
	showIndicators: boolean;
	hasOverflow: boolean;
	canScrollUp: boolean;
	canScrollDown: boolean;
	upIndicator: string;
	downIndicator: string;
};

function Indicators({
	showIndicators, hasOverflow, canScrollUp, canScrollDown, upIndicator, downIndicator,
}: IndicatorsProps) {
	if (!showIndicators || !hasOverflow) {
		return null;
	}

	return (
		<Box justifyContent='space-between' aria-hidden>
			<Text dimColor>{canScrollUp ? upIndicator : ' '}</Text>
			<Text dimColor>{canScrollDown ? downIndicator : ' '}</Text>
		</Box>
	);
}

type ScreenReaderAnnouncementProps = {
	isScreenReaderEnabled: boolean;
	hasOverflow: boolean;
	isFocused: boolean;
	positionLabel: string;
};

function ScreenReaderAnnouncement({
	isScreenReaderEnabled, hasOverflow, isFocused, positionLabel,
}: ScreenReaderAnnouncementProps) {
	if (!isScreenReaderEnabled || !hasOverflow) {
		return null;
	}

	return (
		<Box height={0} overflowY='hidden'>
			<Text aria-label={isFocused ? `${positionLabel}, focused` : positionLabel}>{' '}</Text>
		</Box>
	);
}

function ScrollableBoxRender(
	props: ScrollableBoxProps,
	ref: React.ForwardedRef<ScrollableBoxRef>,
) {
	const {
		height,
		width,
		lines,
		children,
		followOutput,
		initialOffset,
		scrollStep,
		border,
		showScrollbar,
		showIndicators,
		focusable,
		id,
		onScroll,
		scrollbarStyle,
		scrollbarCharacter,
		trackCharacter,
		upIndicator,
		downIndicator,
		scrollbarColor,
		scrollbarDimColor,
		trackColor,
		borderColor,
		borderDimColor,
		enableVimBindings,
		onFocus,
		onBlur,
		overscan,
		offset,
		onOffsetChange,
		measureChildren,
		debug,
		onContentHeightChange,
		onViewportSizeChange,
		onItemHeightChange,
		onReachEnd,
		onReachStart,
		reachThreshold,
		scrollbarPosition,
		ariaLabel,
	} = resolveProps(props);

	validateProps({
		height, lines, children, overscan, reachThreshold, initialOffset,
	});

	const childrenArray = useMemo(
		() => (children ? Children.toArray(children) : []),
		[children],
	);

	// Measurement state for variable-height children
	const heightsRef = useRef<number[]>([]);
	const [measuredHeight, setMeasuredHeight] = useState(childrenArray.length);
	// Bumped whenever a child's measured height changes in place. Heights live
	// in heightsRef (a ref), so this counter is what drives the total-height
	// recompute effect to react to in-place growth/shrink at a stable count.
	const [measurementVersion, setMeasurementVersion] = useState(0);

	useEffect(() => {
		if (heightsRef.current.length > childrenArray.length) {
			heightsRef.current.length = childrenArray.length;
		}
	}, [childrenArray.length]);

	useEffect(() => {
		// Only trust the total once every child has reported a height. Checking
		// per-index (not `total > 0`) lets a genuine collapse to 0 update
		// contentHeight instead of leaving it stale (which would show phantom
		// overflow), while still ignoring the not-yet-measured initial state.
		if (!(measureChildren && allChildrenMeasured(heightsRef.current, childrenArray.length))) {
			return;
		}

		const total = heightsRef.current.reduce((sum, h) => sum + h, 0);
		if (total !== measuredHeight) {
			setMeasuredHeight(total);
		}
	}, [measureChildren, childrenArray.length, measuredHeight, measurementVersion]);

	const onItemHeightChangeRef = useRef(onItemHeightChange);
	useEffect(() => {
		onItemHeightChangeRef.current = onItemHeightChange;
	}, [onItemHeightChange]);

	const onItemMeasure = useCallback((index: number, h: number) => {
		const previous = heightsRef.current[index];
		heightsRef.current[index] = h;
		if (previous !== h) {
			// Height changed (or was measured for the first time) — trigger a
			// recompute of the total content height.
			setMeasurementVersion(v => v + 1);
		}

		if (previous !== undefined && previous !== h) {
			onItemHeightChangeRef.current?.(index, h, previous);
		}
	}, []);

	const contentHeight = useContentHeight(lines, measureChildren, measuredHeight, childrenArray.length);
	const effectiveHeight = border ? Math.max(1, height - 2) : height;

	const scroll = useScrollable({
		contentHeight,
		viewportHeight: effectiveHeight,
		scrollStep,
		followOutput,
		initialOffset,
		controlledOffset: offset,
		onOffsetChange,
	});

	const itemCount = lines ? lines.length : childrenArray.length;
	useImperativeHandle(ref, () => buildRefHandle({
		scroll,
		effectiveHeight,
		heightsRef,
		itemCount,
		measureChildren,
	}), [scroll, effectiveHeight, itemCount, measureChildren]);

	const {isFocused} = useScrollableInput({
		scroll,
		focusable,
		autoFocus: props.autoFocus,
		id,
		enableVimBindings,
	});

	useScrollCallbacks({
		scroll,
		isFocused,
		onScroll,
		onFocus,
		onBlur,
		onContentHeightChange,
		onViewportSizeChange,
		onReachEnd,
		onReachStart,
		reachThreshold,
	});

	const isScreenReaderEnabled = useIsScreenReaderEnabled();

	const hasOverflow = contentHeight > effectiveHeight;
	const isShowBar = showScrollbar && hasOverflow;
	const isOutside = scrollbarPosition === 'outside';
	const activeBorderColor = isFocused ? (borderColor ?? 'blue') : borderDimColor;
	const containerLabel = ariaLabel ?? (followOutput ? 'Scrollable log' : 'Scrollable content');

	const scrollbarElement = isShowBar
		? (
			<Scrollbar
				contentHeight={contentHeight}
				viewportHeight={effectiveHeight}
				offset={scroll.offset}
				isFocused={isFocused}
				scrollbarStyle={scrollbarStyle}
				thumbCharacter={scrollbarCharacter}
				trackCharacter={trackCharacter}
				thumbColor={scrollbarColor}
				thumbDimColor={scrollbarDimColor}
				trackColor={trackColor}
			/>
		)
		: null;

	const indicators = (
		<Indicators
			showIndicators={showIndicators}
			hasOverflow={hasOverflow}
			canScrollUp={scroll.canScrollUp}
			canScrollDown={scroll.canScrollDown}
			upIndicator={upIndicator}
			downIndicator={downIndicator}
		/>
	);

	const visibleEnd = Math.min(scroll.offset + effectiveHeight, contentHeight);
	const positionLabel = `Showing lines ${scroll.offset + 1} to ${visibleEnd} of ${contentHeight}`;
	const screenReaderAnnouncement = (
		<ScreenReaderAnnouncement
			isScreenReaderEnabled={isScreenReaderEnabled}
			hasOverflow={hasOverflow}
			isFocused={isFocused}
			positionLabel={positionLabel}
		/>
	);

	const contentBox = (
		<Box
			flexDirection='column'
			width={isOutside ? undefined : width}
			flexGrow={isOutside ? 1 : undefined}
			borderStyle={border ? 'round' : undefined}
			borderColor={border ? activeBorderColor : undefined}
		>
			<Box height={0} overflowY='hidden'>
				<Text aria-label={containerLabel}>{' '}</Text>
			</Box>
			<Box
				height={effectiveHeight}
				flexDirection='row'
				overflowY={debug ? undefined : 'hidden'}
			>
				<Box flexDirection='column' flexGrow={1}>
					<ScrollContent
						lines={lines}
						childrenArray={childrenArray}
						measureChildren={measureChildren}
						scrollOffset={scroll.offset}
						effectiveHeight={effectiveHeight}
						contentHeight={contentHeight}
						overscan={overscan}
						onItemMeasure={onItemMeasure}
					/>
				</Box>
				{isOutside ? null : scrollbarElement}
			</Box>
			{indicators}
			{screenReaderAnnouncement}
		</Box>
	);

	if (!isOutside) {
		return contentBox;
	}

	const borderPadding = border ? 1 : 0;

	return (
		<Box flexDirection='row' width={width}>
			{contentBox}
			{isShowBar
				? (
					<Box flexDirection='column' paddingTop={borderPadding} paddingBottom={borderPadding}>
						{scrollbarElement}
					</Box>
				)
				: null}
		</Box>
	);
}

export const ScrollableBox = forwardRef<ScrollableBoxRef, ScrollableBoxProps>(ScrollableBoxRender);
ScrollableBox.displayName = 'ScrollableBox';
