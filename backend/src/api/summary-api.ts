/**
 * Handles http calls routed through the openapi handler as defined in the openapi.json file and api-controllers.ts.
 * Handles calls to <api-prefix>/members/{mid}/summary
 */

import { Request, Response, NextFunction } from 'express';
import { Context } from 'openapi-backend';
import { setupDebug } from '../utils/src/debugOutput';
import { setup } from './shared'

const { modulename, debug } = setupDebug(__filename);

/* the name of query parmeter in the url */
const filter = 'weeks';


const getSummary = (
  context: Context | undefined,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  debug(`${modulename}: running getSummary`);

  const {
    mid,
    queryString,
    summaryHandlers,
    miscHandlers,
    dumpError,
  } = setup(context, filter, req, next)!;

  const weeksRequested = +queryString;

  summaryHandlers
    .getSummary(req, mid, weeksRequested)
    .then((payload: Array<Perform.TSummary>) => {

      miscHandlers.writeJson(context, req, res, next, 200, payload);
    })
    .catch((err: any) => {
     console.error(`${modulename}: getSummary returned error`);
      dumpError(err);
      next(err);
    });
};


export const summaryApi = {
  getSummary,
};
