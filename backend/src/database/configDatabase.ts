/**
 * This module sets all configuration parameters for the database component.
 *
 * It includes two functions:
 * - getMongoUrl() - returns a database connection uri.
 * - getConnectionOptions() - returns database connection options object.
 *
 * Note: The paths to some files (e.g. certs) rely on process.cwd being equal to the backend root directory.
 */

import { ConnectionOptions } from 'mongoose';
import { format } from 'util';
import fs from 'fs';
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
    const ssl = 'true';
    const authSource = 'admin';
    const authMechanism = 'DEFAULT';

    return format(
      '%s://%s:%s@%s/%s?ssl=%s&authSource=%s&authMechanism=%s',
      scheme,
      user,
      password,
      host,
      db,
      ssl,
      authSource,
      authMechanism,
    );
  },

  /**
   * This method returns the options parameter used in Mongoose.createConnection(uri, options) function that connects to a MongoDB database server.
   */
  getConnectionOptions: (): ConnectionOptions => {
    /* Read the certificate authority */
    const ROOT_CA = resolve('certs', 'database', 'rootCA.crt');
    const ca = [fs.readFileSync(ROOT_CA)];
    /* Read the private key and public cert (both stored in the same file) */
    const HTTPS_KEY = resolve('certs', 'database', 'mongoKeyAndCert.pem');
    const key = fs.readFileSync(HTTPS_KEY);
    const cert = key;
    const sslValidate = process.env.DB_IS_LOCAL === 'true';

    return {
      sslCA: ca,
      sslCert: cert,
      sslKey: key,
      sslValidate,
      /* Don't buffer commands if not connected, i.e. return error immediately */
      bufferMaxEntries: 0,
      /* Next 4 prevent mongoose deprecation warnings */
      useNewUrlParser: true,
      useFindAndModify: false,
      useCreateIndex: true,
      useUnifiedTopology: true,
      poolSize: 10, // default = 5
      keepAlive: true, // default true
      keepAliveInitialDelay: 300000, // default 300000
      socketTimeoutMS: 0, // default 360000
      appname: 'perform',
      loggerLevel: 'error', // default 'error'
      validateOptions: true,
    };
  },

  /* Path to database app.js file for unit test */
  startDatabasePath: resolve('dist', 'src', 'database', 'src', 'startDatabase'),
};
