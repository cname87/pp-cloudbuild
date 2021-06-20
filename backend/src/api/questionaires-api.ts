/**
 * Handles http calls routed through the openapi handler as defined in the openapi.json file.
 * Handles calls to <api-prefix>/members/{mid}/questionaires
 */

import { Request, Response, NextFunction } from 'express';
import { Context } from 'openapi-backend';
import { setupDebug } from '../utils/src/debugOutput';
import { setup } from './shared'

const { modulename, debug } = setupDebug(__filename);

/* types of body in request */
type bodyNoId = Perform.IQuestionaireNoId;
type bodyWithId = Perform.IQuestionaire;
/* selects questionaires with text starting with the query 'text' parameter */
const filter = 'text';

export const addQuestionaire = (
  context: Context | undefined,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  debug(`${modulename}: running addQuestionaire`);

  const {
    body,
    questionairesHandlers,
    miscHandlers,
    dumpError,
  } = setup(context, filter, req, next)!;

  questionairesHandlers
    .addQuestionaire(req, body as bodyNoId)
    .then((payload) => {
      miscHandlers.writeJson(context, req, res, next, 201, payload);
    })
    .catch((err) => {
     console.error(`${modulename}: handler addQuestionaire returned error`);
      dumpError(err);
      next(err);
    });
};

export const getQuestionaire = (
  context: Context | undefined,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  debug(`${modulename}: running getQuestionaire`);

  const {
    qid,
    questionairesHandlers,
    miscHandlers,
    dumpError,
  } = setup(context, filter, req, next)!;

  questionairesHandlers
    .getQuestionaire(req, qid)
    .then((payload) => {
      miscHandlers.writeJson(context, req, res, next, 200, payload);
    })
    .catch((err) => {
     console.error(`${modulename}: handler getQuestionaire returned error`);
      dumpError(err);
      next(err);
    });
};

export const getAllQuestionaires = (
  context: Context | undefined,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  debug(`${modulename}: running getAllQuestionaires`);

  const {
    filterString,
    questionairesHandlers,
    miscHandlers,
    dumpError,
  } = setup(context, filter, req, next)!;

  /* call getQuestionaires with 0 as the id parameter will return all questionaires from all members */
  questionairesHandlers
    .getQuestionaires(req, 0, filterString)
    .then((payload) => {
      miscHandlers.writeJson(context, req, res, next, 200, payload);
    })
    .catch((err) => {
     console.error(`${modulename}: handler getAllQuestionaires returned error`);
      dumpError(err);
      next(err);
    });
};

/**
 * Gets all questionaires for a specific member.
 * The questionaires are filtered by the request query 'text' parameter so only questionaires with comments starting with 'text' are returned.
 *
 * @param context Context suppied by Openapi controller.
 * @param req The Request being handled.
 * @param res The response to be sent.
 * @param next The Express next function.
 */
export const getQuestionaires = (
  context: Context | undefined,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  debug(`${modulename}: running getQuestionaires`);

  const {
    mid,
    filterString,
    questionairesHandlers,
    miscHandlers,
    dumpError,
  } = setup(context, filter, req, next)!;

  questionairesHandlers
    .getQuestionaires(req, mid, filterString)
    .then((payload) => {
      miscHandlers.writeJson(context, req, res, next, 200, payload);
    })
    .catch((err) => {
     console.error(`${modulename}: handler getQuestionaires returned error`);
      dumpError(err);
      next(err);
    });
};

export const updateQuestionaire = (
  context: Context | undefined,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  debug(`${modulename}: running updateQuestionaire`);

  const {
    body,
    questionairesHandlers,
    miscHandlers,
    dumpError,
  } = setup(context, filter, req, next)!;

  questionairesHandlers
    .updateQuestionaire(req, body as bodyWithId)
    .then((payload) => {
      miscHandlers.writeJson(context, req, res, next, 200, payload);
    })
    .catch((err) => {
     console.error(`${modulename}: handler updateQuestionaire returned error`);
      dumpError(err);
      next(err);
    });
};

export const deleteQuestionaire = (
  context: Context | undefined,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  debug(`${modulename}: running deleteQuestionaire`);

  const {
    qid,
    questionairesHandlers,
    miscHandlers,
    dumpError,
  } = setup(context, filter, req, next)!;

  questionairesHandlers
    .deleteQuestionaire(req, qid)
    .then((number) => {
      const payload = { count: number };
      miscHandlers.writeJson(context, req, res, next, 200, payload);
    })
    .catch((err) => {
     console.error(`${modulename}: handler deleteQuestionaire returned error`);
      dumpError(err);
      next(err);
    });
};

export const questionairesApi = {
  getQuestionaire,
  getAllQuestionaires,
  getQuestionaires,
  addQuestionaire,
  deleteQuestionaire,
  updateQuestionaire,
};
