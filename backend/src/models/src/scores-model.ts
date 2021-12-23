/**
 * This module creates a, or returns an existing, Mongoose database model (which is an object that allows access to a named mongoDB collection) which manages scores details.  It defines the model schema for a scores table and then returns a pre-existing model, or creates a new model, based on supplied parameters.
 */

import { Document, Model, Schema } from 'mongoose';
import { autoIncrement } from 'mongoose-plugin-autoinc';
import { setupDebug } from '../../utils/src/debugOutput';
import { scoresModel } from './models/models';

/* Log a header and set up the debug function */
const { modulename, debug } = setupDebug(__filename);

/**
 * @summary
 * Creates a Scores schema and returns a Mongoose model.
 * @param database - A connection to a mongoDB database.
 * @param ModelName - The name for the created model.
 * @param collection - The name of the mongoDB collection.
 * @returns A Mongoose model.
 */
function createModelScores(
  database: Perform.TDatabase,
  ModelName: string,
  collection: string,
): Model<any> {
  debug(`${modulename}: running createModelScores`);

  /* Set up a schema for member scores */
  const scoresSchema = new Schema(scoresModel);

  /* Auto-increment the id field on document creation */
  scoresSchema.plugin(autoIncrement, {
    model: ModelName,
    field: 'id',
    startAt: 1,
  });

  /* Create the model - extended above by autoinc plugin */
  const ModelScores = database.createModel(ModelName, scoresSchema, collection);

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
