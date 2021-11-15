/**
 * This module provides a error logging service.
 * A custom logger such as Winston is not required as GKE captures console logs, so it uses console.error.
 */

/**
 * Usage:
 *
 * Add...
 * const { DumpError } = <path to file>.dumpError;
 * const dumpError = new DumpError() as (err: any) => void;
 *
 * Also once this module is imported then all subsequent imports get the same
 * object.  Thus you can set up DumpError in the main module and add...
 * dumpError = new DumpError(); in other modules,
 *
 * Note: The property 'dumped' is set to true on an object
 * that is passed in to prevent an error object that has
 * being dumped from being dumped again.
 */

import util from 'util';
import { setupDebug } from './debugOutput';

const { modulename } = setupDebug(__filename);

class DumpError {
  /* holds the singleton instance */
  public static instance: Perform.TDumpErrorFunction;

  /* the function that dumps the error */
  public static dump: Perform.TDumpErrorFunction;

  /* instantiates if necessary and sets dump to console.error */
  public constructor() {
    if (!DumpError.instance) {
      DumpError.dump = console.error;
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      DumpError.instance = dumpError;
    }
    return DumpError.instance;
  }
}

function dumpError(err: any) {
  DumpError.dump(`${modulename}: dumpError called`);

  if (err && typeof err === 'object') {
    if (err.dumped) {
      DumpError.dump(`${modulename}: error previously dumped`);
      return;
    }

    DumpError.dump(`Error Object: \n${util.format('%O', err)}\n`);

    /* mark so not dumped twice */
    err.dumped = true;
  } else if (typeof err === 'string') {
    DumpError.dump(`Error String: ${err}`);
  } else {
    DumpError.dump('DumpError: err is null or not an object or string');
  }
}

export { DumpError };
