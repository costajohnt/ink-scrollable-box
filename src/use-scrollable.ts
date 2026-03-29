import {
	useState,
	useMemo,
	useCallback,
	useEffect,
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

	const maxOffset = Math.max(0, contentHeight - viewportHeight);
	const [offset, setOffset] = useState(() => clamp(initialOffset, 0, maxOffset));

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

	// Helper: update offset, calling onOffsetChange in controlled mode
	const updateOffset = useCallback(
		(newOffset: number) => {
			const clamped = clamp(newOffset, 0, maxOffset);
			if (isControlled) {
				onOffsetChangeRef.current?.(clamped);
			} else {
				setOffset(clamped);
			}
		},
		[maxOffset, isControlled],
	);

	// Helper: update offset with a function of current offset
	const updateOffsetFn = useCallback(
		(fn: (current: number) => number) => {
			if (isControlled) {
				// In controlled mode we compute from adjustedOffset (the controlled value)
				// We read from internal state since it's synced to controlledOffset
				setOffset(current => {
					const next = clamp(fn(current), 0, maxOffset);
					onOffsetChangeRef.current?.(next);
					return current; // Don't actually update internal state in controlled mode
				});
			} else {
				setOffset(current => clamp(fn(current), 0, maxOffset));
			}
		},
		[maxOffset, isControlled],
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
		updateOffsetFn(current => current - Math.floor(viewportHeight / 2));
	}, [viewportHeight, updateOffsetFn]);

	const halfPageDown = useCallback(() => {
		updateOffsetFn(current => current + Math.floor(viewportHeight / 2));
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
