/**
 * Handles http calls routed through the openapi handler as defined in the openapi.json file.
 * Handles calls to <api-prefix>/member{mid}/activity and <api-prefix>/member{mid}/activity/{aid}
 */

import { Request, Response, NextFunction } from 'express';
import { Context } from 'openapi-backend';
import { setupDebug } from '../utils/src/debugOutput';
import { setup } from './shared'

const { modulename, debug } = setupDebug(__filename);

/* types of body in request */
type bodyNoId = Perform.IActivityNoId;
type bodyWithId = Perform.IActivity;
/* there is no query parameter on activity urls, but a dummy value is needed for the setup calls */
const filter = '';

export const getActivities = (
  context: Context | undefined,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  debug(`${modulename}: running getActivities`);

  const {
    mid,
    activityHandlers,
    miscHandlers,
    dumpError,
  } = setup(context, filter, req, next)!;

  console.log(`mod: ${mid}`);

  activityHandlers
    .getActivities(req, mid)
    .then((payload: Perform.IActivity[]) => {
      miscHandlers.writeJson(context, req, res, next, 200, payload);
    })
    .catch((err) => {
      console.error(`${modulename}: handler getActivities returned error`);
      dumpError(err);
      next(err);
    });
};

export const addActivity = (
  context: Context | undefined,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  debug(`${modulename}: running addActivity`);

  const {
    body,
    activityHandlers,
    miscHandlers,
    dumpError,
  } = setup(context, filter, req, next)!;

  activityHandlers
    .addActivity(req, body as bodyNoId)
    .then((payload: Perform.IActivity) => {
      miscHandlers.writeJson(context, req, res, next, 201, payload);
    })
    .catch((err: any) => {
     console.error(`${modulename}: handler addActivity returned error`);
      dumpError(err);
      next(err);
    });
};

export const getActivity = (
  context: Context | undefined,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  debug(`${modulename}: running getActivity`);

  const {
    mid,
    activityHandlers,
    miscHandlers,
    dumpError,
  } = setup(context, filter, req, next)!;

  activityHandlers
    .getActivity(req, mid)
    .then((payload: Perform.IActivity) => {
      miscHandlers.writeJson(context, req, res, next, 200, payload);
    })
    .catch((err: any) => {
      console.error(`${modulename}: handler getActivity returned error`);
      dumpError(err);
      next(err);
    });
};

export const updateActivity = (
  context: Context | undefined,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  debug(`${modulename}: running updateActivity`);

  const {
    body,
    activityHandlers,
    miscHandlers,
    dumpError,
  } = setup(context, filter, req, next)!;

  activityHandlers
    .updateActivity(req, body as bodyWithId)
    .then((payload: Perform.IActivity) => {
      miscHandlers.writeJson(context, req, res, next, 200, payload);
    })
    .catch((err: any) => {
     console.error(`${modulename}: handler updateActivity returned error`);
      dumpError(err);
      next(err);
    });
};

export const deleteActivity = (
  context: Context | undefined,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  debug(`${modulename}: running deleteActivity`);

  const {
    aid,
    activityHandlers,
    miscHandlers,
    dumpError,
  } = setup(context, filter, req, next)!;

  activityHandlers
    .deleteActivity(req, aid)
    .then((number: number) => {
      const payload = { count: number };
      miscHandlers.writeJson(context, req, res, next, 200, payload);
    })
    .catch((err: any) => {
     console.error(`${modulename}: handler deleteActivity returned error`);
      dumpError(err);
      next(err);
    });
};

export const activityApi = {
  getActivities,
  addActivity,
  getActivity,
  deleteActivity,
  updateActivity,
};
