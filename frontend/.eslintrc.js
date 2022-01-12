/**
 * TODO fix eslint error
 * I have excluded this file from ./tsconfig.json which means I get a non-fixable eslint parsing error.  I can ignore for the moment as I exclude this file in .eslintignore => you will never see the error in an eslint run.
 */
module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2020: true,
    jasmine: true,
    protractor: true,
  },
  extends: [
    /**
     * TODO enable airbnb
     */
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    /* rules I'm overriding but would like to meet */
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/interface-name-prefix': [
      'off',
      {
        prefixWithI: 'always',
        allowUnderscorePrefix: true,
      },
    ],
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',

    /* set personal preferences below */
    'max-len': [
      'error',
      {
        code: 120, // default 80
        tabWidth: 2, // default 4
        ignoreComments: true,
        ignorePattern: 'it[(].*',
      },
    ],
    'prettier/prettier': ['error'],
  },
};
