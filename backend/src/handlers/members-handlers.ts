/**
 * Holds all members handlers e.g. getMember.
 * Called by functions in members-api.ts.
 */

import { Document } from 'mongoose';
import { Request } from 'express';
import { databaseUnavailable } from './utilities';
import { setupDebug } from '../utils/src/debugOutput';

const { modulename, debug } = setupDebug(__filename);

/**
 * Adds a supplied member object to the database.
 *
 * @param req The http request being actioned (used to retrieve the data model).
 * @param memberNoId Member to add. Must not have an id property.
 * @rejects Resolves to a reported error.
 * @returns Promise that resolves to the member object added.
 */
const addMember = (
  req: Request,
  memberNoId: Perform.IMemberNoId,
): Promise<Perform.IMember> => {
  const modelMembers = req.app.appLocals.models.members;

  /* test that the supplied member does not already have an id */
  if ((memberNoId as any).id) {
    const err: Perform.IErr = {
      name: 'UNEXPECTED_FAIL',
      message: 'member id exists before document creation',
      statusCode: 500,
      dumped: false,
    };
    req.app.appLocals.dumpError(err);
    throw new Error('member id exists before document creation');
  }

  const addedMember = new modelMembers(memberNoId);
  return new Promise((resolve, reject) => {
    addedMember
      .save()
      .then((savedMember: Document) => {
        /* return the added member as a JSON object */
        return resolve(savedMember.toObject() as Perform.IMember);
      })
      .catch((err: any) => {
        /* report a general database unavailable error */
        const functionName = 'addMember';
        databaseUnavailable(err, functionName, req.app.appLocals, reject);
      });
  });
};

/**
 * Returns a specific team member given by the id parameter passed in.
 * @param req The http request being actioned (used to retrieve the data model).
 * @param memberId The id of the member to return.
 * @rejects Resolves to a reported error.
 * @returns Promise that resolves to a member object.
 */
const getMember = (
  req: Request,
  memberId: number,
): Promise<Perform.IMember> => {
  debug(`${modulename}: running getMember`);

  const modelMembers = req.app.appLocals.models.members;

  return new Promise((resolve, reject) => {
    modelMembers
      .findOne({ id: memberId })
      .exec()
      .then((doc) => {
        /* return error if no member found */
        if (!doc) {
          console.error(`${modulename}: getMember found no matching member`);
          const errNotFound: Perform.IErr = {
            name: 'DATABASE_NOT_FOUND',
            message: 'The supplied member ID does not match a stored member',
            statusCode: 404,
            dumped: false,
          };
          return reject(errNotFound);
        }
        /* strip down to member object and return */
        return resolve(doc.toObject() as unknown as Perform.IMember);
      })
      .catch((err) => {
        /* report a general database unavailable error */
        const functionName = 'getMember';
        databaseUnavailable(err, functionName, req.app.appLocals, reject);
      });
  });
};

/**
 * Returns all the members in a team.
 * @param req The http request being actioned (used to retrieve the data model).
 * @param matchString A string to match members to return.
 * - If a matchString is not supplied then all team members are returned.
 * - If a matchstring is supplied it returns all team members whose 'name' field starts with the match string (case insensitive).
 * @rejects Resolves to a reported error.
 * @returns Promise that resolves to an array of member objects.
 */
const getMembers = (
  req: Request,
  matchString = '',
): Promise<Perform.IMember[]> => {
  debug(`${modulename}: running getMembers`);

  const modelMembers = req.app.appLocals.models.members;

  /* replace all characters, 'c', in the user entered search string that need to be escaped in a regex pattern with '\c' */
  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };
  const sanitizedMatchString = escapeRegExp(matchString);

  return new Promise((resolve, reject) => {
    modelMembers
      .find()
      .where('name')
      .regex('name', new RegExp(`^${sanitizedMatchString}.*`, 'i'))
      .lean(true) // return json object
      .select({ _id: 0, __v: 0 }) // exclude _id and __v fields
      .exec()
      .then((docs) => {
        /* return member objects array */
        return resolve(docs as unknown as [Perform.IMember]);
      })
      .catch((err) => {
        /* report a general database unavailable error */
        const functionName = 'getMembers';
        databaseUnavailable(err, functionName, req.app.appLocals, reject);
      });
  });
};

/**
 * Updates a supplied member with a supplied member object.
 *
 * It detects which member to update based on the id field in the supplied member object.
 *
 * @param req The http request being actioned (used to retrieve the data model).
 * @param member Member to add.
 * @rejects Resolves to a reported error.
 * @returns Promise that resolves to the member object added.
 */
const updateMember = (
  req: Request,
  member: Perform.IMember,
): Promise<Perform.IMember> => {
  const modelMembers = req.app.appLocals.models.members;

  const updatedMember = new modelMembers(member);

  return new Promise((resolve, reject) => {
    modelMembers
      .findOneAndUpdate({ id: member.id }, updatedMember, {
        new: true,
        runValidators: true,
      })
      .exec()
      .then((doc) => {
        /* return error if no member found */
        if (!doc) {
          console.error(`${modulename}: updateMember found no matching member`);
          const errNotFound: Perform.IErr = {
            name: 'DATABASE_NOT_FOUND',
            message: 'The supplied member ID does not match a stored member',
            statusCode: 404,
            dumped: false,
          };
          return reject(errNotFound);
        }
        /* return new member object */
        resolve(doc.toObject() as unknown as Perform.IMember);
      })
      .catch((err) => {
        /* report a general database unavailable error */
        const functionName = 'updateMember';
        databaseUnavailable(err, functionName, req.app.appLocals, reject);
      });
  });
};

/**
 * Deletes a specific team member given by the id parameter passed in.
 *
 * @param req The http request being actioned (used to retrieve the data model).
 * @param memberId The id of the member to delete.
 * @rejects Resolves to a reported error.
 * @returns Promise that resolves to the deleted member object.
 */
const deleteMember = (req: Request, memberId: number): Promise<number> => {
  debug(`${modulename}: running deleteMember`);

  const modelMembers = req.app.appLocals.models.members;

  return new Promise((resolve, reject) => {
    modelMembers
      .deleteOne({ id: memberId })
      .exec()
      .then((doc) => {
        /* return error if no member deleted */
        if (doc.deletedCount === 0) {
          console.error(
            `${modulename}: delete Member found no matching member`,
          );
          const errNotFound: Perform.IErr = {
            name: 'DATABASE_NOT_FOUND',
            message: 'The supplied member ID does not match a stored member',
            statusCode: 404,
            dumped: false,
          };
          return reject(errNotFound);
        }
        /* return count (= 1) to match api */
        return resolve(doc.deletedCount!);
      })
      .catch((err) => {
        /* report a general database unavailable error */
        const functionName = 'deleteMember';
        databaseUnavailable(err, functionName, req.app.appLocals, reject);
      });
  });
};

export const membersHandlers = {
  addMember,
  getMember,
  getMembers,
  updateMember,
  deleteMember,
};
