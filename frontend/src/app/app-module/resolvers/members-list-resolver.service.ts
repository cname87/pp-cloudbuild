import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import {
  Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot,
} from '@angular/router';
import { Observable } from 'rxjs';
import { catchError, shareReplay } from 'rxjs/operators';

import { MembersService } from '../services/members-service/members.service';
import { IMember } from '../models/models';

@Injectable({
  providedIn: 'root',
})
export class MembersListResolverService implements Resolve<IMember[]> {
  constructor(
    private membersService: MembersService,
    private logger: NGXLogger,
  ) {
    this.logger.trace(
      `${MembersListResolverService.name}: Starting MembersListResolverService`,
    );
  }

  /**
   * Called before membersList is loaded and stores the object returned in route data.
   * @param _route Not used.
   * @param _state Not used.
   */
  resolve(
    _route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot,
  ): Observable<IMember[]> {
    this.logger.trace(`${MembersListResolverService.name}: Calling getMembers`);

    return this.membersService.getMembers().pipe(
      /* multicast to all elements on the html page */
      shareReplay(1),
      catchError((err: any) => {
        this.logger.trace(
          `${MembersListResolverService.name}: catchError called`,
        );
        this.logger.trace(
          `${MembersListResolverService.name}: not proceeding and throwing the error to the error handler`,
        );
        throw err;
      }),
    );
  }
}
