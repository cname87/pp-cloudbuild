/**
 * This module creates a test database model.
 */

import { Document, Model, Schema } from 'mongoose';
import { setupDebug } from '../../utils/src/debugOutput';

/* Output header and set up the debug function */
const { modulename, debug } = setupDebug(__filename);

function createModel(database: Perform.Database): Model<Document> {
  debug(`${modulename}: running createModel`);

  /* Set up schema, collection, and model name */
  const schema = new Schema({
    id: { type: Number, unique: true },
    name: String,
  });

  const collection = 'tests';
  const ModelName = 'Tests';

  /* Create the model */
  const model = database.createModel(ModelName, schema, collection);

  /* Set toObject option so _id, and __v deleted */
  model.schema.set('toObject', {
    transform: (_doc: Document, ret: any, _options: any) => {
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  });

  return model;
}

export { createModel as createModelTests };
