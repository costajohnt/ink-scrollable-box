import React, {useState, useEffect} from 'react';
import {render, Box, Text} from 'ink';
import {ScrollableBox} from '../src/index.js';

function App() {
	const [logs, setLogs] = useState<string[]>([]);

	useEffect(() => {
		const interval = setInterval(() => {
			setLogs(prev => [
				...prev,
				`[${new Date().toISOString()}] Log entry #${prev.length + 1}`,
			]);
		}, 200);

		return () => clearInterval(interval);
	}, []);

	return (
		<Box flexDirection="column">
			<Text bold>Log Follower — auto-scrolls to new entries (scroll up to pause)</Text>
			<Text dimColor>{logs.length} entries</Text>
			<ScrollableBox height={15} lines={logs} followOutput border autoFocus />
		</Box>
	);
}

render(<App />);
