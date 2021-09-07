/**
 * Holds all handlers for the sessions table objects.
 * Called by functions in sessions2-api.ts.
 */

import { Document } from 'mongoose';
import { Request } from 'express';
import { databaseUnavailable } from './utilities';
import { setupDebug } from '../utils/src/debugOutput';

const { modulename, debug } = setupDebug(__filename);

const blankSessions: Perform.ISessionsWithoutId = {
  memberId: 0,
  date: '',
  sessions: [
    {
      type: '',
      rpe: 0,
      duration: 0,
    },
    {
      type: '',
      rpe: 0,
      duration: 0,
    },
    {
      type: '',
      rpe: 0,
      duration: 0,
    },
    {
      type: '',
      rpe: 0,
      duration: 0,
    },
    {
      type: '',
      rpe: 0,
      duration: 0,
    },
    {
      type: '',
      rpe: 0,
      duration: 0,
    },
    {
      type: '',
      rpe: 0,
      duration: 0,
    },
    {
      type: '',
      rpe: 0,
      duration: 0,
    },
    {
      type: '',
      rpe: 0,
      duration: 0,
    },
    {
      type: '',
      rpe: 0,
      duration: 0,
    },
    {
      type: '',
      rpe: 0,
      duration: 0,
    },
    {
      type: '',
      rpe: 0,
      duration: 0,
    },
    {
      type: '',
      rpe: 0,
      duration: 0,
    },
    {
      type: '',
      rpe: 0,
      duration: 0,
    },
  ],
};

/**
 * Gets a sessions object by member id & date, or adds a new sessions object to the database.
 *
 * @param req The http request being actioned (used to retrieve the data model).
 * @param sessions Sessions to add. Must not have an id property.
 * @rejects Resolves to a reported error.
 * @returns Promise that resolves to the sessions object added.
 */
const getOrCreateSessions = async (
  req: Request,
  mid: number,
  date: string,
): Promise<Perform.ISessions> => {
  debug(`${modulename}: running getOrCreateSessions`);

  /* get the sessions mongodDB collection */
  const modelSessions = req.app.appLocals.models.sessions2;

  const foundDoc: Perform.ISessions = await new Promise((resolve, _reject) => {
    modelSessions
      .findOne({ memberId: mid, date: date })
      .exec()
      .then((doc) => {
        if (!doc) {
          debug(`${modulename}: no sessions object found or created`);
        }
        /* strip down to sessions object and return */
        return resolve(doc?.toObject() as Perform.ISessions);
      });
  });

  /* if a document is returned then return it */
  if (foundDoc) {
    return foundDoc;
  }

  /* if no document is returned then create a blank document */
  blankSessions.memberId = mid;
  blankSessions.date = date;
  const addedSessions = new modelSessions(blankSessions);

  return new Promise((resolve, reject) => {
    addedSessions
      .save()
      .then((savedSessions: Document) => {
        /* return the added sessions table as a JSON object */
        return resolve(savedSessions.toObject() as Perform.ISessions);
      })
      .catch((err: any) => {
        /* report a general database unavailable error */
        const functionName = 'getOrCreateSessions';
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
 * Updates a supplied sessions with a supplied sessions object.
 *
 * It detects which sessions object to update based on the memberId and the id fields in the supplied sessions object.
 *
 * @param req The http request being actioned (used to retrieve the data model).
 * @param sessions Sessions object to add.
 * @rejects Resolves to a reported error.
 * @returns Promise that resolves to the sessions object added.
 */
const updateSessions = (
  req: Request,
  sessions: Perform.ISessions,
): Promise<Perform.ISessions> => {
  debug(`${modulename}: running updateSessions`);

  /* get the sessions mongodDB collection */
  const modelSessions = req.app.appLocals.models.sessions2;
  const updatedSessions = new modelSessions(sessions);

  return new Promise((resolve, reject) => {
    modelSessions
      .findOneAndUpdate(
        { id: sessions.id, memberId: sessions.memberId },
        updatedSessions,
        {
          new: true,
          runValidators: true,
        },
      )
      .exec()
      .then((doc) => {
        /* return error if no sessions found */
        if (!doc) {
          console.error(
            `${modulename}: updateSessions found no matching sessions`,
          );
          const errNotFound: Perform.IErr = {
            name: 'DATABASE_NOT_FOUND',
            message:
              'The supplied sessions ID does not match a stored sessions',
            statusCode: 404,
            dumped: false,
          };
          return reject(errNotFound);
        }
        /* return new sessions object */
        resolve(doc.toObject() as Perform.ISessions);
      })
      .catch((err) => {
        /* report a general database unavailable error */
        const functionName = 'updateSessions';
        databaseUnavailable(err, functionName, req.app.appLocals, reject);
      });
  });
};

export const sessions2Handlers = {
  getOrCreateSessions,
  updateSessions,
};
