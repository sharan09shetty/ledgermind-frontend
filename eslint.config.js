import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    // Build-time config runs in Node, not the browser
    files: ['vite.config.js', 'eslint.config.js'],
    languageOptions: { globals: globals.node },
  },
  {
    // Context modules conventionally export a provider plus hooks/constants;
    // shared UI utils export helpers alongside tiny components. HMR still
    // works acceptably for these, so relax the fast-refresh purity rule.
    files: ['src/context/**/*.jsx', 'src/utils/**/*.jsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
