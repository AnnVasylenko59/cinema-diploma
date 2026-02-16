import pluginReact from 'eslint-plugin-react';
import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,jsx}'],
    plugins: { react: pluginReact },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser, // Для Frontend
        ...globals.node,    // Для Backend
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      'semi': ['error', 'always'],        // Обов'язкова крапка з комою
      'quotes': ['error', 'single'],      // Тільки одинарні лапки
      'indent': ['error', 4],             // Відступи 2 пробіли
      'no-unused-vars': 'warn',           // Попередження про невикористані змінні
      'eqeqeq': 'error',                  // Тільки строге порівняння ===
      'react/react-in-jsx-scope': 'off',
    },
  },
  {
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      'landing/',
      '.env',
      'backend/generated/',
      'backend/tests/'
    ],
  }
];