/**
 * This module creates or returns an existing Mongoose database model (which is an object that allows access to a named mongoDB collection) which manages sessions details.  It defines the model schema for a sessions table and then returns a pre-existing model, or creates a new model, based on supplied parameters.
 */

import { Document, Model, Schema } from 'mongoose';
import { autoIncrement } from 'mongoose-plugin-autoinc';
import { setupDebug } from '../../utils/src/debugOutput';
import { sessionsModel } from './models/models';

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
  database: Perform.TDatabase,
  ModelName: string,
  collection: string,
): Model<any> {
  debug(`${modulename}: running createModelSessions`);

  /* Set up a schema for the sessions */
  const sessionsSchema = new Schema(sessionsModel);

  /* Auto-increment the id field on document creation */
  /* Note: resetCount() is called when delete all members is called */
  sessionsSchema.plugin(autoIncrement, {
    model: ModelName,
    field: 'id',
    startAt: 1,
  });

  /* Create the model - extended above by autoinc plugin */
  const ModelSessions = database.createModel(
    ModelName,
    sessionsSchema,
    collection,
  );

  /* Set toObject option so _id, and __v deleted after query */
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
