import React from 'react';
import {render, Box, Text} from 'ink';
import {useScrollable} from '../src/index.js';

const data = Array.from({length: 50}, (_, i) => `Record ${i + 1}`);

function App() {
	const scroll = useScrollable({
		contentHeight: data.length,
		viewportHeight: 10,
		scrollStep: 3,
	});

	const visible = data.slice(scroll.offset, scroll.offset + 10);

	return (
		<Box flexDirection="column">
			<Text bold>Custom Hook — useScrollable standalone</Text>
			<Text dimColor>
				Offset: {scroll.offset} | {scroll.percentage}% | {scroll.isAtTop ? 'TOP' : scroll.isAtBottom ? 'BOTTOM' : 'MIDDLE'}
			</Text>
			<Box flexDirection="column" borderStyle="round" borderColor="gray">
				{visible.map((line, i) => (
					<Text key={scroll.offset + i}>{line}</Text>
				))}
			</Box>
		</Box>
	);
}

render(<App />);
