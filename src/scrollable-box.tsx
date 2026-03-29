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
	align: 'start' | 'center' | 'end',
): number {
	if (align === 'end') {
		return index - effectiveHeight + 1;
	}

	if (align === 'center') {
		return index - Math.floor(effectiveHeight / 2);
	}

	return index;
}

function buildRefHandle(
	scroll: UseScrollableResult,
	effectiveHeight: number,
): ScrollableBoxRef {
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
		scrollToIndex(index: number, options?: {align?: 'start' | 'center' | 'end'}) {
			const target = computeScrollToIndex(index, effectiveHeight, options?.align ?? 'start');
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

function ScrollableBoxRender(
	props: ScrollableBoxProps,
	ref: React.ForwardedRef<ScrollableBoxRef>,
) {
	const {
		height,
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

	const onItemMeasure = useCallback((index: number, h: number) => {
		heightsRef.current[index] = h;
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

	useImperativeHandle(ref, () => buildRefHandle(scroll, effectiveHeight), [scroll, effectiveHeight]);

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
	});

	const showBar = showScrollbar && contentHeight > effectiveHeight;
	const hasOverflow = contentHeight > effectiveHeight;

	const activeBorderColor = isFocused
		? (borderColor ?? 'blue')
		: borderDimColor;

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
