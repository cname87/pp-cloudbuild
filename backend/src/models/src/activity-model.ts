/**
 * This module creates or returns an existing Mongoose database model (which is an object that allows access to a named mongoDB collection) which manages activity details.  It defines the model schema for an activity and then returns a pre-existing model, or creates a new model, based on supplied parameters.
 */

import { Document, Schema } from 'mongoose';
import { autoIncrement } from 'mongoose-plugin-autoinc';
import { setupDebug } from '../../utils/src/debugOutput';
import { activityModel } from './models/models';

/* Output a header and set up the debug function */
const { modulename, debug } = setupDebug(__filename);

/**
 * @summary
 * Creates an Activities schema and returns a Mongoose model.
 * @params
 * - database - a connection to a mongoDB database.
 * - ModelName - the name for the created model.
 * - collection - the name of the mongoDB collection.
 * @returns A Mongoose model.
 */
function createModelActivities(
  database: Perform.TDatabase,
  ModelName: string,
  collection: string,
): Perform.IModelExtended {
  debug(`${modulename}: running createModelActivities`);

  /* Set up a activity schema */
  const activitySchema = new Schema(activityModel);

  /* Auto-increment the id field on document creation */
  /* Note: resetCount() can be called to reset */
  activitySchema.plugin(autoIncrement, {
    model: ModelName,
    field: 'id',
    startAt: 1,
  });

  /* Create the model - extended above by autoinc plugin */
  const ModelActivities = database.createModel(
    ModelName,
    activitySchema,
    collection,
  ) as Perform.IModelExtended;

  /* Set toObject option so _id, and __v deleted following query*/
  ModelActivities.schema.set('toObject', {
    transform: (_doc: Document, ret: any, _options: any) => {
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  });

  return ModelActivities;
}

export { createModelActivities };
