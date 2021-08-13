/* eslint-disable no-console */
/**
 * Utility to delete, and then recreate, a dist directory
 *
 * Usage:
 *
 * Used in package.com.
 *
 * The dist directory to be deleted and recreated is passed in as a parameter.
 * package.com script: "npm run delDistDir.ts <pathToDistDir>".
 *
 * <pathToDistDir> is relative to the application base directory.
 *
 * <pathToDistDir> must end in /dist/.
 *
 */

import fs from 'fs';
import rimraf from 'rimraf';
import { resolve } from 'path';
import { mkdirSync } from 'fs';

/* confirm that the passed in path ends in /dist/ */
if (!process.argv[2].endsWith('/dist/')) {
  console.error('ERROR: dist directory not provided');
  process.exit(1);
}

/* create path to dist directory from passed in parameter */
const distPath = resolve(process.argv[2]);
console.log(`Deleting: ${distPath}`);

if (!fs.existsSync(distPath)) {
  console.error('WARNING: dist directory not found');
}

rimraf.sync(distPath, { maxBusyTries: 100 });

mkdirSync(distPath);

console.log(`The directory ${distPath} is deleted or was not found`);
