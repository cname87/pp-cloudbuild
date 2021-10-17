import { TUsersData } from './user';
import envUsers from '../../.envUsers.json';

const allConfiguredUsers = envUsers as TUsersData;

let usersList = allConfiguredUsers.usersDevelopment;
switch (process.env.NODE_ENV) {
  case 'development':
    usersList = envUsers.usersDevelopment;
    break;
  case 'production':
    usersList = envUsers.usersProduction;
    break;
  case 'staging':
    usersList = envUsers.usersStaging;
    break;
  default:
    usersList = envUsers.usersDevelopment;
    break;
}

export { usersList };
