/* all shared functions here */

import { Request, NextFunction } from 'express';
import { Context } from 'openapi-backend';

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


const decodeQueryParam = (p: string): string => {
  return decodeURIComponent(p.replace(/\+/g, ' '));
}
export const setup = (
  context: Context | undefined,
  queryParameter: string,
  req: Request,
  next: NextFunction
) => {
  if (!(context?.request?.body)) {
    return contextError(req, next);
  }
  /* the uri may contain the member id */
  const mid = Number.parseInt(context.request.params.mid as string, 10);
  /* the uri may contain the questionaire id */
  const qid = Number.parseInt(context.request.params.qid as string, 10);
  /* the uri may contain the session id */
  const sid = Number.parseInt(context.request.params.sid as string, 10);
  /* gets the named query parameter  */
  let queryString = context?.request.query[queryParameter] ? context?.request.query[queryParameter] as string : '';
  queryString = decodeQueryParam(queryString);
  /* the body may contain an element to be added or updated */
  const body = context.request.body;
  const { membersHandlers, sessionsHandlers, questionairesHandlers, scoresHandlers, sessions2Handlers, miscHandlers } = req.app.appLocals.handlers;
  const { dumpError } = req.app.appLocals;
  return {
    mid,
    qid,
    sid,
    queryString,
    body,
    membersHandlers,
    sessionsHandlers,
    questionairesHandlers,
    scoresHandlers,
    sessions2Handlers,
    miscHandlers,
    dumpError,
  }
}

