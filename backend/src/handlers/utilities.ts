/**
 * This module supplies utility function used by various handlers.
 */

import { setupDebug } from '../utils/src/debugOutput';

const { modulename } = setupDebug(__filename);

/**
 * This is a utility function used by other handlers to report an unknown database error
 */
export const databaseUnavailable = (
  err: any,
  caller: string,
  locals: Perform.IAppLocals,
  reject: (reason: any) => void,
): void => {
  console.error(`${modulename}: ${caller} database error reported`);
  locals.dumpError(err);
  const errDb: Perform.IErr = {
    name: 'DATABASE_ACCESS',
    message: 'The database service is unavailable',
    statusCode: 503,
    dumped: true,
  };
  return reject(errDb);
};
