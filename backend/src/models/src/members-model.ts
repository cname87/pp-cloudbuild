/**
 * This module creates or returns an existing Mongoose database model (which is an object that allows access to a named mongoDB collection) which manages team members details.  It defines the model schema for the team members and then returns a pre-existing model, or creates a new model, based on supplied parameters.
 */

import { Document, DocumentToObjectOptions, Schema } from 'mongoose';
import { autoIncrement } from 'mongoose-plugin-autoinc';
import { setupDebug } from '../../utils/src/debugOutput';

/* Output a header and set up the debug function */
const { modulename, debug } = setupDebug(__filename);

/**
 * @summary
 * Creates a Members schema and returns a Mongoose model.
 * @params
 * - database - a connection to a mongoDB database.
 * - ModelName - the name for the created model.
 * - collection - the name of the mongoDB collection.
 * @returns A Mongoose model.
 */
function createModelMembers(
  database: Perform.Database,
  ModelName: string,
  collection: string,
): Perform.IModelExtended {
  debug(`${modulename}: running createModelMembers`);

  /* Set up the schema for the team members */
  const memberSchema = new Schema({
    id: { type: Number, unique: true },
    name: String,
  });

  /* Auto-increment the id field on document creation */
  /* Note: resetCount() is called when delete all members is called */
  memberSchema.plugin(autoIncrement, {
    model: ModelName,
    field: 'id',
    startAt: 1,
  });

  /* Create the model - extended above by autoinc plugin */
  const ModelMembers = (database.createModel(
    ModelName,
    memberSchema,
    collection,
  ) as any) as Perform.IModelExtended;

  /* Set toObject option so _id, and __v deleted */
  ModelMembers.schema.set('toObject', {
    transform: (
      _doc: Document,
      ret: any,
      _options: DocumentToObjectOptions,
    ) => {
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  });

  return ModelMembers;
}

export { createModelMembers };
