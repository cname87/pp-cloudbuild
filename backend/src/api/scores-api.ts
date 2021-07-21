/**
 * Handles http calls routed through the openapi handler as defined in the openapi.json file and api-controllers.ts.
 * Handles calls to <api-prefix>/members/{mid}/scores and <api-prefix>/scores
 */

import { Request, Response, NextFunction } from 'express';
import { Context } from 'openapi-backend';
import { setupDebug } from '../utils/src/debugOutput';
import { setup } from './shared'

const { modulename, debug } = setupDebug(__filename);

/* the name of query parmeter in the url */
const filter = 'date';


const getOrCreateScores = (
  context: Context | undefined,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  debug(`${modulename}: running getOrCreateScores`);

  const {
    mid,
    body,
    scoresHandlers,
    miscHandlers,
    dumpError,
  } = setup(context, filter, req, next)!;

  /* the format of the date property is an ISO date string */
  const date: string = body.date;

  /* confirm the format is of format 'yyyy-mm-ddT00:00:00.000Z' */
  /* this is the format set by the client-side datepicker parser i.e. zero hours UTC, and you must save to the database with this format so only one database item is created for each day */
  const dateRegex = new RegExp(/\d{4}-[01]\d-[0-3]\dT00:00:00.000Z/);
  if (!dateRegex.test(date)) {
    throw new Error('Invalid date format for scores table object');
  }

  scoresHandlers
    .getOrCreateScores(req, mid, date)
    .then((payload: Perform.IScores) => {
      miscHandlers.writeJson(context, req, res, next, 201, payload);
    })
    .catch((err: any) => {
     console.error(`${modulename}: handler getOrCreateScores returned error`);
      dumpError(err);
      next(err);
    });
};

const updateScores = (
  context: Context | undefined,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  debug(`${modulename}: running updateScores`);

  const {
    body,
    scoresHandlers,
    miscHandlers,
    dumpError,
  } = setup(context, filter, req, next)!;

  scoresHandlers
    .updateScores(req, body as Perform.IScores)
    .then((payload: Perform.IScores) => {
      miscHandlers.writeJson(context, req, res, next, 200, payload);
    })
    .catch((err: any) => {
     console.error(`${modulename}: handler updateScores returned error`);
      dumpError(err);
      next(err);
    });
};

export const scoresApi = {
  getOrCreateScores,
  updateScores,
};
