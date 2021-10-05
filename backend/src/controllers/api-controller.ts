/**
 * This controller handles requests for .../api-v1.
 * It is called by runServer and serves all api requests.
 */

import { Router, Request, NextFunction, Response } from 'express';
import OpenAPIBackend from 'openapi-backend';
import util from 'util';
import path from 'path';
import { setupDebug } from '../utils/src/debugOutput';

const { modulename, debug } = setupDebug(__filename);

const router = Router();

/* Initialize the openapi-backend middleware */
/* This takes a long time to run => run once only for performance - called during first-time server startup => a warm-up request is a good idea. */
let api: OpenAPIBackend;
export const initOpenApi = (appLocals: Perform.IAppLocals): void => {
  debug(`${modulename}: running initOpenApi`);
  /* route paths as per the api file */
  api = new OpenAPIBackend({
    definition: path.resolve(process.env.OPENAPI_FILE!),
    apiRoot: '/api-v1',
    strict: true,
    validate: true,
    ajvOpts: {
      validateFormats: false,
      verbose: true,
    },
    handlers: {
      getIsTestDatabase: (
        context,
        request: Request,
        response: Response,
        nextFunction: NextFunction,
      ) => {
        const result = {
          isTestDatabase:
            appLocals.dbConnection.db.databaseName ===
            process.env.DB_DATABASE_TEST,
        };
        appLocals.handlers.miscHandlers.writeJson(
          context,
          request,
          response,
          nextFunction,
          200,
          result,
        );
      },
      getMember: (
        context,
        request: Request,
        response: Response,
        nextFunction: NextFunction,
      ) =>
        appLocals.handlers.membersApi.getMember(
          context,
          request,
          response,
          nextFunction,
        ),
      getMembers: (
        context,
        request: Request,
        response: Response,
        nextFunction: NextFunction,
      ) =>
        appLocals.handlers.membersApi.getMembers(
          context,
          request,
          response,
          nextFunction,
        ),
      addMember: (
        context,
        request: Request,
        response: Response,
        nextFunction: NextFunction,
      ) =>
        appLocals.handlers.membersApi.addMember(
          context,
          request,
          response,
          nextFunction,
        ),
      deleteMember: (
        context,
        request: Request,
        response: Response,
        nextFunction: NextFunction,
      ) =>
        appLocals.handlers.membersApi.deleteMember(
          context,
          request,
          response,
          nextFunction,
        ),
      updateMember: (
        context,
        request: Request,
        response: Response,
        nextFunction: NextFunction,
      ) =>
        appLocals.handlers.membersApi.updateMember(
          context,
          request,
          response,
          nextFunction,
        ),
      getOrCreateScores: (
        context,
        request: Request,
        response: Response,
        nextFunction: NextFunction,
      ) => {
        return appLocals.handlers.scoresApi.getOrCreateScores(
          context,
          request,
          response,
          nextFunction,
        );
      },
      updateScores: (
        context,
        request: Request,
        response: Response,
        nextFunction: NextFunction,
      ) =>
        appLocals.handlers.scoresApi.updateScores(
          context,
          request,
          response,
          nextFunction,
        ),
      getOrCreateSessions: (
        context,
        request: Request,
        response: Response,
        nextFunction: NextFunction,
      ) => {
        return appLocals.handlers.sessionsApi.getOrCreateSessions(
          context,
          request,
          response,
          nextFunction,
        );
      },
      updateSessions: (
        context,
        request: Request,
        response: Response,
        nextFunction: NextFunction,
      ) =>
        appLocals.handlers.sessionsApi.updateSessions(
          context,
          request,
          response,
          nextFunction,
        ),
      validationFail: (
        context,
        _request: Request,
        _response: Response,
        nextFunction: NextFunction,
      ) => {
        debug(`${modulename}: running validationFail`);

        console.error(`${modulename}: API validation fail`);
        const err: Perform.IErr = {
          name: 'REQUEST_VALIDATION_FAIL',
          message: 'API validation fail',
          statusCode: 400,
          dumped: false,
        };

        if (!(context && context.validation && context.validation.errors)) {
          /* openapi-backend types require this test */
          /* unexpected error if context.validation.errors returned */
          err.message += ': unexpected openapi error';
          err.statusCode = 500;
          return nextFunction(err);
        }

        /* dump detail and then strip back message to send to the client */
        err.message = `API validation fail\n${util.inspect(
          context.validation.errors,
        )}`;
        appLocals.dumpError(err);
        err.message = 'API validation fail';
        nextFunction(err);
      },
      notFound: async (
        /* called if path not matched - needed or an exception thrown */
        _context,
        _request: Request,
        _response: Response,
        nextFunction: NextFunction,
      ) => {
        debug(`${modulename}: api handler running notFound`);

        /* let angular or error handler deal with not-founds */
        nextFunction();
      },
    },
  });
  api.init();
  debug(`${modulename}: openApi initialised`);
};

/* middleware functions below */

/**
 * Gets and stores the user (or throws an error).
 */
const findUser = (req: Request, res: Response, next: NextFunction) => {
  debug(`${modulename}: running findUser`);

  let user: Perform.User | undefined;

  if (req.auth) {
    user = req.app.appLocals.getUser(req.auth.sub);
  } else {
    const error = new Error();
    error.name = 'NoAuthentication';
    error.message = 'Unknown authentication error - no req.auth created';
    res.statusCode = 401;
    next(error);
  }

  if (user) {
    req.user = user;
  } else {
    const error = new Error();
    error.name = 'NoUser';
    error.message = 'No user matching authentication token was found';
    res.statusCode = 401;
    next(error);
  }

  next();
};

/**
 * This tests if the connection to the user members and sessions database collections have been created and, if not, creates them.  This results in members and sessions Mongoose models being created for the requesting user and stored in appLocals.models. Once the models exist they do not have to be recreated if that user makes another request.
 * @params req - the incoming API request.
 * @params next - next function.
 */

const createDbCollectionConnection = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  debug(`${modulename}: running createCollectionConnection`);

  /* check that the database is connected */
  const { dbConnection } = req.app.appLocals;
  if (
    !dbConnection ||
    dbConnection.readyState !== Perform.DbReadyState.Connected
  ) {
    console.error(`${modulename}: Database not connected`);
    const errDb: Perform.IErr = {
      name: 'DATABASE_ACCESS',
      message: 'The database service is unavailable',
      statusCode: 503,
      dumped: false,
    };
    next(errDb);
  }

  /* connect to user collections, but only if not already done */
  const { appLocals } = req.app;
  if (
    /* initial call will not have modelName */
    !(
      appLocals.models.members &&
      appLocals.models.members.modelName &&
      appLocals.models.members.modelName.substring(
        0,
        req.user!.dbCollection.length,
      ) === `${req.user!.dbCollection}`
    )
  ) {
    debug(`${modulename}: creating connection to the user collections`);
    appLocals.models.members = appLocals.createModelMembers(
      appLocals.database,
      `${req.user!.dbCollection}_Member`,
      `${req.user!.dbCollection}_members`,
    );
    appLocals.models.scores = appLocals.createModelScores(
      appLocals.database,
      `${req.user!.dbCollection}_Score`,
      `${req.user!.dbCollection}_scores`,
    );
    appLocals.models.sessions = appLocals.createModelSessions(
      appLocals.database,
      `${req.user!.dbCollection}_Sessions`,
      `${req.user!.dbCollection}_sessions`,
    );
  }
  next();
};

/**
 * Calls the api handler function based on the url path.
 */
const callApiHandler = (req: Request, res: Response, next: NextFunction) => {
  debug(`${modulename}: running callApiHandler`);

  /* initialise OpenApi if not already done */
  if (!api) {
    debug(`${modulename}: initialising OpenApi`);
    initOpenApi(req.app.appLocals);
  }

  api.handleRequest(
    /* the first parameter is passed to openapi-backend middleware - the others are passed to the called handler function */
    {
      method: req.method,
      /* path must include the api root passed when initializing openAPIBackend.
      Requests are routed based on the api root (baseUrl) so req.path does not include the baseUrl.*/
      path: req.baseUrl + req.path,
      body: req.body,
      query: req.query as { [key: string]: string | string[] },
      headers: req.headers as { [key: string]: string | string[] },
    },
    req,
    res,
    next,
  );
};

export const checkError = (
  error: Record<string, unknown>,
  _req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  console.error(`${modulename}: Authorization fail`);
  /* apply code 401 meaning there was a problem with credentials */
  error.statusCode = 401;
  error.dumped = false;
  next(error);
};

const authenticate = Router();
authenticate.use(
  (req: Request, res: Response, next: NextFunction) => {
    /* verify that the user is authorized for the configured database */
    req.app.appLocals.handlers.authenticateHandler(req, res, next);
  },
  /* catch authentication errors */
  checkError,
);

const authorize = Router();
authorize.use(
  (req: Request, res: Response, next: NextFunction) => {
    /* verify that the user is authorized for the configured database */
    req.app.appLocals.handlers.authorizeHandler(req, res, next);
  },
  /* catch authorization errors */
  checkError,
);

router.use(
  '/',
  authenticate,
  authorize,
  /* get the user */
  findUser,
  /* create connection to the user database model / collection */
  createDbCollectionConnection,
  /* call a handler based on the path and the api spec */
  callApiHandler,
);

export { router as apiController };
