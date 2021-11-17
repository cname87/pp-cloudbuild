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
      getSummary: (
        context,
        request: Request,
        response: Response,
        nextFunction: NextFunction,
      ) =>
        appLocals.handlers.summaryApi.getSummary(
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

        if (!context!.validation!.errors) {
          /* openapi-backend types require this test */
          /* unexpected error if no context.validation.errors returned */
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
        return nextFunction(err);
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
 * This tests if the connection to the user members and sessions database collections have been created and, if not, creates them.  This results in members and sessions Mongoose models being created for the requesting user and stored in appLocals.models. Once the models exist they do not have to be recreated if that user makes another request.
 * @params req - the incoming API request.
 * @params next - next function.
 */

const createDbCollectionConnection = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  debug(`${modulename}: running createDbCollectionConnection`);

  /* check that the database is connected */
  const { dbConnection } = req.app.appLocals;
  if (
    !dbConnection ||
    dbConnection.readyState !== Perform.EDbReadyState.Connected
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
        process.env.DB_COLLECTION!.length,
      ) === `${process.env.DB_COLLECTION}`
    )
  ) {
    debug(`${modulename}: creating connection to the database collections`);
    appLocals.models.members = appLocals.createModelMembers(
      appLocals.database,
      `${process.env.DB_COLLECTION}_Member`,
      `${process.env.DB_COLLECTION}_members`,
    );
    appLocals.models.scores = appLocals.createModelScores(
      appLocals.database,
      `${process.env.DB_COLLECTION}_Score`,
      `${process.env.DB_COLLECTION}_scores`,
    );
    appLocals.models.sessions = appLocals.createModelSessions(
      appLocals.database,
      `${process.env.DB_COLLECTION}_Sessions`,
      `${process.env.DB_COLLECTION}_sessions`,
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

const authenticate = Router();
authenticate.use(
  (req: Request, res: Response, next: NextFunction) => {
    /* verify that the user is authorized for the configured database */
    req.app.appLocals.handlers.authenticateHandler(req, res, next);
  },
  /* catch authentication errors */
  (
    error: Record<string, unknown>,
    _req: Request,
    _res: Response,
    next: NextFunction,
  ) => {
    console.error(`${modulename}: Database authorization fail`);
    /* apply code 401 meaning there was a problem with credentials */
    error.statusCode = 401;
    error.dumped = false;
    next(error);
  },
);

const dbAuthorize = Router();
dbAuthorize.use(
  (req: Request, res: Response, next: NextFunction) => {
    /* verify that the user is authorized for the configured database */
    req.app.appLocals.handlers.dbAuthorizeHandler(req, res, next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    /* verify that the user is authorized for admin urls */
    req.app.appLocals.handlers.managerAuthorizeHandler(req, res, next);
  },
  /* catch authorization errors */
  (
    error: Record<string, unknown>,
    _req: Request,
    _res: Response,
    next: NextFunction,
  ) => {
    console.error(`${modulename}: dbAuthorize fail`);
    /* apply code 403 meaning there was a problem with authorization */
    error.statusCode = 403;
    error.dumped = false;
    next(error);
  },
);

const managerAuthorize = Router();
managerAuthorize.use(
  (req: Request, res: Response, next: NextFunction) => {
    /* verify that the user is authorized for admin urls */
    req.app.appLocals.handlers.managerAuthorizeHandler(req, res, next);
  },
  /* catch authorization errors */
  (
    error: Record<string, unknown>,
    _req: Request,
    _res: Response,
    next: NextFunction,
  ) => {
    console.error(`${modulename}: managerAuthorize fail`);
    /* apply code 403 meaning there was a problem with authorization */
    error.statusCode = 403;
    error.dumped = false;
    next(error);
  },
);

const memberAuthorize = Router();
memberAuthorize.use(
  '/members/:mid',
  (req: Request, res: Response, next: NextFunction) => {
    /* verify that the user is authorized for the configured database */
    req.app.appLocals.handlers.memberAuthorizeHandler(req, res, next);
  },
  /* catch authorization errors */
  (
    error: Record<string, unknown>,
    _req: Request,
    _res: Response,
    next: NextFunction,
  ) => {
    console.error(`${modulename}: memberAuthorize fail`);
    /* apply code 403 meaning there was a problem with authorization */
    error.statusCode = 403;
    error.dumped = false;
    next(error);
  },
);

router.use(
  '/',
  authenticate,
  dbAuthorize,
  managerAuthorize,
  memberAuthorize,
  /* create connection to the user database model / collection */
  createDbCollectionConnection,
  /* call a handler based on the path and the api spec */
  callApiHandler,
);

export { router as apiController };
