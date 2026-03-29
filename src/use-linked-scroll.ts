import {useState, useCallback, useMemo} from 'react';

export type LinkedScrollResult = {
	/** Shared offset value */
	offset: number;
	/** Handler — spread onto each ScrollableBox as onOffsetChange */
	onOffsetChange: (offset: number) => void;
};

export type UseLinkedScrollOptions = {
	/** Initial offset (default: 0) */
	initialOffset?: number;
};

export function useLinkedScroll(options?: UseLinkedScrollOptions): LinkedScrollResult {
	const [offset, setOffset] = useState(options?.initialOffset ?? 0);

	const onOffsetChange = useCallback((newOffset: number) => {
		setOffset(newOffset);
	}, []);

	return useMemo(() => ({
		offset,
		onOffsetChange,
	}), [offset, onOffsetChange]);
}
