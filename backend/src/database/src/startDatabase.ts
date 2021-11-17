/**
 * This module exports a function that connects to a MongoDB database server.
 */

import { setupDebug } from '../../utils/src/debugOutput';
import { configDatabase } from '../configDatabase';
import { Database } from './database';

/* Output a header and set up the debug function */
const { modulename, debug } = setupDebug(__filename);

/**
 * @summary
 * This function connects to a MongoDB database server.
 *
 * @param
 * - The set of parameters determine whether the database server started will be a local or hosted server, and whether the database on the server that is used will be the test or a production database.
 *
 * @returns A Database instance.
 * The database instance includes...
 * - A MongoDB database connection object.
 * - Utility database methods.
 * See the database module for database instance detail.
 *
 * @throws Throws an error if the database set up fails.
 */
async function startDatabase(
  DB_IS_LOCAL: string | undefined,
  DB_LOCAL_USER: string | undefined,
  DB_USER: string | undefined,
  DB_LOCAL_PASSWORD: string | undefined,
  DB_PASSWORD: string | undefined,
  DB_LOCAL_HOST: string | undefined,
  DB_HOST: string | undefined,
  NODE_ENV: string | undefined,
  DB_MODE: string | undefined,
  DB_DATABASE: string | undefined,
  DB_DATABASE_TEST: string | undefined,
  dumpError: Perform.TDumpErrorFunction = console.error,
): Promise<Perform.TDatabase> {
  debug(`${modulename}: running startDatabase`);

  try {
    const connectionUrl = configDatabase.getMongoUri(
      DB_IS_LOCAL,
      DB_LOCAL_USER,
      DB_USER,
      DB_LOCAL_PASSWORD,
      DB_PASSWORD,
      DB_LOCAL_HOST,
      DB_HOST,
      NODE_ENV,
      DB_MODE,
      DB_DATABASE,
      DB_DATABASE_TEST,
    );
    const connectOptions = configDatabase.getConnectionOptions();
    const database = new Database(connectionUrl, connectOptions, dumpError);
    /* await connection and store back in database object */
    database.dbConnection = await database.dbConnectionPromise;

    /* return database instance */
    return database;
  } catch (err) {
    console.error(`${modulename}: database failed to setup`);
    dumpError(err);
    throw err;
  }
}

/* export for main server */
export { startDatabase };
