import pluginReact from 'eslint-plugin-react';
import js from '@eslint/js';
import globals from 'globals';
import jsdoc from 'eslint-plugin-jsdoc';

export default [
    js.configs.recommended,
    {
        files: ['**/*.{js,mjs,cjs,jsx}'],
        plugins: {
            react: pluginReact,
            jsdoc: jsdoc
        },
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
            'indent': ['error', 4],             // Відступи 4 пробіли (виправлено коментар)
            'no-unused-vars': 'warn',           // Попередження про невикористані змінні
            'eqeqeq': 'error',                  // Тільки строге порівняння ===
            'react/react-in-jsx-scope': 'off',

            // ПРАВИЛА ЯКОСТІ ДОКУМЕНТАЦІЇ
            'jsdoc/require-jsdoc': 'warn',      // Вимагає JSDoc для функцій
            'jsdoc/require-param-type': 'warn', // Перевіряє наявність типів у @param
            'jsdoc/require-returns': 'warn',    // Перевіряє наявність @returns
            'jsdoc/require-description': 'warn' // Вимагає опис (бізнес-логіку)
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
            'backend/tests/',
            'docs/gen/**'
        ],
    }
];