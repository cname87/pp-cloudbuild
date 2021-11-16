/**
 * This module returns a database object with methods to carry out database operations.
 *
 * The database object is instantiated with the following parameters:
 * - uri and options parameters that pass to the mongoose.createConnection function.
 * - Optional Logger and dumpError parameters.
 *
 * The database object provides the following properties:
 * - dbConnectionPromise: A promise that resolves to a Mongoose connection object.
 * - dbConnection: This is empty.  It is used to store the database connection object once that object is retrieved from dbConnectionPromise.  This is filled by a startDatabase function before the database object is passed to the backend server.
 *
 * The database object provides the following methods:
 * - closeConnection: Closes a supplied connection to the MongoDB server.
 * - createModel: Returns a Mongoose model based on supplied parameters.
 */

import mongoose, {
  Connection,
  Document,
  Model,
  Schema,
  SchemaDefinition,
} from 'mongoose';
import { setupDebug } from '../../utils/src/debugOutput';

/* output a header and set up debug function*/
const { modulename, debug } = setupDebug(__filename);

/**
 * @summary
 * Creates a connection to a database on the MongoDB server.
 * If a connection is not possible, the connection attempt will time out after 30s and throw an error.
 * If debug is enabled it also prints stats on the configured database.
 * @params
 * - None.
 * @returns
 * - Returns a promise to a Mongoose database connection object.
 * @throws
 * - Throws an error if the connection attempt fails.
 */
async function connectToDb(
  uri: string,
  options: mongoose.ConnectOptions,
  dumpError: Perform.TDumpErrorFunction = console.error,
): Promise<Connection> {
  debug(`${modulename}: running connectToDb`);

  try {
    debug(`${modulename}: trying to connect to the database server`);

    const dbConnection = await mongoose
      .createConnection(uri, options)
      .asPromise();

    /* Disable buffering commands for all models so an error is thrown immediately when a connection goes down */
    mongoose.set('bufferCommands', false);

    /* Enable logging of all Mongoose database calls */
    if (process.env.DB_LOGS === 'log') {
      mongoose.set('debug', true);
    }

    debug(
      `${modulename} : database \'${dbConnection.db.databaseName}\' connected`,
    );

    if (debug.enabled) {
      debug(`${modulename}: printing db stats`);
      const stats = await dbConnection.db.command({ dbStats: 1 });
      debug(stats);
    }

    return dbConnection;
  } catch (err) {
    console.error(`${modulename}: database error during connection attempt`);
    dumpError(err);
    throw err;
  }
}

/**
 * @summary
 * Closes a MongoDB database connection.
 * Throws an error if there is an error on connection.
 * @params
 * - dbConnection: The database connection to be closed, i.e. a Mongoose or MongoDB connection with a close function.
 * - force: Passed to force close which can clear timers etc if you are closing after an error. The connection cannot be used again and it emits no events during closure. Defaults to false.
 * @returns
 * It returns the connection as returned from the underlying connection.close() output.
 * @throws
 * It logs and throws an error if the underlying connection.close() throws an error.
 */
async function closeConnection(
  this: Database,
  dbConnection: Connection,
  force = false,
): Promise<void> {
  debug(`${modulename}: running closeConnection`);

  try {
    /* Remove close event listeners to avoid triggering an error event */
    dbConnection.removeAllListeners('close');
    dbConnection.removeAllListeners('disconnected');
    const connection = await dbConnection.close(force);
    debug(
      `${modulename}: database connection successfully closed by closeConnection`,
    );
    return connection;
  } catch (err) {
    const message = ': database connection error during closeConnection';
    console.error(modulename + message);
    this.dumpError(err);
    throw err;
  }
}

/**
 * @summary
 * Returns a pre-existing, or creates a Mongoose model (which is an object that allows access to a collection on a MongoDB database) based on supplied parameters.
 * The model (i.e. collection connection) will be to a collection with the supplied collection name in the parent database instance, (and using the supplied schema).
 * @params
 * - ModelName: The name to give the created model.
 * - modelSchema: The schema definition to use in the model.
 * - dbCollectionName: The name of the collection to use.
 * @returns
 * - Returns a Mongoose database model object.
 * @throws
 * - Throws an error if the model creation attempt fails.
 */
function createModel(
  this: Database,
  ModelName: string,
  modelSchema: SchemaDefinition,
  dbCollectionName: string,
): Model<Document, Record<string, unknown>> {
  debug(`${modulename}: running createModel`);

  /* Identify the database collection and define its schema */
  const DbSchema = new Schema(modelSchema, {
    collection: dbCollectionName,
  });

  try {
    /* Return the model or create the model if it doesn't already exist */
    const DbModel =
      this.dbConnection.models[ModelName] ||
      this.dbConnection.model(ModelName, DbSchema);
    debug(`${modulename}: mongoose model \'${DbModel.modelName}\' returned`);
    return DbModel;
  } catch (err) {
    console.error(`${modulename}: database model creation error`);
    this.dumpError(err);
    throw err;
  }
}

/**
 * The class constructor for the exported database object.
 */
class Database {
  /* dbConnection is set once the connection object is retrieved */
  public set dbConnection(connection: Connection) {
    this.#dbConnection = connection;
  }

  public get dbConnection(): Connection {
    return this.#dbConnection;
  }

  public dbConnectionPromise: Promise<Connection>;

  public closeConnection: (
    this: Database,
    dbConnection: Connection,
    force?: boolean,
  ) => Promise<void>;

  public createModel: (
    this: Database,
    ModelName: string,
    modelSchema: SchemaDefinition,
    dbCollectionName: string,
  ) => Model<Document, Record<string, unknown>>;

  #dbConnection: Connection = {} as unknown as Connection;

  /**
   * @param
   * - The Mongoose createConnection uri and options parameters must be provided.
   * - a dumperror function may be provided */
  constructor(
    protected connectionUrl: string,
    protected connectionOptions: mongoose.ConnectOptions,
    protected dumpError: Perform.TDumpErrorFunction = console.error,
  ) {
    /* Get a promise to the database */
    this.dbConnectionPromise = connectToDb(
      connectionUrl,
      connectionOptions,
      dumpError,
    );
    this.closeConnection = closeConnection;
    this.createModel = createModel;
  }
}

export { Database };
