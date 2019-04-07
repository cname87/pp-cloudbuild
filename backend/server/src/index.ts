﻿/**
 * This application runs a http(s) server with a database backend.
 *
 * It creates an object with key items which it attaches to the express app application so it is accessible by all middleware.
 *
 * It attempts to start the database and then starts the server.
 *
 * It can start the server in the absence of a database connection
 * if the configuration file is so configured.
 *
 * It can be stopped via a SIGINT, or if started via a forever
 * monitoring service via a message from the forever process.
 *
 */

const modulename = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
export const debug = debugFunction(`PP_${modulename}`);
debug(`Starting ${modulename}`);

/* external dependencies */
import { strict } from 'assert';
import { EventEmitter } from 'events';
import express from 'express';

/* import configuration object */
import {
  config,
  Database,
  IAppLocals,
  IControllers,
  IErr,
  IExpressApp,
  IModels,
  processExtended,
  Server,
} from './configServer';

/* import secret configuration parameters */
import * as dotenv from 'dotenv';
import winston = require('winston');
dotenv.config({ path: config.ENV_FILE });

/*
 * Define aliases for config parameters.
 */

/* server initiation methods */
const { runServer, startServer } = config;
/* database creation function */
const { runDatabaseApp } = config;
/* handlers used by controllers */
const { miscHandlers, membersHandlers1 } = config;
/* errorHandler middleware */
const { errorHandlers } = config;
/* route controllers */
const { failController } = config;
/* database models */
const { createModelMembers, createModelTests, createModelUsers } = config;
/* Create the single instances of the general logger & dumpError utilities, and the server logger middleware.  These are passed via the appLocals object. Also, other modules can create new instances later without any parameters and they will receive the same instance. */
const Logger = config.Logger;
const logger = new Logger() as winston.Logger;
const dumpError = config.DumpError.getInstance(logger);
const { ServerLogger } = config;
const serverLogger = new ServerLogger(config);

/**
 * An applocals object is added to the express app object containing objects and variables needed across requests.
 */
const appLocals: IAppLocals = ({} as unknown) as IAppLocals;
appLocals.config = config;
/* generate the controllers object */
const controllers: IControllers = {};
// controllers.members = members;       XXXX fix
controllers.fail = failController;
appLocals.controllers = controllers;
/* appLocals.database filled during server startup */
/* appLocals.dbConnection filled during server startup */
appLocals.dumpError = dumpError;
appLocals.errorHandler = errorHandlers;
/* event emitter needed by Mocha before server up */
const event: EventEmitter = new EventEmitter();
appLocals.event = event;
appLocals.miscHandlers = miscHandlers;
appLocals.membersHandlers1 = membersHandlers1;
appLocals.logger = logger;
/* appLocals.models filled during server startup */
appLocals.serverLogger = serverLogger;

/* the express app used throughout */
/* add the appLocals object for access in middleware */
const app: IExpressApp = Object.assign(express(), { appLocals });

/**
 * Handles uncaught exceptions.
 * @param err Error passed in by error handler.
 */
async function uncaughtException(err: Error) {
  debug(modulename + ': running uncaughtException');

  /* note: a process.uncaughtException also logs the trace to console.error */
  logger.error(modulename + ': uncaught exception');
  dumpError(err);
  await closeAll();
  process.exit(-11);
}
/* capture all uncaught application exceptions (only once) */
process.once('uncaughtException', uncaughtException);
/* use process.thrownException instead of uncaughtException to throw
 * errors internally */
(process as processExtended).once('thrownException', uncaughtException);

/**
 * Handles unhandled rejection.
 * @param reason Reason passed in by error handler.
 */
async function unhandledRejection(reason: IErr) {
  debug(modulename + ': running unhandledRejection');

  logger.error(modulename + ': unhandled promise rejection');
  dumpError(reason);
  await closeAll();
  process.exit(-12);
}
/* capture unhandled promise rejection (only once) */
(process as processExtended).once('unhandledRejection', unhandledRejection);

/**
 * Initiate the server creation.
 */
async function runApp() {
  debug(modulename + ': running runApp');

  logger.info('\n*** STARTING THE APPLICATION ***\n');

  /* holds db state */
  const enum DBReadyState {
    Disconnected = 0,
    Connected = 1,
    Connecting = 2,
    Disconnecting = 3,
  }
  let isDbReady = DBReadyState.Disconnected;

  try {
    debug(modulename + ': calling the database');

    /* create a database connection */
    const database = await runDatabaseApp();
    appLocals.database = database;

    /* obtain the database connection object */
    const dbConnection = database.dbConnection;
    appLocals.dbConnection = dbConnection;

    /* set database ready state variable */
    isDbReady = appLocals.dbConnection.readyState;

    if (isDbReady === DBReadyState.Connected) {
      debug(modulename + ': database set up complete');

      /* generate the models object */
      const models: IModels = {};
      models.users = createModelUsers(database);
      models.tests = createModelTests(database);
      models.members = createModelMembers(database);
      appLocals.models = models;
    } else {
      logger.error(modulename + ': database failed to connect');
    }
  } catch (err) {
    /* log error but proceed */
    logger.error(modulename + ': database start up error - continuing');
    dumpError(err);
  }

  /* call the http server if db connected or not needed otherwise exit */
  if (isDbReady === DBReadyState.Connected || config.IS_NO_DB_OK) {
    debug(modulename + ': calling the http server');

    logger.info('\n*** STARTING SERVER ***\n');

    /* start the server */
    try {
      /* holds connected servers */
      const servers: Server[] = [];
      await startServer(
        app,
        servers, // filled with connected server on return
        config,
        logger,
        dumpError,
      );
      appLocals.servers = servers;

      /* set up an error handlers for the servers */
      for (const server of servers) {
        server.expressServer.on('error', async (err: Error) => {
          logger.error(modulename + ': Unexpected server error - exiting');
          dumpError(err);
          await closeAll(appLocals.servers, appLocals.database);
          debug(modulename + ': will exit with code -3');
          process.exitCode = -3;
        });
      }

      /* run the server functionality */
      await runServer(
        app,
        config,
        controllers,
        errorHandlers,
        miscHandlers,
        serverLogger,
      );

      debug(modulename + ': server up and running');

      /* raise an event that mocha can read */
      const arg = {
        message: 'Server running 0',
      };
      appLocals.event.emit('indexRunApp', arg);

      /* if started from forever signal that server is up */
      if (process.send) {
        process.send('Server is running');
      }

      logger.info('\n*** SERVER UP AND RUNNING ***\n');
    } catch (err) {
      logger.error(modulename + ': server start up error - exiting');
      dumpError(err);
      await closeAll(appLocals.servers, appLocals.database);
      debug(modulename + ': will exit with code -2');
      process.exitCode = -2;
    }
  } else {
    logger.error(modulename + ': no database connection - exiting');
    await closeAll(appLocals.servers, appLocals.database);
    debug(modulename + ': will exit with code -1');
    process.exitCode = -1;
  }
}

/**
 * Closes all server and database connections
 * @param servers Array of created servers.
 * @param database Created database instance.
 */
async function closeAll(
  servers: Server[] = appLocals.servers,
  database: Database = appLocals.database,
) {
  try {
    debug(modulename + ': closing connections...');

    if (servers && servers.length > 0) {
      for (const svr of servers) {
        await svr.stopServer();
        svr.expressServer.removeAllListeners();
      }
    }

    if (database) {
      await database.closeConnection(database.dbConnection);
    }

    process.removeListener('SIGINT', sigint);
    process.removeListener('uncaughtException', uncaughtException);
    process.removeListener('unhandledRejection', unhandledRejection);
    process.removeListener('thrownException', uncaughtException);
    process.removeListener('message', parentMessage);

    debug(modulename + ': all connections & listeners closed');

    return;
  } catch (err) {
    /* unexpected error - don't call uncaught/rejected */
    logger.error(modulename + ': closeAll error - exiting');
    dumpError(err);
    debug(modulename + ': will exit with code -4');
    process.exitCode = -4;
  }
}

/**
 * Shuts down the application gracefully.
 */
async function sigint() {
  debug(modulename + ': running sigint');

  await closeAll();

  debug(modulename + ': SIGINT - will exit normally with code 0');

  logger.info('\n*** CLOSING THE SERVER ON SIGINT REQUEST ***\n');

  /* raise an event that mocha can read */
  const arg = {
    message: 'Server exit 0',
    number: 0,
  };

  appLocals.event.emit('indexSigint', arg);
}

/**
 * Registers an event handler for SIGINT.
 * Event triggers if CTRL+C pressed
 */
process.on('SIGINT', sigint);

/**
 * Receives a message and shuts down the server gracefully.
 * @param message Message from the parent monitor application.
 */
interface IMessage {
  action: string;
  code: number;
}
async function parentMessage(message: IMessage) {
  debug(
    modulename +
      `: received '${message.action}' ` +
      'message from forever process',
  );
  strict.deepStrictEqual(
    message.action,
    'close',
    "The only supported message is 'close'",
  );
  await closeAll();
  debug(modulename + ': exiting child process');

  logger.info('\n*** CLOSING THE SERVER ON MONITOR REQUEST ***\n');

  /* a code is returned to tell forever that this exit should not be subject to a restart */
  process.exit(message.code);
}

/**
 * process.send is true if started by forever. The 'message' event
 * triggers if forever exits on a SIGINT i.e. CTRL+C pressed.
 */
if (process.send) {
  process.on('message', parentMessage);
}

/* create the server */
runApp();

/* Note: All exports are for mocha. */
export {
  appLocals,
  event,
  IAppLocals,
  sigint,
  uncaughtException,
  unhandledRejection,
};
