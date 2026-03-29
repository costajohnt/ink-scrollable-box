import React from 'react';
import {render, Box, Text} from 'ink';
import {ScrollableBox} from '../src/index.js';

const items = [
	{status: 'pass', text: 'Build succeeded'},
	{status: 'pass', text: 'Types check passed'},
	{status: 'warn', text: '3 deprecation warnings'},
	{status: 'pass', text: 'Lint passed (0 errors)'},
	{status: 'fail', text: 'Test: auth.test.ts failed'},
	{status: 'pass', text: '142 tests passed'},
	{status: 'warn', text: 'Coverage: 89% (below 95% threshold)'},
	{status: 'pass', text: 'Bundle size: 12.3 KB'},
	{status: 'pass', text: 'No circular dependencies'},
	{status: 'fail', text: 'Publish dry-run failed: missing README'},
	{status: 'pass', text: 'Changelog updated'},
	{status: 'pass', text: 'Version bumped to 1.2.0'},
];

const colors: Record<string, string> = {pass: 'green', warn: 'yellow', fail: 'red'};
const icons: Record<string, string> = {pass: '✔', warn: '⚠', fail: '✘'};

function App() {
	return (
		<Box flexDirection="column">
			<Text bold>Children Mode — styled React nodes</Text>
			<ScrollableBox height={6} border>
				{items.map((item, i) => (
					<Text key={i} color={colors[item.status]}>
						{icons[item.status]} {item.text}
					</Text>
				))}
			</ScrollableBox>
		</Box>
	);
}

render(<App />);
