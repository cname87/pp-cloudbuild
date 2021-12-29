/**
 * Holds all handlers for the summary table objects.
 * Called by functions in summary-api.ts.
 */

import { Request } from 'express';
import { databaseUnavailable } from './utilities';
import { setupDebug } from '../utils/src/debugOutput';
import { PipelineStage } from 'mongoose';

const { modulename, debug } = setupDebug(__filename);

const errFunction = (
  err: any,
  req: Request,
  reject: (reason?: any) => void,
) => {
  /* report a general database unavailable error */
  const functionName = 'Summary function';
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
): Promise<Summary.TScoresSummaryItems> => {
  debug(`${modulename}: running getScoresSummary`);

  const retrieveDays = new Date(
    new Date().setDate(new Date().getDate() - 7 * weeks),
  );

  const aggregation: PipelineStage[] = [
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
        scoresTotal: {
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
      .then((summary: Summary.TScoresSummaryItems) => {
        /* return error if no summary returned found */
        if (!summary) {
          console.error(`${modulename}: getScoresSummary returned no summary`);
          const errNotFound: Perform.IErr = {
            name: 'DATABASE_NOT_FOUND',
            message: 'No summary returned',
            statusCode: 404,
            dumped: false,
          };
          return reject(errNotFound);
        }

        /* return summary object */
        return resolve(summary);
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
): Promise<Summary.TSessionsSummaryItems> => {
  debug(`${modulename}: running getSessionsSummary`);

  const retrieveDays = new Date(
    new Date().setDate(new Date().getDate() - 7 * weeks),
  );

  const aggregation: PipelineStage[] = [
    /* select the specific member */
    { $match: { memberId: memberId } },
    /* select all tables in the last requested number of weeks */
    { $match: { date: { $gt: retrieveDays } } },
    /* sort by date ascending */
    { $sort: { date: 1 } },
    /* add extra fields to each document */
    {
      $project: {
        _id: 0,
        date: 1,
        /* sum of the product of rpe and duration (load) for all sessions */
        sessionsTotal: {
          $sum: {
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
        /* count of the number of non-zero sessions */
        count: {
          $sum: {
            $map: {
              input: '$sessions',
              as: 'session',
              in: {
                $cond: {
                  if: {
                    $gt: [{ $ifNull: ['$$session.duration', 0] }, 0],
                  },
                  then: 1,
                  else: 0,
                },
              },
            },
          },
        },
        /* average of the load of all non-zero duration sessions */
        average: {
          /* return 0, and not null, if no non-zero sessions */
          $ifNull: [
            {
              $round: [
                {
                  $avg: {
                    $map: {
                      input: '$sessions',
                      as: 'session',
                      in: {
                        $cond: {
                          if: {
                            $gt: [{ $ifNull: ['$$session.duration', 0] }, 0],
                          },
                          then: {
                            $multiply: [
                              { $ifNull: ['$$session.rpe', 0] },
                              { $ifNull: ['$$session.duration', 0] },
                            ],
                          },
                          else: null,
                        },
                      },
                    },
                  },
                },
                0,
              ],
            },
            0,
          ],
        },
        /* standard deviation of the load of all non-zero duration sessions */
        stdDev: {
          /* return 0, and not null, if no non-zro sessions */
          $ifNull: [
            {
              $round: [
                {
                  $stdDevPop: {
                    $map: {
                      input: '$sessions',
                      as: 'session',
                      in: {
                        $cond: {
                          if: {
                            $gt: [{ $ifNull: ['$$session.duration', 0] }, 0],
                          },
                          then: {
                            $multiply: [
                              { $ifNull: ['$$session.rpe', 0] },
                              { $ifNull: ['$$session.duration', 0] },
                            ],
                          },
                          else: null,
                        },
                      },
                    },
                  },
                },
                0,
              ],
            },
            0,
          ],
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
      .then((summary: Summary.TSessionsSummaryItems) => {
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
        return resolve(summary);
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
): Promise<[Summary.TScoresSummaryItems, Summary.TSessionsSummaryItems]> => {
  debug(`${modulename}: running getSummary`);
  return Promise.all([
    getScoresSummary(req, memberId, weeks),
    getSessionsSummary(req, memberId, weeks),
  ]);
};

export const summaryHandlers = {
  getSummary,
};
