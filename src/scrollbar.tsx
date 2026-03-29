import type {ReactNode} from 'react';
import {Box, Text} from 'ink';
import type {ScrollbarProps} from './types.js';

export function Scrollbar({
	contentHeight,
	viewportHeight,
	offset,
	isFocused,
	thumbCharacter = '█',
	trackCharacter = '░',
	thumbColor,
	thumbDimColor,
	trackColor,
}: ScrollbarProps) {
	if (contentHeight <= viewportHeight) {
		return null;
	}

	const thumbHeight = Math.max(
		1,
		Math.round(viewportHeight * (viewportHeight / contentHeight)),
	);
	const maxThumbOffset = viewportHeight - thumbHeight;
	const maxScrollOffset = contentHeight - viewportHeight;
	const thumbOffset
		= maxScrollOffset === 0
			? 0
			: Math.round((offset / maxScrollOffset) * maxThumbOffset);

	const lines: ReactNode[] = [];
	for (let i = 0; i < viewportHeight; i++) {
		const isThumb = i >= thumbOffset && i < thumbOffset + thumbHeight;
		const character = isThumb ? thumbCharacter : trackCharacter;
		const color = isThumb ? (isFocused ? thumbColor : thumbDimColor) : trackColor;

		lines.push(<Text key={i} color={color}>{character}</Text>);
	}

	return (
		<Box flexDirection='column' flexShrink={0} width={1}>
			{lines}
		</Box>
	);
}
