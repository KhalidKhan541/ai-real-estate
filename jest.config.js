const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

/** @type {import('jest').Config} */
const customConfig = {
  setupFilesAfterSetup: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@/components/(.*)$": "<rootDir>/src/components/$1",
    "^@/lib/(.*)$": "<rootDir>/src/lib/$1",
    "^@/types/(.*)$": "<rootDir>/src/types/$1",
    "^@/hooks/(.*)$": "<rootDir>/src/hooks/$1",
    "^@/stores/(.*)$": "<rootDir>/src/stores/$1",
    "^@/utils/(.*)$": "<rootDir>/src/utils/$1",
    "^@/validators/(.*)$": "<rootDir>/src/validators/$1",
    "^@/server/(.*)$": "<rootDir>/src/server/$1",
    "^@/styles/(.*)$": "<rootDir>/src/styles/$1",
  },
  testMatch: [
    "<rootDir>/src/**/*.test.{ts,tsx}",
    "<rootDir>/tests/**/*.test.{ts,tsx}",
  ],
  testPathIgnorePatterns: [
    "<rootDir>/.next/",
    "<rootDir>/node_modules/",
    "<rootDir>/cypress/",
  ],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.stories.{ts,tsx}",
    "!src/app/globals.css",
    "!src/app/layout.tsx",
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  coverageReporters: ["text", "lcov", "clover", "json-summary"],
  setupFiles: [],
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
        jsx: "react-jsx",
      },
    ],
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(.*\\.mjs$|@radix-ui|lucide-react|recharts|date-fns|clsx|tailwind-merge|class-variance-authority|framer-motion|zustand|immer|mapbox-gl|react-map-gl)/)",
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  resetModules: true,
  clearMocks: true,
  restoreMocks: true,
};

module.exports = createJestConfig(customConfig);
