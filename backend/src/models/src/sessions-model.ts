/**
 * This module creates or returns an existing Mongoose database model (which is an object that allows access to a named mongoDB collection) which manages member sport session details.  It defines the model schema for the member sessions and then returns a pre-existing model, or creates a new model, based on supplied parameters.
 */

import { Document, Schema } from 'mongoose';
import { autoIncrement } from 'mongoose-plugin-autoinc';
import { setupDebug } from '../../utils/src/debugOutput';

/* Output a header and set up the debug function */
const { modulename, debug } = setupDebug(__filename);

/**
 * @summary
 * Creates a Sessions schema and returns a Mongoose model.
 * @params
 * - database - a connection to a mongoDB database.
 * - ModelName - the name for the created model.
 * - collection - the name of the mongoDB collection.
 * @returns A Mongoose model.
 */
function createModelSessions(
  database: Perform.Database,
  ModelName: string,
  collection: string,
): Perform.IModelExtended {
  debug(`${modulename}: running createModelSessions`);

  /* Set up the schema for the team members */
  const sessionSchema = new Schema({
    id: { type: Number, unique: true },
    date: String,
    type: String,
    score: Number,
    duration: Number,
    metric: Number,
    memberId: Number,
    comment: String,
  });

  /* Auto-increment the id field on document creation */
  /* Note: resetCount() is called when delete all members is called */
  sessionSchema.plugin(autoIncrement, {
    model: ModelName,
    field: 'id',
    startAt: 1,
  });

  /* Create the model - extended above by autoinc plugin */
  const ModelSessions = database.createModel(
    ModelName,
    sessionSchema,
    collection,
  ) as any as Perform.IModelExtended;

  /* Set toObject option so _id, and __v deleted */
  ModelSessions.schema.set('toObject', {
    transform: (_doc: Document, ret: any, _options: any) => {
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  });

  return ModelSessions;
}

export { createModelSessions };
