// user\jest.config.cjs

/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",

  rootDir: ".",
  testMatch: ["**/*.spec.ts"],

  // tell Jest to treat .ts as ESM
  extensionsToTreatAsEsm: [".ts"],

  // compile TS -> ESM
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "<rootDir>/tsconfig.jest.json",
        diagnostics: false,
      },
    ],
  },

  // fix ESM path endings + your path alias
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
