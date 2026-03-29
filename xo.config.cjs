module.exports = {
  extends: ['xo-react'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
  },
  overrides: [
    {
      files: ['test/**'],
      rules: {
        '@typescript-eslint/no-floating-promises': 'off',
      },
    },
  ],
};
