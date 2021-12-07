/**
 * Handles http calls routed through the openapi handler as defined in the openapi.json file.
 * Handles calls to <api-prefix>/members, <api-prefix>/member/ and <api-prefix>/member/{mid}
 */

import { Request, Response, NextFunction } from 'express';
import { Context } from 'openapi-backend';
import { setupDebug } from '../utils/src/debugOutput';
import { setup } from './shared'

const { modulename, debug } = setupDebug(__filename);

/* types of body in request */
type bodyNoId = Perform.IMemberNoId;
type bodyWithId = Perform.IMember;
/* name of query filter parameter */
const filter = 'name';

export const addMember = (
  context: Context | undefined,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  debug(`${modulename}: running addMember`);

  const {
    body,
    membersHandlers,
    miscHandlers,
    dumpError,
  } = setup(context, filter, req, next)!;

  membersHandlers
    .addMember(req, body as bodyNoId)
    .then((payload: Perform.IMember) => {
      miscHandlers.writeJson(context, req, res, next, 201, payload);
    })
    .catch((err) => {
     console.error(`${modulename}: handler addMember returned error`);
      dumpError(err);
      next(err);
    });
};

export const getMember = (
  context: Context | undefined,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  debug(`${modulename}: running getMember`);

  const {
    mid,
    membersHandlers,
    miscHandlers,
    dumpError,
  } = setup(context, filter, req, next)!;

  membersHandlers
    .getMember(req, mid)
    .then((payload: Perform.IMember) => {
      miscHandlers.writeJson(context, req, res, next, 200, payload);
    })
    .catch((err) => {
     console.error(`${modulename}: handler getMember returned error`);
      dumpError(err);
      next(err);
    });
};

export const getMembers = (
  context: Context | undefined,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  debug(`${modulename}: running getMembers`);

  const {
    queryString,
    membersHandlers,
    miscHandlers,
    dumpError,
  } = setup(context, filter, req, next)!;

  membersHandlers
    .getMembers(req, queryString)
    .then((payload: Perform.IMember[]) => {
      miscHandlers.writeJson(context, req, res, next, 200, payload);
    })
    .catch((err) => {
     console.error(`${modulename}: handler getMembers returned error`);
      dumpError(err);
      next(err);
    });
};

export const updateMember = (
  context: Context | undefined,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  debug(`${modulename}: running updateMember`);

  const {
    body,
    membersHandlers,
    miscHandlers,
    dumpError,
  } = setup(context, filter, req, next)!;

  membersHandlers
    .updateMember(req, body as bodyWithId)
    .then((payload: Perform.IMember) => {
      miscHandlers.writeJson(context, req, res, next, 200, payload);
    })
    .catch((err) => {
     console.error(`${modulename}: handler updateMember returned error`);
      dumpError(err);
      next(err);
    });
};

export const deleteMember = (
  context: Context | undefined,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  debug(`${modulename}: running deleteMember`);

  const {
    mid,
    membersHandlers,
    miscHandlers,
    dumpError,
  } = setup(context, filter, req, next)!;

  membersHandlers

    .deleteMember(req, mid)
    .then((number: number) => {
      const payload = { count: number };
      miscHandlers.writeJson(context, req, res, next, 200, payload);
    })
    .catch((err) => {
     console.error(`${modulename}: handler deleteMember returned error`);
      dumpError(err);
      next(err);
    });
};

export const membersApi = {
  getMember,
  getMembers,
  addMember,
  deleteMember,
  updateMember,
};
