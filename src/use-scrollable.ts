import {
	useState,
	useMemo,
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
} from 'react';
import type {UseScrollableOptions, UseScrollableResult} from './types.js';

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(value, max));
}

export function useScrollable({
	contentHeight,
	viewportHeight,
	scrollStep = 1,
	followOutput = false,
	initialOffset = 0,
	controlledOffset,
	onOffsetChange,
}: UseScrollableOptions): UseScrollableResult {
	if (scrollStep <= 0 || !Number.isFinite(scrollStep)) {
		throw new Error(
			`useScrollable: \`scrollStep\` must be a positive number, got ${scrollStep}.`,
		);
	}

	if (initialOffset < 0 || !Number.isFinite(initialOffset)) {
		throw new Error(
			`useScrollable: \`initialOffset\` must be a non-negative finite number, got ${initialOffset}.`,
		);
	}

	const maxOffset = Math.max(0, contentHeight - viewportHeight);
	// Rounded so a fractional initialOffset can't produce a fractional offset.
	const [offset, setOffset] = useState(() => clamp(Math.round(initialOffset), 0, maxOffset));

	// Track previous values via state (React-recommended pattern for storing
	// information from previous renders without using refs during render)
	const [previousContentHeight, setPreviousContentHeight] = useState(contentHeight);
	const [previousMaxOffset, setPreviousMaxOffset] = useState(maxOffset);

	const isControlled = controlledOffset !== undefined;

	// Keep a ref to onOffsetChange to avoid stale closures
	const onOffsetChangeRef = useRef(onOffsetChange);
	useEffect(() => {
		onOffsetChangeRef.current = onOffsetChange;
	}, [onOffsetChange]);

	// Synchronously adjust offset during render when props change
	let adjustedOffset = offset;

	if (contentHeight !== previousContentHeight || maxOffset !== previousMaxOffset) {
		if (followOutput && contentHeight > previousContentHeight) {
			const wasAtBottom = offset >= previousMaxOffset;
			if (wasAtBottom || previousContentHeight === 0) {
				adjustedOffset = maxOffset;
			}
		}

		// Preserve proportional scroll position on pure viewport resize
		// (contentHeight unchanged, only viewportHeight changed)
		if (contentHeight === previousContentHeight && maxOffset !== previousMaxOffset && previousMaxOffset > 0) {
			const previousPercentage = offset / previousMaxOffset;
			adjustedOffset = Math.round(previousPercentage * maxOffset);
		}

		// Clamp to valid range (handles viewport/content resize)
		adjustedOffset = clamp(adjustedOffset, 0, maxOffset);

		if (adjustedOffset !== offset) {
			setOffset(adjustedOffset);
		}

		setPreviousContentHeight(contentHeight);
		setPreviousMaxOffset(maxOffset);
	}

	// In controlled mode, the external offset takes precedence.
	// Also sync internal state so updater functions have the right baseline.
	if (isControlled) {
		const clamped = clamp(controlledOffset, 0, maxOffset);
		adjustedOffset = clamped;

		if (offset !== clamped) {
			setOffset(clamped);
		}
	}

	// Controlled mode: the offset the parent last rendered us with, synced at
	// commit so event handlers always see the committed value.
	const committedOffsetRef = useRef(adjustedOffset);
	useLayoutEffect(() => {
		committedOffsetRef.current = adjustedOffset;
	});

	// Controlled mode: the value most recently requested through onOffsetChange
	// in the current synchronous batch. Several relative scrolls can fire before
	// the parent re-renders (one stdin chunk carrying several arrow keys, key
	// repeat, wheel bursts); each must build on the previous request, not on
	// the stale committed offset, or the steps collapse into one. Cleared once
	// the batch is over so a parent that rejects a change does not leave a
	// phantom baseline behind.
	const pendingOffsetRef = useRef<number | undefined>(undefined);

	const requestOffset = useCallback((next: number) => {
		const isNewBatch = pendingOffsetRef.current === undefined;
		pendingOffsetRef.current = next;
		onOffsetChangeRef.current?.(next);
		if (isNewBatch) {
			queueMicrotask(() => {
				pendingOffsetRef.current = undefined;
			});
		}
	}, []);

	// Helper: update offset, calling onOffsetChange in controlled mode
	const updateOffset = useCallback(
		(newOffset: number) => {
			const clamped = clamp(newOffset, 0, maxOffset);
			if (isControlled) {
				requestOffset(clamped);
			} else {
				setOffset(clamped);
			}
		},
		[maxOffset, isControlled, requestOffset],
	);

	// Helper: update offset with a function of current offset
	const updateOffsetFn = useCallback(
		(fn: (current: number) => number) => {
			if (isControlled) {
				// Compute outside any state updater: onOffsetChange is a side
				// effect (usually a parent setState) and updaters must be pure.
				const base = pendingOffsetRef.current ?? committedOffsetRef.current;
				requestOffset(clamp(fn(base), 0, maxOffset));
			} else {
				setOffset(current => clamp(fn(current), 0, maxOffset));
			}
		},
		[maxOffset, isControlled, requestOffset],
	);

	const scrollUp = useCallback(() => {
		updateOffsetFn(current => current - scrollStep);
	}, [scrollStep, updateOffsetFn]);

	const scrollDown = useCallback(() => {
		updateOffsetFn(current => current + scrollStep);
	}, [scrollStep, updateOffsetFn]);

	const scrollTo = useCallback(
		(target: number) => {
			updateOffset(target);
		},
		[updateOffset],
	);

	const scrollToTop = useCallback(() => {
		updateOffset(0);
	}, [updateOffset]);

	const scrollToBottom = useCallback(() => {
		updateOffset(maxOffset);
	}, [updateOffset, maxOffset]);

	const pageUp = useCallback(() => {
		updateOffsetFn(current => current - viewportHeight);
	}, [viewportHeight, updateOffsetFn]);

	const pageDown = useCallback(() => {
		updateOffsetFn(current => current + viewportHeight);
	}, [viewportHeight, updateOffsetFn]);

	const halfPageUp = useCallback(() => {
		updateOffsetFn(current => current - Math.max(1, Math.floor(viewportHeight / 2)));
	}, [viewportHeight, updateOffsetFn]);

	const halfPageDown = useCallback(() => {
		updateOffsetFn(current => current + Math.max(1, Math.floor(viewportHeight / 2)));
	}, [viewportHeight, updateOffsetFn]);

	const state = useMemo(() => {
		const canScrollUp = adjustedOffset > 0;
		const canScrollDown = adjustedOffset < maxOffset;
		const isAtTop = adjustedOffset === 0;
		const isAtBottom = adjustedOffset >= maxOffset;
		const percentage
			= maxOffset === 0 ? 100 : Math.round((adjustedOffset / maxOffset) * 100);

		return {
			offset: adjustedOffset,
			contentHeight,
			viewportHeight,
			canScrollUp,
			canScrollDown,
			isAtTop,
			isAtBottom,
			percentage,
		};
	}, [adjustedOffset, contentHeight, viewportHeight, maxOffset]);

	return {
		...state,
		scrollUp,
		scrollDown,
		scrollTo,
		scrollToTop,
		scrollToBottom,
		pageUp,
		pageDown,
		halfPageUp,
		halfPageDown,
	};
}
