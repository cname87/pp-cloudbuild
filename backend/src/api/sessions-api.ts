/**
 * Handles http calls routed through the openapi handler as defined in the openapi.json file and api-controllers.ts.
 * Handles calls to <api-prefix>/members/{mid}/sessions and <api-prefix>/sessions
 */

import { Request, Response, NextFunction } from 'express';
import { Context } from 'openapi-backend';
import { setupDebug } from '../utils/src/debugOutput';
import { setup } from './shared'

const { modulename, debug } = setupDebug(__filename);

/* the name of query parmeter in the url */
const filter = 'date';


const getOrCreateSessions = (
  context: Context | undefined,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  debug(`${modulename}: running getOrCreateSessions`);

  const {
    mid,
    body,
    sessionsHandlers,
    miscHandlers,
    dumpError,
  } = setup(context, filter, req, next)!;

  /* the format of the date property is an ISO date string */
  const date: string = body.date;

  /* confirm the format is of format 'yyyy-mm-ddT00:00:00.000Z' */
  /* this is the format set by the client-side datepicker parser i.e. zero hours UTC, and you must save to the database with this format so only one database item is created for each day */
  const dateRegex = new RegExp(/\d{4}-[01]\d-[0-3]\dT00:00:00.000Z/);
  if (!dateRegex.test(date)) {
    throw new Error('Invalid date format for sessions table object');
  }

  sessionsHandlers
    .getOrCreateSessions(req, mid, date)
    .then((payload: Perform.ISessions) => {
      miscHandlers.writeJson(context, req, res, next, 201, payload);
    })
    .catch((err: any) => {
     console.error(`${modulename}: handler getOrCreateSessions returned error`);
      dumpError(err);
      next(err);
    });
};

const updateSessions = (
  context: Context | undefined,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  debug(`${modulename}: running updateSessions`);

  const {
    body,
    sessionsHandlers,
    miscHandlers,
    dumpError,
  } = setup(context, filter, req, next)!;

  sessionsHandlers
    .updateSessions(req, body as Perform.ISessions)
    .then((payload: Perform.ISessions) => {
      miscHandlers.writeJson(context, req, res, next, 200, payload);
    })
    .catch((err: any) => {
     console.error(`${modulename}: handler updateSessions returned error`);
      dumpError(err);
      next(err);
    });
};

export const sessionsApi = {
  getOrCreateSessions,
  updateSessions,
};
