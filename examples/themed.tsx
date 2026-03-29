import React from 'react';
import {render, Box, Text} from 'ink';
import {ScrollableBox} from '../src/index.js';

const lines = Array.from({length: 40}, (_, i) => `Entry ${i + 1}`);

function App() {
	return (
		<Box flexDirection="column">
			<Text bold>Themed — custom scrollbar characters and colors</Text>
			<ScrollableBox
				height={10}
				lines={lines}
				border
				scrollbarCharacter="▓"
				trackCharacter="░"
				scrollbarColor="cyan"
				scrollbarDimColor="gray"
				trackColor="gray"
				borderColor="cyan"
				borderDimColor="gray"
				upIndicator="↑ more"
				downIndicator="↓ more"
			/>
		</Box>
	);
}

render(<App />);
