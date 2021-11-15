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

/**
 * @returns Returns the Sunday that is equal or prior to today. The date is returned as a Date object.
 */
export const getLastSunday = (): Date => {
  let lastSunday = new Date();
  /* get last Sunday */
  lastSunday.setDate(lastSunday.getDate() - lastSunday.getDay());
  /* remove hours, minutes and seconds */
  lastSunday = new Date(lastSunday.toDateString());
  /* move by the local time offset to move the UTC value to 00:00 on the Sunday */
  lastSunday = new Date(
    lastSunday.getTime() - lastSunday.getTimezoneOffset() * 60 * 1000,
  );
  return lastSunday;
};
