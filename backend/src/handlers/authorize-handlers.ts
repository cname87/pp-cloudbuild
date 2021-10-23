/**
 * Authorizes the user and request combination.
 */

import { Request, Response, NextFunction } from 'express';
import expressJwtPermissions from 'express-jwt-permissions';
import { setupDebug } from '../utils/src/debugOutput';
import authConfig from '../../.envAuthorization.json';

const { modulename, debug } = setupDebug(__filename);

/**
 * Authorizes the user & request combination.
 */

/**
 * This allows the request only when the user has permission to access the configured database, i.e. the 'test' Vs the production 'perform' database.
 */
export const dbAuthorizeHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  debug(`${modulename}: running dbAuthorizeHandler`);

  /* the user will need specific permission, as configured on the OAuth server, to access either the test or production database */
  const requiredPermission =
    process.env.DB_MODE === 'production'
      ? authConfig.permissions.database.production
      : authConfig.permissions.database.test;

  /* server requests use a grant type of client-credentials and the permissions are contained in auth.scope or auth.permissions */
  const permissionsProperty =
    (req.auth! as any).gty === 'client-credentials' ? 'scope' : 'permissions';

  /* this will call next(err) on an authorization fail => catch with an error handler */
  const checkPermissions = expressJwtPermissions({
    requestProperty: 'auth',
    permissionsProperty,
  }).check(requiredPermission);

  checkPermissions(req, res, next);
};

/**
 * This allows the request to admin api urls only when the user has manager permissions.
 */
export const managerAuthorizeHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  debug(`${modulename}: running managerAuthorizeHandler`);

  const isManagerUrl = authConfig.urls.admin.includes(req.url);
  const isManager = req.auth?.permissions.includes(
    authConfig.permissions.manage.all,
  );

  if (isManagerUrl && !isManager) {
    console.error(`${modulename}: Admin access authorization fail`);
    /* apply code 403 meaning there was a problem with authorization */
    const error: Perform.IErr = {
      name: 'Admin page access error',
      statusCode: 403,
      message:
        'An attempt was made to access a page accessible only to managers without the appropriate permissions',
      dumped: false,
    };
    next(error);
  }
  next();
};

/**
 * This allows requests specific to a member, all of which must have the member id in the api url, only when the id in the JWT token matches the member id in the api url, or the user is a manager.
 * Note: This route only receives paths that start with /members/:mid
 */
export const memberAuthorizeHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  debug(`${modulename}: running memberAuthorizeHandler`);

  const id = +req.params.mid;
  const isMatchedId = id === (req.auth as any)[authConfig.idInfo.id];
  const isManager = req.auth?.permissions.includes(
    authConfig.permissions.manage.all,
  );

  if (!isMatchedId && !isManager) {
    console.error(`${modulename}: Member id authorization fail`);
    /* apply code 403 meaning there was a problem with authorization */
    const error: Perform.IErr = {
      name: 'Member id access error',
      statusCode: 403,
      message: 'The member id in the url did not match the id in the token',
      dumped: false,
    };
    next(error);
  }
  next();
};
