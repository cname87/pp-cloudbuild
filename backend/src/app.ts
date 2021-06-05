/* eslint-disable @typescript-eslint/no-use-before-define */

/**
 * This application runs a http server with a database backend.
 * It is designed to be hosted on the GKE Kubernetes platform.
 *
 * This module creates an object with key items which it attaches to the express app application so it is accessible by all middleware.
 *
 * It attempts to start the database and then starts the http server.
 *
 * It can be stopped via a SIGINT event (CTRL+C).
 *
 */

/* import configuration parameters into process.env */
import './utils/src/loadEnvFile';

/* import all internal modules used in the application */
import { EventEmitter } from 'events';
import express from 'express';
import { Connection } from 'mongoose';
import util from 'util';
import { setupDebug } from './utils/src/debugOutput';

/* server functions */
import { startServer } from './server/startserver';
import { runServer } from './server/runServer';
/* members and sessions models */
import { createModelMembers } from './models/src/members-model';
import { createModelSessions } from './models/src/sessions-model';
/* controllers */
import { apiController, initOpenApi } from './controllers/api-controller';
import { failController } from './controllers/fail-controller';
/* authentication handler */
import { authenticateHandler } from './handlers/authenticate-handlers';
/* authorization handler */
import { authorizeHandler } from './handlers/authorize-handlers';
/* error handler middleware functions (and debug for mocha) */
import { errorHandlers } from './handlers/error-handlers';
/* handlers for /members api */
import { membersApi } from './api/members-api';
/* handlers for /sessions api */
import { sessionsApi } from './api/sessions-api';
/* 2nd level members handlers */
import { membersHandlers } from './handlers/members-handlers';
/* 2nd level sessions handlers */
import { sessionsHandlers } from './handlers/sessions-handlers';
/* shared handler functions */
import { miscHandlers } from './handlers/misc-handlers';
/* a utility to dump errors */
import { DumpError } from './utils/src/dumpError';
/* user class */
import { User } from './users/user';
/* getUser function */
import { getUser } from './users/users';
/* database creation function */
import { startDatabase } from './database/src/startDatabase';

/* output a header */
const { modulename, debug } = setupDebug(__filename);
const sleep = util.promisify(setTimeout);

/* Create the single instances of the dumpError utility.  This is used in this module and also passed via the appLocals object. (Other modules can create a new instance later and they will receive the same instance). */
const dumpError = new DumpError() as Perform.DumpErrorFunction;

/**
 * An object is created to be added to the express app object containing objects and variables needed across requests.
 */
const createStore: () => Perform.IAppLocals = (): Perform.IAppLocals => {
  return {
    /* route controllers */
    controllers: {
      api: apiController,
      /* test fail paths */
      fail: failController,
    },
    /* dump error utility */
    dumpError,
    /* generate the handlers object */
    handlers: {
      authenticateHandler,
      authorizeHandler,
      errorHandlers,
      membersHandlers,
      sessionsHandlers,
      miscHandlers,
      membersApi,
      sessionsApi,
    },
    /* handlers generated by openapi */
    membersApi,
    /* creates the mongoose models */
    createModelMembers,
    createModelSessions,
    /*  user class */
    User,
    /* getUser utility */
    getUser,
    /* event emitter to signal server up etc */
    /* create before db setup call as async nature of db setup means app exports before db up and app.event definition needed by mocha so it can await server up event */
    event: new EventEmitter(),
    /* holds created http(s) servers  - filled during start server call */
    servers: [],
    /* models. */
    models: {
      /* filled during an api call */
      members: ({} as any) as Perform.IModelExtended,
      sessions: ({} as any) as Perform.IModelExtended,
    },
    /* database - filled during database startup */
    database: ({} as any) as Perform.Database,
    /* dbConnection is filled during database startup */
    dbConnection: ({} as any) as Connection,
  };
};
const appLocals = createStore();

/* the express app used throughout */
/* add the appLocals object for access in middleware */
const app = Object.assign(express(), { appLocals });

/**
 * Handles uncaughtException events.
 * @param err Error passed in by error handler.
 */
const uncaughtException: Perform.TUncaught = async (err: Perform.IErr) => {
  debug(`${modulename}: running uncaughtException`);

  /* note: process.uncaughtException also logs the trace to console.error */
  console.error(`${modulename}: uncaught exception`);
  dumpError(err);
  await closeAll();
  process.exit(-11);
};
/* capture all uncaught application exceptions (only once) */
process.on('uncaughtException', uncaughtException);

/**
 * Handles unhandledRejection events.
 * @param reason Reason passed in by error handler.
 */
const unhandledRejection: NodeJS.UnhandledRejectionListener = async (
  reason,
  promise,
) => {
  debug(`${modulename}: running unhandledRejection`);

  console.error(
    `${modulename}: Unhandled Rejection at promise: ${JSON.stringify(
      promise,
    )} with reason: ${JSON.stringify(reason)}`,
  );
  dumpError(reason);
  await closeAll();
  process.exit(-12);
};
/* capture unhandled promise rejection (only once) */
process.once('unhandledRejection', unhandledRejection);

/**
 * @summary
 * Starts the database and stores the database object, and the database connection object, in a supplied object.
 * If the supplied object already includes a connected database it does nothing.
 * On connection it sets up listeners that throw untrapped errors in case of an unexpected error or disconnect after the connection has been established.
 * It catches any error during database startup, logs the error but does not throw on the error i.e. it allows retries.
 * @returns void
 * - If the connection is successful the supplied object is mutated to include a database instance and a database connection object.

 */
const storeDatabase = async (store: {
  database: Perform.Database;
  dbConnection: Connection;
  models: Perform.IModels;
  dumpError: Perform.DumpErrorFunction;
}) => {
  debug(`${modulename}: calling storeDatabase`);

  /* Check if a valid connection exists and, if so, exit */
  if (
    store.dbConnection &&
    store.dbConnection.readyState === Perform.DbReadyState.Connected
  ) {
    return;
  }

  try {
    /* Clear the stored database and connection objects in case this is a reconnect */
    if (
      store.database &&
      store.database.dbConnection &&
      store.database.closeConnection
    ) {
      try {
        await store.database.closeConnection(store.database.dbConnection);
      } catch (err) {
        debug(
          `${modulename}: database.closeConnection error - ignoring and continuing`,
        );
      }
      store.database = ({} as any) as Perform.Database;
      store.dbConnection = ({} as any) as Connection;
    }

    /* Clear the members model in case this is a reconnect, so that a fresh members model is created based on the new connection */
    if (store.models && store.models.members) {
      store.models.members = ({} as any) as Perform.IModelExtended;
    }

    /* Clear the sessions model in case this is a reconnect, so that a fresh sessions model is created based on the new connection */
    if (store.models && store.models.sessions) {
      store.models.sessions = ({} as any) as Perform.IModelExtended;
    }

    /* Create and store a database object */
    /* The database server started will be either local or hosted connection, and the database used will be either a test or a production database, depending on process.env parameters */
    store.database = await startDatabase(
      process.env.DB_IS_LOCAL,
      process.env.DB_LOCAL_USER,
      process.env.DB_USER,
      process.env.DB_LOCAL_PASSWORD,
      process.env.DB_PASSWORD,
      process.env.DB_LOCAL_HOST,
      process.env.DB_HOST,
      process.env.NODE_ENV,
      process.env.DB_MODE,
      process.env.DB_DATABASE,
      process.env.DB_DATABASE_TEST,
      store.dumpError,
    );

    /* Obtain and store the database connection object separately for ease of access */
    store.dbConnection = store.database.dbConnection;

    /* Handle any errors issued after the connection is established */
    store.dbConnection.on('error', (err) => {
      console.error(
        `${modulename}: unexpected database \'${store.dbConnection.db.databaseName}\' error event received`,
      );
      dumpError(err);
      /* Throw error - caught in GCP error handler and will restart */
      throw err;
    });

    /* Handle any unexpected connection drop after the connection is established  */
    store.dbConnection.on('disconnected', async () => {
      const databaseName = store.dbConnection.db.databaseName;
      const errMessage = `${modulename}: Unexpected database \'${databaseName}\' disconnected event received`;
      console.error(errMessage);
      const err = {
        name: 'Database disconnection ',
        message: errMessage,
      };
      /* Throw error - caught in GCP error handler and will restart */
      throw err;
    });

    return;
  } catch (err) {
    /* Log error but proceed i.e. allow connection retries */
    console.error(`${modulename}: database startup error - continuing`);
    dumpError(err);
  }
};

/**
 * Calls the http server to start and stores the server object in a supplied object.
 * It catches any error during server startup, logs the error and exits.
 * @returns void. The supplied object is mutated to include a server object.
 */

const storeServer = async (store: {
  servers: Perform.Server[];
  controllers: Perform.IControllers;
  handlers: Perform.IHandlers;
  event: EventEmitter;
}) => {
  debug(`${modulename}: calling storeServer`);

  /* holds connected servers */
  const servers: Perform.Server[] = [];
  await startServer(
    app,
    servers, // filled with connected server on return
    dumpError,
  );
  store.servers = servers;

  /* set up an error handlers for the servers */
  for (const server of servers) {
    server.expressServer.on('error', async (err: Error) => {
      console.error(`${modulename}: Unexpected server error - exiting`);
      dumpError(err);
      await closeAll();
      debug(`${modulename}: will exit with code -3`);
      process.exitCode = -3;
    });
  }

  /* run the server functionality */
  await runServer(app);

  debug(`${modulename}: server up and running`);

  /* raise an event that mocha can read */
  const arg = {
    message: 'Server running 0',
  };
  store.event.emit('appRunApp', arg);
};

/**
 * Runs the application.
 */
async function runApp(store: Perform.IAppLocals) {
  debug(`${modulename}: running runApp`);

  /* try connect to database until successful */
  console.info('\n*** STARTING THE DATABASE ***\n');
  let isDbReady = Perform.DbReadyState.Disconnected;
  while (isDbReady !== Perform.DbReadyState.Connected) {
    /* starts database and stores database and connection in store */
    await storeDatabase(store);
    if (!store.dbConnection.readyState) {
      await sleep(+process.env.DATABASE_ERROR_DELAY!);
    }
    isDbReady = store.dbConnection.readyState;
  }

  /* initialise openApi (it takes a long time) */
  initOpenApi(store);

  try {
    /*  start the http server */
    console.info('\n*** STARTING THE HTTP SERVER ***\n');
    await storeServer(store);
    console.info('\n*** SERVER UP AND LISTENING ***');
    /* output key environment variables */
    debug(`${modulename}: Environment (NODE_ENV): ${process.env.NODE_ENV}`);
    debug(
      `${modulename}: Database server is local (DB_IS_LOCAL): ${
        process.env.DB_IS_LOCAL === 'true'
      }`,
    );
    debug(
      `${modulename}: Production database in use (DB_MODE): ${
        process.env.NODE_ENV === 'production' &&
        process.env.DB_MODE === 'production'
      }`,
    );
    debug(
      `${modulename}: Test paths open (TEST_PATHS): ${
        process.env.TEST_PATHS === 'true'
      }`,
    );
    debug(
      `${modulename}: Test local database (TEST_DB_LOCAL): ${
        process.env.TEST_DB_LOCAL === 'true'
      }`,
    );
  } catch (err) {
    console.error(`${modulename}: server startup error - exiting`);
    dumpError(err);
    await closeAll(store.servers, store.database);
    debug(`${modulename}: will exit with code -1`);
    process.exitCode = -1;
  }
}

/**
 * Shuts down the application gracefully.
 * It raises an event using an eventemitter stored in the appLocals object defined in the module.  The event is used by unit test e.g. Mocha.
 */
const sigint: Perform.TSigint = async (signal = 'Internal Shutdown') => {
  debug(`${modulename}: running sigint`);

  await closeAll();

  debug(`${modulename}: ${signal} signal - will exit normally with code 0`);

  console.info('\n*** CLOSING THE SERVER ON REQUEST ***\n');

  /* raise an event that mocha can read */
  const arg = {
    message: 'Server exit 0',
    number: 0,
  };

  appLocals.event.emit('appSigint', arg);
};

/**
 * Closes all server and database connections.
 * If no parameters are supplied the appLocals object defined in the module is used to identify what to close.
 * @param servers Array of created servers.
 * @param database Created database instance.
 */
async function closeAll(
  servers: Perform.Server[] = appLocals.servers,
  database: Perform.Database = appLocals.database,
) {
  try {
    debug(`${modulename}: closing connections...`);

    if (servers && servers.length > 0) {
      for (const svr of servers) {
        await svr.stopServer();
        svr.expressServer.removeAllListeners();
      }
    }

    if (database) {
      try {
        await database.closeConnection(database.dbConnection);
      } catch (err) {
        debug(
          `${modulename}: database.closeConnection error - ignoring and continuing`,
        );
      }
    }

    process.removeListener('SIGINT', sigint);
    process.removeListener('uncaughtException', uncaughtException);
    process.removeListener('unhandledRejection', unhandledRejection);
    process.removeListener('thrownException', uncaughtException);

    debug(`${modulename}: all connections & listeners closed`);

    return;
  } catch (err) {
    /* unexpected error - don't call uncaught/rejected */
    console.error(`${modulename}: closeAll error - exiting`);
    dumpError(err);
    debug(`${modulename}: will exit with code -4`);
    process.exitCode = -4;
  }
}

/**
 * Registers an event handler for SIGINT.
 * Event triggers if CTRL+C pressed.
 */
process.once('SIGINT', sigint);

/* create the server */
runApp(appLocals);

/* exports for unit test */
export const appVars: Perform.IServerIndex = {
  appLocals,
  sigint,
  uncaughtException,
  unhandledRejection,
};
