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
 * @rejects Resolves to a reported error.
 * @returns Promise that resolves to the returned summary table.
 */
const getSummary = (
  req: Request,
  memberId: number,
  weeks: number,
): Promise<Perform.ISummary> => {
  debug(`${modulename}: running getSummary`);

  const retrieveDays = new Date(
    new Date().setDate(new Date().getDate() - 7 * weeks),
  );

  /* Build an aggregation */
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
        totalMonday: { $sum: '$scores.monday' },
        totalTuesday: { $sum: '$scores.tuesday' },
        totalWednesday: { $sum: '$scores.wednesday' },
        totalThursday: { $sum: '$scores.thursday' },
        totalFriday: { $sum: '$scores.friday' },
        totalSaturday: { $sum: '$scores.saturday' },
        totalSunday: { $sum: '$scores.sunday' },
      },
    },
    {
      $project: {
        date: 1,
        total: {
          $sum: [
            '$totalMonday',
            '$totalTuesday',
            '$totalWednesday',
            '$totalThursday',
            '$totalFriday',
            '$totalSaturday',
            '$totalSunday',
          ],
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
        return resolve(summary as Perform.ISummary);
      })
      .catch((err: any) => {
        errFunction(err, req, reject);
      });
  });
};

export const summaryHandlers = {
  getSummary,
};
