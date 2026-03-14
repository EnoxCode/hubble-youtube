import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Hubble modules react to connector data inside useEffect — intentional pattern
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    files: ['.github/**/*.mjs', '.github/**/*.js', '.github/**/*.cjs'],
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
      },
    },
  },
  {
    ignores: ['dist/', 'node_modules/'],
  },
);
