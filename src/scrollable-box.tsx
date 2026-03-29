import {
	Children,
	forwardRef,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
} from 'react';
import {Box, Text} from 'ink';
import {useScrollable} from './use-scrollable.js';
import {useScrollableInput} from './use-scrollable-input.js';
import {Scrollbar} from './scrollbar.js';
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
}: ScrollableBoxProps, ref: React.ForwardedRef<ScrollableBoxRef>) {
	validateProps(height, lines, children);

	// Determine content
	const childrenArray = useMemo(
		() => (children ? Children.toArray(children) : []),
		[children],
	);
	const contentHeight = lines ? lines.length : childrenArray.length;

	// Account for border reducing effective viewport
	const effectiveHeight = border ? Math.max(1, height - 2) : height;

	const scroll = useScrollable({
		contentHeight,
		viewportHeight: effectiveHeight,
		scrollStep,
		followOutput,
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
		: childrenArray.slice(scroll.offset, scroll.offset + effectiveHeight);

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
					{visibleContent}
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
