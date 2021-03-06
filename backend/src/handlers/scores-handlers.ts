/**
 * Holds all handlers for the scores table objects.
 * Called by functions in scores-api.ts.
 */

import { Document } from 'mongoose';
import { Request } from 'express';
import { databaseUnavailable } from './utilities';
import { setupDebug } from '../utils/src/debugOutput';

const { modulename, debug } = setupDebug(__filename);

const enum ScoreType {
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

const errFunction = (
  err: any,
  req: Request,
  reject: (reason?: any) => void,
) => {
  /* report a general database unavailable error */
  const functionName = 'Scores function';
  return databaseUnavailable(err, functionName, req.app.appLocals, reject);
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
  date: Date,
): Promise<Perform.IScores> => {
  debug(`${modulename}: running getOrCreateScores`);

  /* get the scores mongodDB collection */
  const modelScores = req.app.appLocals.models.scores;

  const foundDoc: Perform.IScores = await new Promise((resolve, reject) => {
    modelScores
      .findOne({ memberId: mid, date: date })
      .exec()
      .then((doc: Document<Perform.IScores>) => {
        if (!doc) {
          debug(`${modulename}: no scores object found`);
        }
        /* convert Mongoose document to object */
        const docObject = doc?.toObject() as Perform.IScores;
        return resolve(docObject);
      })
      .catch((err: any) => {
        errFunction(err, req, reject);
      });
  });

  /* if a document is returned then return it */
  if (foundDoc) {
    debug(`${modulename}: scores object found`);
    return foundDoc;
  }

  /* if no document is returned then create a blank document */
  blankScores.memberId = mid;
  blankScores.date = date;
  const addedScores = new modelScores(blankScores);

  return new Promise((resolve, reject) => {
    addedScores
      .save()
      .then((doc: Document) => {
        debug(`${modulename}: new scores object created`);
        /* convert document to object */
        const docObject = doc?.toObject() as Perform.IScores;
        return resolve(docObject);
      })
      .catch((err: any) => {
        errFunction(err, req, reject);
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

  /* convert to date before sending to MongoDB */
  scores.date = new Date(scores.date);

  /* get the scores mongoDB collection */
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
      .then((doc: Document<Perform.IScores>) => {
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
        /* convert document to object */
        const docObject = doc?.toObject() as Perform.IScores;
        return resolve(docObject);
      })
      .catch((err: any) => {
        errFunction(err, req, reject);
      });
  });
};

export const scoresHandlers = {
  getOrCreateScores,
  updateScores,
};
