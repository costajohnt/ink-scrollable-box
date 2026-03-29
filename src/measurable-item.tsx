import {useRef, useEffect, type ReactNode} from 'react';
import {Box, measureElement, type DOMElement} from 'ink';

type MeasurableItemProps = {
  children: ReactNode;
  onMeasure: (height: number) => void;
};

export function MeasurableItem({children, onMeasure}: MeasurableItemProps) {
  const ref = useRef<DOMElement>(null);

  useEffect(() => {
    if (ref.current) {
      const {height} = measureElement(ref.current);
      onMeasure(height);
    }
  });

  return <Box ref={ref}>{children}</Box>;
}
