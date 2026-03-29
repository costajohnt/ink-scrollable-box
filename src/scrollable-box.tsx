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
import {Box, Text} from 'ink';
import {useScrollable} from './use-scrollable.js';
import {useScrollableInput} from './use-scrollable-input.js';
import {useScrollCallbacks} from './use-scroll-callbacks.js';
import {ScrollContent} from './render-content.js';
import {Scrollbar} from './scrollbar.js';
import type {ScrollableBoxProps, ScrollableBoxRef, UseScrollableResult} from './types.js';

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
			const target = computeScrollToIndex(index, effectiveHeight, options?.align ?? 'auto', scroll.offset);
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
				// Clear cached height — next MeasurableItem effect will re-measure
				heightsRef.current[index] = 0;
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

// eslint-disable-next-line complexity
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
	} = resolveProps(props);

	validateProps(height, lines, children);

	const childrenArray = useMemo(
		() => (children ? Children.toArray(children) : []),
		[children],
	);

	// Measurement state for variable-height children
	const heightsRef = useRef<number[]>([]);
	const [measuredHeight, setMeasuredHeight] = useState(childrenArray.length);

	useEffect(() => {
		if (measureChildren && heightsRef.current.length === childrenArray.length) {
			const total = heightsRef.current.reduce((sum, h) => sum + h, 0);
			if (total !== measuredHeight && total > 0) {
				setMeasuredHeight(total);
			}
		}
	}, [measureChildren, childrenArray.length, measuredHeight]);

	const onItemHeightChangeRef = useRef(onItemHeightChange);
	useEffect(() => {
		onItemHeightChangeRef.current = onItemHeightChange;
	}, [onItemHeightChange]);

	const onItemMeasure = useCallback((index: number, h: number) => {
		const previous = heightsRef.current[index];
		heightsRef.current[index] = h;
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

	const hasOverflow = contentHeight > effectiveHeight;
	const showBar = showScrollbar && hasOverflow;
	const isOutside = scrollbarPosition === 'outside';
	const activeBorderColor = isFocused ? (borderColor ?? 'blue') : borderDimColor;

	const scrollbarElement = showBar
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

	const indicators = showIndicators && hasOverflow
		? (
			<Box justifyContent='space-between'>
				<Text dimColor>{scroll.canScrollUp ? upIndicator : ' '}</Text>
				<Text dimColor>{scroll.canScrollDown ? downIndicator : ' '}</Text>
			</Box>
		)
		: null;

	const contentBox = (
		<Box
			flexDirection='column'
			width={isOutside ? undefined : width}
			flexGrow={isOutside ? 1 : undefined}
			borderStyle={border ? 'round' : undefined}
			borderColor={border ? activeBorderColor : undefined}
		>
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
		</Box>
	);

	if (isOutside) {
		return (
			<Box flexDirection='row' width={width}>
				{contentBox}
				{scrollbarElement
					? (
						<Box flexDirection='column' paddingTop={border ? 1 : 0} paddingBottom={border ? 1 : 0}>
							{scrollbarElement}
						</Box>
					)
					: null}
			</Box>
		);
	}

	return contentBox;
}

export const ScrollableBox = forwardRef<ScrollableBoxRef, ScrollableBoxProps>(ScrollableBoxRender);
ScrollableBox.displayName = 'ScrollableBox';
