/**
 * Holds all handlers for the scores table objects.
 * Called by functions in scores-api.ts.
 */

import { Document } from 'mongoose';
import { Request } from 'express';
import { databaseUnavailable } from './utilities';
import { setupDebug } from '../utils/src/debugOutput';

const { modulename, debug } = setupDebug(__filename);

enum ScoreType {
  Sleep = 'SLEEP',
  Fatigue = 'FATIGUE',
  Soreness = 'SORENESS',
  Stress = 'STRESS',
  Motivation = 'MOTIVATION',
  Health = 'HEALTH',
  Nutrition = 'NUTRITION',
  Mood = 'MOOD',
}
const blankScores: Perform.IScoresWithoutId = {
  memberId: 0,
  date: '',
  scores: [
    {
      item: ScoreType.Sleep,
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0,
    },
    {
      item: ScoreType.Fatigue,
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0,
    },
    {
      item: ScoreType.Soreness,
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0,
    },
    {
      item: ScoreType.Stress,
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0,
    },
    {
      item: ScoreType.Motivation,
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0,
    },
    {
      item: ScoreType.Health,
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0,
    },
    {
      item: ScoreType.Nutrition,
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0,
    },
    {
      item: ScoreType.Mood,
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0,
    },
  ],
};

/**
 * Gets a scores object by member id & date, or adds a new scores object to the database.
 *
 * @param req The http request being actioned (used to retrieve the data model).
 * @param scores Scores to add. Must not have an id property.
 * @rejects Resolves to a reported error.
 * @returns Promise that resolves to the scores object added.
 */
const getOrCreateScores = async (
  req: Request,
  mid: number,
  date: string,
): Promise<Perform.IScores> => {
  debug(`${modulename}: running getOrCreateScores`);

  /* get the scores mongodDB collection */
  const modelScores = req.app.appLocals.models.scores;

  const foundDoc: Perform.IScores = await new Promise((resolve, _reject) => {
    modelScores
      .findOne({ memberId: mid, date: date })
      .exec()
      .then((doc) => {
        if (!doc) {
          debug(`${modulename}: no scores object found`);
        }
        /* strip down to scores object and return */
        return resolve(doc?.toObject() as Perform.IScores);
      });
  });

  /* if a document is returned then return it */
  if (foundDoc) {
    return foundDoc;
  }

  /* if no document is returned then create a blank document */
  blankScores.memberId = mid;
  blankScores.date = date;
  const addedScores = new modelScores(blankScores);

  return new Promise((resolve, reject) => {
    addedScores
      .save()
      .then((savedScores: Document) => {
        debug(`${modulename}: new scores object created`);
        /* return the added scores table as a JSON object */
        return resolve(savedScores.toObject() as Perform.IScores);
      })
      .catch((err: any) => {
        /* report a general database unavailable error */
        const functionName = 'getOrCreateScores';
        return databaseUnavailable(
          err,
          functionName,
          req.app.appLocals,
          reject,
        );
      });
  });
};

/**
 * Updates a supplied scores with a supplied scores object.
 *
 * It detects which scores object to update based on the memberId and the id fields in the supplied scores object.
 *
 * @param req The http request being actioned (used to retrieve the data model).
 * @param scores Scores object to add.
 * @rejects Resolves to a reported error.
 * @returns Promise that resolves to the scores object added.
 */
const updateScores = (
  req: Request,
  scores: Perform.IScores,
): Promise<Perform.IScores> => {
  debug(`${modulename}: running updateScores`);

  /* get the scores mongodDB collection */
  const modelScores = req.app.appLocals.models.scores;
  const updatedScores = new modelScores(scores);

  return new Promise((resolve, reject) => {
    modelScores
      .findOneAndUpdate(
        { id: scores.id, memberId: scores.memberId },
        updatedScores,
        {
          new: true,
          runValidators: true,
        },
      )
      .exec()
      .then((doc) => {
        /* return error if no scores found */
        if (!doc) {
          console.error(`${modulename}: updateScores found no matching scores`);
          const errNotFound: Perform.IErr = {
            name: 'DATABASE_NOT_FOUND',
            message: 'The supplied scores ID does not match a stored scores',
            statusCode: 404,
            dumped: false,
          };
          return reject(errNotFound);
        }
        /* return new scores object */
        resolve(doc.toObject() as Perform.IScores);
      })
      .catch((err) => {
        /* report a general database unavailable error */
        const functionName = 'updateScores';
        databaseUnavailable(err, functionName, req.app.appLocals, reject);
      });
  });
};

export const scoresHandlers = {
  getOrCreateScores,
  updateScores,
};
