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

  /* Confirm the format of the supplied date is of format 'yyyy-mm-ddT00:00:00.000Z' */
  /* This is the format set by a client-side datepicker parser function i.e. zero hours UTC, and you must save to the database with this format so only one database item is created for each day */
  const dateRegex = new RegExp(/\d{4}-[01]\d-[0-3]\dT00:00:00.000Z/);
  if (!dateRegex.test(body.date)) {
    throw new Error('Invalid date format for scores table object');
  }

  /* convert incoming date string to a Date object for all internal manipulation, including sending to MongoDB */
  const date = new Date(body.date);

  scoresHandlers
    .getOrCreateScores(req, mid, date)
    .then((payload: Perform.IScores) => {
      /* stringify date for sending to frontend */
      payload.date = (payload.date as Date).toISOString();
      miscHandlers.writeJson(context, req, res, next, 201, payload);
    })
    .catch((err: any) => {
     console.error(`${modulename}: getOrCreateScores returned error`);
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
      /* stringify date for sending to frontend */
      payload.date = (payload.date as Date).toISOString();
      miscHandlers.writeJson(context, req, res, next, 200, payload);
    })
    .catch((err: any) => {
     console.error(`${modulename}: updateScores returned error`);
      dumpError(err);
      next(err);
    });
};

const getScores = (
  context: Context | undefined,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  debug(`${modulename}: running getScores`);

  const {
    scoresHandlers,
    miscHandlers,
    dumpError,
  } = setup(context, filter, req, next)!;

  const date = new Date();

  scoresHandlers
    .getScores(req, date)
    .then((payload: Perform.IScores[]) => {
      miscHandlers.writeJson(context, req, res, next, 200, payload);
    })
    .catch((err: any) => {
      console.error(`${modulename}: getScores returned error`);
      dumpError(err);
      next(err);
    });
};


export const scoresApi = {
  getOrCreateScores,
  updateScores,
  getScores,
};
