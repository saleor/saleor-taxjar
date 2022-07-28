/* eslint-disable import/no-anonymous-default-export */
const { pathsToModuleNameMapper } = require("ts-jest");
const requireJSON = require("json-easy-strip");
const { compilerOptions } = requireJSON("./tsconfig.json");

delete compilerOptions.paths["react"];

export default {
  collectCoverage: true,
  coverageDirectory: "coverage",
  coveragePathIgnorePatterns: ["/node_modules/", "__tests__/"],
  coverageProvider: "v8",
  modulePathIgnorePatterns: ["utils.ts"],
  transform: {
    "^.+\\.ts?$": "ts-jest",
  },
  moduleNameMapper: {
    ...pathsToModuleNameMapper(compilerOptions.paths, {
      prefix: "<rootDir>/",
    }),
    "^lodash-es/(.*)$": "lodash/$1",
  },
  transformIgnorePatterns: ["<rootDir>/node_modules/"],
  testMatch: [
    // "**/__tests__/**/*.[jt]s?(x)",
    "**/?(*.)+(spec|test).[tj]s?(x)",
  ],
};
