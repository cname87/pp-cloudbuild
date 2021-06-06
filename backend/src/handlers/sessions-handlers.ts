/**
 * Holds all sessions handlers e.g. addSession.
 * Called by functions in sessions-api.ts.
 */

import { Document } from 'mongoose';
import { Request } from 'express';
import { setupDebug } from '../utils/src/debugOutput';

const { modulename, debug } = setupDebug(__filename);

/* shared function to report unknown database error */
const databaseUnavailable = (
  err: any,
  caller: string,
  locals: Perform.IAppLocals,
  reject: (reason: any) => void,
) => {
  console.error(`${modulename}: ${caller} database error reported`);
  locals.dumpError(err);
  const errDb: Perform.IErr = {
    name: 'DATABASE_ACCESS',
    message: 'The database service is unavailable',
    statusCode: 503,
    dumped: true,
  };
  return reject(errDb);
};

/**
 * Adds a supplied session object to the database.
 *
 * @param req The http request being actioned (used to retrieve the data model).
 * @param sessionNoId Session to add. Must not have an id property.
 * @rejects Resolves to a reported error.
 * @returns Promise that resolves to the session object added.
 */
const addSession = (
  req: Request,
  sessionNoId: Perform.ISessionNoId,
): Promise<Perform.ISession> => {
  const modelSessions = req.app.appLocals.models.sessions;

  /* test that the supplied session does not already have an id */
  if ((sessionNoId as any).id) {
    const err: Perform.IErr = {
      name: 'UNEXPECTED_FAIL',
      message: 'session id exists before document creation',
      statusCode: 500,
      dumped: false,
    };
    req.app.appLocals.dumpError(err);
    throw new Error('session id exists before document creation');
  }

  const addedSession = new modelSessions(sessionNoId);
  return new Promise((resolve, reject) => {
    addedSession
      .save()
      .then((savedSession: Document) => {
        /* return the added session as a JSON object */
        return resolve(savedSession.toObject() as Perform.ISession);
      })
      .catch((err) => {
        /* report a general database unavailable error */
        const functionName = 'addSession';
        databaseUnavailable(err, functionName, req.app.appLocals, reject);
      });
  });
};

/**
 * Returns a specific session given by the member and session id parameters.
 * @param req The http request being actioned (used to retrieve the data model).
 * @param sessionId The id of the session to return.
 * @rejects Resolves to a reported error.
 * @returns Promise that resolves to a session object.
 */
const getSession = (
  req: Request,
  sessionId: number,
): Promise<Perform.ISession> => {
  debug(`${modulename}: running getSession`);

  const modelSessions = req.app.appLocals.models.sessions;

  return new Promise((resolve, reject) => {
    modelSessions
      .findOne({ id: sessionId })
      .exec()
      .then((doc) => {
        /* return error if no session found */
        if (!doc) {
          console.error(`${modulename}: getSession found no matching session`);
          const errNotFound: Perform.IErr = {
            name: 'DATABASE_NOT_FOUND',
            message: 'The supplied session ID does not match a stored session',
            statusCode: 404,
            dumped: false,
          };
          return reject(errNotFound);
        }
        /* strip down to session object and return */
        return resolve(doc.toObject() as Perform.ISession);
      })
      .catch((err) => {
        /* report a general database unavailable error */
        const functionName = 'getSession';
        databaseUnavailable(err, functionName, req.app.appLocals, reject);
      });
  });
};

/**
 * Returns all the sessions belonging to a member.
 * @param req The http request being actioned (used to retrieve the data model).
 * @param memberId: The id of the member whose sessions are being requested.
 *  If a memberId greater than zero is supplied then only sessions belonging to the referenced member are considered.
 * - If a memberId of zero is supplied then all sessions across all team members are considered.
 * @param matchString Optional. A string to filter the sessions to return.
 * - If a matchString is not supplied then no filtering takes place.
 * - If a matchstring is supplied it returns only sessions whose 'type' field starts with the match string (case insensitive).
 * @rejects Resolves to a reported error.
 * @returns Promise that resolves to an array of session objects.
 */
const getSessions = (
  req: Request,
  memberId: number,
  matchString = '',
): Promise<[Perform.ISession]> => {
  debug(`${modulename}: running getSessions`);

  const modelSessions = req.app.appLocals.models.sessions;

  /* replace all characters, 'c', in the user entered search string that need to be escaped in a regex pattern with '\c' */
  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };
  const sanitizedMatchString = escapeRegExp(matchString).toUpperCase();

  /* get all sessions for all members if memberId = 0 or else get all members */
  const query =
    memberId === 0 ? { memberId: { $gt: 0 } } : { memberId: memberId };

  return new Promise((resolve, reject) => {
    modelSessions
      .find(query)
      .where('type')
      .regex('type', new RegExp(`^${sanitizedMatchString}.*`, 'i'))
      .lean(true) // return json object
      .select({ _id: 0, __v: 0 }) // exclude _id and __v fields
      .exec()
      .then((docs) => {
        /* return session objects array */
        return resolve(docs as unknown as [Perform.ISession]);
      })
      .catch((err) => {
        /* report a general database unavailable error */
        const functionName = 'getSessions';
        databaseUnavailable(err, functionName, req.app.appLocals, reject);
      });
  });
};

/**
 * Updates a supplied session with a supplied session object.
 *
 * It detects which session to update based on the memberId and the id fields in the supplied session object.
 *
 * @param req The http request being actioned (used to retrieve the data model).
 * @param session Session to add.
 * @rejects Resolves to a reported error.
 * @returns Promise that resolves to the session object added.
 */
const updateSession = (
  req: Request,
  session: Perform.ISession,
): Promise<Perform.ISession> => {
  const modelSessions = req.app.appLocals.models.sessions;

  const updatedSession = new modelSessions(session);

  return new Promise((resolve, reject) => {
    modelSessions
      .findOneAndUpdate(
        { id: session.id, memberId: session.memberId },
        updatedSession,
        {
          new: true,
          runValidators: true,
        },
      )
      .exec()
      .then((doc) => {
        /* return error if no session found */
        if (!doc) {
          console.error(
            `${modulename}: updateSession found no matching session`,
          );
          const errNotFound: Perform.IErr = {
            name: 'DATABASE_NOT_FOUND',
            message: 'The supplied session ID does not match a stored session',
            statusCode: 404,
            dumped: false,
          };
          return reject(errNotFound);
        }
        /* return new session object */
        resolve(doc.toObject() as Perform.ISession);
      })
      .catch((err) => {
        /* report a general database unavailable error */
        const functionName = 'updateSession';
        databaseUnavailable(err, functionName, req.app.appLocals, reject);
      });
  });
};

/**
 * Deletes a specific session given by the memberId and id parameters passed in.
 *
 * @param req The http request being actioned (used to retrieve the data model).
 * @param sessionId The id of the session to delete.
 * @rejects Resolves to a reported error.
 * @returns Promise that resolves to the deleted session object.
 */
const deleteSession = (req: Request, sessionId: number): Promise<number> => {
  debug(`${modulename}: running deleteSession`);

  const modelSessions = req.app.appLocals.models.sessions;

  return new Promise((resolve, reject) => {
    modelSessions
      .deleteOne({ id: sessionId })
      .exec()
      .then((doc) => {
        /* return error if no session deleted */
        if (doc.n === 0) {
          console.error(
            `${modulename}: delete Session found no matching session`,
          );
          const errNotFound: Perform.IErr = {
            name: 'DATABASE_NOT_FOUND',
            message: 'The supplied session ID does not matchsession a stored ',
            statusCode: 404,
            dumped: false,
          };
          return reject(errNotFound);
        }
        /* return count (= 1) to match api */
        return resolve(doc.n!);
      })
      .catch((err) => {
        /* report a general database unavailable error */
        const functionName = 'deleteSession';
        databaseUnavailable(err, functionName, req.app.appLocals, reject);
      });
  });
};

export const sessionsHandlers = {
  addSession,
  getSession,
  getSessions,
  updateSession,
  deleteSession,
};
