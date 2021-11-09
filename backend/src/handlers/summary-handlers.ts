/**
 * Holds all handlers for the scores table objects.
 * Called by functions in scores-api.ts.
 */

import { Request } from 'express';
import { databaseUnavailable } from './utilities';
import { setupDebug } from '../utils/src/debugOutput';

const { modulename, debug } = setupDebug(__filename);

const errFunction = (
  err: any,
  req: Request,
  reject: (reason?: any) => void,
) => {
  /* report a general database unavailable error */
  const functionName = 'getSummary';
  return databaseUnavailable(err, functionName, req.app.appLocals, reject);
};

/**
 * Gets a summary of a number of scores tables belonging to a specific member.
 *
 * @param req The http request being actioned (used to retrieve the data model).
 * @param weeks The number of weeks of Scores records to summarize.
 * @rejects Resolves to a reported error.
 * @returns Promise that resolves to the returned summary of scores.
 */
const getScoresSummary = (
  req: Request,
  memberId: number,
  weeks: number,
): Promise<Perform.TSummary> => {
  debug(`${modulename}: running getScoresSummary`);

  const retrieveDays = new Date(
    new Date().setDate(new Date().getDate() - 7 * weeks),
  );

  const aggregation = [
    /* select the specific member */
    { $match: { memberId: memberId } },
    /* select all tables in the last requested number of weeks */
    { $match: { date: { $gt: retrieveDays } } },
    /* sort by date ascending */
    { $sort: { date: 1 } },
    {
      $project: {
        _id: 0,
        date: 1,
        total: {
          /* sum the output of the calculation on each array element */
          $sum: {
            /* iterate over each element in the scores array and for each element output a sum of all scores in that element */
            $map: {
              input: '$scores',
              as: 'score',
              in: {
                $sum: [
                  { $ifNull: ['$$score.monday', 0] },
                  { $ifNull: ['$$score.tuesday', 0] },
                  { $ifNull: ['$$score.wednesday', 0] },
                  { $ifNull: ['$$score.thursday', 0] },
                  { $ifNull: ['$$score.friday', 0] },
                  { $ifNull: ['$$score.saturday', 0] },
                  { $ifNull: ['$$score.sunday', 0] },
                ],
              },
            },
          },
        },
      },
    },
  ];

  /* get the scores mongoDB collection */
  const modelScores = req.app.appLocals.models.scores;

  return new Promise((resolve, reject) => {
    //
    modelScores
      .aggregate(aggregation)
      .then((summary) => {
        /* return error if no summary returned found */
        if (!summary) {
          console.error(`${modulename}: getSummary returned no summary`);
          const errNotFound: Perform.IErr = {
            name: 'DATABASE_NOT_FOUND',
            message: 'No summary returned',
            statusCode: 404,
            dumped: false,
          };
          return reject(errNotFound);
        }

        /* return summary object */
        return resolve(summary as Perform.TSummary);
      })
      .catch((err: any) => {
        errFunction(err, req, reject);
      });
  });
};

/**
 * Gets a summary of a number of sessions tables belonging to a specific member.
 *
 * @param req The http request being actioned (used to retrieve the data model).
 * @param weeks The number of weeks of Sessions records to summarize.
 * @rejects Resolves to a reported error.
 * @returns Promise that resolves to the returned summary of sessions.
 */
const getSessionsSummary = (
  req: Request,
  memberId: number,
  weeks: number,
): Promise<Perform.TSummary> => {
  debug(`${modulename}: running getSessionsSummary`);

  const retrieveDays = new Date(
    new Date().setDate(new Date().getDate() - 7 * weeks),
  );

  const aggregation = [
    /* select the specific member */
    { $match: { memberId: memberId } },
    /* select all tables in the last requested number of weeks */
    { $match: { date: { $gt: retrieveDays } } },
    /* sort by date ascending */
    { $sort: { date: 1 } },
    /* sum the products of rep and duration of each session */
    {
      $project: {
        _id: 0,
        date: 1,
        total: {
          /* sum the output of the calculation on each array element */
          $sum: {
            /* iterate over each element in the sessions array and for each element output the product of rpe and duration for that element */
            $map: {
              input: '$sessions',
              as: 'session',
              in: {
                $multiply: [
                  { $ifNull: ['$$session.rpe', 0] },
                  { $ifNull: ['$$session.duration', 0] },
                ],
              },
            },
          },
        },
      },
    },
  ];

  /* get the scores mongoDB collection */
  const modelSessions = req.app.appLocals.models.sessions;

  return new Promise((resolve, reject) => {
    //
    modelSessions
      .aggregate(aggregation)
      .then((summary) => {
        /* return error if no summary returned found */
        if (!summary) {
          console.error(
            `${modulename}: getSessionsSummary returned no summary`,
          );
          const errNotFound: Perform.IErr = {
            name: 'DATABASE_NOT_FOUND',
            message: 'No summary returned',
            statusCode: 404,
            dumped: false,
          };
          return reject(errNotFound);
        }

        /* return summary object */
        return resolve(summary as Perform.TSummary);
      })
      .catch((err: any) => {
        errFunction(err, req, reject);
      });
  });
};

/**
 * Gets an array of two elements
 * (i) a summary of a number of scores tables belonging to a specific member.
 * (ii) a summary of a number of sessions tables belonging to a specific member.
 * @param req The http request being actioned (used to retrieve the data model).
 * @param weeks The number of weeks of Sessions records to summarize.
 * @rejects Resolves to a reported error.
 * @returns Promise that resolves to the returned array.
 */
const getSummary = (
  req: Request,
  memberId: number,
  weeks: number,
): Promise<Array<Perform.TSummary>> => {
  debug(`${modulename}: running getSummary`);
  return Promise.all([
    getScoresSummary(req, memberId, weeks),
    getSessionsSummary(req, memberId, weeks),
  ]);
};

export const summaryHandlers = {
  getScoresSummary,
  getSessionsSummary,
  getSummary,
};
