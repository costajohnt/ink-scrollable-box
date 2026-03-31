import type {ReactNode} from 'react';
import {Box, Text} from 'ink';
import type {ScrollbarProps} from './types.js';

const scrollbarStyles = {
	block: {thumb: '█', track: '░'},
	line: {thumb: '│', track: ' '},
	thick: {thumb: '┃', track: '╏'},
	dots: {thumb: '●', track: '·'},
} as const;

type RenderOptions = {
	viewportHeight: number;
	contentHeight: number;
	offset: number;
	thumb: string;
	track: string;
	isFocused: boolean;
	thumbColor?: string;
	thumbDimColor?: string;
	trackColor?: string;
};

function resolveColor(isThumb: boolean, options: RenderOptions): string | undefined {
	if (isThumb) {
		return options.isFocused ? options.thumbColor : options.thumbDimColor;
	}

	return options.trackColor;
}

function renderHalfLineScrollbar(options: RenderOptions): ReactNode[] {
	const {viewportHeight, contentHeight, offset, thumb, track} = options;
	const halfViewport = viewportHeight * 2;
	const halfThumbHeight = Math.max(1, Math.round(halfViewport * (viewportHeight / contentHeight)));
	const halfMaxThumbOffset = halfViewport - halfThumbHeight;
	const halfMaxScrollOffset = contentHeight - viewportHeight;
	const halfThumbOffset = halfMaxScrollOffset === 0
		? 0
		: Math.round((offset / halfMaxScrollOffset) * halfMaxThumbOffset);

	const lines: ReactNode[] = [];
	for (let i = 0; i < viewportHeight; i++) {
		const cellTop = i * 2;
		const cellBottom = (i * 2) + 1;

		const topInThumb = cellTop >= halfThumbOffset && cellTop < halfThumbOffset + halfThumbHeight;
		const bottomInThumb = cellBottom >= halfThumbOffset && cellBottom < halfThumbOffset + halfThumbHeight;

		let character: string;
		if (topInThumb && bottomInThumb) {
			character = thumb;
		} else if (topInThumb) {
			character = '▀';
		} else if (bottomInThumb) {
			character = '▄';
		} else {
			character = track;
		}

		const isThumbCell = topInThumb || bottomInThumb;
		const color = resolveColor(isThumbCell, options);
		lines.push(<Text key={i} color={color}>{character}</Text>);
	}

	return lines;
}

function renderIntegerScrollbar(options: RenderOptions): ReactNode[] {
	const {viewportHeight, contentHeight, offset, thumb, track} = options;
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
		const character = isThumb ? thumb : track;
		const color = resolveColor(isThumb, options);
		lines.push(<Text key={i} color={color}>{character}</Text>);
	}

	return lines;
}

export function Scrollbar({
	contentHeight,
	viewportHeight,
	offset,
	isFocused,
	scrollbarStyle,
	thumbCharacter,
	trackCharacter,
	thumbColor,
	thumbDimColor,
	trackColor,
}: ScrollbarProps) {
	if (contentHeight <= viewportHeight) {
		return null;
	}

	const style = scrollbarStyles[scrollbarStyle ?? 'block'];
	const thumb = thumbCharacter ?? style.thumb;
	const track = trackCharacter ?? style.track;
	const renderOptions: RenderOptions = {
		viewportHeight,
		contentHeight,
		offset,
		thumb,
		track,
		isFocused,
		thumbColor,
		thumbDimColor,
		trackColor,
	};

	// Use half-line precision only for block style without custom thumbCharacter
	const useHalfLine = (scrollbarStyle ?? 'block') === 'block' && thumbCharacter === undefined;

	const lines = useHalfLine
		? renderHalfLineScrollbar(renderOptions)
		: renderIntegerScrollbar(renderOptions);

	const needsGap = (scrollbarStyle ?? 'block') !== 'block';

	return (
		<Box flexDirection='column' flexShrink={0} width={1} marginLeft={needsGap ? 1 : 0} aria-hidden>
			{lines}
		</Box>
	);
}
