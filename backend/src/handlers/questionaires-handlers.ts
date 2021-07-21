/**
 * Holds all questionaires handlers e.g. addQuestionaire.
 * Called by functions in questionaires-api.ts.
 */

import { Document } from 'mongoose';
import { Request } from 'express';
import { databaseUnavailable } from './utilities';
import { setupDebug } from '../utils/src/debugOutput';

const { modulename, debug } = setupDebug(__filename);

/**
 * Adds a supplied questionaire object to the database.
 *
 * @param req The http request being actioned (used to retrieve the data model).
 * @param questionaireNoId Questionaire to add. Must not have an id property.
 * @rejects Resolves to a reported error.
 * @returns Promise that resolves to the questionaire object added.
 */
const addQuestionaire = (
  req: Request,
  questionaireNoId: Perform.IQuestionaireNoId,
): Promise<Perform.IQuestionaire> => {
  const modelQuestionaires = req.app.appLocals.models.questionaires;

  /* test that the supplied questionaire does not already have an id */
  if ((questionaireNoId as any).id) {
    const err: Perform.IErr = {
      name: 'UNEXPECTED_FAIL',
      message: 'questionaire id exists before document creation',
      statusCode: 500,
      dumped: false,
    };
    req.app.appLocals.dumpError(err);
    throw new Error('questionaire id exists before document creation');
  }

  const addedQuestionaire = new modelQuestionaires(questionaireNoId);
  return new Promise((resolve, reject) => {
    addedQuestionaire
      .save()
      .then((savedQuestionaire: Document) => {
        /* return the added questionaire as a JSON object */
        return resolve(savedQuestionaire.toObject() as Perform.IQuestionaire);
      })
      .catch((err) => {
        /* report a general database unavailable error */
        const functionName = 'addQuestionaire';
        databaseUnavailable(err, functionName, req.app.appLocals, reject);
      });
  });
};

/**
 * Returns a specific questionaire given by the member and questionaire id parameters.
 * @param req The http request being actioned (used to retrieve the data model).
 * @param questionaireId The id of the questionaire to return.
 * @rejects Resolves to a reported error.
 * @returns Promise that resolves to a questionaire object.
 */
const getQuestionaire = (
  req: Request,
  questionaireId: number,
): Promise<Perform.IQuestionaire> => {
  debug(`${modulename}: running getQuestionaire`);

  const modelQuestionaires = req.app.appLocals.models.questionaires;

  return new Promise((resolve, reject) => {
    modelQuestionaires
      .findOne({ id: questionaireId })
      .exec()
      .then((doc) => {
        /* return error if no questionaire found */
        if (!doc) {
          console.error(
            `${modulename}: getQuestionaire found no matching questionaire`,
          );
          const errNotFound: Perform.IErr = {
            name: 'DATABASE_NOT_FOUND',
            message:
              'The supplied questionaire ID does not match a stored questionaire',
            statusCode: 404,
            dumped: false,
          };
          return reject(errNotFound);
        }
        /* strip down to questionaire object and return */
        return resolve(doc.toObject() as Perform.IQuestionaire);
      })
      .catch((err) => {
        /* report a general database unavailable error */
        const functionName = 'getQuestionaire';
        databaseUnavailable(err, functionName, req.app.appLocals, reject);
      });
  });
};

/**
 * Returns all the questionaires belonging to a member.
 * @param req The http request being actioned (used to retrieve the data model).
 * @param memberId: The id of the member whose questionaires are being requested.
 *  If a memberId greater than zero is supplied then only questionaires belonging to the referenced member are considered.
 * - If a memberId of zero is supplied then all questionaires across all team members are considered.
 * @param matchString Optional. A string to filter the questionaires to return.
 * - If a matchString is not supplied then no filtering takes place.
 * - If a matchstring is supplied it returns only questionaires whose 'date' field starts with the match string (case insensitive).
 * @rejects Resolves to a reported error.
 * @returns Promise that resolves to an array of questionaire objects.
 */
const getQuestionaires = (
  req: Request,
  memberId: number,
  matchString = '',
): Promise<[Perform.IQuestionaire]> => {
  debug(`${modulename}: running getQuestionaires`);

  const modelQuestionaires = req.app.appLocals.models.questionaires;

  /* replace all characters, 'c', in the user entered search string that need to be escaped in a regex pattern with '\c' */
  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };
  const sanitizedMatchString = escapeRegExp(matchString).toUpperCase();

  /* get all questionaires for all members if memberId = 0 or else get all members */
  const query =
    memberId === 0 ? { memberId: { $gt: 0 } } : { memberId: memberId };

  return new Promise((resolve, reject) => {
    modelQuestionaires
      .find(query)
      .where('date')
      .regex('date', new RegExp(`^${sanitizedMatchString}.*`, 'i'))
      .lean(true) // return json object
      .select({ _id: 0, __v: 0 }) // exclude _id and __v fields
      .exec()
      .then((docs) => {
        /* return questionaire objects array */
        return resolve(docs as unknown as [Perform.IQuestionaire]);
      })
      .catch((err) => {
        /* report a general database unavailable error */
        const functionName = 'getQuestionaires';
        databaseUnavailable(err, functionName, req.app.appLocals, reject);
      });
  });
};

/**
 * Updates a supplied questionaire with a supplied questionaire object.
 *
 * It detects which questionaire to update based on the memberId and the id fields in the supplied questionaire object.
 *
 * @param req The http request being actioned (used to retrieve the data model).
 * @param questionaire Questionaire to add.
 * @rejects Resolves to a reported error.
 * @returns Promise that resolves to the questionaire object added.
 */
const updateQuestionaire = (
  req: Request,
  questionaire: Perform.IQuestionaire,
): Promise<Perform.IQuestionaire> => {
  const modelQuestionaires = req.app.appLocals.models.questionaires;

  const updatedQuestionaire = new modelQuestionaires(questionaire);

  return new Promise((resolve, reject) => {
    modelQuestionaires
      .findOneAndUpdate(
        { id: questionaire.id, memberId: questionaire.memberId },
        updatedQuestionaire,
        {
          new: true,
          runValidators: true,
        },
      )
      .exec()
      .then((doc) => {
        /* return error if no questionaire found */
        if (!doc) {
          console.error(
            `${modulename}: updateQuestionaire found no matching questionaire`,
          );
          const errNotFound: Perform.IErr = {
            name: 'DATABASE_NOT_FOUND',
            message:
              'The supplied questionaire ID does not match a stored questionaire',
            statusCode: 404,
            dumped: false,
          };
          return reject(errNotFound);
        }
        /* return new questionaire object */
        resolve(doc.toObject() as Perform.IQuestionaire);
      })
      .catch((err) => {
        /* report a general database unavailable error */
        const functionName = 'updateQuestionaire';
        databaseUnavailable(err, functionName, req.app.appLocals, reject);
      });
  });
};

/**
 * Deletes a specific questionaire given by the memberId and id parameters passed in.
 *
 * @param req The http request being actioned (used to retrieve the data model).
 * @param questionaireId The id of the questionaire to delete.
 * @rejects Resolves to a reported error.
 * @returns Promise that resolves to the deleted questionaire object.
 */
const deleteQuestionaire = (
  req: Request,
  questionaireId: number,
): Promise<number> => {
  debug(`${modulename}: running deleteQuestionaire`);

  const modelQuestionaires = req.app.appLocals.models.questionaires;

  return new Promise((resolve, reject) => {
    modelQuestionaires
      .deleteOne({ id: questionaireId })
      .exec()
      .then((doc) => {
        /* return error if no questionaire deleted */
        if (doc.n === 0) {
          console.error(
            `${modulename}: delete Questionaire found no matching questionaire`,
          );
          const errNotFound: Perform.IErr = {
            name: 'DATABASE_NOT_FOUND',
            message:
              'The supplied questionaire ID does not matchquestionaire a stored ',
            statusCode: 404,
            dumped: false,
          };
          return reject(errNotFound);
        }
        /* return count (= 1) to match api */
        return resolve(doc.n!);
      })
      .catch((err) => {
        /* report a general database unavailable error */
        const functionName = 'deleteQuestionaire';
        databaseUnavailable(err, functionName, req.app.appLocals, reject);
      });
  });
};

export const questionairesHandlers = {
  addQuestionaire,
  getQuestionaire,
  getQuestionaires,
  updateQuestionaire,
  deleteQuestionaire,
};
