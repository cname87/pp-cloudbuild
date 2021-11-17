/* Note: eslint must be run from ./backend directory */
module.exports = {
  root: true,
  env: {
    commonjs: true,
    browser: true,
    node: true,
    es2020: true,
    mocha: true,
  },
  globals: {
    chai: 'writable',
  },
  extends: ['plugin:@typescript-eslint/recommended', 'prettier'],
  /*
   Note: If you run eslint using the @typescript-eslint-parser (as set up in .below) you must include all files that you lint (that use this file) in the referenced parserOptions.project (i.e. ./tsconfig.json).  Therefore lint commands that use this file should only target files that are included in the project file.  If the lint commands include other directories you can exclude them by adding directories/files to be excluded to .eslintignore.
   */
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
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/explicit-module-boundary-types': [
      'error',
      {
        allowArgumentsExplicitlyTypedAsAny: true,
      },
    ],
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
