import {useRef, useEffect, type ReactNode} from 'react';
import {Box, measureElement, type DOMElement} from 'ink';

type MeasurableItemProps = {
	children: ReactNode;
	onMeasure: (height: number) => void;
};

export function MeasurableItem({children, onMeasure}: MeasurableItemProps) {
	const ref = useRef<DOMElement>(null);

	// Intentionally no dependency array — measure after every render because
	// children may have changed size. onMeasure writes to a ref (not state),
	// so the extra calls are inexpensive.
	useEffect(() => {
		if (ref.current) {
			try {
				const {height} = measureElement(ref.current);
				onMeasure(height);
			} catch {
				// Measurement failed — fall back to default height
				onMeasure(1);
			}
		}
	});

	return <Box ref={ref}>{children}</Box>;
}
