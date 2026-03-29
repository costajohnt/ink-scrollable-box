import React from 'react';
import {render, Box, Text} from 'ink';
import {ScrollableBox} from '../src/index.js';

const leftLines = Array.from({length: 30}, (_, i) => `Left-${i + 1}`);
const rightLines = Array.from({length: 50}, (_, i) => `Right-${i + 1}`);

function App() {
	return (
		<Box flexDirection="column">
			<Text bold>Multi-Pane — Tab to switch focus between panes</Text>
			<Box flexDirection="row" gap={2}>
				<Box flexDirection="column">
					<Text dimColor>Panel A</Text>
					<ScrollableBox height={10} lines={leftLines} border id="left" autoFocus />
				</Box>
				<Box flexDirection="column">
					<Text dimColor>Panel B</Text>
					<ScrollableBox height={10} lines={rightLines} border id="right" />
				</Box>
			</Box>
		</Box>
	);
}

render(<App />);
