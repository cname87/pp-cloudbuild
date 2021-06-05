/**
 * Handles http calls routed through the openapi handler as defined in the openapi.json file.
 * Handles calls to <api-prefix>/members/{id}/sessions
 */

/* import external dependencies */
import { Request, Response, NextFunction } from 'express';
import { Context } from 'openapi-backend';
import { setupDebug } from '../utils/src/debugOutput';

const { modulename, debug } = setupDebug(__filename);

const contextError = (
  req: Request,
  next: NextFunction) => {
  const err: Perform.IErr = {
    name: 'UNEXPECTED_FAIL',
    message: 'context not supplied',
    statusCode: 500,
    dumped: false,
  };
  req.app.appLocals.dumpError(err);
  return next(err);
}

export const addSession = (
  context: Context | undefined,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  debug(`${modulename}: running addSession`);

  if (!(context?.request?.body)) {
    return contextError(req, next);
  }

  /* the body contains a session to be added */
  const sessionNoId = context.request.body as Perform.ISessionNoId;

  const { sessionsHandlers } = req.app.appLocals.handlers;
  const handles = req.app.appLocals.handlers.miscHandlers;
  const { dumpError } = req.app.appLocals;

  sessionsHandlers
    .addSession(req, sessionNoId)
    .then((payload) => {
      handles.writeJson(context, req, res, next, 201, payload);
    })
    .catch((err) => {
     console.error(`${modulename}: handler addSession returned error`);
      dumpError(err);
      next(err);
    });
};

export const getSession = (
  context: Context | undefined,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  debug(`${modulename}: running getSession`);

  if (!(context?.request?.body)) {
    return contextError(req, next);
  }

  /* the uri contains the member and session ids */
  const sid = Number.parseInt(context.request.params.sid as string, 10);

  const { sessionsHandlers } = req.app.appLocals.handlers;
  const handles = req.app.appLocals.handlers.miscHandlers;
  const { dumpError } = req.app.appLocals;

  sessionsHandlers
    .getSession(req, sid)
    .then((payload) => {
      handles.writeJson(context, req, res, next, 200, payload);
    })
    .catch((err) => {
     console.error(`${modulename}: handler getSession returned error`);
      dumpError(err);
      next(err);
    });
};

export const getAllSessions = (
  context: Context | undefined,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  debug(`${modulename}: running getAllSessions`);

  if (!(context?.request?.body)) {
    return contextError(req, next);
  }

  const matchString = context.request.query.type as string;

  const { sessionsHandlers } = req.app.appLocals.handlers;
  const handles = req.app.appLocals.handlers.miscHandlers;
  const { dumpError } = req.app.appLocals;

  /* call getSessions with 0 as the id params which will return all sessions from all members */
  sessionsHandlers
    .getSessions(req, 0, matchString)
    .then((payload) => {
      handles.writeJson(context, req, res, next, 200, payload);
    })
    .catch((err) => {
     console.error(`${modulename}: handler getAllSessions returned error`);
      dumpError(err);
      next(err);
    });
};

export const getSessions = (
  context: Context | undefined,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  debug(`${modulename}: running getSessions`);

  if (!(context?.request?.body)) {
    contextError(req, next);
  }

  const matchString = context?.request.query.type as string;
  const memberId = Number.parseInt(context?.request.params.id as string, 10);

  const { sessionsHandlers } = req.app.appLocals.handlers;
  const handles = req.app.appLocals.handlers.miscHandlers;
  const { dumpError } = req.app.appLocals;

  /* getting all sessions for a specific member */
  sessionsHandlers
    .getSessions(req, memberId, matchString)
    .then((payload) => {
      handles.writeJson(context, req, res, next, 200, payload);
    })
    .catch((err) => {
     console.error(`${modulename}: handler getSessions returned error`);
      dumpError(err);
      next(err);
    });
};

export const updateSession = (
  context: Context | undefined,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  debug(`${modulename}: running updateSession`);

  if (!(context?.request?.body)) {
    return contextError(req, next);
  }

  /* the body contains a session to be updated */
  const session = context.request.body as Perform.ISession;
  const { sessionsHandlers } = req.app.appLocals.handlers;
  const handles = req.app.appLocals.handlers.miscHandlers;
  const { dumpError } = req.app.appLocals;

  sessionsHandlers
    .updateSession(req, session)
    .then((payload) => {
      handles.writeJson(context, req, res, next, 200, payload);
    })
    .catch((err) => {
     console.error(`${modulename}: handler updateSession returned error`);
      dumpError(err);
      next(err);
    });
};

export const deleteSession = (
  context: Context | undefined,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  debug(`${modulename}: running deleteSession`);

  if (!(context?.request?.body)) {
    return contextError(req, next);
  }

  /* the uri contains the session id */
  const id = Number.parseInt(context.request.params.sid as string, 10);

  const { sessionsHandlers } = req.app.appLocals.handlers;
  const handles = req.app.appLocals.handlers.miscHandlers;
  const { dumpError } = req.app.appLocals;

  sessionsHandlers
    .deleteSession(req, id)
    .then((number) => {
      const payload = { count: number };
      handles.writeJson(context, req, res, next, 200, payload);
    })
    .catch((err) => {
     console.error(`${modulename}: handler deleteSession returned error`);
      dumpError(err);
      next(err);
    });
};

export const sessionsApi = {
  getSession,
  getAllSessions,
  getSessions,
  addSession,
  deleteSession,
  updateSession,
};
