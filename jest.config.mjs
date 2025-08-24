// user\jest.config.mjs

/** @type {import('jest').Config} */
export default {
  // TS + ESM
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",

  rootDir: ".",
  testMatch: ["**/*.spec.ts"],

  // Tell Jest to treat .ts as ESM
  extensionsToTreatAsEsm: [".ts"],

  // Use ts-jest to transpile TS (ESM output)
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "<rootDir>/tsconfig.jest.json",
      },
    ],
  },

  // Fix ESM ".js" extension rewrites in compiled output
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^@nihil_backend/user/(.*)$": "<rootDir>/src/$1",
  },

  setupFilesAfterEnv: ["<rootDir>/jest.setup.cjs"],
  injectGlobals: true,

  moduleFileExtensions: ["ts", "js", "mjs", "cjs", "json"],
  modulePathIgnorePatterns: ["<rootDir>/dist/"],

  collectCoverageFrom: ["src/**/*.{ts,js}"],
  coverageDirectory: "./coverage",

  verbose: true,
};
