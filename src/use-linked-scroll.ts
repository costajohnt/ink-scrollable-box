import {useState, useCallback, useMemo} from 'react';

type LinkedScrollMode = 'absolute' | 'proportional';

type LinkedScrollResult = {
	/** Shared offset value */
	offset: number;
	/** Handler — spread onto each ScrollableBox as onOffsetChange */
	onOffsetChange: (offset: number) => void;
	/** The sync mode */
	mode: LinkedScrollMode;
};

type UseLinkedScrollOptions = {
	/** How to synchronize: 'absolute' = same line offset, 'proportional' = same percentage */
	mode?: LinkedScrollMode;
	/** Initial offset (default: 0) */
	initialOffset?: number;
};

export function useLinkedScroll(options?: UseLinkedScrollOptions): LinkedScrollResult {
	const mode = options?.mode ?? 'absolute';
	const [offset, setOffset] = useState(options?.initialOffset ?? 0);

	const onOffsetChange = useCallback((newOffset: number) => {
		setOffset(newOffset);
	}, []);

	return useMemo(() => ({
		offset,
		onOffsetChange,
		mode,
	}), [offset, onOffsetChange, mode]);
}
