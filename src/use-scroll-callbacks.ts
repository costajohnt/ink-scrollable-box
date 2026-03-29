import {useRef, useEffect} from 'react';
import type {ScrollState} from './types.js';

type UseScrollCallbacksOptions = {
	scroll: ScrollState;
	isFocused: boolean;
	onScroll?: (state: ScrollState) => void;
	onFocus?: () => void;
	onBlur?: () => void;
	onContentHeightChange?: (height: number, previousHeight: number) => void;
	onViewportSizeChange?: (height: number, previousHeight: number) => void;
	onReachEnd?: () => void;
	onReachStart?: () => void;
	reachThreshold?: number;
};

export function useScrollCallbacks({
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
}: UseScrollCallbacksOptions) {
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

	const onScrollRef = useRef(onScroll);
	useEffect(() => {
		onScrollRef.current = onScroll;
	}, [onScroll]);

	const isFirstScrollRender = useRef(true);
	useEffect(() => {
		if (isFirstScrollRender.current) {
			isFirstScrollRender.current = false;
			return;
		}

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

	const onContentHeightChangeRef = useRef(onContentHeightChange);
	useEffect(() => {
		onContentHeightChangeRef.current = onContentHeightChange;
	}, [onContentHeightChange]);

	const previousContentHeightRef = useRef(scroll.contentHeight);
	useEffect(() => {
		const previous = previousContentHeightRef.current;
		if (scroll.contentHeight !== previous) {
			previousContentHeightRef.current = scroll.contentHeight;
			onContentHeightChangeRef.current?.(scroll.contentHeight, previous);
		}
	}, [scroll.contentHeight]);

	const onViewportSizeChangeRef = useRef(onViewportSizeChange);
	useEffect(() => {
		onViewportSizeChangeRef.current = onViewportSizeChange;
	}, [onViewportSizeChange]);

	const previousViewportHeightRef = useRef(scroll.viewportHeight);
	useEffect(() => {
		const previous = previousViewportHeightRef.current;
		if (scroll.viewportHeight !== previous) {
			previousViewportHeightRef.current = scroll.viewportHeight;
			onViewportSizeChangeRef.current?.(scroll.viewportHeight, previous);
		}
	}, [scroll.viewportHeight]);

	const onReachEndRef = useRef(onReachEnd);
	useEffect(() => {
		onReachEndRef.current = onReachEnd;
	}, [onReachEnd]);

	const onReachStartRef = useRef(onReachStart);
	useEffect(() => {
		onReachStartRef.current = onReachStart;
	}, [onReachStart]);

	const hasScrolledRef = useRef(false);
	useEffect(() => {
		if (scroll.offset !== 0 || hasScrolledRef.current) {
			hasScrolledRef.current = true;
		}
	}, [scroll.offset]);

	const threshold = reachThreshold ?? 5;
	const maxOffset = Math.max(0, scroll.contentHeight - scroll.viewportHeight);

	useEffect(() => {
		if (!hasScrolledRef.current) {
			return;
		}

		if (scroll.offset >= maxOffset - threshold && maxOffset > 0) {
			onReachEndRef.current?.();
		}
	}, [scroll.offset, maxOffset, threshold]);

	useEffect(() => {
		if (!hasScrolledRef.current) {
			return;
		}

		if (scroll.offset <= threshold && maxOffset > 0) {
			onReachStartRef.current?.();
		}
	}, [scroll.offset, threshold, maxOffset]);
}
