// @ts-check
const path = require('path');
const grafanaConfig = require('@grafana/eslint-config/flat');
const { includeIgnoreFile } = require('@eslint/compat');
const { defineConfig } = require('eslint/config');

/**
 * @type {Array<import('eslint').Linter.Config>}
 */
module.exports = defineConfig([
  includeIgnoreFile(path.resolve(__dirname, '.gitignore')),
  grafanaConfig,
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: { '@typescript-eslint/no-deprecated': 'warn' },
    languageOptions: { parserOptions: { project: './tsconfig.json' } },
  },
]);
