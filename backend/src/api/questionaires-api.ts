/**
 * Handles http calls routed through the openapi handler as defined in the openapi.json file.
 * Handles calls to <api-prefix>/members/{id}/questionaires
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

export const addQuestionaire = (
  context: Context | undefined,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  debug(`${modulename}: running addQuestionaire`);

  if (!(context?.request?.body)) {
    return contextError(req, next);
  }

  /* the body contains a questionaire to be added */
  const questionaireNoId = context.request.body as Perform.IQuestionaireNoId;

  const { questionairesHandlers } = req.app.appLocals.handlers;
  const handles = req.app.appLocals.handlers.miscHandlers;
  const { dumpError } = req.app.appLocals;

  questionairesHandlers
    .addQuestionaire(req, questionaireNoId)
    .then((payload) => {
      handles.writeJson(context, req, res, next, 201, payload);
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

  if (!(context?.request?.body)) {
    return contextError(req, next);
  }

  /* the uri contains the questionaire id */
  const qid = Number.parseInt(context.request.params.qid as string, 10);

  const { questionairesHandlers } = req.app.appLocals.handlers;
  const handles = req.app.appLocals.handlers.miscHandlers;
  const { dumpError } = req.app.appLocals;

  questionairesHandlers
    .getQuestionaire(req, qid)
    .then((payload) => {
      handles.writeJson(context, req, res, next, 200, payload);
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

  if (!(context?.request?.body)) {
    return contextError(req, next);
  }

  const matchString = context.request.query.type as string;

  const { questionairesHandlers } = req.app.appLocals.handlers;
  const handles = req.app.appLocals.handlers.miscHandlers;
  const { dumpError } = req.app.appLocals;

  /* call getQuestionaires with 0 as the id params which will return all questionaires from all members */
  questionairesHandlers
    .getQuestionaires(req, 0, matchString)
    .then((payload) => {
      handles.writeJson(context, req, res, next, 200, payload);
    })
    .catch((err) => {
     console.error(`${modulename}: handler getAllQuestionaires returned error`);
      dumpError(err);
      next(err);
    });
};

export const getQuestionaires = (
  context: Context | undefined,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  debug(`${modulename}: running getQuestionaires`);

  if (!(context?.request?.body)) {
    contextError(req, next);
  }

  const matchString = context?.request.query.type as string;
  const memberId = Number.parseInt(context?.request.params.id as string, 10);

  const { questionairesHandlers } = req.app.appLocals.handlers;
  const handles = req.app.appLocals.handlers.miscHandlers;
  const { dumpError } = req.app.appLocals;

  /* getting all questionaires for a specific member */
  questionairesHandlers
    .getQuestionaires(req, memberId, matchString)
    .then((payload) => {
      handles.writeJson(context, req, res, next, 200, payload);
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

  if (!(context?.request?.body)) {
    return contextError(req, next);
  }

  /* the body contains a questionaire to be updated */
  const questionaire = context.request.body as Perform.IQuestionaire;
  const { questionairesHandlers } = req.app.appLocals.handlers;
  const handles = req.app.appLocals.handlers.miscHandlers;
  const { dumpError } = req.app.appLocals;

  questionairesHandlers
    .updateQuestionaire(req, questionaire)
    .then((payload) => {
      handles.writeJson(context, req, res, next, 200, payload);
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

  if (!(context?.request?.body)) {
    return contextError(req, next);
  }

  /* the uri contains the questionaire id */
  const qid = Number.parseInt(context.request.params.qid as string, 10);

  const { questionairesHandlers } = req.app.appLocals.handlers;
  const handles = req.app.appLocals.handlers.miscHandlers;
  const { dumpError } = req.app.appLocals;

  questionairesHandlers
    .deleteQuestionaire(req, qid)
    .then((number) => {
      const payload = { count: number };
      handles.writeJson(context, req, res, next, 200, payload);
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
