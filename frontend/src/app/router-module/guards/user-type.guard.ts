import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { User } from '@auth0/auth0-spa-js';
import { NGXLogger } from 'ngx-logger';
import { Observable } from 'rxjs';

import { map } from 'rxjs/operators';
import { AuthService } from '../../app-module/services/auth-service/auth.service';
import { roles } from '../../configuration/configuration';

/**
 * This guard routes the default route based on whether the user is a Manager r a Member.
 */
@Injectable({
  providedIn: 'root',
})
export class UserTypeGuard implements CanActivate {
  constructor(
    private logger: NGXLogger,
    private auth: AuthService,
    private router: Router,
  ) {
    this.logger.trace(`${UserTypeGuard.name}: Starting ${UserTypeGuard.name}`);
  }

  /**
   * Checks if the user is authenticated by calling the relevant property of the AuthService and allows (returns Observable(true) if authenticated or routes to the login page and returns Observable(false) otherwise.
   * Note: If the authentication status times out then this will be captured here and the routing blocked.
   * @param routeSnapshot ActivatedRouteSnapshot contains the route that will be activated should you pass through the guard check.
   * @param _routerState RouterStateSnapshot contains the RouterState of the application should you pass through the guard check.
   */
  canActivate(
    routeSnapshot: ActivatedRouteSnapshot,
    _routerState: RouterStateSnapshot,
  ): Observable<boolean> {
    this.logger.trace(`${UserTypeGuard.name}: Running canActivate()`);
    const managerPath = routeSnapshot.data['managerRedirect'];
    const memberPathRoot = routeSnapshot.data['memberRedirectRoot'];
    return this.auth.userProfile$.pipe(
      map((user: User | undefined) => {
        console.log(`User Roles 1: ${JSON.stringify(user?.roles)}`);
        console.log(`User Roles 2: ${JSON.stringify(roles.admin)}`);
        if (!user || user.roles.includes(roles.admin)) {
          console.log(`Manager Path: ${JSON.stringify(managerPath)}`);
          this.router.navigate([managerPath]);
        } else {
          console.log(`MemberPath: ${JSON.stringify(memberPathRoot)}`);
          /* route the members detail page */
          this.router.navigate([`${memberPathRoot}/${user.id}`]);
        }
        return true;
      }),
    );
  }
}
