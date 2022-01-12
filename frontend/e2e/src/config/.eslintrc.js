module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2020: true,
    jasmine: true,
    protractor: true,
  },
  extends: ['prettier'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: ['import', 'prettier'],
  rules: {
    'no-console': [
      'error',
      {
        allow: [
          'log',
          'warn',
          'dir',
          'timeLog',
          'assert',
          'clear',
          'count',
          'countReset',
          'group',
          'groupEnd',
          'table',
          'dirxml',
          'error',
          'groupCollapsed',
          'Console',
          'profile',
          'profileEnd',
          'timeStamp',
          'context',
        ],
      },
    ],
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
