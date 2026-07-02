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

	const threshold = reachThreshold ?? 5;
	const maxOffset = Math.max(0, scroll.contentHeight - scroll.viewportHeight);

	// Edge-latched: fire only on the transition INTO the threshold zone and
	// re-arm when the offset leaves it. Without this, a callback would fire on
	// every scroll tick while inside the zone (load-more storms).
	//
	// The latch starts `undefined` and is seeded to the mount-time zone state on
	// its first run without firing, so a non-zero `initialOffset` that lands the
	// viewport already inside a zone does not fire spuriously on mount. The
	// callback is edge-triggered thereafter: it fires only when the offset
	// crosses from outside the zone to inside.
	//
	// The zone can also "appear" around a stationary offset when overflow first
	// shows up (maxOffset crosses 0 -> positive as content grows). That is a
	// change in the zone, not a scroll into it, so it is re-seeded rather than
	// fired — otherwise a fits-then-overflows view would fire once with no user
	// action.
	const inReachEndZoneRef = useRef<boolean | undefined>(undefined);
	const previousEndMaxOffsetRef = useRef(maxOffset);
	useEffect(() => {
		const inZone = maxOffset > 0 && scroll.offset >= maxOffset - threshold;
		const wasInZone = inReachEndZoneRef.current;
		const overflowAppeared = previousEndMaxOffsetRef.current === 0 && maxOffset > 0;
		previousEndMaxOffsetRef.current = maxOffset;
		inReachEndZoneRef.current = inZone;
		if (wasInZone !== undefined && !overflowAppeared && inZone && !wasInZone) {
			onReachEndRef.current?.();
		}
	}, [scroll.offset, maxOffset, threshold]);

	const inReachStartZoneRef = useRef<boolean | undefined>(undefined);
	const previousStartMaxOffsetRef = useRef(maxOffset);
	useEffect(() => {
		const inZone = maxOffset > 0 && scroll.offset <= threshold;
		const wasInZone = inReachStartZoneRef.current;
		const overflowAppeared = previousStartMaxOffsetRef.current === 0 && maxOffset > 0;
		previousStartMaxOffsetRef.current = maxOffset;
		inReachStartZoneRef.current = inZone;
		if (wasInZone !== undefined && !overflowAppeared && inZone && !wasInZone) {
			onReachStartRef.current?.();
		}
	}, [scroll.offset, threshold, maxOffset]);
}
