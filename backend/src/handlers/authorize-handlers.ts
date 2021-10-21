/**
 * Authorizes the user and request combination.
 */

import { Request, Response, NextFunction } from 'express';
import expressJwtPermissions from 'express-jwt-permissions';
import { setupDebug } from '../utils/src/debugOutput';
import permissions from '../../.envPermissions.json';

const { modulename, debug } = setupDebug(__filename);

/**
 * Authorizes the user & request combination.
 * Case 1:
 * It allows the request only when the user has permission to access the configured database, i.e. the 'test' Vs the production 'perform' database.
 */
export const authorizeHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  debug(`${modulename}: running authorizeHandler`);

  /* the user will need specific permission, as configured on the OAuth server, to access either the test or production database */
  const requiredPermission =
    process.env.DB_MODE === 'production'
      ? permissions.database.production
      : permissions.database.test;

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
