import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // `.react-router/types` is codegen output — not ours to lint or fix.
  globalIgnores(['dist', '.react-router']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // shadcn/ui ships its cva variant maps next to the component, and
      // SortableItem exports its sensor hook the same way. Both are imported
      // widely, so allow the co-export instead of splitting the files.
      'react-refresh/only-export-components': [
        'warn',
        {
          allowConstantExport: true,
          allowExportNames: ['buttonVariants', 'badgeVariants', 'useDragSensors'],
        },
      ],
      // Reports that React Compiler skipped memoizing a component because it
      // uses react-hook-form's watch() or TanStack Table. We don't run the
      // compiler (no babel-plugin-react-compiler in vite.config.ts), so there
      // is nothing being skipped. Re-enable if the compiler is ever turned on.
      'react-hooks/incompatible-library': 'off',
    },
  },
  {
    // The FCM service worker runs in a worker scope and pulls `firebase` in
    // via importScripts, so declare those globals instead of muting no-undef.
    files: ['public/firebase-messaging-sw.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: { ...globals.serviceworker, firebase: 'readonly' },
    },
  },
])
