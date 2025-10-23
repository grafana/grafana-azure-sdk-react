module.exports = {
  modulePaths: ['<rootDir>/src'],
  setupFiles: ['<rootDir>/src/tests/jest-setup.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/tests/setupTests.ts'],
  testEnvironment: 'jest-environment-jsdom',
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{spec,test,jest}.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{spec,test,jest}.{js,jsx,ts,tsx}',
  ],
  transform: {
    '^.+\\.(t|j)sx?$': [
      '@swc/jest',
      {
        sourceMaps: true,
        jsc: { parser: { syntax: 'typescript', tsx: true, decorators: false, dynamicImport: true } },
      },
    ],
  },
  transformIgnorePatterns: [],
  moduleNameMapper: { '\\.(css|less|sass|scss)$': '<rootDir>/src/tests/mock/styleMock.js' },
  passWithNoTests: true,
};
