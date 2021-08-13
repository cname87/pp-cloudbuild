/**
 * This module creates or returns an existing Mongoose database model (which is an object that allows access to a named mongoDB collection) which manages scores details.  It defines the model schema for a scores table and then returns a pre-existing model, or creates a new model, based on supplied parameters.
 */

import { Document, Schema } from 'mongoose';
import { autoIncrement } from 'mongoose-plugin-autoinc';
import { setupDebug } from '../../utils/src/debugOutput';
import { scoresModel } from './models/models';

/* Output a header and set up the debug function */
const { modulename, debug } = setupDebug(__filename);

/**
 * @summary
 * Creates a Scores schema and returns a Mongoose model.
 * @params
 * - database - a connection to a mongoDB database.
 * - ModelName - the name for the created model.
 * - collection - the name of the mongoDB collection.
 * @returns A Mongoose model.
 */
function createModelScores(
  database: Perform.Database,
  ModelName: string,
  collection: string,
): Perform.IModelExtended {
  debug(`${modulename}: running createModelScores`);

  /* Set up a session schema */
  const scoresSchema = new Schema(scoresModel);

  /* Auto-increment the id field on document creation */
  /* Note: resetCount() is called when delete all members is called */
  scoresSchema.plugin(autoIncrement, {
    model: ModelName,
    field: 'id',
    startAt: 1,
  });

  /* Create the model - extended above by autoinc plugin */
  const ModelScores = database.createModel(
    ModelName,
    scoresSchema,
    collection,
  ) as Perform.IModelExtended;

  /* Set toObject option so _id, and __v deleted after query */
  ModelScores.schema.set('toObject', {
    transform: (_doc: Document, ret: any, _options: any) => {
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  });

  return ModelScores;
}

export { createModelScores };
