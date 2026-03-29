import React from 'react';
import {render, Box, Text} from 'ink';
import {ScrollableBox} from '../src/index.js';

const lines = Array.from({length: 100_000}, (_, i) =>
	`[${String(i).padStart(6, '0')}] ${'█'.repeat(Math.floor(Math.random() * 40))}`,
);

function App() {
	return (
		<Box flexDirection="column">
			<Text bold>Large Dataset — 100,000 lines (slice rendering)</Text>
			<Text dimColor>Use j/k, g/G, u/d, Page Up/Down to navigate</Text>
			<ScrollableBox height={20} lines={lines} border autoFocus />
		</Box>
	);
}

render(<App />);
