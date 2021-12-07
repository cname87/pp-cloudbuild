/**
 * Holds all activity handlers e.g. getActivity.
 * Called by functions in activity-api.ts.
 */

import { Document } from 'mongoose';
import { Request } from 'express';
import { databaseUnavailable } from './utilities';
import { setupDebug } from '../utils/src/debugOutput';

const { modulename, debug } = setupDebug(__filename);

/**
 * Returns all the activities for a member.
 * @param req The http request being actioned (used to retrieve the data model).
 * @rejects Resolves to a reported error.
 * @returns Promise that resolves to an array of activity objects.
 */
const getActivities = (req: Request): Promise<Perform.IActivity[]> => {
  debug(`${modulename}: running getActivity`);

  const modelActivity = req.app.appLocals.models.activity;

  return new Promise((resolve, reject) => {
    modelActivity
      .find()
      .lean(true) // return json object
      .select({ _id: 0, __v: 0 }) // exclude _id and __v fields
      .exec()
      .then((docs) => {
        /* return activity objects array */
        return resolve(docs as unknown as [Perform.IActivity]);
      })
      .catch((err: any) => {
        /* report a general database unavailable error */
        const functionName = 'getActivities';
        databaseUnavailable(err, functionName, req.app.appLocals, reject);
      });
  });
};

/**
 * Returns a specific member activity given by the id parameter passed in.
 * @param req The http request being actioned (used to retrieve the data model).
 * @param activityId The id of the activity to return.
 * @rejects Resolves to a reported error.
 * @returns Promise that resolves to a activity object.
 */
const getActivity = (
  req: Request,
  activityId: number,
): Promise<Perform.IActivity> => {
  debug(`${modulename}: running getActivity`);

  const modelActivity = req.app.appLocals.models.activity;

  return new Promise((resolve, reject) => {
    modelActivity
      .findOne({ id: activityId })
      .exec()
      .then((doc) => {
        /* return error if no activity found */
        if (!doc) {
          console.error(
            `${modulename}: getActivity found no matching activity`,
          );
          const errNotFound: Perform.IErr = {
            name: 'DATABASE_NOT_FOUND',
            message:
              'The supplied activity ID does not match a stored activity',
            statusCode: 404,
            dumped: false,
          };
          return reject(errNotFound);
        }
        /* strip down to activity object and return */
        return resolve(doc.toObject() as unknown as Perform.IActivity);
      })
      .catch((err: any) => {
        /* report a general database unavailable error */
        const functionName = 'getActivity';
        databaseUnavailable(err, functionName, req.app.appLocals, reject);
      });
  });
};

/**
 * Adds a supplied activity object to the database.
 *
 * @param req The http request being actioned (used to retrieve the data model).
 * @param activityNoId Activity to add. Must not have an id property.
 * @rejects Resolves to a reported error.
 * @returns Promise that resolves to the activity object added.
 */
const addActivity = (
  req: Request,
  activityNoId: Perform.IActivityNoId,
): Promise<Perform.IActivity> => {
  const modelActivity = req.app.appLocals.models.activity;

  /* test that the supplied activity does not already have an id */
  if ((activityNoId as any).id) {
    const err: Perform.IErr = {
      name: 'UNEXPECTED_FAIL',
      message: 'activity id exists before document creation',
      statusCode: 500,
      dumped: false,
    };
    req.app.appLocals.dumpError(err);
    throw new Error('activity id exists before document creation');
  }

  const addedActivity = new modelActivity(activityNoId);
  return new Promise((resolve, reject) => {
    addedActivity
      .save()
      .then((savedActivity: Document) => {
        /* return the added activity as a JSON object */
        return resolve(savedActivity.toObject() as Perform.IActivity);
      })
      .catch((err: any) => {
        /* report a general database unavailable error */
        const functionName = 'addActivity';
        databaseUnavailable(err, functionName, req.app.appLocals, reject);
      });
  });
};

/**
 * Updates a supplied activity with a supplied activity object.
 *
 * It detects which activity to update based on the id field in the supplied activity object.
 *
 * @param req The http request being actioned (used to retrieve the data model).
 * @param activity Activity which updates the stored version.
 * @rejects Resolves to a reported error.
 * @returns Promise that resolves to the activity object added.
 */
const updateActivity = (
  req: Request,
  activity: Perform.IActivity,
): Promise<Perform.IActivity> => {
  const modelActivity = req.app.appLocals.models.activity;

  const updatedActivity = new modelActivity(activity);

  return new Promise((resolve, reject) => {
    modelActivity
      .findOneAndUpdate({ id: activity.id }, updatedActivity, {
        new: true,
        runValidators: true,
      })
      .exec()
      .then((doc) => {
        /* return error if no activity found */
        if (!doc) {
          console.error(
            `${modulename}: updateActivity found no matching activity`,
          );
          const errNotFound: Perform.IErr = {
            name: 'DATABASE_NOT_FOUND',
            message:
              'The supplied activity ID does not match a stored activity',
            statusCode: 404,
            dumped: false,
          };
          return reject(errNotFound);
        }
        /* return new activity object */
        resolve(doc.toObject() as unknown as Perform.IActivity);
      })
      .catch((err: any) => {
        /* report a general database unavailable error */
        const functionName = 'updateActivity';
        databaseUnavailable(err, functionName, req.app.appLocals, reject);
      });
  });
};

/**
 * Deletes a specific team activity given by the id parameter passed in.
 *
 * @param req The http request being actioned (used to retrieve the data model).
 * @param activityId The id of the activity to delete.
 * @rejects Resolves to a reported error.
 * @returns Promise that resolves to the deleted activity object.
 */
const deleteActivity = (req: Request, activityId: number): Promise<number> => {
  debug(`${modulename}: running deleteActivity`);

  const modelActivity = req.app.appLocals.models.activity;

  return new Promise((resolve, reject) => {
    modelActivity
      .deleteOne({ id: activityId })
      .exec()
      .then((doc) => {
        /* return error if no activity deleted */
        if (doc.deletedCount === 0) {
          console.error(
            `${modulename}: delete Activity found no matching activity`,
          );
          const errNotFound: Perform.IErr = {
            name: 'DATABASE_NOT_FOUND',
            message:
              'The supplied activity ID does not match a stored activity',
            statusCode: 404,
            dumped: false,
          };
          return reject(errNotFound);
        }
        /* return count (= 1) to match api */
        return resolve(doc.deletedCount!);
      })
      .catch((err: any) => {
        /* report a general database unavailable error */
        const functionName = 'deleteActivity';
        databaseUnavailable(err, functionName, req.app.appLocals, reject);
      });
  });
};

export const activityHandlers = {
  addActivity,
  getActivity,
  getActivities,
  updateActivity,
  deleteActivity,
};
