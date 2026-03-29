import {
	useState,
	useMemo,
	useCallback,
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

	// Synchronously adjust offset during render when props change
	let adjustedOffset = offset;

	if (contentHeight !== previousContentHeight || maxOffset !== previousMaxOffset) {
		if (followOutput && contentHeight > previousContentHeight) {
			const wasAtBottom = offset >= previousMaxOffset;
			if (wasAtBottom || previousContentHeight === 0) {
				adjustedOffset = maxOffset;
			}
		}

		// Clamp to valid range (handles viewport/content resize)
		adjustedOffset = clamp(adjustedOffset, 0, maxOffset);

		if (adjustedOffset !== offset) {
			setOffset(adjustedOffset);
		}

		setPreviousContentHeight(contentHeight);
		setPreviousMaxOffset(maxOffset);
	}

	const scrollUp = useCallback(() => {
		setOffset(current => clamp(current - scrollStep, 0, maxOffset));
	}, [scrollStep, maxOffset]);

	const scrollDown = useCallback(() => {
		setOffset(current => clamp(current + scrollStep, 0, maxOffset));
	}, [scrollStep, maxOffset]);

	const scrollTo = useCallback(
		(target: number) => {
			setOffset(clamp(target, 0, maxOffset));
		},
		[maxOffset],
	);

	const scrollToTop = useCallback(() => {
		setOffset(0);
	}, []);

	const scrollToBottom = useCallback(() => {
		setOffset(maxOffset);
	}, [maxOffset]);

	const pageUp = useCallback(() => {
		setOffset(current => clamp(current - viewportHeight, 0, maxOffset));
	}, [viewportHeight, maxOffset]);

	const pageDown = useCallback(() => {
		setOffset(current => clamp(current + viewportHeight, 0, maxOffset));
	}, [viewportHeight, maxOffset]);

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
	};
}
