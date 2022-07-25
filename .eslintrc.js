module.exports = {
  extends: ["next"],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ["./tsconfig.json"],
  },
  settings: {
    next: {
      rootDir: ["."],
    },
  },
  rules: {
    "require-await": ["error"],
    "eqeqeq": ["error"]
  },
};