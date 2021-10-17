/**
 * This module creates a users pseudo database and manages all user-related functions.
 */

import { setupDebug } from '../utils/src/debugOutput';
import { User } from './user';
import { usersList } from './envUsers';

const { modulename, debug } = setupDebug(__filename);

const users: User[] = [];
for (const user of Object.values(usersList)) {
  users.push(new User(user.id, user.dbCollection));
}

/* application users pseudo database */
class Users {
  /* creates the users object from env parameters */
  constructor(private _users: User[]) {}
  /**
   * Returns a user based on a supplied unique id or returns undefined if a matching user is not found.
   */
  getUser = (id: string) => {
    debug(`${modulename}: running getUser`);

    console.log(JSON.stringify(process.env.users));

    return this._users.find((user) => {
      return user.id === id;
    });
  };
}

/* export the users getUser function */
export const { getUser } = new Users(users);
