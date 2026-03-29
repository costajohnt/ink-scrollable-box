import React from 'react';
import {render, Box, Text} from 'ink';
import {ScrollableBox} from '../src/index.js';

const lines = Array.from({length: 100}, (_, i) => `Item ${i + 1}`);

function App() {
	return (
		<Box flexDirection="column">
			<Text bold>Basic ScrollableBox — 100 items (j/k/g/G to navigate)</Text>
			<ScrollableBox height={15} lines={lines} border autoFocus />
		</Box>
	);
}

render(<App />);
