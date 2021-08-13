/**
 * This module runs a http(s) server.
 * The base controllers, handlers and an object containing the database
 * connection, servers and express app are passed in.
 * It loads common express middleware and responds to
 * incoming web requests by calling the appropriate routing functions.
 * - It calls some test functions when configured appropriately.
 * - It calls an api handler for urls matching the api base path.
 * - It loads the Angular static files from a configured directory.
 * - It loads error handlers to handle errors.
 */

/* external dependencies */
import compression from 'compression';
import express, { Application } from 'express';
import favicon from 'serve-favicon';
import util from 'util';
import path from 'path';
import nocache from 'nocache';

import { setupDebug } from '../utils/src/debugOutput';
const { modulename, debug } = setupDebug(__filename);

/**
 * Sets up express middleware and responds to incoming requests.  See the module description.
 * @param app The express app object
 * @returns Void.
 */

async function runServer(app: Application): Promise<void> {
  debug(`${modulename}: running runServer`);

  const instanceStarted = new Date().toUTCString();

  /* Readiness & liveness probe */
  app.get(/\/ready|\/health/, (_req, res, _next) => {
    /* If the database ping returns an error or exceeds the timeout configured in the deployment.yaml file the check fails */

    debug(`Liveness: Instance started (UTC): ${instanceStarted}`);

    const { database } = app.appLocals;

    debug(`${modulename}: calling database ping`);

    const ping = database.dbConnection.db.command({ ping: 1 });
    ping
      .then((result) => {
        const pingReturn = result.ok === 1 ? 'ok' : 'an unexpected value';
        debug(`${modulename}: database ping returned \'${pingReturn}\'`);
        res.status(200).json({
          started: instanceStarted,
        });
      })
      .catch((err) => {
        console.error(`${modulename}: database ping returned an error`);
        res.status(500).json({
          error: err,
        });
      });
  });

  /* disable etag validation as costly and do not want to cache */
  app.set('etag', false);
  /* /Foo different to /foo */
  app.set('case sensitive routing', true);
  /* /admin the same as /admin/ */
  app.set('strict routing', false);
  /* compress payloads above 1k before sending */
  app.use(compression({ threshold: 1000 }));

  /* parse incoming request body object as a JSON object */
  app.use(express.json());

  /* disable all caching */
  app.use(nocache());

  /* log basic information from the request */
  if (debug.enabled) {
    app.use((req, _res, next) => {
      debug(`${modulename}: *** Request received ***`);
      debug(`${modulename}: req.url: ${req.url}`);
      debug(`${modulename}: req.baseUrl: ${req.baseUrl}`);
      debug(`${modulename}: req.path: ${req.path}`);
      debug(`${modulename}: req.originalUrl: ${req.originalUrl}`);
      debug(`${modulename}: req.method: ${req.method}`);
      debug(`${modulename}: req.query: ${util.inspect(req.query)}`);
      debug(`${modulename}: req.params: ${util.inspect(req.params)}`);
      debug(`${modulename}: req.headers: ${util.inspect(req.headers)}`);
      debug(`${modulename}: req.body: ${util.inspect(req.body)}`);
      debug(
        `${modulename}: req.signedCookies: ${util.inspect(req.signedCookies)}`,
      );
      next();
    });
  }

  /* serve favicon */
  app.use(favicon(path.resolve(process.env.FAVICON!)));

  /* test functionality only */
  if (process.env.TEST_PATHS === 'true') {
    /* serve server test files (e.g. api-loadMocha.html) from a static server mounted on /testServer */
    const staticTestOptions = {
      redirect: false,
    };
    app.use(
      '/testServer',
      express.static(
        path.resolve(process.env.STATIC_TEST_PATH!),
        staticTestOptions,
      ),
    );
    /* serve node_modules files from a static server mounted on /node_modules so mocha etc can be loaded by the browser for client-fired tests */
    app.use(
      '/node_modules',
      express.static(
        path.resolve(process.env.NODE_MODULES_PATH!),
        staticTestOptions,
      ),
    );

    /* respond to a request asking whether test database is in use */
    app.use('/testServer/isTestDatabase', (_req, res, _next) => {
      debug(`${modulename}: calling isTestDatabase`);
      const result = {
        isTestDatabase:
          app.appLocals.dbConnection.db.databaseName ===
          process.env.DB_DATABASE_TEST,
      };
      res.status(200).json(result);
    });

    /* use fail controller to test errorhandling */
    app.use('/testServer/fail', (req, res, next) => {
      debug(`${modulename}: calling the fail controller`);
      app.appLocals.controllers.fail(req, res, next);
    });

    /* respond to posted raiseEvents from test pages */
    app.post('/raiseEvent', (req, res, next) => {
      debug(`${modulename}: calling raiseEvent handler`);
      app.appLocals.handlers.miscHandlers.raiseEvent(req, res, next);
    });
  }

  /* calls a api handler */
  app.use(
    /* use for api paths only */
    process.env.API_BASE_PATH!,
    (req, res, next) => {
      debug(`${modulename}: calling the api controller`);
      app.appLocals.controllers.api(req, res, next);
    },
  );

  /* respond to '/' with some diagnostic information */
  app.get('/', (_req, res, _next) => {
    const nodeEnvironment = process.env.NODE_ENV;
    const isDbLocal = process.env.DB_IS_LOCAL === 'true';
    const isDbProduction =
      process.env.NODE_ENV === 'production' &&
      process.env.DB_MODE === 'production';
    const isTestPaths = process.env.TEST_PATHS === 'true';
    const resText = `You have reached the project-perform backend server<br/>
    Environment: ${nodeEnvironment}<br/>
    Local database server in use: ${isDbLocal}<br/>
    Production database in use: ${isDbProduction}<br/>
    Test paths enabled: ${isTestPaths}`;
    res.status(200).send(resText);
  });

  /* handle all errors passed down */
  app.use(app.appLocals.handlers.errorHandlers.notFound);
  app.use(app.appLocals.handlers.errorHandlers.assignCode);
  app.use(app.appLocals.handlers.errorHandlers.logError);
  app.use(app.appLocals.handlers.errorHandlers.sendErrorResponse);
  app.use(app.appLocals.handlers.errorHandlers.throwError);
}

export { runServer };
