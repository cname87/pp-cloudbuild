/**
 * Handles http calls routed through the openapi handler as defined in the openapi.json file.
 * Handles calls to <api-prefix>/members/{mid}/sessions
 */

import { Request, Response, NextFunction } from 'express';
import { Context } from 'openapi-backend';
import { setupDebug } from '../utils/src/debugOutput';
import { setup } from './shared'

const { modulename, debug } = setupDebug(__filename);

/* types of body in request */
type bodyNoId = Perform.ISessionNoId;
type bodyWithId = Perform.ISession;
/* selects questionaires with text starting with the query 'text' parameter */
const filter = 'type';


export const addSession = (
  context: Context | undefined,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  debug(`${modulename}: running addSession`);

  const {
    body,
    sessionsHandlers,
    miscHandlers,
    dumpError,
  } = setup(context, filter, req, next)!;

  sessionsHandlers
    .addSession(req, body as bodyNoId)
    .then((payload) => {
      miscHandlers.writeJson(context, req, res, next, 201, payload);
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

  const {
    sid,
    sessionsHandlers,
    miscHandlers,
    dumpError,
  } = setup(context, filter, req, next)!;

  sessionsHandlers
    .getSession(req, sid)
    .then((payload) => {
      miscHandlers.writeJson(context, req, res, next, 200, payload);
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

  const {
    filterString,
    sessionsHandlers,
    miscHandlers,
    dumpError,
  } = setup(context, filter, req, next)!;

  /* call getSessions with 0 as the id params which will return all sessions from all members */
  sessionsHandlers
    .getSessions(req, 0, filterString)
    .then((payload) => {
      miscHandlers.writeJson(context, req, res, next, 200, payload);
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

  const {
    mid,
    filterString,
    sessionsHandlers,
    miscHandlers,
    dumpError,
  } = setup(context, filter, req, next)!;

  /* getting all sessions for a specific member */
  sessionsHandlers
    .getSessions(req, mid, filterString)
    .then((payload) => {
      miscHandlers.writeJson(context, req, res, next, 200, payload);
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

  const {
    body,
    sessionsHandlers,
    miscHandlers,
    dumpError,
  } = setup(context, filter, req, next)!;

  sessionsHandlers
    .updateSession(req, body as bodyWithId)
    .then((payload) => {
      miscHandlers.writeJson(context, req, res, next, 200, payload);
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

  const {
    sid,
    sessionsHandlers,
    miscHandlers,
    dumpError,
  } = setup(context, filter, req, next)!;;

  sessionsHandlers
    .deleteSession(req, sid)
    .then((number) => {
      const payload = { count: number };
      miscHandlers.writeJson(context, req, res, next, 200, payload);
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
