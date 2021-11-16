/**
 * This module sets all configuration parameters for the database component.
 *
 * It includes two functions:
 * - getMongoUrl() - returns a database connection uri.
 * - getConnectionOptions() - returns database connection options object.
 *
 * Note: The paths to some files (e.g. certs) rely on process.cwd being equal to the backend root directory.
 */

import mongoose from 'mongoose';
import { format } from 'util';
import { resolve } from 'path';
import { setupDebug } from '../utils/src/debugOutput';

/* Output a header and set up debug function */
const { modulename, debug } = setupDebug(__filename);

export const configDatabase = {
  /**
   * This method returns the uri parameter to be used in the Mongoose.createConnection(uri, options) function that connects to a MongoDB database server.
   */
  getMongoUri: (
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
  ): string => {
    /* Print out which database is in use */
    const server = DB_IS_LOCAL === 'true' ? 'local' : 'remote';
    debug(`${modulename} : ${server} database server in use`);

    /* Set up local or remote mongoDB server - local is only used if DB_IS_LOCAL is true */
    const scheme = DB_IS_LOCAL === 'true' ? 'mongodb' : 'mongodb+srv';

    /* the credentials are chosen to match the local or remote mongoDB server */
    const user =
      DB_IS_LOCAL === 'true'
        ? encodeURIComponent(DB_LOCAL_USER as string)
        : encodeURIComponent(DB_USER as string);
    const password =
      DB_IS_LOCAL === 'true'
        ? encodeURIComponent(DB_LOCAL_PASSWORD as string)
        : encodeURIComponent(DB_PASSWORD as string);
    const host =
      DB_IS_LOCAL === 'true' ? (DB_LOCAL_HOST as string) : (DB_HOST as string);

    /* The mongoDB database to use within the database server is either a test database or a production database */
    /* The production database is only used when both NODE_ENV and DB_MODE both equal 'production'=> you can use the 'test' database with NODE_ENV = 'production' if required */
    const db =
      NODE_ENV === 'production' && DB_MODE === 'production'
        ? (DB_DATABASE as string)
        : (DB_DATABASE_TEST as string);
    debug(`${modulename} : database \'${db}\' in use`);
    const extra = 'authSource=admin&retryWrites=true&w=majority';
    return format(
      '%s://%s:%s@%s/%s?%s',
      scheme,
      user,
      password,
      host,
      db,
      extra,
    );
  },

  /**
   * This method returns the options parameter used in Mongoose.createConnection(uri, options) function that connects to a MongoDB database server.
   */
  getConnectionOptions: (): mongoose.ConnectOptions => {
    /* Read the certificate authority */
    const ROOT_CA = resolve('certs', 'database', 'rootCA.crt');
    const ca = ROOT_CA;
    /* Read the private key and public cert (both stored in the same file) */
    const HTTPS_KEY = resolve('certs', 'database', 'mongoKeyAndCert.pem');
    const key: any = HTTPS_KEY;
    const cert = key;
    /* The cloud Atlas server does not support certificate validation (i.e. the node server confirming a cert returned from the mongodb server).  This ued to work on a local mongodb server (so I used to set sslValidate = process.env.DB_IS_LOCAL === 'true'; but this stopped working and I simply set to false.  I could troubleshoot but I am not sure it bsi supported and it adds no value. */
    const sslValidate = false;

    return {
      sslCA: ca,
      sslCert: cert,
      sslKey: key,
      sslValidate,
      /* set false if you have a large database and are changing indexes as could result in a slow start up - not a problem for a small database and impact is on only on startup*/
      autoIndex: true,
      keepAlive: true, // default true
      keepAliveInitialDelay: 300000, // default 300000
      socketTimeoutMS: 0, // default 360000
      appName: 'perform',
      loggerLevel: 'error', // default 'error'
    };
  },

  /* Path to database app.js file for unit test */
  startDatabasePath: resolve('dist', 'src', 'database', 'src', 'startDatabase'),
};
