import {readFileSync} from 'node:fs';
import {expect, test} from 'vitest';

// `useIsScreenReaderEnabled` and the `aria-*` props first shipped in ink 6.2.0.
test('ink peer range floor is at least 6.2.0', () => {
	const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {peerDependencies: Record<string, string>};
	const [major, minor] = packageJson.peerDependencies['ink']!.replace('>=', '').split('.').map(Number);
	expect(major! > 6 || (major === 6 && minor! >= 2)).toBe(true);
});
