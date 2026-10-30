import base from '@costajohnt/ink-config/xo';

/**
@type {import('xo').FlatXoConfig}
*/
const xoConfig = [
	...base,
	{
		// Rules this codebase does not satisfy yet under the shared config.
		// Burn these down by fixing the code and deleting the line.
		rules: {
			'@eslint-react/naming-convention-ref-name': 'off',
			'@eslint-react/no-children-to-array': 'off',
			'@eslint-react/no-forward-ref': 'off',
			'@eslint-react/no-unnecessary-use-prefix': 'off',
			'@typescript-eslint/strict-boolean-expressions': 'off',
			'unicorn/consistent-boolean-name': 'off',
			'unicorn/prefer-number-is-safe-integer': 'off',
			'unicorn/prefer-simple-condition-first': 'off',
			'unicorn/prefer-ternary': 'off',
		},
	},
	{
		files: ['test/**', 'src/**/__tests__/**'],
		rules: {
			'@eslint-community/eslint-comments/require-description': 'off',
			'node-test/no-import-test-files': 'off',
			'regexp/no-control-character': 'off',
			'unicorn/no-duplicate-loops': 'off',
			'unicorn/no-return-array-push': 'off',
			'unicorn/prefer-unicode-code-point-escapes': 'off',
		},
	},
	{
		files: ['**/*.md'],
		rules: {
			'markdown/no-missing-label-refs': 'off',
		},
	},
	{
		files: ['package.json'],
		rules: {
			'package-json/prefer-side-effects-field': 'off',
			'package-json/require-default-condition': 'off',
		},
	},
];

export default xoConfig;
